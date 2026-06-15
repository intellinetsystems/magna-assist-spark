import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Zap, Maximize2, Minimize2, X, RefreshCw, Mic, MicOff, PhoneOff, Phone, MessageSquare, Send,
  Sparkles, ChevronDown, Search, PenSquare, MessageCircle, HelpCircle, Settings, Trash2, LogOut,
  Package, Replace, Ticket, CheckCircle, ChevronRight, ChevronUp, MessageSquarePlus,
  Tag, Upload, ShoppingCart, Clock,
} from "lucide-react";
import { Waveform } from "./Waveform";
import {
  ChatMessage, FlowKey, buildFlow, buildEtaAvailable, buildCreateTicketFromEta, buildLastOrderNoEta, buildOrder1111, buildOrder7777,
  flowTriggers, newId, suggestions, quickActions, searchParts, buildFilters, buildKeys, buildQuickRefItems, partsByFigure, quickRefSubmodels, findPart, type PartItem,
} from "@/lib/flows";
import {
  UserBubble, BotText, TypingBubble, PriorityCard, TicketCard,
} from "./MessageBubbles";
import {
  AttachmentPickerCard, ModelPickerCard, VariantPickerCard, AssemblyPickerCard, PartQueryCard, ResultListCard,
  PartDetailCard, OrderHeaderCard, EtaPendingCard, OrderConfirmCard, TrackingCardEx,
  AccessoryPickerCard, AccessoryListCard,
  QuickRefPickerCard, QuickRefSeriesCard, QuickRefSubmodelCard, QuickRefListCard, NoResultsCard,
  FindSeriesCard, FindModelCard, FindAggregateCard, FindAssemblyCard,
} from "./GuidedCards";
import {
  CampaignListCard, CartOfferAnalysisCard, RecommendationBanner, AlertCard, CartReviewCard,
  BulkUploadCard, UploadSummaryCard, BulkInsightsCard,
  VoiceOrderConfirmCard, VoiceOrderSuccessCard, SupersededPartPrompt, DuplicateConsolidationCard, InvalidPartCard,
  DescriptionOrderCard,
} from "./OffersUploadVoice";
import {
  campaigns as allCampaigns, parseVoiceOrder, consolidate, validateBulkRows,
  matchCampaignsForParts, totalSavings, formatINR, demoCart, type ParsedOrderItem, type BulkValidationResult,
  parseDescriptionOrder, extractVehicleContext, normalizeModel, type DescOrderItem,
} from "@/lib/offers-data";
import { toast } from "sonner";
import { useSmartAutoScroll } from "@/hooks/use-smart-auto-scroll";
import { TypographyToggle } from "./TypographyToggle";

type Mode = "closed" | "panel" | "full";

const qaIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Package, Replace, Ticket, CheckCircle, Tag, Upload, Mic, ShoppingCart, Clock,
};

type ChatHistoryItem = { id: string; title: string; messages: ChatMessage[]; updated: number };

const STORAGE_KEY = "magna_ai_session";
const HISTORY_KEY = "magna_ai_history";
const SETTINGS_KEY = "magna_ai_settings";

type Settings = {
  voice: "female-en" | "male-en" | "female-hi";
  language: "en-US" | "en-IN" | "hi-IN";
  notifications: boolean;
  autoListen: boolean;
  responseStyle: "concise" | "detailed";
  theme: "light" | "system";
};
const defaultSettings: Settings = {
  voice: "female-en", language: "en-US", notifications: true,
  autoListen: false, responseStyle: "concise", theme: "light",
};

// Strip non-serializable / interactive prompts before persisting
function persistable(messages: ChatMessage[]): ChatMessage[] {
  return messages.filter((m) =>
    m.type === "text" || m.type === "ticket" || m.type === "tracking" ||
    m.type === "order-header" || m.type === "part-detail"
  );
}

export function Assistant() {
  const [mode, setMode] = useState<Mode>("closed");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [textMode, setTextMode] = useState(false);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [inCall, setInCall] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [transcriptOpen, setTranscriptOpen] = useState(true);
  const [unread, setUnread] = useState(false);
  const [etaAvailable, setEtaAvailable] = useState(true);
  const [confirmClose, setConfirmClose] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const timersRef = useRef<number[]>([]);
  // Pending state for the multi-step part flow
  const partFlowRef = useRef<{ attachment?: string; model?: string; variant?: string; figure?: string; query?: string }>({});

  // Load persisted session + history + settings
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ChatMessage[];
        if (Array.isArray(parsed)) setMessages(parsed);
      }
      const hRaw = localStorage.getItem(HISTORY_KEY);
      if (hRaw) {
        const parsed = JSON.parse(hRaw) as ChatHistoryItem[];
        if (Array.isArray(parsed)) setChatHistory(parsed);
      }
      const sRaw = localStorage.getItem(SETTINGS_KEY);
      if (sRaw) setSettings({ ...defaultSettings, ...JSON.parse(sRaw) });
    } catch { /* ignore */ }
  }, []);
  useEffect(() => { try { localStorage.setItem(HISTORY_KEY, JSON.stringify(chatHistory)); } catch { /* ignore */ } }, [chatHistory]);
  useEffect(() => { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch { /* ignore */ } }, [settings]);

  // Auto-record current conversation into history (live updates)
  useEffect(() => {
    const userMsgs = messages.filter((m) => m.role === "user" && m.type === "text") as Extract<ChatMessage, { type: "text" }>[];
    if (!userMsgs.length) return;
    const title = userMsgs[0].text.slice(0, 80);
    setChatHistory((prev) => {
      const id = activeChatId ?? prev.find((c) => c.title === title)?.id ?? newId();
      if (!activeChatId) setActiveChatId(id);
      const without = prev.filter((c) => c.id !== id);
      return [{ id, title, messages, updated: Date.now() }, ...without].slice(0, 30);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  // Persist
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(persistable(messages))); } catch { /* ignore */ }
  }, [messages]);

  // (Auto-scroll is handled inside <Thread/> via useSmartAutoScroll)

  // Unread badge: when closed and a new bot message arrives
  useEffect(() => {
    if (mode === "closed" && messages.length > 0) {
      const last = messages[messages.length - 1];
      if (last.role === "bot" && last.type !== "typing") setUnread(true);
    }
  }, [messages, mode]);

  // Esc demotes mode
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMode((m) => (m === "full" ? "panel" : m === "panel" ? "closed" : m));
      } else if (e.shiftKey && (e.key === "E" || e.key === "e")) {
        setEtaAvailable((v) => {
          toast(`Demo: ETA branch → ${!v ? "Available" : "Pending"}`);
          return !v;
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Cleanup timers
  useEffect(() => () => { timersRef.current.forEach(clearTimeout); }, []);

  // When opening, clear unread
  useEffect(() => { if (mode !== "closed") setUnread(false); }, [mode]);

  function pushMessage(m: ChatMessage) {
    setMessages((prev) => [...prev.filter((x) => x.type !== "typing"), m]);
  }

  function runSteps(steps: ReturnType<typeof buildFlow>) {
    let acc = 0;
    steps.forEach((s) => {
      acc += s.delay ?? 400;
      const t = window.setTimeout(() => {
        if (s.message.type === "typing") {
          setMessages((prev) => [...prev, s.message]);
        } else {
          pushMessage(s.message);
        }
      }, acc);
      timersRef.current.push(t);
    });
  }

  function runFlow(flow: FlowKey) {
    if (flow === "part-search") partFlowRef.current = {};
    runSteps(buildFlow(flow));
    if (flow === "track-eta") {
      // Branch after order-header
      const followup = etaAvailable ? buildEtaAvailable() : buildFlow("eta-fallback");
      const baseDelay = buildFlow("track-eta").reduce((a, s) => a + (s.delay ?? 400), 0);
      followup.forEach((s, idx) => {
        const t = window.setTimeout(() => pushMessage(s.message), baseDelay + (s.delay ?? 400) * (idx + 1));
        timersRef.current.push(t);
      });
    }
  }

  function handleUserInput(raw: string) {
    const text = raw.trim();
    if (!text) return;
    pushMessage({ id: newId(), role: "user", type: "text", text });
    setInput("");
    const lower = text.toLowerCase();

    // FLOW 8/9 — explicit order numbers
    if (/\border\s*(#|number|no\.?)?\s*1111\b/i.test(text)) { setTimeout(() => runSteps(buildOrder1111()), 200); return; }
    if (/\border\s*(#|number|no\.?)?\s*7777\b/i.test(text)) { setTimeout(() => runSteps(buildOrder7777()), 200); return; }

    // FLOW 7 — last order ETA / no ETA
    if (/(eta|status).*(last|recent)\s*order|check.*eta.*order|my last order/i.test(text)) {
      setTimeout(() => runSteps(buildLastOrderNoEta()), 200); return;
    }

    // FLOW 5/6 — direct quick-ref ("key for 05 series", "hydraulic filter for 15 series")
    const seriesMatch = text.match(/(00|05|10|15|16|20|25|1500|1600|2500)\s*series/i);
    if (seriesMatch && /\b(key|filter)/i.test(text)) {
      const isKey = /\bkey/i.test(text);
      const category = isKey ? "KEY LIST" : "FILTER LIST";
      const series = `${seriesMatch[1]} Series`;
      const items = buildQuickRefItems(category, series);
      setTimeout(() => pushMessage({ id: newId(), role: "bot", type: "typing" }), 150);
      setTimeout(() => {
        pushMessage({ id: newId(), role: "bot", type: "text", text: isKey ? `Here is the **key list** for the **${series}** tractors.` : `I found the **hydraulic filters** for the **${series}** tractors.` });
        setTimeout(() => pushMessage({ id: newId(), role: "bot", type: "quick-ref-list", category, series, items }), 300);
      }, 850);
      return;
    }

    // FLOW 4 — "I want key" with no series → ask for series
    if (/^(i\s*want\s*|show\s*|need\s*)?(a\s*)?key$/i.test(text) || /\bkey\b.*tractor/i.test(text)) {
      setTimeout(() => pushMessage({ id: newId(), role: "bot", type: "text", text: "Sure — for which **tractor series** do you need the key?" }), 200);
      qrRef.current = { category: "KEY LIST" };
      setTimeout(() => pushMessage({ id: newId(), role: "bot", type: "quick-ref-series", category: "KEY LIST" }), 600);
      return;
    }

    // FLOW 3 — Swinging Drawbar attachment
    if (/(swinging\s*drawbar|drawbar\s*attachment)/i.test(text)) {
      const hasContext = /(4500|00\s*series)/i.test(text);
      if (hasContext) {
        const part = findPart("E007900403C11");
        if (part) {
          const tagged = { ...part, searchTags: ["00 Series", "4500 2WD", "Swinging Drawbar", "Plate Support RH"] };
          setTimeout(() => pushMessage({ id: newId(), role: "bot", type: "typing" }), 150);
          setTimeout(() => {
            pushMessage({ id: newId(), role: "bot", type: "text", text: "I found the **SWINGING DRAWBAR ATTACHMENT** for **4500 2WD**. The highlighted component is **ASSLY PLATE DRAWBAR SUPPORT RH**." });
            setTimeout(() => pushMessage({ id: newId(), role: "bot", type: "part-detail", part: tagged }), 300);
          }, 900);
          return;
        }
      }
      // No series/model → guide user to pick Series → Sub-model
      qrRef.current = { category: "SWINGING DRAWBAR ATTACHMENT" };
      setTimeout(() => pushMessage({ id: newId(), role: "bot", type: "text", text: "Sure — for the **SWINGING DRAWBAR ATTACHMENT**, which **Series** is your tractor from?" }), 200);
      setTimeout(() => pushMessage({ id: newId(), role: "bot", type: "quick-ref-series", category: "SWINGING DRAWBAR ATTACHMENT" }), 600);
      return;
    }

    // FLOW: "I am looking for Part Number XXX" — demo multi-result list
    const lookingFor = text.match(/(?:looking\s*for|find|search(?:ing)?\s*for|part\s*(?:no\.?|number))\s*['"]?([A-Z0-9]{6,})['"]?/i);
    if (lookingFor) {
      const partNo = lookingFor[1].toUpperCase();
      const demoItem: PartItem = {
        partNo: "00601731081", description: "OIL FILTER", category: "Quick Reference",
        vehicle: "Filter List", model: "05 Series", variant: "05 Series",
        aggregate: "3505", groupNo: "QRF-05 Series 3505-fig 101",
        assembly: "Filter List - 3505", figure: "QRF-05 - FIG 101",
        refNo: 1, qty: 1, cost: 0, mrp: 0, inStock: 12, isQuickRef: true,
      };
      const items = Array.from({ length: 7 }, () => demoItem);
      setTimeout(() => pushMessage({ id: newId(), role: "bot", type: "typing" }), 150);
      setTimeout(() => {
        pushMessage({ id: newId(), role: "bot", type: "result-list", query: partNo, model: "05 Series", variant: "05 Series", items });
      }, 900);
      return;
    }

    // FLOW 1 — exact part-no lookup
    const partMatch = text.match(/\b(KMW[A-Z0-9]+|E\d{6,}[A-Z0-9]*)\b/i);
    if (partMatch) {
      const part = findPart(partMatch[0]);
      if (part) {
        setTimeout(() => pushMessage({ id: newId(), role: "bot", type: "typing" }), 150);
        setTimeout(() => {
          pushMessage({ id: newId(), role: "bot", type: "text", text: `I found the **${part.description}** for the **${part.aggregate}** attachment.` });
          setTimeout(() => pushMessage({ id: newId(), role: "bot", type: "part-detail", part }), 300);
        }, 900);
        return;
      }
    }

    // FLOW 2 — description "hydraulic adapter 90" → unique part
    if (/hydraulic\s*adapter.*90/i.test(text) && !/45/i.test(text)) {
      const part = findPart("KMW05863108408");
      if (part) {
        const tagged = { ...part, searchTags: ["Backhoe", "Hydraulic", "Adapter", "90°"] };
        setTimeout(() => pushMessage({ id: newId(), role: "bot", type: "typing" }), 150);
        setTimeout(() => {
          pushMessage({ id: newId(), role: "bot", type: "text", text: "Here is the matching **Hydraulic Adapter, 90°** used in the **Backhoe** attachment." });
          setTimeout(() => pushMessage({ id: newId(), role: "bot", type: "part-detail", part: tagged }), 300);
        }, 900);
        return;
      }
    }

    // Description-based lookup — short keyword like "valve", "hex nut", "hydraulic adapter".
    const descKeyword = /\b(valve|adapter|fitting|hex\s*nut|hex\s*head|cap\s*screw|screw|lockwasher|washer|hydraulic|backhoe)\b/i;
    if (descKeyword.test(text) && !/order|ticket|eta|track|missing|wrong|filter|key/i.test(text)) {
      const items = searchParts(text, "", "");
      if (items.length === 1) {
        const part = items[0];
        setTimeout(() => pushMessage({ id: newId(), role: "bot", type: "typing" }), 150);
        setTimeout(() => {
          pushMessage({ id: newId(), role: "bot", type: "text", text: `Found it — **${part.partNo}** (${part.description}).` });
          setTimeout(() => pushMessage({ id: newId(), role: "bot", type: "part-detail", part }), 300);
        }, 900);
        return;
      }
      if (items.length > 1) {
        partFlowRef.current = { query: text };
        setTimeout(() => pushMessage({ id: newId(), role: "bot", type: "typing" }), 150);
        setTimeout(() => {
          pushMessage({ id: newId(), role: "bot", type: "text", text: `I found **${items.length}** parts matching "${text}". To pinpoint the right one, which **attachment category** is this for?` });
          setTimeout(() => pushMessage({ id: newId(), role: "bot", type: "attachment-picker" }), 300);
        }, 800);
        return;
      }
    }

    // ===== OEM Offers / Bulk / Voice intents =====
    if (/(active\s*offers|current\s*campaigns|discounts?\s*available|recommend\s*(active\s*)?promotions|which\s*offers)/i.test(text)) {
      const list = allCampaigns.filter((c) => c.status === "active");
      setTimeout(() => pushMessage({ id: newId(), role: "bot", type: "typing" }), 150);
      setTimeout(() => {
        pushMessage({ id: newId(), role: "bot", type: "text", text: `Here are the **${list.length} active OEM campaigns** I found for you:` });
        setTimeout(() => pushMessage({ id: newId(), role: "bot", type: "campaign-list", title: "Active OEM Campaigns", campaignIds: list.map((c) => c.id) }), 300);
      }, 800);
      return;
    }
    if (/(expiring\s*(soon\s*)?(campaigns|offers)|expir(es|ing)\s*in)/i.test(text)) {
      const list = allCampaigns.filter((c) => c.status === "expiring");
      setTimeout(() => pushMessage({ id: newId(), role: "bot", type: "typing" }), 150);
      setTimeout(() => {
        pushMessage({ id: newId(), role: "bot", type: "text", text: `**${list.length}** campaigns are expiring soon — act fast:` });
        setTimeout(() => pushMessage({ id: newId(), role: "bot", type: "campaign-list", title: "Expiring Campaigns", campaignIds: list.map((c) => c.id) }), 300);
      }, 800);
      return;
    }
    if (/(check\s*offers?\s*(on\s*)?(my\s*)?cart|cart\s*savings|how\s*much\s*can\s*i\s*save)/i.test(text)) {
      const matched = matchCampaignsForParts(demoCart.map((l) => l.partNo));
      const savings = totalSavings(matched);
      setTimeout(() => pushMessage({ id: newId(), role: "bot", type: "typing" }), 150);
      setTimeout(() => {
        pushMessage({ id: newId(), role: "bot", type: "text", text: `I analyzed your cart and found **${matched.length}** matching campaigns.` });
        setTimeout(() => pushMessage({
          id: newId(), role: "bot", type: "cart-analysis",
          campaignIds: matched.map((c) => c.id), savings,
          missedHint: "Add 3 more eligible parts to unlock an additional 5% discount.",
        }), 300);
      }, 800);
      return;
    }
    if (/(review\s*my\s*cart|show\s*my\s*cart|view\s*cart)/i.test(text)) {
      setTimeout(() => pushMessage({ id: newId(), role: "bot", type: "typing" }), 150);
      setTimeout(() => pushMessage({ id: newId(), role: "bot", type: "cart-review" }), 800);
      return;
    }
    if (/(bulk\s*(order\s*)?upload|upload\s*(an?\s*)?(excel|file|order)|order\s*template)/i.test(text)) {
      setTimeout(() => pushMessage({ id: newId(), role: "bot", type: "text", text: "Sure — download the OEM template, fill it in, and upload it here. I'll validate parts, quantities, and check campaign eligibility." }), 200);
      setTimeout(() => pushMessage({ id: newId(), role: "bot", type: "bulk-upload" }), 600);
      return;
    }
    // Multi-part voice/text ordering: starts with add/order/i need + numbers
    if (/^(add|order|i\s+need|i\s+want|please\s+add|book)\s+.+/i.test(text) && /\d|\b(one|two|three|four|five|six|seven|eight|nine|ten|twenty|thirty|fifty|hundred)\b/i.test(text)) {
      const parsed = parseVoiceOrder(text);
      if (parsed.length > 0) {
        const { items, duplicates } = consolidate(parsed);
        setTimeout(() => pushMessage({ id: newId(), role: "bot", type: "typing" }), 150);
        setTimeout(() => {
          if (duplicates.length) {
            const dup = items.find((i) => (i.partNo ?? i.description) === duplicates[0])!;
            pushMessage({ id: newId(), role: "bot", type: "duplicate-consolidation", partNo: dup.partNo ?? dup.description, totalQty: dup.qty });
          }
          pushMessage({ id: newId(), role: "bot", type: "voice-order-confirm", itemsJson: JSON.stringify(items) });
        }, 800);
        return;
      }
    }

    void lower;
    const trigger = flowTriggers.find((t) => t.match.test(text));
    const flow = trigger?.flow ?? "create-ticket";
    setTimeout(() => runFlow(flow), 200);
  }

  function handleSuggestion(s: string) {
    // OEM Offers / Bulk / Voice shortcuts — route through text intents
    const textMap: Record<string, string> = {
      "Active Offers": "Show active offers",
      "Bulk Order Upload": "I want to bulk upload an order",
      "Voice Multi-Order": "Add 10 Oil Filters, part number ABC-123 and 5 Air Filters, part number XYZ-123",
      "Cart Savings": "Check offers on my cart",
      "Expiring Campaigns": "Show expiring campaigns",
      "Model-Based Offers": "Show offers for Model XEV 9E",
      "Part-Based Offers": "Show offers on part number ABC-123",
    };
    if (textMap[s]) { handleUserInput(textMap[s]); return; }

    const map: Record<string, FlowKey> = {
      "Find a part": "part-search",
      "Order Part": "part-search",
      "Browse Quick Reference": "quick-reference",
      "Track my last order": "track-eta",
      "Check Availability": "quick-reference",
      "Find Alternate Part": "part-search",
      "Report an order issue": "wrong-part",
      "Create a service ticket": "create-ticket",
      "Create Ticket": "create-ticket",
    };
    const flow = map[s] ?? "create-ticket";
    const trigger = flowTriggers.find((t) => t.flow === flow);
    pushMessage({ id: newId(), role: "user", type: "text", text: trigger?.userText ?? s });
    setTimeout(() => runFlow(flow), 250);
  }

  // ===== Offers/Bulk/Voice callbacks =====
  const onBulkParsed = useCallback((rows: { partNo: string; qty: number; remarks?: string }[]) => {
    const result = validateBulkRows(rows);
    pushMessage({ id: newId(), role: "user", type: "text", text: `Uploaded ${rows.length} rows` });
    setTimeout(() => pushMessage({ id: newId(), role: "bot", type: "typing" }), 150);
    setTimeout(() => {
      pushMessage({ id: newId(), role: "bot", type: "text", text: `I've validated your file. Here's the summary:` });
      setTimeout(() => pushMessage({ id: newId(), role: "bot", type: "upload-summary", resultJson: JSON.stringify(result) }), 300);
    }, 900);
  }, []);

  const onUploadContinue = useCallback((result: BulkValidationResult) => {
    const validParts = result.rows.filter((r) => r.status === "valid").map((r) => r.partNo);
    const matched = matchCampaignsForParts(validParts);
    const savings = totalSavings(matched);
    pushMessage({ id: newId(), role: "user", type: "text", text: `Add ${result.valid} parts to cart` });
    setTimeout(() => {
      pushMessage({ id: newId(), role: "bot", type: "text", text: `**${result.valid} parts** added to your cart successfully.` });
      setTimeout(() => pushMessage({
        id: newId(), role: "bot", type: "bulk-insights",
        eligibleCount: matched.reduce((a, c) => a + c.eligiblePartsCount, 0) || matched.length * 4,
        supersededCount: result.superseded, volumeGap: 8, savings,
      }), 400);
      setTimeout(() => pushMessage({
        id: newId(), role: "bot", type: "recommendation-banner",
        campaignIds: matched.map((c) => c.id), savings,
      }), 1000);
    }, 250);
  }, []);

  const onVoiceConfirm = useCallback((items: ParsedOrderItem[]) => {
    const totalParts = items.length;
    const totalQty = items.reduce((a, i) => a + i.qty, 0);
    const matched = matchCampaignsForParts(items.map((i) => i.partNo ?? "").filter(Boolean));
    const savings = totalSavings(matched);
    pushMessage({ id: newId(), role: "user", type: "text", text: "Confirm" });
    setTimeout(() => pushMessage({ id: newId(), role: "bot", type: "voice-order-success", totalParts, totalQty }), 400);
    if (matched.length) {
      setTimeout(() => pushMessage({
        id: newId(), role: "bot", type: "alert-card",
        kind: "stock", title: "Good News!",
        body: `${matched.length} parts qualify for active OEM campaigns. Potential Savings: ${formatINR(savings)}`,
      }), 900);
      setTimeout(() => pushMessage({
        id: newId(), role: "bot", type: "recommendation-banner",
        campaignIds: matched.map((c) => c.id), savings,
      }), 1500);
    }
  }, []);


  // Continuation handlers for guided cards
  const onAttachmentPick = useCallback((attachment: string) => {
    partFlowRef.current.attachment = attachment;
    pushMessage({ id: newId(), role: "user", type: "text", text: attachment });
    setTimeout(() => {
      pushMessage({ id: newId(), role: "bot", type: "text", text: `Got it — **${attachment}**. Which **model** is it?` });
      setTimeout(() => pushMessage({ id: newId(), role: "bot", type: "model-picker", attachment }), 400);
    }, 250);
  }, []);

  const onModelPick = useCallback((model: string) => {
    const attachment = partFlowRef.current.attachment ?? "Attachment";
    partFlowRef.current.model = model;
    pushMessage({ id: newId(), role: "user", type: "text", text: model });
    setTimeout(() => {
      pushMessage({ id: newId(), role: "bot", type: "text", text: `Great — and which **variant** of ${model}?` });
      setTimeout(() => pushMessage({ id: newId(), role: "bot", type: "variant-picker", attachment, model }), 400);
    }, 250);
  }, []);

  const onVariantPick = useCallback((variant: string) => {
    const attachment = partFlowRef.current.attachment ?? "Attachment";
    const model = partFlowRef.current.model ?? "Unknown";
    partFlowRef.current.variant = variant;
    pushMessage({ id: newId(), role: "user", type: "text", text: variant });
    setTimeout(() => {
      pushMessage({ id: newId(), role: "bot", type: "text", text: `Perfect — **${attachment} → ${model} → ${variant}**. Which **assembly / figure** are you looking at?` });
      setTimeout(() => pushMessage({ id: newId(), role: "bot", type: "assembly-picker", attachment, model, variant }), 400);
    }, 250);
  }, []);

  const onAssemblyPick = useCallback((figure: string, label: string) => {
    const model = partFlowRef.current.model ?? "Unknown";
    const variant = partFlowRef.current.variant ?? "All";
    const pendingQuery = partFlowRef.current.query;
    partFlowRef.current.figure = figure;
    pushMessage({ id: newId(), role: "user", type: "text", text: label });
    setTimeout(() => pushMessage({ id: newId(), role: "bot", type: "typing" }), 200);
    setTimeout(() => {
      const all = partsByFigure(figure);
      // If we had a pending description query, narrow within this assembly.
      const items = pendingQuery
        ? all.filter((p) => p.description.toLowerCase().includes(pendingQuery.toLowerCase()) || p.partNo.toLowerCase().includes(pendingQuery.toLowerCase()))
        : all;
      const finalItems = items.length ? items : all;
      if (finalItems.length === 1) {
        pushMessage({ id: newId(), role: "bot", type: "text", text: `Here's the detail for **${finalItems[0].partNo}** — ${finalItems[0].description}:` });
        setTimeout(() => pushMessage({ id: newId(), role: "bot", type: "part-detail", part: finalItems[0] }), 300);
      } else {
        const heading = pendingQuery
          ? `Within **${label}**, ${finalItems.length} parts match "${pendingQuery}". Pick one to see it on the illustration:`
          : `Here are the **${finalItems.length} parts** in *${label}*. Pick one to see it on the illustration:`;
        pushMessage({ id: newId(), role: "bot", type: "text", text: heading });
        setTimeout(() => pushMessage({ id: newId(), role: "bot", type: "result-list", query: pendingQuery ?? label, model, variant, items: finalItems }), 300);
      }
    }, 1100);
  }, []);

  const onPartQuery = useCallback((q: string) => {
    const { model = "Unknown", variant = "All variants" } = partFlowRef.current;
    partFlowRef.current.query = q;
    pushMessage({ id: newId(), role: "user", type: "text", text: q });
    setTimeout(() => pushMessage({ id: newId(), role: "bot", type: "typing" }), 200);
    setTimeout(() => {
      const items = searchParts(q, model, variant);
      if (items.length === 1) {
        pushMessage({ id: newId(), role: "bot", type: "text", text: `Here's the detail for **${items[0].partNo}** — ${items[0].description}:` });
        setTimeout(() => pushMessage({ id: newId(), role: "bot", type: "part-detail", part: items[0] }), 300);
      } else {
        pushMessage({ id: newId(), role: "bot", type: "text", text: `I found **${items.length}** matching parts for "${q}" in ${model} — ${variant}. Pick one to see details:` });
        setTimeout(() => pushMessage({ id: newId(), role: "bot", type: "result-list", query: q, model, variant, items }), 300);
      }
    }, 1100);
  }, []);

  const onResultSelect = useCallback((p: PartItem) => {
    pushMessage({ id: newId(), role: "user", type: "text", text: `Show ${p.partNo}` });
    setTimeout(() => {
      pushMessage({ id: newId(), role: "bot", type: "text", text: `Here's the detail for **${p.partNo}** — ${p.description}:` });
      setTimeout(() => pushMessage({ id: newId(), role: "bot", type: "part-detail", part: p }), 300);
    }, 250);
  }, []);

  const onCreateTicketEta = useCallback((_ticketId?: string) => {
    pushMessage({ id: newId(), role: "user", type: "text", text: "Yes, create a ticket" });
    setTimeout(() => runSteps(buildCreateTicketFromEta()), 250);
  }, []);

  const onCheckLater = useCallback(() => {
    pushMessage({ id: newId(), role: "user", type: "text", text: "No" });
    setTimeout(() => pushMessage({ id: newId(), role: "bot", type: "text", text: "No problem. Is there anything else I can help you with?" }), 400);
  }, []);

  const onAccessoryPick = useCallback((kind: "Filter" | "Key", series: string) => {
    pushMessage({ id: newId(), role: "user", type: "text", text: `${kind} List → ${series}` });
    setTimeout(() => {
      const items = kind === "Filter" ? buildFilters(series) : buildKeys(series);
      pushMessage({ id: newId(), role: "bot", type: "text", text: `Here are the **${kind}** items for **${series}** — pick one to see full details:` });
      setTimeout(() => pushMessage({ id: newId(), role: "bot", type: "accessory-list", kind, series, items }), 300);
    }, 250);
  }, []);

  // Quick Reference handlers
  const qrRef = useRef<{ category?: string; series?: string; submodel?: string }>({});
  const onQuickRefPick = useCallback((category: string) => {
    qrRef.current = { category };
    pushMessage({ id: newId(), role: "user", type: "text", text: category });
    setTimeout(() => {
      pushMessage({ id: newId(), role: "bot", type: "text", text: `**${category}** — choose a Series:` });
      setTimeout(() => pushMessage({ id: newId(), role: "bot", type: "quick-ref-series", category }), 300);
    }, 250);
  }, []);
  const onQuickRefSeries = useCallback((series: string) => {
    const category = qrRef.current.category ?? "Quick Reference";
    qrRef.current.series = series;
    pushMessage({ id: newId(), role: "user", type: "text", text: series });
    const hasSubmodels = !!quickRefSubmodels[series]?.length;
    setTimeout(() => {
      if (hasSubmodels) {
        pushMessage({ id: newId(), role: "bot", type: "text", text: `**${category} → ${series}** — pick a sub-model:` });
        setTimeout(() => pushMessage({ id: newId(), role: "bot", type: "quick-ref-submodel", category, series }), 300);
      } else {
        const items = buildQuickRefItems(category, series);
        pushMessage({ id: newId(), role: "bot", type: "text", text: `Here are the items in **${category} → ${series}**:` });
        setTimeout(() => pushMessage({ id: newId(), role: "bot", type: "quick-ref-list", category, series, items }), 300);
      }
    }, 250);
  }, []);
  const onQuickRefSubmodel = useCallback((submodel: string) => {
    const { category = "Quick Reference", series = "" } = qrRef.current;
    qrRef.current.submodel = submodel;
    pushMessage({ id: newId(), role: "user", type: "text", text: submodel });
    // Special-case: Swinging Drawbar Attachment → 00 Series → 4500 2WD shows the illustration
    if (/swinging\s*drawbar/i.test(category) && /4500/i.test(submodel)) {
      const part = findPart("E007900403C11");
      if (part) {
        const tagged = { ...part, searchTags: ["00 Series", "4500 2WD", "Swinging Drawbar", "Plate Support RH"] };
        setTimeout(() => pushMessage({ id: newId(), role: "bot", type: "typing" }), 200);
        setTimeout(() => {
          pushMessage({ id: newId(), role: "bot", type: "text", text: `Here is the **SWINGING DRAWBAR ATTACHMENT** for **${series} → ${submodel}**. The highlighted component is **ASSLY PLATE DRAWBAR SUPPORT RH**.` });
          setTimeout(() => pushMessage({ id: newId(), role: "bot", type: "part-detail", part: tagged }), 300);
        }, 900);
        return;
      }
    }
    setTimeout(() => {
      const items = buildQuickRefItems(category, series, submodel);
      pushMessage({ id: newId(), role: "bot", type: "text", text: `Items in **${category} → ${series} → ${submodel}**:` });
      setTimeout(() => pushMessage({ id: newId(), role: "bot", type: "quick-ref-list", category, series, submodel, items }), 300);
    }, 250);
  }, []);

  // Find a Part: Series → Model → Aggregate → Assembly
  const findRef = useRef<{ series?: string; model?: string; aggregate?: string }>({});
  const onFindSeries = useCallback((series: string) => {
    findRef.current = { series };
    pushMessage({ id: newId(), role: "user", type: "text", text: series });
    setTimeout(() => {
      pushMessage({ id: newId(), role: "bot", type: "text", text: `**${series}** — now pick a **Model**:` });
      setTimeout(() => pushMessage({ id: newId(), role: "bot", type: "find-model", series }), 300);
    }, 250);
  }, []);
  const onFindModel = useCallback((model: string) => {
    const series = findRef.current.series ?? "";
    findRef.current.model = model;
    pushMessage({ id: newId(), role: "user", type: "text", text: model });
    setTimeout(() => {
      pushMessage({ id: newId(), role: "bot", type: "text", text: `**${series} → ${model}** — choose an **Aggregate**:` });
      setTimeout(() => pushMessage({ id: newId(), role: "bot", type: "find-aggregate", series, model }), 300);
    }, 250);
  }, []);
  const onFindAggregate = useCallback((aggregate: string) => {
    const series = findRef.current.series ?? "";
    const model = findRef.current.model ?? "";
    findRef.current.aggregate = aggregate;
    pushMessage({ id: newId(), role: "user", type: "text", text: aggregate });
    setTimeout(() => {
      pushMessage({ id: newId(), role: "bot", type: "text", text: `**${aggregate}** — pick the **Assembly / Illustration**:` });
      setTimeout(() => pushMessage({ id: newId(), role: "bot", type: "find-assembly", series, model, aggregate }), 300);
    }, 250);
  }, []);
  const onFindAssembly = useCallback((assembly: string) => {
    const { series = "", model = "", aggregate = "" } = findRef.current;
    pushMessage({ id: newId(), role: "user", type: "text", text: assembly });
    // Special: 00 Series → 4500 2WD → Attachments → Swinging Drawbar Attachment shows the illustration
    if (/swinging\s*drawbar/i.test(assembly) && /4500\s*2WD/i.test(model)) {
      const part = findPart("E007900403C11");
      if (part) {
        setTimeout(() => pushMessage({ id: newId(), role: "bot", type: "typing" }), 200);
        setTimeout(() => {
          pushMessage({ id: newId(), role: "bot", type: "text", text: `Here is **${assembly}** for **${series} → ${model}**. The highlighted component is **ASSLY PLATE DRAWBAR SUPPORT RH**.` });
          setTimeout(() => pushMessage({ id: newId(), role: "bot", type: "part-detail", part }), 300);
        }, 900);
        return;
      }
    }
    setTimeout(() => {
      const items = buildQuickRefItems(aggregate, series, model);
      pushMessage({ id: newId(), role: "bot", type: "text", text: `Parts in **${series} → ${model} → ${aggregate} → ${assembly}**:` });
      setTimeout(() => pushMessage({ id: newId(), role: "bot", type: "quick-ref-list", category: aggregate, series, submodel: model, items }), 300);
    }, 250);
  }, []);

  const onPartCreateTicket = useCallback((p: PartItem) => {
    pushMessage({ id: newId(), role: "user", type: "text", text: `Create a ticket — ${p.partNo} is out of stock` });
    setTimeout(() => {
      pushMessage({ id: newId(), role: "bot", type: "text", text: `Got it — **${p.partNo}** (${p.description}) is out of stock. I've logged this as a **High Priority** restock request. Please confirm or change priority:` });
      setTimeout(() => pushMessage({ id: newId(), role: "bot", type: "priority" }), 300);
    }, 250);
  }, []);
  const onNoResultsTicket = useCallback(() => {
    pushMessage({ id: newId(), role: "user", type: "text", text: "Yes, raise a ticket" });
    setTimeout(() => runFlow("create-ticket"), 200);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function saveCurrentToHistory() {
    const userMsgs = messages.filter((m) => m.role === "user" && m.type === "text") as Extract<ChatMessage, { type: "text" }>[];
    if (!userMsgs.length) return;
    const title = userMsgs[0].text.slice(0, 80);
    const id = activeChatId ?? newId();
    setChatHistory((prev) => {
      const without = prev.filter((c) => c.id !== id);
      return [{ id, title, messages, updated: Date.now() }, ...without].slice(0, 30);
    });
    setActiveChatId(id);
  }

  function newChat() {
    saveCurrentToHistory();
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setMessages([]);
    setActiveChatId(null);
    partFlowRef.current = {};
  }

  function loadChat(c: ChatHistoryItem) {
    saveCurrentToHistory();
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setMessages(c.messages);
    setActiveChatId(c.id);
  }

  function clearAllConversations() {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setMessages([]);
    setChatHistory([]);
    setActiveChatId(null);
    try { localStorage.removeItem(HISTORY_KEY); localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    toast.success("All conversations cleared");
  }

  function endSession() {
    newChat();
    setMode("closed");
    toast("Chat ended. Start a new one any time.");
  }

  function toggleMic() { setListening((v) => !v); }
  function startCall() {
    setInCall(true);
    setListening(true);
    pushMessage({ id: newId(), role: "bot", type: "text", text: "📞 **Call connected with MAgNA AI.** I'm listening — go ahead and speak. Tap the red button to hang up when you're done." });
  }
  function endCall() {
    setInCall(false);
    setListening(false);
    pushMessage({ id: newId(), role: "bot", type: "text", text: "📴 **Call ended.** You can keep chatting here or start a new call anytime." });
  }

  const renderMessage = (m: ChatMessage) => {
    if (m.role === "user" && m.type === "text") return <UserBubble key={m.id} text={m.text} />;
    if (m.type === "text") return <BotText key={m.id} text={m.text} />;
    if (m.type === "typing") return <TypingBubble key={m.id} />;
    if (m.type === "priority") return <PriorityCard key={m.id} onSelect={() => {
      setTimeout(() => pushMessage({ id: newId(), role: "bot", type: "text", text: "Thank you. Your ticket has been created successfully." }), 300);
      setTimeout(() => pushMessage({ id: newId(), role: "bot", type: "ticket", ticketId: "EPC-61485" }), 800);
    }} />;
    if (m.type === "ticket") return <TicketCard key={m.id} ticketId={m.ticketId} />;
    if (m.type === "tracking") return <TrackingCardEx key={m.id} orderId={m.orderId} eta={m.eta} carrier={m.carrier} status={m.status} partNos={m.partNos} />;
    if (m.type === "attachment-picker") return <AttachmentPickerCard key={m.id} onSubmit={onAttachmentPick} />;
    if (m.type === "model-picker") return <ModelPickerCard key={m.id} attachment={m.attachment} onSubmit={onModelPick} />;
    if (m.type === "variant-picker") return <VariantPickerCard key={m.id} model={m.model} onSubmit={onVariantPick} />;
    if (m.type === "assembly-picker") return <AssemblyPickerCard key={m.id} model={m.model} variant={m.variant} onSubmit={onAssemblyPick} />;
    if (m.type === "part-query") return <PartQueryCard key={m.id} model={m.model} variant={m.variant} onSubmit={onPartQuery} />;
    if (m.type === "result-list") return <ResultListCard key={m.id} items={m.items} query={m.query} model={m.model} variant={m.variant} onSelect={onResultSelect} />;
    if (m.type === "part-detail") return <PartDetailCard key={m.id} part={m.part} onCreateTicket={onPartCreateTicket} />;
    if (m.type === "order-header") return <OrderHeaderCard key={m.id} orderId={m.orderId} placed={m.placed} items={m.items} total={m.total} />;
    if (m.type === "eta-pending") return <EtaPendingCard key={m.id} orderId={m.orderId} onCreateTicket={() => onCreateTicketEta(m.ticketId)} onCheckLater={onCheckLater} />;
    if (m.type === "order-confirm") return <OrderConfirmCard key={m.id} orderId={m.orderId} placed={m.placed} parts={m.parts} onYes={() => {
      pushMessage({ id: newId(), role: "user", type: "text", text: "Yes" });
      setTimeout(() => pushMessage({ id: newId(), role: "bot", type: "text", text: `Order **#${m.orderId}** has not been dispatched yet, so ETA is not available currently.` }), 350);
      setTimeout(() => pushMessage({ id: newId(), role: "bot", type: "eta-pending", orderId: m.orderId, ticketId: m.ticketId }), 800);
    }} onNo={() => {
      pushMessage({ id: newId(), role: "user", type: "text", text: "No" });
      setTimeout(() => pushMessage({ id: newId(), role: "bot", type: "text", text: "No problem — please share the order number you'd like to check." }), 400);
    }} />;
    if (m.type === "accessory-picker") return <AccessoryPickerCard key={m.id} kind={m.kind} onPick={onAccessoryPick} />;
    if (m.type === "accessory-list") return <AccessoryListCard key={m.id} kind={m.kind} series={m.series} items={m.items} onSelect={onResultSelect} />;
    if (m.type === "quick-ref-picker") return <QuickRefPickerCard key={m.id} onPick={onQuickRefPick} />;
    if (m.type === "quick-ref-series") return <QuickRefSeriesCard key={m.id} category={m.category} onPick={onQuickRefSeries} />;
    if (m.type === "quick-ref-submodel") return <QuickRefSubmodelCard key={m.id} category={m.category} series={m.series} onPick={onQuickRefSubmodel} />;
    if (m.type === "quick-ref-list") return <QuickRefListCard key={m.id} category={m.category} series={m.series} submodel={m.submodel} items={m.items} onSelect={onResultSelect} />;
    if (m.type === "find-series") return <FindSeriesCard key={m.id} onPick={onFindSeries} />;
    if (m.type === "find-model") return <FindModelCard key={m.id} series={m.series} onPick={onFindModel} />;
    if (m.type === "find-aggregate") return <FindAggregateCard key={m.id} series={m.series} model={m.model} onPick={onFindAggregate} />;
    if (m.type === "find-assembly") return <FindAssemblyCard key={m.id} series={m.series} model={m.model} aggregate={m.aggregate} onPick={onFindAssembly} />;
    if (m.type === "no-results") return <NoResultsCard key={m.id} query={m.query} onCreateTicket={onNoResultsTicket} />;
    if (m.type === "campaign-list") {
      const list = allCampaigns.filter((c) => m.campaignIds.includes(c.id));
      return <CampaignListCard key={m.id} campaigns={list} title={m.title}
        onApply={(c) => { pushMessage({ id: newId(), role: "user", type: "text", text: `Apply ${c.name}` }); setTimeout(() => pushMessage({ id: newId(), role: "bot", type: "text", text: `**${c.name}** applied. Estimated savings: ${formatINR(c.estSavings)}.` }), 400); }}
        onViewParts={(c) => pushMessage({ id: newId(), role: "bot", type: "text", text: `Eligible parts under **${c.name}**: ${c.eligibleParts.join(", ")}` })}
      />;
    }
    if (m.type === "cart-analysis") {
      const list = allCampaigns.filter((c) => m.campaignIds.includes(c.id));
      return <CartOfferAnalysisCard key={m.id} matched={list} savings={m.savings} missedHint={m.missedHint} />;
    }
    if (m.type === "recommendation-banner") {
      const list = allCampaigns.filter((c) => m.campaignIds.includes(c.id));
      return <RecommendationBanner key={m.id} campaigns={list} savings={m.savings}
        onApply={() => toast.success(`Offer applied · ${formatINR(m.savings)} savings`)}
        onView={() => pushMessage({ id: newId(), role: "bot", type: "campaign-list", campaignIds: m.campaignIds })} />;
    }
    if (m.type === "alert-card") return <AlertCard key={m.id} kind={m.kind} title={m.title} body={m.body} />;
    if (m.type === "cart-review") return <CartReviewCard key={m.id} onCheckOffers={() => handleUserInput("Check offers on my cart")} />;
    if (m.type === "bulk-upload") return <BulkUploadCard key={m.id} onParsed={onBulkParsed} />;
    if (m.type === "upload-summary") {
      const result = JSON.parse(m.resultJson) as BulkValidationResult;
      return <UploadSummaryCard key={m.id} result={result} onContinue={() => onUploadContinue(result)} />;
    }
    if (m.type === "bulk-insights") return <BulkInsightsCard key={m.id} eligibleCount={m.eligibleCount} supersededCount={m.supersededCount} volumeGap={m.volumeGap} savings={m.savings} onApply={() => toast.success("Offers applied to cart")} />;
    if (m.type === "voice-order-confirm") {
      const items = JSON.parse(m.itemsJson) as ParsedOrderItem[];
      return <VoiceOrderConfirmCard key={m.id} items={items}
        onConfirm={onVoiceConfirm}
        onCancel={() => pushMessage({ id: newId(), role: "bot", type: "text", text: "Cancelled — no items were added." })}
        onRemove={(idx) => { const next = items.filter((_, i) => i !== idx); pushMessage({ id: newId(), role: "bot", type: "voice-order-confirm", itemsJson: JSON.stringify(next) }); }}
      />;
    }
    if (m.type === "voice-order-success") return <VoiceOrderSuccessCard key={m.id} totalParts={m.totalParts} totalQty={m.totalQty}
      onViewCart={() => handleUserInput("Review my cart")}
      onContinue={() => pushMessage({ id: newId(), role: "bot", type: "text", text: "What else would you like to order?" })}
      onCheckout={() => toast.success("Proceeding to checkout…")} />;
    if (m.type === "superseded-prompt") return <SupersededPartPrompt key={m.id} oldPart={m.oldPart} newPart={m.newPart} qty={m.qty}
      onAccept={() => toast.success(`Switched to ${m.newPart}`)} onKeep={() => toast(`Kept ${m.oldPart}`)} />;
    if (m.type === "duplicate-consolidation") return <DuplicateConsolidationCard key={m.id} partNo={m.partNo} totalQty={m.totalQty} onProceed={() => toast.success("Consolidated quantity confirmed")} />;
    if (m.type === "invalid-part") return <InvalidPartCard key={m.id} partNo={m.partNo} onRetry={() => pushMessage({ id: newId(), role: "bot", type: "text", text: "Please re-enter the part number." })} />;
    return null;
  };

  return (
    <>
      {/* Floating launcher */}
      <AnimatePresence>
        {mode === "closed" && (
          <motion.button
            key="launcher"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => setMode("panel")}
            className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-2xl bg-gradient-brand text-white shadow-soft-lg flex items-center justify-center group focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] focus:ring-offset-2"
            aria-label="Open MAgNA AI Assistant"
          >
            <div className="relative">
              <Zap className="w-7 h-7" strokeWidth={2.2} fill="currentColor" />
            </div>
            {unread && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Panel mode */}
      <AnimatePresence>
        {mode === "panel" && (
          <motion.div
            key="panel"
            initial={{ x: 480, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 480, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 240 }}
            className="fixed top-4 right-4 bottom-4 w-[440px] max-w-[calc(100vw-2rem)] z-50 flex flex-col"
          >
            <div className="flex-1 flex flex-col bg-white rounded-3xl shadow-soft-lg border border-black/5 overflow-hidden backdrop-blur-xl">
              <Header
                listening={listening}
                quickOpen={quickOpen}
                setQuickOpen={setQuickOpen}
                onMaximize={() => setMode("full")}
                onMinimize={() => setMode("closed")}
                onClose={endSession}
                onNewChat={newChat}
                showMax
                onQuickAction={handleSuggestion}
              />
              <Thread
                messages={messages}
                transcriptOpen={transcriptOpen}
                setTranscriptOpen={setTranscriptOpen}
                onSuggestion={handleSuggestion}
                renderMessage={renderMessage}
              />
              <Dock
                listening={listening}
                toggleMic={toggleMic}
                textMode={textMode}
                setTextMode={setTextMode}
                input={input}
                setInput={setInput}
                onSend={() => handleUserInput(input)}
                onEnd={endCall}
                onStartCall={startCall}
                inCall={inCall}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full mode */}
      <AnimatePresence>
        {mode === "full" && (
          <motion.div
            key="full"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="fixed inset-0 z-50 bg-white flex"
          >
            <aside className="w-[260px] border-r border-black/5 bg-[var(--surface-1)] flex flex-col">
              <div className="p-4 flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center shadow-soft">
                  <Zap className="w-5 h-5 text-white" fill="currentColor" />
                </div>
                <div>
                  <div className="text-sm font-bold text-[var(--brand-600)] leading-tight">MAgNA AI</div>
                  <div className="text-[11px] text-[var(--ink-500)]">Virtual Assistant</div>
                </div>
              </div>
              <div className="px-3 space-y-1">
                <button onClick={newChat} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white text-sm text-[var(--ink-700)] font-medium border border-transparent hover:border-black/5">
                  <PenSquare className="w-4 h-4" /> New Chat
                </button>
                <button className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white text-sm text-[var(--ink-700)] border border-transparent hover:border-black/5">
                  <Search className="w-4 h-4" /> Search Chat
                </button>
              </div>
              <div className="px-5 mt-5 mb-2 text-[10px] uppercase tracking-wider text-[var(--ink-500)] font-semibold">Chat History</div>
              <div className="px-3 space-y-1 flex-1 overflow-auto scrollbar-thin">
                {chatHistory.length === 0 && (
                  <div className="px-3 py-2 text-[11px] text-[var(--ink-500)] italic">No chats yet — start one below.</div>
                )}
                {chatHistory.map((c) => {
                  const active = c.id === activeChatId;
                  return (
                    <button
                      key={c.id}
                      onClick={() => loadChat(c)}
                      className={`w-full text-left flex items-start gap-2 px-3 py-2 rounded-xl text-xs leading-snug hover:bg-white transition border ${active ? "bg-[var(--brand-50)] border-[var(--brand-200)] text-[var(--ink-900)]" : "border-transparent text-[var(--ink-700)]"}`}
                    >
                      <MessageCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[var(--brand-600)]" />
                      <span className="line-clamp-2">{c.title}</span>
                    </button>
                  );
                })}
              </div>
              <div className="p-3 border-t border-black/5 space-y-1">
                <button onClick={() => toast("Help center coming soon")} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white text-xs text-[var(--ink-700)]">
                  <HelpCircle className="w-4 h-4" /><span className="flex-1 text-left">Help</span><ChevronRight className="w-3 h-3" />
                </button>
                <button onClick={() => setSettingsOpen(true)} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white text-xs text-[var(--ink-700)]">
                  <Settings className="w-4 h-4" /><span className="flex-1 text-left">Settings</span>
                </button>
                <button onClick={clearAllConversations} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white text-xs text-[var(--ink-700)]">
                  <Trash2 className="w-4 h-4" /><span className="flex-1 text-left">Clear conversations</span>
                </button>
                <button onClick={() => { endSession(); toast("Logged out"); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white text-xs text-[var(--ink-700)]">
                  <LogOut className="w-4 h-4" /><span className="flex-1 text-left">Log out</span>
                </button>
              </div>
            </aside>

            <div className="flex-1 flex flex-col">
              <Header
                listening={listening}
                quickOpen={quickOpen}
                setQuickOpen={setQuickOpen}
                onMaximize={() => setMode("panel")}
                onMinimize={() => setMode("panel")}
                onClose={() => setConfirmClose(true)}
                onNewChat={newChat}
                showMin
                hideBrand
                onQuickAction={handleSuggestion}
              />
              <Thread
                messages={messages}
                transcriptOpen={transcriptOpen}
                setTranscriptOpen={setTranscriptOpen}
                onSuggestion={handleSuggestion}
                renderMessage={renderMessage}
                wide
              />
              <Dock
                listening={listening}
                toggleMic={toggleMic}
                textMode={textMode}
                setTextMode={setTextMode}
                input={input}
                setInput={setInput}
                onSend={() => handleUserInput(input)}
                onEnd={endCall}
                onStartCall={startCall}
                inCall={inCall}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm close dialog */}
      <AnimatePresence>
        {confirmClose && (
          <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-6" onClick={() => setConfirmClose(false)}>
            <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-soft-lg" onClick={(e) => e.stopPropagation()}>
              <div className="text-base font-semibold text-[var(--ink-900)]">Close MAgNA AI Assistance?</div>
              <p className="text-sm text-[var(--ink-500)] mt-2">Your chat history is saved.</p>
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => setConfirmClose(false)} className="px-4 py-2 rounded-full text-sm font-medium border border-black/10 hover:bg-[var(--surface-2)]">
                  Cancel
                </button>
                <button onClick={() => { setConfirmClose(false); setMode("closed"); }} className="px-4 py-2 rounded-full text-sm font-semibold bg-gradient-brand text-white shadow-soft">
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} settings={settings} setSettings={setSettings} onClearAll={clearAllConversations} />
    </>
  );
}

function Header({ listening, quickOpen, setQuickOpen, onMaximize, onMinimize, onClose, onNewChat, showMax, showMin, hideBrand, onQuickAction }: {
  listening: boolean;
  quickOpen: boolean;
  setQuickOpen: (v: boolean) => void;
  onMaximize: () => void;
  onMinimize: () => void;
  onClose: () => void;
  onNewChat: () => void;
  showMax?: boolean;
  showMin?: boolean;
  hideBrand?: boolean;
  onQuickAction?: (label: string) => void;
}) {
  return (
    <div className="relative h-14 px-3 border-b border-black/5 flex items-center gap-2 bg-white/80 backdrop-blur">
      {!hideBrand && (
        <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center shadow-soft shrink-0">
          <Zap className="w-4 h-4 text-white" fill="currentColor" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        {!hideBrand && <div className="text-[13px] font-bold text-[var(--brand-600)] leading-tight truncate">MAgNA AI</div>}
        <div className="text-[10px] text-[var(--ink-500)] leading-tight flex items-center gap-1">
          <span className={`w-1.5 h-1.5 rounded-full ${listening ? "bg-emerald-500 animate-pulse" : "bg-emerald-400"}`} />
          {listening ? "Listening…" : "Online"}
        </div>
      </div>
      {listening && <Waveform active listening className="hidden md:flex" />}
      <button
        onClick={onNewChat}
        aria-label="Start new chat"
        title="Start new chat"
        className="p-1.5 rounded-lg text-[var(--ink-700)] hover:text-[var(--brand-600)] hover:bg-[var(--brand-50)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)]"
      >
        <MessageSquarePlus className="w-4 h-4" />
      </button>
      <QuickActionsButton quickOpen={quickOpen} setQuickOpen={setQuickOpen} onQuickAction={onQuickAction} />
      <TypographyToggle />

      {/* Window controls */}
      <div className="flex items-center gap-0.5 pl-1 ml-1 border-l border-black/5">
        {showMax && (
          <button onClick={onMaximize} aria-label="Maximize" title="Maximize" className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] text-[var(--ink-500)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)]">
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        )}
        {showMin && (
          <button onClick={onMaximize} aria-label="Restore down" title="Restore" className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] text-[var(--ink-500)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)]">
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
        )}
        {showMax && (
          <button onClick={onMinimize} aria-label="Minimize to launcher" title="Minimize" className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] text-[var(--ink-500)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)]">
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        )}
        <button onClick={onClose} aria-label="Close" title="Close" className="p-1.5 rounded-lg hover:bg-[var(--brand-50)] hover:text-[var(--brand-600)] text-[var(--ink-500)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)]">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function Thread({ messages, transcriptOpen, setTranscriptOpen, onSuggestion, renderMessage, wide }: {
  messages: ChatMessage[];
  transcriptOpen: boolean;
  setTranscriptOpen: (v: boolean) => void;
  onSuggestion: (s: string) => void;
  renderMessage: (m: ChatMessage) => React.ReactNode;
  wide?: boolean;
}) {
  const empty = messages.length === 0;
  const lastIsTyping = messages[messages.length - 1]?.type === "typing";
  const { ref, pinned, scrollToBottom } = useSmartAutoScroll<HTMLDivElement>([messages.length, lastIsTyping]);
  return (
    <div className="relative flex-1 min-h-0">
      <div ref={ref} className="absolute inset-0 overflow-y-auto bg-[var(--brand-50)]/40 noise-bg scrollbar-thin overscroll-contain" aria-live="polite">
        <div className={`mx-auto px-4 py-4 ${wide ? "max-w-3xl" : ""}`}>
          {!empty && (
            <button
              onClick={() => setTranscriptOpen(!transcriptOpen)}
              className="text-[10px] uppercase tracking-wider text-[var(--ink-500)] font-semibold flex items-center gap-1 mb-3"
            >
              Live Transcript <ChevronUp className={`w-3 h-3 transition ${transcriptOpen ? "" : "rotate-180"}`} />
            </button>
          )}
          {transcriptOpen && (
            <div>
              {empty ? <Welcome onSuggestion={onSuggestion} /> : messages.map((m) => renderMessage(m))}
            </div>
          )}
          {/* Bottom spacing so the latest output isn't flush against the dock */}
          {!empty && <div className="h-6" aria-hidden />}
        </div>
      </div>
      <AnimatePresence>
        {!pinned && !empty && (
          <motion.button
            key="new-response"
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            onClick={() => scrollToBottom("smooth")}
            className="absolute left-1/2 -translate-x-1/2 bottom-3 z-10 px-3.5 py-1.5 rounded-full bg-white border border-black/10 shadow-soft-lg text-xs font-medium text-[var(--ink-700)] hover:bg-[var(--brand-50)] hover:text-[var(--brand-600)] hover:border-[var(--brand-200)] inline-flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)]"
          >
            New response <ChevronDown className="w-3.5 h-3.5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

function QuickActionsButton({ quickOpen, setQuickOpen, onQuickAction }: {
  quickOpen: boolean;
  setQuickOpen: (v: boolean) => void;
  onQuickAction?: (label: string) => void;
}) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!quickOpen) return;
    const update = () => {
      const r = btnRef.current?.getBoundingClientRect();
      if (r) setPos({ top: r.bottom + 8, left: r.right - 224 });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    const onClick = (e: MouseEvent) => {
      if (btnRef.current && !btnRef.current.contains(e.target as Node)) {
        const panel = document.getElementById("qa-portal-panel");
        if (panel && !panel.contains(e.target as Node)) setQuickOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      document.removeEventListener("mousedown", onClick);
    };
  }, [quickOpen, setQuickOpen]);

  return (
    <>
      <button
        ref={btnRef}
        onClick={() => setQuickOpen(!quickOpen)}
        aria-label="Quick Actions"
        title="Quick Actions"
        className="p-1.5 rounded-lg text-[var(--ink-700)] hover:text-[var(--brand-600)] hover:bg-[var(--brand-50)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)]"
      >
        <RefreshCw className="w-4 h-4" />
      </button>
      {quickOpen && pos && createPortal(
        <motion.div
          id="qa-portal-panel"
          initial={{ opacity: 0, scale: 0.96, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          style={{ position: "fixed", top: pos.top, left: Math.max(8, pos.left), zIndex: 9999 }}
          className="w-56 bg-white rounded-2xl shadow-soft-lg border border-black/5 p-2"
        >
          <div className="px-2 pt-1 pb-2 text-[10px] uppercase tracking-wider text-[var(--ink-500)] font-semibold">Quick Actions</div>
          {quickActions.map((q) => {
            const Icon = qaIcons[q.icon];
            return (
              <button
                key={q.label}
                onClick={() => { setQuickOpen(false); onQuickAction?.(q.label); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-[var(--ink-700)] hover:bg-[var(--brand-50)]"
              >
                <Icon className="w-4 h-4 text-[var(--brand-600)]" /> {q.label}
              </button>
            );
          })}
        </motion.div>,
        document.body
      )}
    </>
  );
}

function Welcome({ onSuggestion }: { onSuggestion: (s: string) => void }) {
  return (
    <div className="flex flex-col items-center text-center py-6 px-2">
      <div className="relative w-16 h-16 rounded-2xl bg-gradient-brand flex items-center justify-center shadow-soft-lg">
        <Zap className="w-8 h-8 text-white" fill="currentColor" />
        <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white" />
      </div>
      <h2 className="mt-5 text-[20px] font-semibold text-[var(--ink-900)] tracking-tight">Hello, Travis 👋</h2>
      <p className="text-[var(--brand-600)] font-semibold text-sm mt-0.5">Welcome to MAgNA AI Assistance</p>
      <p className="text-[var(--ink-500)] text-xs mt-1">Ask about parts, orders, filters or service tickets.</p>
      <div className="flex flex-wrap gap-2 justify-center mt-5 max-w-md">
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => onSuggestion(s)}
            className="px-3.5 py-1.5 rounded-full bg-white border border-black/10 text-xs font-medium text-[var(--ink-700)] hover:bg-[var(--brand-50)] hover:border-[var(--brand-200)] hover:text-[var(--brand-700)] transition shadow-sm flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] focus:ring-offset-2"
          >
            <Sparkles className="w-3 h-3 text-[var(--brand-500)]" />
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function Dock({ listening, toggleMic, textMode, setTextMode, input, setInput, onSend, onEnd, onStartCall, inCall }: {
  listening: boolean;
  toggleMic: () => void;
  textMode: boolean;
  setTextMode: (v: boolean) => void;
  input: string;
  setInput: (v: string) => void;
  onSend: () => void;
  onEnd: () => void;
  onStartCall: () => void;
  inCall: boolean;
}) {
  // ChatGPT-style composer: text input is always visible; call/mute live inside the bar.
  void textMode; void setTextMode;
  return (
    <div className="border-t border-black/5 bg-white/90 backdrop-blur p-3">
      <form
        onSubmit={(e) => { e.preventDefault(); onSend(); }}
        className="flex items-end gap-2 bg-[var(--surface-1)] border border-black/10 rounded-3xl px-3 py-2 focus-within:ring-2 focus-within:ring-[var(--brand-200)]"
      >
        {/* Mic — only visible during an active call to mute/unmute */}
        {inCall && (
          <button
            type="button"
            onClick={toggleMic}
            aria-label={listening ? "Mute microphone" : "Unmute microphone"}
            title={listening ? "Mute" : "Unmute"}
            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition ${
              listening
                ? "bg-[var(--brand-600)] text-white ring-4 ring-[var(--brand-200)]/40 animate-pulse"
                : "bg-white border border-black/10 text-[var(--ink-700)] hover:bg-[var(--brand-50)]"
            }`}
          >
            {listening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>
        )}

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); } }}
          placeholder="Message MAgNA AI…"
          rows={1}
          aria-label="Type a message"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--ink-500)] resize-none max-h-32 py-1.5"
        />

        {/* Call / hang-up */}
        {inCall ? (
          <button
            type="button"
            onClick={onEnd}
            aria-label="Hang up call"
            title="Hang up"
            className="w-9 h-9 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shrink-0"
          >
            <PhoneOff className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onStartCall}
            aria-label="Call MAgNA AI"
            title="Voice call"
            className="w-9 h-9 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shrink-0"
          >
            <Phone className="w-4 h-4" />
          </button>
        )}

        {/* Send */}
        <button
          type="submit"
          aria-label="Send"
          disabled={!input.trim()}
          className="w-9 h-9 rounded-full bg-gradient-brand text-white flex items-center justify-center hover:opacity-95 shadow-soft shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
      <p className="text-center text-[10px] text-[var(--ink-500)] mt-2">
        MAgNA AI may make mistakes — verify critical info.
      </p>
    </div>
  );
}

function SettingsModal({ open, onClose, settings, setSettings, onClearAll }: {
  open: boolean;
  onClose: () => void;
  settings: Settings;
  setSettings: (s: Settings) => void;
  onClearAll: () => void;
}) {
  if (!open) return null;
  const update = <K extends keyof Settings>(k: K, v: Settings[K]) => setSettings({ ...settings, [k]: v });
  return (
    <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-6" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-3xl p-6 max-w-md w-full shadow-soft-lg max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-base font-semibold text-[var(--ink-900)]">Settings</div>
            <div className="text-xs text-[var(--ink-500)]">Personalize your MAgNA AI experience</div>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-2 rounded-full hover:bg-[var(--surface-2)]"><X className="w-4 h-4" /></button>
        </div>

        <Section title="Voice & Language">
          <Row label="Assistant voice">
            <select value={settings.voice} onChange={(e) => update("voice", e.target.value as Settings["voice"])} className="text-xs bg-[var(--surface-1)] border border-black/10 rounded-lg px-2 py-1.5">
              <option value="female-en">Aria (Female · English)</option>
              <option value="male-en">Atlas (Male · English)</option>
              <option value="female-hi">Anaya (Female · Hindi)</option>
            </select>
          </Row>
          <Row label="Language">
            <select value={settings.language} onChange={(e) => update("language", e.target.value as Settings["language"])} className="text-xs bg-[var(--surface-1)] border border-black/10 rounded-lg px-2 py-1.5">
              <option value="en-US">English (US)</option>
              <option value="en-IN">English (India)</option>
              <option value="hi-IN">हिन्दी (Hindi)</option>
            </select>
          </Row>
          <Row label="Auto-listen on call start">
            <Toggle on={settings.autoListen} onChange={(v) => update("autoListen", v)} />
          </Row>
        </Section>

        <Section title="Responses">
          <Row label="Response style">
            <div className="flex gap-1">
              {(["concise", "detailed"] as const).map((v) => (
                <button key={v} onClick={() => update("responseStyle", v)} className={`text-xs px-3 py-1.5 rounded-full border ${settings.responseStyle === v ? "bg-[var(--brand-600)] text-white border-[var(--brand-600)]" : "bg-white border-black/10 text-[var(--ink-700)]"}`}>
                  {v[0].toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
          </Row>
        </Section>

        <Section title="Notifications">
          <Row label="Order & ticket updates">
            <Toggle on={settings.notifications} onChange={(v) => update("notifications", v)} />
          </Row>
        </Section>

        <Section title="Appearance">
          <Row label="Theme">
            <div className="flex gap-1">
              {(["light", "system"] as const).map((v) => (
                <button key={v} onClick={() => update("theme", v)} className={`text-xs px-3 py-1.5 rounded-full border ${settings.theme === v ? "bg-[var(--brand-600)] text-white border-[var(--brand-600)]" : "bg-white border-black/10 text-[var(--ink-700)]"}`}>
                  {v[0].toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
          </Row>
        </Section>

        <Section title="Data">
          <button onClick={() => { onClearAll(); onClose(); }} className="w-full text-xs px-3 py-2 rounded-xl border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 inline-flex items-center justify-center gap-1.5">
            <Trash2 className="w-3.5 h-3.5" /> Clear all conversations
          </button>
        </Section>

        <div className="text-[10px] text-[var(--ink-500)] text-center mt-4">MAgNA AI Assistant · v1.0.0</div>
      </motion.div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="text-[10px] uppercase tracking-wider text-[var(--ink-500)] font-semibold mb-2">{title}</div>
      <div className="space-y-2 bg-[var(--surface-1)] rounded-2xl p-3 border border-black/5">{children}</div>
    </div>
  );
}
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="text-xs text-[var(--ink-700)]">{label}</div>
      {children}
    </div>
  );
}
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!on)} aria-pressed={on} className={`w-10 h-6 rounded-full transition relative ${on ? "bg-[var(--brand-600)]" : "bg-[var(--ink-300)]"}`}>
      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${on ? "left-[18px]" : "left-0.5"}`} />
    </button>
  );
}

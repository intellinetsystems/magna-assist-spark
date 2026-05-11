import { useEffect, useRef, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Zap, Maximize2, Minimize2, X, RefreshCw, Mic, MicOff, PhoneOff, MessageSquare, Send,
  Sparkles, ChevronDown, Search, PenSquare, MessageCircle, HelpCircle, Settings, Trash2, LogOut,
  Package, Replace, Ticket, CheckCircle, ChevronRight, ChevronUp, MessageSquarePlus,
} from "lucide-react";
import { Waveform } from "./Waveform";
import {
  ChatMessage, FlowKey, buildFlow, buildEtaAvailable, buildCreateTicketFromEta,
  flowTriggers, newId, suggestions, quickActions, searchParts, buildFilters, buildKeys, partsByFigure, type PartItem,
} from "@/lib/flows";
import {
  UserBubble, BotText, TypingBubble, PriorityCard, TicketCard,
} from "./MessageBubbles";
import {
  AttachmentPickerCard, ModelPickerCard, VariantPickerCard, AssemblyPickerCard, PartQueryCard, ResultListCard,
  PartDetailCard, OrderHeaderCard, EtaPendingCard, TrackingCardEx,
  AccessoryPickerCard, AccessoryListCard,
} from "./GuidedCards";
import { toast } from "sonner";
import { useSmartAutoScroll } from "@/hooks/use-smart-auto-scroll";

type Mode = "closed" | "panel" | "full";

const qaIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Package, Replace, Ticket, CheckCircle,
};

const historyMock = [
  "Order Detail Analysis from 1-Jan-2023 to 16-Jun-2025 of 'Auto Motors Co. HCV'",
  "Top 5 Selling Parts",
  "Compare Cost Of Quarter 1 & Quarter 2, 2024",
];

const STORAGE_KEY = "magna_ai_session";

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
  const [quickOpen, setQuickOpen] = useState(false);
  const [transcriptOpen, setTranscriptOpen] = useState(true);
  const [unread, setUnread] = useState(false);
  const [etaAvailable, setEtaAvailable] = useState(true);
  const [confirmClose, setConfirmClose] = useState(false);
  const timersRef = useRef<number[]>([]);
  // Pending state for the multi-step part flow
  const partFlowRef = useRef<{ attachment?: string; model?: string; variant?: string; figure?: string; query?: string }>({});

  // Load persisted session
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ChatMessage[];
        if (Array.isArray(parsed)) setMessages(parsed);
      }
    } catch { /* ignore */ }
  }, []);

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

    // Direct part-number lookup — skip the model/variant flow when an exact part no is provided.
    const partMatch = text.match(/KMW[A-Z0-9]+/i);
    if (partMatch) {
      const items = searchParts(partMatch[0], "", "");
      if (items.length >= 1 && items[0].partNo.toLowerCase() === partMatch[0].toLowerCase()) {
        const part = items[0];
        setTimeout(() => pushMessage({ id: newId(), role: "bot", type: "typing" }), 150);
        setTimeout(() => {
          pushMessage({ id: newId(), role: "bot", type: "text", text: `Found it — **${part.partNo}** (${part.description}) from **${part.model} / ${part.variant}**, assembly *${part.assembly}*.` });
          setTimeout(() => pushMessage({ id: newId(), role: "bot", type: "part-detail", part }), 300);
        }, 900);
        return;
      }
    }

    // Description-based lookup — short keyword like "valve", "hex nut", "hydraulic adapter".
    // If unique → jump straight to detail. If multiple → ask model/variant hierarchy first.
    const descKeyword = /\b(valve|adapter|fitting|hex\s*nut|hex\s*head|cap\s*screw|screw|lockwasher|washer|hydraulic|backhoe)\b/i;
    if (descKeyword.test(text) && !/order|ticket|eta|track|missing|wrong|filter|key/i.test(text)) {
      const items = searchParts(text, "", "");
      if (items.length === 1) {
        const part = items[0];
        setTimeout(() => pushMessage({ id: newId(), role: "bot", type: "typing" }), 150);
        setTimeout(() => {
          pushMessage({ id: newId(), role: "bot", type: "text", text: `Found it — **${part.partNo}** (${part.description}) from **${part.model} / ${part.variant}**, assembly *${part.assembly}*.` });
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

    const trigger = flowTriggers.find((t) => t.match.test(text));
    const flow = trigger?.flow ?? "create-ticket";
    setTimeout(() => runFlow(flow), 200);
  }

  function handleSuggestion(s: string) {
    const map: Record<string, FlowKey> = {
      "Find a part": "part-search",
      "Browse Quick Reference": "quick-reference",
      "Track my last order": "track-eta",
      "Report an order issue": "wrong-part",
      "Create a service ticket": "create-ticket",
    };
    const flow = map[s] ?? "create-ticket";
    const trigger = flowTriggers.find((t) => t.flow === flow);
    pushMessage({ id: newId(), role: "user", type: "text", text: trigger?.userText ?? s });
    setTimeout(() => runFlow(flow), 250);
  }

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

  const onCreateTicketEta = useCallback(() => {
    pushMessage({ id: newId(), role: "user", type: "text", text: "Yes, create a ticket" });
    setTimeout(() => runSteps(buildCreateTicketFromEta()), 250);
  }, []);

  const onCheckLater = useCallback(() => {
    const t = new Date(Date.now() + 60 * 60 * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    toast.success(`We'll re-check at ${t}`);
    pushMessage({ id: newId(), role: "bot", type: "text", text: `No problem — I'll re-check at **${t}** and notify you.` });
  }, []);

  const onAccessoryPick = useCallback((kind: "Filter" | "Key", series: string) => {
    pushMessage({ id: newId(), role: "user", type: "text", text: `${kind} List → ${series}` });
    setTimeout(() => {
      const items = kind === "Filter" ? buildFilters(series) : buildKeys(series);
      pushMessage({ id: newId(), role: "bot", type: "text", text: `Here are the **${kind}** items for **${series}** — pick one to see full details:` });
      setTimeout(() => pushMessage({ id: newId(), role: "bot", type: "accessory-list", kind, series, items }), 300);
    }, 250);
  }, []);

  function newChat() {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setMessages([]);
    partFlowRef.current = {};
  }

  function endSession() {
    newChat();
    setMode("closed");
    toast("Chat ended. Start a new one any time.");
  }

  function toggleMic() { setListening((v) => !v); }

  const renderMessage = (m: ChatMessage) => {
    if (m.role === "user" && m.type === "text") return <UserBubble key={m.id} text={m.text} />;
    if (m.type === "text") return <BotText key={m.id} text={m.text} />;
    if (m.type === "typing") return <TypingBubble key={m.id} />;
    if (m.type === "priority") return <PriorityCard key={m.id} onSelect={() => {
      setTimeout(() => pushMessage({ id: newId(), role: "bot", type: "text", text: "Thank you. Your ticket has been created successfully." }), 300);
      setTimeout(() => pushMessage({ id: newId(), role: "bot", type: "ticket", ticketId: "EPC-61485" }), 800);
    }} />;
    if (m.type === "ticket") return <TicketCard key={m.id} ticketId={m.ticketId} />;
    if (m.type === "tracking") return <TrackingCardEx key={m.id} orderId={m.orderId} eta={m.eta} />;
    if (m.type === "attachment-picker") return <AttachmentPickerCard key={m.id} onSubmit={onAttachmentPick} />;
    if (m.type === "model-picker") return <ModelPickerCard key={m.id} attachment={m.attachment} onSubmit={onModelPick} />;
    if (m.type === "variant-picker") return <VariantPickerCard key={m.id} model={m.model} onSubmit={onVariantPick} />;
    if (m.type === "assembly-picker") return <AssemblyPickerCard key={m.id} model={m.model} variant={m.variant} onSubmit={onAssemblyPick} />;
    if (m.type === "part-query") return <PartQueryCard key={m.id} model={m.model} variant={m.variant} onSubmit={onPartQuery} />;
    if (m.type === "result-list") return <ResultListCard key={m.id} items={m.items} query={m.query} model={m.model} variant={m.variant} onSelect={onResultSelect} />;
    if (m.type === "part-detail") return <PartDetailCard key={m.id} part={m.part} />;
    if (m.type === "order-header") return <OrderHeaderCard key={m.id} orderId={m.orderId} placed={m.placed} items={m.items} total={m.total} />;
    if (m.type === "eta-pending") return <EtaPendingCard key={m.id} orderId={m.orderId} onCreateTicket={onCreateTicketEta} onCheckLater={onCheckLater} />;
    if (m.type === "accessory-picker") return <AccessoryPickerCard key={m.id} kind={m.kind} onPick={onAccessoryPick} />;
    if (m.type === "accessory-list") return <AccessoryListCard key={m.id} kind={m.kind} series={m.series} items={m.items} onSelect={onResultSelect} />;
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
                onEnd={() => { setListening(false); setMode("closed"); }}
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
                {historyMock.map((h, i) => (
                  <button key={i} className={`w-full text-left flex items-start gap-2 px-3 py-2 rounded-xl text-xs leading-snug hover:bg-white transition border ${i === 0 ? "bg-[var(--brand-50)] border-[var(--brand-200)] text-[var(--ink-900)]" : "border-transparent text-[var(--ink-700)]"}`}>
                    <MessageCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[var(--brand-600)]" />
                    <span className="line-clamp-2">{h}</span>
                  </button>
                ))}
              </div>
              <div className="p-3 border-t border-black/5 space-y-1">
                {[
                  { Icon: HelpCircle, label: "Help", chev: true },
                  { Icon: Settings, label: "Settings" },
                  { Icon: Trash2, label: "Clear conversations" },
                  { Icon: LogOut, label: "Log out" },
                ].map(({ Icon, label, chev }) => (
                  <button key={label} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white text-xs text-[var(--ink-700)]">
                    <Icon className="w-4 h-4" />
                    <span className="flex-1 text-left">{label}</span>
                    {chev && <ChevronRight className="w-3 h-3" />}
                  </button>
                ))}
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
                onEnd={() => { setListening(false); setMode("closed"); }}
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
    </>
  );
}

function Header({ listening, quickOpen, setQuickOpen, onMaximize, onMinimize, onClose, onNewChat, showMax, showMin }: {
  listening: boolean;
  quickOpen: boolean;
  setQuickOpen: (v: boolean) => void;
  onMaximize: () => void;
  onMinimize: () => void;
  onClose: () => void;
  onNewChat: () => void;
  showMax?: boolean;
  showMin?: boolean;
}) {
  return (
    <div className="relative h-14 px-3 border-b border-black/5 flex items-center gap-2 bg-white/80 backdrop-blur">
      <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center shadow-soft shrink-0">
        <Zap className="w-4 h-4 text-white" fill="currentColor" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-bold text-[var(--brand-600)] leading-tight truncate">MAgNA AI</div>
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
      <div className="relative">
        <button
          onClick={() => setQuickOpen(!quickOpen)}
          aria-label="Quick Actions"
          title="Quick Actions"
          className="p-1.5 rounded-lg text-[var(--ink-700)] hover:text-[var(--brand-600)] hover:bg-[var(--brand-50)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)]"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
        <AnimatePresence>
          {quickOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -4 }}
              className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-soft-lg border border-black/5 p-2 z-10"
            >
              <div className="px-2 pt-1 pb-2 text-[10px] uppercase tracking-wider text-[var(--ink-500)] font-semibold">Quick Actions</div>
              {quickActions.map((q) => {
                const Icon = qaIcons[q.icon];
                return (
                  <button key={q.label} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-[var(--ink-700)] hover:bg-[var(--brand-50)]">
                    <Icon className="w-4 h-4 text-[var(--brand-600)]" /> {q.label}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
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

function Dock({ listening, toggleMic, textMode, setTextMode, input, setInput, onSend, onEnd }: {
  listening: boolean;
  toggleMic: () => void;
  textMode: boolean;
  setTextMode: (v: boolean) => void;
  input: string;
  setInput: (v: string) => void;
  onSend: () => void;
  onEnd: () => void;
}) {
  return (
    <div className="border-t border-black/5 bg-white/90 backdrop-blur p-4">
      {textMode && (
        <form
          onSubmit={(e) => { e.preventDefault(); onSend(); }}
          className="mb-3 flex items-center gap-2 bg-[var(--surface-1)] border border-black/5 rounded-2xl px-3 py-2 focus-within:ring-2 focus-within:ring-[var(--brand-200)]"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Message Mahindra AI Assistant…"
            aria-label="Type a message"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--ink-500)]"
          />
          <button type="submit" aria-label="Send" className="w-8 h-8 rounded-full bg-gradient-brand text-white flex items-center justify-center hover:opacity-95 shadow-soft">
            <Send className="w-4 h-4" />
          </button>
        </form>
      )}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={toggleMic}
          aria-label={listening ? "Stop microphone" : "Start microphone"}
          className={`w-11 h-11 rounded-full border flex items-center justify-center transition focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] focus:ring-offset-2 ${
            listening
              ? "bg-[var(--brand-50)] border-[var(--brand-500)] text-[var(--brand-600)] ring-4 ring-[var(--brand-200)]/40 animate-pulse"
              : "bg-white border-black/10 text-[var(--ink-700)] hover:bg-[var(--surface-2)]"
          }`}
        >
          {listening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>
        <button
          onClick={onEnd}
          aria-label="End call"
          className="w-14 h-14 rounded-full bg-gradient-brand text-white flex items-center justify-center shadow-soft-lg hover:scale-105 transition focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] focus:ring-offset-2"
        >
          <PhoneOff className="w-6 h-6" />
        </button>
        <button
          onClick={() => setTextMode(!textMode)}
          aria-label="Toggle text input"
          className={`w-11 h-11 rounded-full border flex items-center justify-center transition focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] focus:ring-offset-2 ${
            textMode ? "bg-[var(--brand-50)] border-[var(--brand-200)] text-[var(--brand-600)]" : "bg-white border-black/10 text-[var(--ink-700)] hover:bg-[var(--surface-2)]"
          }`}
        >
          <MessageSquare className="w-5 h-5" />
        </button>
      </div>
      <p className="text-center text-[10px] text-[var(--ink-500)] mt-2">
        MAgNA AI may make mistakes — verify critical info.
      </p>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Zap, Maximize2, Minimize2, X, RefreshCw, Mic, MicOff, PhoneOff, MessageSquare, Send,
  Sparkles, ChevronDown, Search, PenSquare, MessageCircle, HelpCircle, Settings, Trash2, LogOut,
  Package, Replace, Ticket, CheckCircle, ChevronRight,
} from "lucide-react";
import { Waveform } from "./Waveform";
import {
  ChatMessage, FlowKey, buildFlow, flowTriggers, newId, suggestions, quickActions,
} from "@/lib/flows";
import {
  UserBubble, BotText, TypingBubble, PriorityCard, TicketCard, TrackingCard, PartCard,
} from "./MessageBubbles";

type Mode = "closed" | "panel" | "full";

const qaIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Package, Replace, Ticket, CheckCircle,
};

const historyMock = [
  "Order Detail Analysis from 1-Jan-2023 to 16-Jun-2025 of 'Auto Motors Co. HCV'",
  "Top 5 Selling Parts",
  "Compare Cost Of Quarter 1 & Quarter 2, 2024",
];

export function Assistant() {
  const [mode, setMode] = useState<Mode>("closed");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [textMode, setTextMode] = useState(false);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [transcriptOpen, setTranscriptOpen] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => () => timersRef.current.forEach(clearTimeout), []);

  function pushMessage(m: ChatMessage) {
    setMessages((prev) => [...prev.filter((x) => x.type !== "typing"), m]);
  }

  function runFlow(flow: FlowKey) {
    const steps = buildFlow(flow);
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

  function handleUserInput(raw: string) {
    const text = raw.trim();
    if (!text) return;
    pushMessage({ id: newId(), role: "user", type: "text", text });
    setInput("");
    const trigger = flowTriggers.find((t) => t.match.test(text));
    const flow = trigger?.flow ?? "create-ticket";
    setTimeout(() => runFlow(flow), 200);
  }

  function handleSuggestion(s: string) {
    const map: Record<string, FlowKey> = {
      "Find a part by number": "part-search",
      "Track my order": "track-eta",
      "Report an order issue": "wrong-part",
      "Create a service ticket": "create-ticket",
    };
    const flow = map[s];
    const trigger = flowTriggers.find((t) => t.flow === flow);
    pushMessage({ id: newId(), role: "user", type: "text", text: trigger?.userText ?? s });
    setTimeout(() => runFlow(flow), 250);
  }

  function newChat() {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setMessages([]);
  }

  function toggleMic() {
    setListening((v) => !v);
  }

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
            className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-2xl bg-gradient-brand text-white shadow-soft-lg flex items-center justify-center group"
            aria-label="Open MAgNA AI Assistant"
          >
            <span className="absolute inset-0 rounded-2xl bg-[var(--brand-500)] opacity-30 animate-ripple" />
            <span className="absolute inset-0 rounded-2xl bg-[var(--brand-500)] opacity-30 animate-ripple" style={{ animationDelay: "0.8s" }} />
            <span className="absolute inset-0 rounded-2xl bg-[var(--brand-500)] opacity-30 animate-ripple" style={{ animationDelay: "1.6s" }} />
            <div className="relative">
              <Zap className="w-7 h-7" strokeWidth={2.2} fill="currentColor" />
            </div>
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
                onClose={() => setMode("closed")}
                showMax
              />
              <Thread
                messages={messages}
                scrollRef={scrollRef}
                transcriptOpen={transcriptOpen}
                setTranscriptOpen={setTranscriptOpen}
                onSuggestion={handleSuggestion}
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
            {/* Sidebar */}
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

            {/* Main */}
            <div className="flex-1 flex flex-col">
              <Header
                listening={listening}
                quickOpen={quickOpen}
                setQuickOpen={setQuickOpen}
                onMaximize={() => setMode("panel")}
                onClose={() => setMode("closed")}
                showMin
              />
              <Thread
                messages={messages}
                scrollRef={scrollRef}
                transcriptOpen={transcriptOpen}
                setTranscriptOpen={setTranscriptOpen}
                onSuggestion={handleSuggestion}
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
    </>
  );
}

function Header({ listening, quickOpen, setQuickOpen, onMaximize, onClose, showMax, showMin }: {
  listening: boolean;
  quickOpen: boolean;
  setQuickOpen: (v: boolean) => void;
  onMaximize: () => void;
  onClose: () => void;
  showMax?: boolean;
  showMin?: boolean;
}) {
  return (
    <div className="relative px-4 py-3 border-b border-black/5 flex items-center gap-3 bg-white/80 backdrop-blur">
      <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center shadow-soft shrink-0">
        <Zap className="w-5 h-5 text-white" fill="currentColor" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[15px] font-bold text-[var(--brand-600)] leading-tight truncate">MAgNA AI Assistance</div>
        <div className="text-[11px] text-[var(--ink-500)]">Virtual Assistant</div>
      </div>
      <Waveform active={listening} className="hidden sm:flex" />
      <div className="relative">
        <button
          onClick={() => setQuickOpen(!quickOpen)}
          className="text-xs font-medium text-[var(--ink-700)] hover:text-[var(--brand-600)] inline-flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-[var(--brand-50)]"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Quick Actions
        </button>
        <AnimatePresence>
          {quickOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -4 }}
              className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-soft-lg border border-black/5 p-2 z-10"
            >
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
      {showMax && (
        <button onClick={onMaximize} className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] text-[var(--ink-500)]">
          <Maximize2 className="w-4 h-4" />
        </button>
      )}
      {showMin && (
        <button onClick={onMaximize} className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] text-[var(--ink-500)]">
          <Minimize2 className="w-4 h-4" />
        </button>
      )}
      <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] text-[var(--ink-500)]">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

function Thread({ messages, scrollRef, transcriptOpen, setTranscriptOpen, onSuggestion, wide }: {
  messages: ChatMessage[];
  scrollRef: React.RefObject<HTMLDivElement | null>;
  transcriptOpen: boolean;
  setTranscriptOpen: (v: boolean) => void;
  onSuggestion: (s: string) => void;
  wide?: boolean;
}) {
  const empty = messages.length === 0;
  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto bg-[var(--brand-50)]/40 noise-bg scrollbar-thin">
      <div className={`mx-auto px-4 py-3 ${wide ? "max-w-3xl" : ""}`}>
        {!empty && (
          <button
            onClick={() => setTranscriptOpen(!transcriptOpen)}
            className="text-[10px] uppercase tracking-wider text-[var(--ink-500)] font-semibold flex items-center gap-1 mb-2"
          >
            Live Transcript <ChevronDown className={`w-3 h-3 transition ${transcriptOpen ? "" : "-rotate-90"}`} />
          </button>
        )}
        {transcriptOpen && (
          <div>
            {empty ? <Welcome onSuggestion={onSuggestion} /> : messages.map((m) => renderMessage(m))}
          </div>
        )}
      </div>
    </div>
  );
}

function renderMessage(m: ChatMessage) {
  if (m.role === "user" && m.type === "text") return <UserBubble key={m.id} text={m.text} />;
  if (m.type === "text") return <BotText key={m.id} text={m.text} />;
  if (m.type === "typing") return <TypingBubble key={m.id} />;
  if (m.type === "priority") return <PriorityCard key={m.id} onSelect={() => {}} />;
  if (m.type === "ticket") return <TicketCard key={m.id} ticketId={m.ticketId} />;
  if (m.type === "tracking") return <TrackingCard key={m.id} orderId={m.orderId} />;
  if (m.type === "part") return <PartCard key={m.id} />;
  return null;
}

function Welcome({ onSuggestion }: { onSuggestion: (s: string) => void }) {
  return (
    <div className="flex flex-col items-center text-center py-8">
      <div className="relative">
        <span className="absolute inset-0 rounded-3xl bg-[var(--brand-500)] opacity-25 animate-ripple" />
        <span className="absolute inset-0 rounded-3xl bg-[var(--brand-500)] opacity-25 animate-ripple" style={{ animationDelay: "0.7s" }} />
        <span className="absolute inset-0 rounded-3xl bg-[var(--brand-500)] opacity-25 animate-ripple" style={{ animationDelay: "1.4s" }} />
        <div className="relative w-24 h-24 rounded-3xl bg-gradient-brand flex items-center justify-center shadow-soft-lg">
          <Zap className="w-12 h-12 text-white" fill="currentColor" />
        </div>
      </div>
      <Waveform active className="mt-6 scale-150" />
      <h2 className="mt-6 text-[22px] font-semibold text-[var(--ink-900)]">Hello, Travis Johnson!</h2>
      <p className="text-[var(--brand-600)] font-semibold mt-1">Welcome to MAgNA AI Assistance!</p>
      <p className="text-[var(--ink-500)] text-sm mt-1">How can I assist?</p>
      <div className="flex flex-wrap gap-2 justify-center mt-6 max-w-md">
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => onSuggestion(s)}
            className="px-4 py-2 rounded-full bg-white border border-black/10 text-xs text-[var(--ink-700)] hover:bg-[var(--brand-50)] hover:border-[var(--brand-200)] hover:text-[var(--brand-600)] transition shadow-sm flex items-center gap-1.5"
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
    <div className="border-t border-black/5 bg-white/90 backdrop-blur p-3">
      {textMode && (
        <form
          onSubmit={(e) => { e.preventDefault(); onSend(); }}
          className="mb-3 flex items-center gap-2 bg-[var(--surface-1)] border border-black/5 rounded-2xl px-3 py-2 focus-within:ring-2 focus-within:ring-[var(--brand-200)]"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Message Mahindra AI Assistant…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--ink-500)]"
          />
          <button type="submit" className="w-8 h-8 rounded-full bg-gradient-brand text-white flex items-center justify-center hover:opacity-95 shadow-soft">
            <Send className="w-4 h-4" />
          </button>
        </form>
      )}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={toggleMic}
          className={`w-11 h-11 rounded-full border flex items-center justify-center transition ${
            listening
              ? "bg-[var(--brand-50)] border-[var(--brand-200)] text-[var(--brand-600)] ring-4 ring-[var(--brand-200)]/40 animate-pulse"
              : "bg-white border-black/10 text-[var(--ink-700)] hover:bg-[var(--surface-2)]"
          }`}
        >
          {listening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>
        <button
          onClick={onEnd}
          className="w-14 h-14 rounded-full bg-gradient-brand text-white flex items-center justify-center shadow-soft-lg hover:scale-105 transition"
        >
          <PhoneOff className="w-6 h-6" />
        </button>
        <button
          onClick={() => setTextMode(!textMode)}
          className={`w-11 h-11 rounded-full border flex items-center justify-center transition ${
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

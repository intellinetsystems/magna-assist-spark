import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ThumbsUp, ThumbsDown, MessageSquarePlus, X, Star, Paperclip, CheckCircle2 } from "lucide-react";

type FeedbackType = "like" | "dislike" | "comment";
type StoredFeedback = {
  responseId: string;
  userId: string;
  timestamp: number;
  type: FeedbackType;
  reasons?: string[];
  comment?: string;
  rating?: number;
  attachments?: string[];
};

const FEEDBACK_KEY = "magna_ai_feedback";
const USER_KEY = "magna_ai_user_id";

function getUserId(): string {
  try {
    let id = localStorage.getItem(USER_KEY);
    if (!id) {
      id = "u_" + Math.random().toString(36).slice(2, 10);
      localStorage.setItem(USER_KEY, id);
    }
    return id;
  } catch {
    return "anon";
  }
}

function saveFeedback(f: StoredFeedback) {
  try {
    const raw = localStorage.getItem(FEEDBACK_KEY);
    const list: StoredFeedback[] = raw ? JSON.parse(raw) : [];
    // replace existing like/dislike for same response
    const filtered = list.filter((x) => !(x.responseId === f.responseId && x.type === f.type));
    filtered.push(f);
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify(filtered));
  } catch { /* ignore */ }
}

const DISLIKE_REASONS = [
  "Incorrect Information",
  "Incomplete Answer",
  "Not Relevant",
  "Difficult to Understand",
  "Outdated Information",
  "Too Long",
  "Too Short",
  "Other",
];

export function FeedbackActions() {
  const responseId = useId();
  const userId = getUserId();
  const [picked, setPicked] = useState<"like" | "dislike" | null>(null);
  const [showLikeToast, setShowLikeToast] = useState(false);
  const [dislikeOpen, setDislikeOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

  function handleLike() {
    if (picked === "like") return;
    setPicked("like");
    saveFeedback({ responseId, userId, timestamp: Date.now(), type: "like" });
    setShowLikeToast(true);
    window.setTimeout(() => setShowLikeToast(false), 2200);
  }

  return (
    <div className="mt-1.5 flex items-center justify-end gap-1 opacity-60 hover:opacity-100 transition">
      <ActionBtn label="Like" active={picked === "like"} onClick={handleLike}>
        <ThumbsUp className="w-3.5 h-3.5" />
      </ActionBtn>
      <ActionBtn
        label="Dislike"
        active={picked === "dislike"}
        onClick={() => setDislikeOpen(true)}
      >
        <ThumbsDown className="w-3.5 h-3.5" />
      </ActionBtn>
      <ActionBtn label="Feedback" onClick={() => setFeedbackOpen(true)}>
        <MessageSquarePlus className="w-3.5 h-3.5" />
      </ActionBtn>

      <AnimatePresence>
        {showLikeToast && (
          <motion.span
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="ml-2 text-[11px] text-emerald-600"
          >
            Thank you! Your feedback helps us improve.
          </motion.span>
        )}
      </AnimatePresence>

      {dislikeOpen && (
        <DislikeModal
          onClose={() => setDislikeOpen(false)}
          onSubmit={(reasons, comment) => {
            setPicked("dislike");
            saveFeedback({
              responseId,
              userId,
              timestamp: Date.now(),
              type: "dislike",
              reasons,
              comment,
            });
            setDislikeOpen(false);
            setSuccessOpen(true);
          }}
        />
      )}
      {feedbackOpen && (
        <FeedbackModal
          onClose={() => setFeedbackOpen(false)}
          onSubmit={(comment, rating, attachments) => {
            saveFeedback({
              responseId,
              userId,
              timestamp: Date.now(),
              type: "comment",
              comment,
              rating,
              attachments,
            });
            setFeedbackOpen(false);
            setSuccessOpen(true);
          }}
        />
      )}
      {successOpen && <SuccessModal onClose={() => setSuccessOpen(false)} />}
    </div>
  );
}

function ActionBtn({
  children, label, active, onClick,
}: { children: React.ReactNode; label: string; active?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`p-1.5 rounded-md border transition ${
        active
          ? "bg-[var(--brand-50)] border-[var(--brand-200)] text-[var(--brand-600)]"
          : "bg-transparent border-transparent text-[var(--ink-500)] hover:bg-[var(--surface-1)] hover:text-[var(--ink-900)]"
      }`}
    >
      {children}
    </button>
  );
}

function ModalShell({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[110] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl shadow-soft-lg w-full max-w-md relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-[var(--surface-2)]" aria-label="Close">
          <X className="w-4 h-4" />
        </button>
        {children}
      </motion.div>
    </div>,
    document.body,
  );
}

function DislikeModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (reasons: string[], comment: string) => void }) {
  const [reasons, setReasons] = useState<string[]>([]);
  const [comment, setComment] = useState("");

  function toggle(r: string) {
    setReasons((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));
  }

  return (
    <ModalShell onClose={onClose}>
      <div className="p-5">
        <h3 className="text-base font-semibold text-[var(--ink-900)]">Help us improve this response</h3>
        <p className="text-sm text-[var(--ink-500)] mt-1">What was wrong with this response?</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {DISLIKE_REASONS.map((r) => {
            const on = reasons.includes(r);
            return (
              <label key={r} className={`flex items-center gap-2 text-sm rounded-lg border px-2.5 py-2 cursor-pointer ${on ? "bg-[var(--brand-50)] border-[var(--brand-200)] text-[var(--brand-600)]" : "border-black/10 text-[var(--ink-700)] hover:bg-[var(--surface-1)]"}`}>
                <input type="checkbox" checked={on} onChange={() => toggle(r)} className="accent-[var(--brand-600)]" />
                <span className="truncate">{r}</span>
              </label>
            );
          })}
        </div>
        <div className="mt-4">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, 500))}
            placeholder="Tell us what could be improved..."
            rows={3}
            className="w-full text-sm rounded-lg border border-black/10 px-3 py-2 focus:outline-none focus:border-[var(--brand-500)] resize-none"
          />
          <div className="text-[11px] text-[var(--ink-500)] mt-1 text-right">{comment.length}/500</div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-3.5 py-1.5 rounded-full text-sm border border-black/10 hover:bg-[var(--surface-1)]">Cancel</button>
          <button
            onClick={() => onSubmit(reasons, comment)}
            disabled={reasons.length === 0 && !comment.trim()}
            className="px-3.5 py-1.5 rounded-full text-sm bg-[var(--brand-600)] text-white hover:opacity-95 disabled:opacity-40"
          >
            Submit Feedback
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function FeedbackModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (comment: string, rating: number, attachments: string[]) => void }) {
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(0);
  const [files, setFiles] = useState<string[]>([]);

  function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const list = Array.from(e.target.files ?? []).map((f) => f.name);
    setFiles((prev) => [...prev, ...list]);
  }

  return (
    <ModalShell onClose={onClose}>
      <div className="p-5">
        <h3 className="text-base font-semibold text-[var(--ink-900)]">Share your feedback</h3>
        <p className="text-sm text-[var(--ink-500)] mt-1">Tell us how we're doing.</p>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your thoughts with us..."
          rows={4}
          className="mt-3 w-full text-sm rounded-lg border border-black/10 px-3 py-2 focus:outline-none focus:border-[var(--brand-500)] resize-none"
        />

        <div className="mt-3">
          <label className="text-xs font-medium text-[var(--ink-700)] uppercase tracking-wider">Attachments</label>
          <label className="mt-1.5 flex items-center gap-2 text-sm rounded-lg border border-dashed border-black/15 px-3 py-2 cursor-pointer hover:bg-[var(--surface-1)] text-[var(--ink-500)]">
            <Paperclip className="w-4 h-4" />
            <span>Add image, screenshot, or document</span>
            <input type="file" multiple className="hidden" accept="image/*,.pdf,.doc,.docx,.txt" onChange={onFiles} />
          </label>
          {files.length > 0 && (
            <ul className="mt-2 space-y-1">
              {files.map((f, i) => (
                <li key={i} className="text-xs text-[var(--ink-700)] truncate">• {f}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-3">
          <label className="text-xs font-medium text-[var(--ink-700)] uppercase tracking-wider">Rating</label>
          <div className="mt-1.5 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setRating(n)} aria-label={`${n} star`}>
                <Star
                  className={`w-6 h-6 transition ${n <= rating ? "fill-amber-400 text-amber-400" : "text-[var(--ink-500)]/40 hover:text-amber-300"}`}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-3.5 py-1.5 rounded-full text-sm border border-black/10 hover:bg-[var(--surface-1)]">Cancel</button>
          <button
            onClick={() => onSubmit(comment, rating, files)}
            disabled={!comment.trim() && rating === 0}
            className="px-3.5 py-1.5 rounded-full text-sm bg-[var(--brand-600)] text-white hover:opacity-95 disabled:opacity-40"
          >
            Submit
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function SuccessModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalShell onClose={onClose}>
      <div className="p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6 text-emerald-600" />
        </div>
        <h3 className="mt-3 text-base font-semibold text-[var(--ink-900)]">Feedback Submitted</h3>
        <p className="mt-1 text-sm text-[var(--ink-500)]">
          Thank you for helping us improve our AI experience. Your feedback has been recorded successfully.
        </p>
        <button
          onClick={onClose}
          className="mt-4 px-5 py-2 rounded-full text-sm bg-[var(--brand-600)] text-white hover:opacity-95"
        >
          Done
        </button>
      </div>
    </ModalShell>
  );
}

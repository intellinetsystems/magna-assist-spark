import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Smart auto-scroll hook (ChatGPT/Claude style).
 * - Follows new content while user is near the bottom.
 * - Pauses when user manually scrolls up.
 * - Exposes `pinned` state and a `scrollToBottom` action so callers can
 *   render a floating "New response ↓" button.
 */
export function useSmartAutoScroll<T extends HTMLElement = HTMLDivElement>(
  deps: ReadonlyArray<unknown>,
  options: { threshold?: number; behavior?: ScrollBehavior } = {},
) {
  const { threshold = 80, behavior = "smooth" } = options;
  const ref = useRef<T | null>(null);
  const pinnedRef = useRef(true);
  const [pinned, setPinned] = useState(true);
  const lastScrollTopRef = useRef(0);
  const programmaticRef = useRef(false);

  const isNearBottom = useCallback(() => {
    const el = ref.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
  }, [threshold]);

  const scrollToBottom = useCallback(
    (b: ScrollBehavior = behavior) => {
      const el = ref.current;
      if (!el) return;
      programmaticRef.current = true;
      el.scrollTo({ top: el.scrollHeight, behavior: b });
      pinnedRef.current = true;
      setPinned(true);
      // clear programmatic flag shortly after
      window.setTimeout(() => {
        programmaticRef.current = false;
      }, 250);
    },
    [behavior],
  );

  // Track user scroll direction to detect manual scroll-up
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => {
      if (programmaticRef.current) {
        lastScrollTopRef.current = el.scrollTop;
        return;
      }
      const goingUp = el.scrollTop < lastScrollTopRef.current - 2;
      lastScrollTopRef.current = el.scrollTop;
      if (goingUp && !isNearBottom()) {
        if (pinnedRef.current) {
          pinnedRef.current = false;
          setPinned(false);
        }
      } else if (isNearBottom()) {
        if (!pinnedRef.current) {
          pinnedRef.current = true;
          setPinned(true);
        }
      }
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [isNearBottom]);

  // Auto-follow on content changes when pinned. Use rAF to wait for layout.
  useEffect(() => {
    if (!pinnedRef.current) return;
    const id = requestAnimationFrame(() => scrollToBottom(behavior));
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  // Observe size changes (streaming text growing, images loading, accordions).
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      if (pinnedRef.current) scrollToBottom("auto");
    });
    Array.from(el.children).forEach((c) => ro.observe(c));
    const mo = new MutationObserver(() => {
      // Re-observe new direct children
      Array.from(el.children).forEach((c) => ro.observe(c));
      if (pinnedRef.current) scrollToBottom(behavior);
    });
    mo.observe(el, { childList: true, subtree: true });
    return () => {
      ro.disconnect();
      mo.disconnect();
    };
  }, [behavior, scrollToBottom]);

  return { ref, pinned, scrollToBottom };
}

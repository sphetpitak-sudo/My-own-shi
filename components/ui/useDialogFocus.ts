"use client";

import { useEffect, useRef } from "react";

interface DialogFocusOptions {
  /** Called on Escape. If omitted, Escape does nothing. */
  onClose?: () => void;
  /** Element to focus on open. Defaults to the panel itself. */
  initialFocusRef?: React.RefObject<HTMLElement | null>;
}

/**
 * Lightweight dialog focus management (no library):
 * - moves focus into the panel on open
 * - traps Tab / Shift+Tab inside the panel
 * - Escape calls onClose
 * - restores focus to the trigger on close/unmount
 * Respects reduced motion implicitly (no animation involved).
 */
export function useDialogFocus<T extends HTMLElement>(
  open: boolean,
  { onClose, initialFocusRef }: DialogFocusOptions = {}
) {
  const panelRef = useRef<T | null>(null);
  const triggerRef = useRef<Element | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    triggerRef.current = document.activeElement;
    const panel = panelRef.current;
    if (!panel) return;

    const target = initialFocusRef?.current ?? panel;
    // Focus after paint so the panel is laid out.
    const raf = requestAnimationFrame(() => {
      try {
        target.focus({ preventScroll: true });
      } catch {}
    });

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCloseRef.current?.();
        return;
      }
      if (e.key !== "Tab") return;
      const focusables = panel.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      const list = Array.from(focusables).filter(
        (el) => el.offsetParent !== null || el === document.activeElement
      );
      if (list.length === 0) {
        e.preventDefault();
        return;
      }
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKeyDown, true);
      const trigger = triggerRef.current as HTMLElement | null;
      try {
        trigger?.focus?.({ preventScroll: true });
      } catch {}
    };
  }, [open, initialFocusRef]);

  return panelRef;
}

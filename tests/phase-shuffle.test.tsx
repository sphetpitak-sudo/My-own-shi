// @vitest-environment jsdom
// ============================================
// Subtle shuffle contract (visual layer only — no flow/business logic):
// - renders a small fixed deck, decorative cards hidden from AT
// - deterministic across renders (same DOM twice)
// - completes exactly once via onComplete (also under reduced motion)
// ============================================

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import ShuffleAnimation from "@/components/ShuffleAnimation";

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("ShuffleAnimation contract", () => {
  it("renders 6 decorative cards hidden from assistive tech", () => {
    const { container } = render(<ShuffleAnimation onComplete={vi.fn()} />);
    const cards = container.querySelectorAll(".sealo-shuffle-card");
    expect(cards).toHaveLength(6);
    const deck = container.querySelector(".shuffle-deck-wrap");
    expect(deck?.getAttribute("aria-hidden")).toBe("true");
    expect(screen.getByText("กำลังเตรียมไพ่...")).toBeDefined();
  });

  it("is deterministic: two renders produce identical card vars", () => {
    const a = render(<ShuffleAnimation onComplete={vi.fn()} />);
    const b = render(<ShuffleAnimation onComplete={vi.fn()} />);
    const varsOf = (c: Element) =>
      Array.from(c.querySelectorAll(".sealo-shuffle-card")).map((el) =>
        (el as HTMLElement).getAttribute("style")
      );
    expect(varsOf(a.container)).toEqual(varsOf(b.container));
    a.unmount();
    b.unmount();
  });

  it("calls onComplete exactly once after the sequence", () => {
    const onComplete = vi.fn();
    render(<ShuffleAnimation onComplete={onComplete} />);
    vi.advanceTimersByTime(1500);
    expect(onComplete).not.toHaveBeenCalled();
    vi.advanceTimersByTime(500);
    expect(onComplete).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(5000);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("reduced motion shows the calm fallback and still completes", () => {
    const onComplete = vi.fn();
    render(<ShuffleAnimation onComplete={onComplete} reducedMotion />);
    expect(screen.getByText("กำลังเตรียมไพ่...")).toBeDefined();
    vi.advanceTimersByTime(300);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});

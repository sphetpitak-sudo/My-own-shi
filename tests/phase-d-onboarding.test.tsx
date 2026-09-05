// @vitest-environment jsdom
// ============================================
// Phase D3 — onboarding dismissal (DOM behavior)
// - backdrop click hides WITHOUT persisting (accidental tap is recoverable)
// - explicit X skip persists completion
// ============================================

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import OnboardingModal from "@/components/OnboardingModal";

const KEY = "sealo_onboarding_done";

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("OnboardingModal dismissal", () => {
  it("backdrop click hides but does NOT permanently complete", async () => {
    const user = userEvent.setup();
    render(<OnboardingModal />);
    expect(await screen.findByRole("dialog")).toBeDefined();
    await user.click(screen.getByRole("button", { name: "ปิด" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it("explicit X skip persists completion", async () => {
    const user = userEvent.setup();
    render(<OnboardingModal />);
    expect(await screen.findByRole("dialog")).toBeDefined();
    await user.click(screen.getByRole("button", { name: "ข้าม" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(localStorage.getItem(KEY)).toBe("1");
  });

  it("Escape hides without persisting (keyboard users keep a way out)", async () => {
    const user = userEvent.setup();
    render(<OnboardingModal />);
    expect(await screen.findByRole("dialog")).toBeDefined();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it("already-completed users never see the modal", () => {
    localStorage.setItem(KEY, "1");
    render(<OnboardingModal />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

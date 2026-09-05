// @vitest-environment jsdom
// ============================================
// Phase C — ConfirmDialog + SpreadSelector selection (DOM behavior)
// - dialog shows spread/cost/balance, confirm advances once,
//   cancel/Esc never spend, keyboard semantics intact
// - selected spread is visually + programmatically represented
// ============================================

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import SpreadSelector from "@/components/SpreadSelector";
import { getConfirmSummary } from "@/lib/reading-flow";

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

const summary = getConfirmSummary({
  spreadNameTh: "ไพ่สามใบ",
  cardCount: 3,
  cost: 15,
  current: 100,
});

function renderDialog(props?: Partial<React.ComponentProps<typeof ConfirmDialog>>) {
  return render(
    <ConfirmDialog
      open
      summary={summary}
      confirmLabel="ยืนยัน เปิดไพ่ (15 แต้ม)"
      cancelLabel="กลับไปแก้คำถาม"
      onConfirm={props?.onConfirm ?? vi.fn()}
      onCancel={props?.onCancel ?? vi.fn()}
    />
  );
}

describe("ConfirmDialog", () => {
  it("shows spread, cost, current and resulting balance before spend", () => {
    renderDialog();
    expect(screen.getByRole("dialog", { name: "ยืนยันก่อนเปิดไพ่" })).toBeDefined();
    expect(screen.getByText("ไพ่สามใบ · 3 ใบ")).toBeDefined();
    expect(screen.getByText("100 แต้ม")).toBeDefined(); // current
    expect(screen.getByText("85 แต้ม")).toBeDefined(); // resulting
  });

  it("confirm advances exactly once (double-click safe)", async () => {
    const onConfirm = vi.fn();
    const user = userEvent.setup();
    renderDialog({ onConfirm });
    const btn = screen.getByRole("button", { name: /ยืนยัน เปิดไพ่/ });
    // Two rapid activations (double-click / Enter repeat) must still spend once.
    await user.click(btn);
    await user.click(btn);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("cancel never spends and Escape cancels", async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const user = userEvent.setup();
    renderDialog({ onConfirm, onCancel });
    await user.click(screen.getByRole("button", { name: "กลับไปแก้คำถาม" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("Escape key cancels the dialog", async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();
    renderDialog({ onCancel });
    await user.keyboard("{Escape}");
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("confirm is disabled when points are insufficient", () => {
    const poor = getConfirmSummary({ spreadNameTh: "ไพ่สามใบ", cardCount: 3, cost: 15, current: 10 });
    render(
      <ConfirmDialog
        open
        summary={poor}
        confirmLabel="ยืนยัน"
        cancelLabel="กลับ"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    const btn = screen.getByRole("button", { name: "ยืนยัน" }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect(screen.getByText(/ขาดอีก 5 แต้ม/)).toBeDefined();
  });

  it("moves focus into the dialog on open", async () => {
    renderDialog();
    await vi.waitFor(() => {
      const active = document.activeElement;
      expect(active?.getAttribute("role")).toBe("dialog");
    });
  });
});

describe("SpreadSelector selection state", () => {
  it("marks the actually-selected spread pressed (not dead code)", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const { rerender } = render(
      <SpreadSelector onSelect={onSelect} selectedSpread={null} userPoints={100} costs={{}} />
    );
    const before = screen.getByRole("button", { name: /ไพ่สามใบ/ });
    expect(before.getAttribute("aria-pressed")).toBe("false");

    rerender(
      <SpreadSelector onSelect={onSelect} selectedSpread="three_card" userPoints={100} costs={{}} />
    );
    expect(screen.getByRole("button", { name: /ไพ่สามใบ/ }).getAttribute("aria-pressed")).toBe("true");
    await user.click(screen.getByRole("button", { name: /ไพ่ใบเดียว/ }));
    expect(onSelect).toHaveBeenCalledWith("single");
  });

  it("insufficient spread uses the shared shortage pattern", () => {
    render(
      <SpreadSelector onSelect={vi.fn()} selectedSpread={null} userPoints={0} costs={{}} />
    );
    // banner text comes from InsufficientPoints ("ขาดอีก N แต้ม")
    expect(screen.getAllByText(/ขาดอีก \d+ แต้ม/).length).toBeGreaterThan(0);
  });
});

describe("focus-visible token (static contract)", () => {
  it("dialog panel is focusable without an outline override", () => {
    renderDialog();
    const panel = screen.getByRole("dialog", { name: "ยืนยันก่อนเปิดไพ่" });
    expect(panel.getAttribute("tabindex")).toBe("-1");
  });

  it("backdrop is not keyboard-focusable", () => {
    renderDialog();
    const backdrop = screen.getByRole("button", { name: "ยกเลิก" });
    expect(backdrop.getAttribute("tabindex")).toBe("-1");
  });

  it("double Escape still cancels only once (no double-spend path)", async () => {
    const onCancel = vi.fn();
    renderDialog({ onCancel });
    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});

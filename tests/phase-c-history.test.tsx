// @vitest-environment jsdom
// ============================================
// Phase C — ReadingHistory states (DOM behavior)
// - fetch failure stops the shimmer and shows a retryable error
// - retry resets error/loading and refetches
// - success renders readings (no fabrication on failure)
// ============================================

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next/link", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: ({ href, children, ...rest }: any) => (
    <a href={typeof href === "string" ? href : "#"} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/client";
import ReadingHistory from "@/components/ReadingHistory";

const ROW = {
  id: "r1",
  user_id: "u1",
  spread_type: "single",
  question: "วันนี้เป็นอย่างไร",
  interpretation: "ดีมาก",
  cards: [],
  points_spent: 5,
  created_at: new Date().toISOString(),
};

function mockFetch(result: { data: unknown; error: unknown }) {
  vi.mocked(createClient).mockReturnValue({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            range: vi.fn(async () => result),
          })),
        })),
      })),
    })),
  } as never);
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

describe("ReadingHistory states", () => {
  it("loading shows a status region, then success renders the reading", async () => {
    mockFetch({ data: [ROW], error: null });
    render(<ReadingHistory userId="u1" />);
    expect(screen.getByRole("status", { name: "กำลังโหลดประวัติการทำนาย" })).toBeDefined();
    expect(await screen.findByText("วันนี้เป็นอย่างไร")).toBeDefined();
  });

  it("fetch failure stops loading and shows a retryable error (never shimmer forever)", async () => {
    mockFetch({ data: null, error: { message: "db down" } });
    render(<ReadingHistory userId="u1" />);
    const retry = await screen.findByRole("button", { name: "ลองใหม่" });
    expect(screen.getByText("โหลดประวัติไม่สำเร็จ")).toBeDefined();
    expect(screen.queryByRole("status")).toBeNull();
    expect(retry).toBeDefined();
  });

  it("retry resets error and refetches successfully", async () => {
    mockFetch({ data: null, error: { message: "db down" } });
    const user = userEvent.setup();
    render(<ReadingHistory userId="u1" />);
    await user.click(await screen.findByRole("button", { name: "ลองใหม่" }));
    // Second attempt succeeds (mock now returns data).
    mockFetch({ data: [ROW], error: null });
    await user.click(await screen.findByRole("button", { name: "ลองใหม่" }));
    await waitFor(() => expect(screen.getByText("วันนี้เป็นอย่างไร")).toBeDefined());
  });
});

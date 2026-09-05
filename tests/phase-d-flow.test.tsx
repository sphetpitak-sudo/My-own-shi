// @vitest-environment jsdom
// ============================================
// Phase D — D1 topic state + D4 collection modal (DOM behavior)
// D1: no topic button is active before explicit choice; after picking +
//     navigating back, the chosen topic (and only it) is pressed.
// D4: filter buttons expose touch-hit + pressed state; card modal has
//     dialog semantics and closes via Escape without side effects.
// ============================================

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/dashboard",
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
import ReadingPage from "@/app/dashboard/reading/page";
import CardCollection from "@/components/CardCollection";

function mockShellClient() {
  vi.mocked(createClient).mockReturnValue({
    auth: { getUser: vi.fn(async () => ({ data: { user: { id: "u1" } } })) },
    from: vi.fn((table: string) => {
      if (table === "profiles") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(async () => ({
                data: {
                  points: 100,
                  display_name: "Tester",
                  avatar_url: null,
                  is_admin: false,
                },
                error: null,
              })),
            })),
          })),
        };
      }
      if (table === "admin_settings") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(async () => ({ data: null, error: { message: "none" } })),
            })),
          })),
        };
      }
      throw new Error(`unexpected table ${table}`);
    }),
    channel: vi.fn(() => ({ on: vi.fn(() => ({ subscribe: vi.fn(() => ({})) })) })),
    removeChannel: vi.fn(),
  } as never);
}

function topicButton(label: string) {
  // Accessible name concatenates the button's text content.
  return screen.getByRole("button", { name: new RegExp(label) });
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("D1 topic selection state", () => {
  it("nothing is pressed initially; explicit choice sticks across back-nav", async () => {
    mockShellClient();
    const user = userEvent.setup();
    render(<ReadingPage />);

    // Reach the topic step: pick any spread first.
    await user.click(await screen.findByRole("button", { name: /ไพ่สามใบ/ }));
    const love = await screen.findByRole("button", { name: /ความรัก/ });

    // Initial: neutral — no topic claims selection.
    const pressedBefore = screen
      .getAllByRole("button")
      .filter((b) => b.getAttribute("aria-pressed") === "true");
    expect(pressedBefore).toHaveLength(0);
    expect(love.getAttribute("aria-pressed")).toBe("false");

    // Explicit pick advances to question…
    await user.click(love);
    expect(await screen.findByText("ตั้งคำถามกับจักรวาล")).toBeDefined();

    // …and back-nav shows exactly the chosen topic pressed.
    await user.click(screen.getByRole("button", { name: "เลือกหัวข้อ" }));
    expect(await screen.findByRole("button", { name: /ความรัก/ })).toBeDefined();
    const pressedAfter = screen
      .getAllByRole("button")
      .filter((b) => b.getAttribute("aria-pressed") === "true");
    expect(pressedAfter).toHaveLength(1);
    expect(topicButton("ความรัก").getAttribute("aria-pressed")).toBe("true");
  }, 15000);
});

describe("D4 collection modal + filters", () => {
  function mockCollection(cards: unknown[]) {
    vi.mocked(createClient).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(async () => ({ data: [{ cards }], error: null })),
        })),
      })),
    } as never);
  }

  it("filters expose pressed state and touch-hit sizing", async () => {
    mockCollection([{ cardId: 0, reversed: false }]);
    render(<CardCollection userId="u1" />);
    const all = await screen.findByRole("button", { name: "ทั้งหมด" });
    expect(all.getAttribute("aria-pressed")).toBe("true");
    expect(all.className).toContain("touch-hit");
  });

  it("card modal has dialog semantics and Escape closes it", async () => {
    mockCollection([{ cardId: 0, reversed: false }]);
    const user = userEvent.setup();
    render(<CardCollection userId="u1" />);
    // Open the discovered card's detail modal.
    const cards = await screen.findAllByRole("button");
    const target = cards.find((b) => b.textContent?.includes("เดอะ ฟูล"));
    expect(target).toBeDefined();
    await user.click(target!);
    const dialog = await screen.findByRole("dialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });
});

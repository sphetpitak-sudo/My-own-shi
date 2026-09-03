import { createClient } from "@/lib/supabase/server";
import { ALL_CARDS } from "@/lib/cards";
import { pickDailyCard, buildDailyFallback } from "@/lib/daily";

// Whitelisted tools — AI can only use these via server
export const CHAT_TOOLS = [
  "get_daily",
  "get_recent_readings",
  "get_reading",
  "get_card",
  "get_collection",
  "get_profile",
  "start_reading",
  "open_history",
  "open_collection",
  "open_daily",
] as const;

export type ChatToolName = (typeof CHAT_TOOLS)[number];

export interface ToolResult {
  name: ChatToolName;
  data: unknown;
  widget?: { type: string; props: unknown };
}

// Simple heuristic: decide which tools to inject based on user message
export function detectToolsNeeded(message: string): ChatToolName[] {
  const m = message.toLowerCase();
  const tools: ChatToolName[] = [];
  if (m.includes("วันนี้") || m.includes("ดวงวันนี้") || m.includes("daily") || m.includes("ดูดวงวันนี้")) tools.push("get_daily");
  if (m.includes("ล่าสุด") || m.includes("ครั้งล่าสุด") || m.includes("ไพ่ล่าสุด") || m.includes("recent")) tools.push("get_recent_readings");
  if (m.match(/ไพ่\s*(the\s*)?[a-z\u0E00-\u0E7F]+/i) || m.includes("ความหมาย") || m.includes("the fool") || m.includes("the magician")) {
    // Will try get_card, but only if user asks about a specific card name
    // Do lightweight check: if message contains a known card name
    const hasCard = ALL_CARDS.some((c) => m.includes(c.name.toLowerCase()) || m.includes(c.nameTh.toLowerCase()));
    if (hasCard) tools.push("get_card");
  }
  if (m.includes("โปรไฟล์") || m.includes("แต้ม") || m.includes("points") || m.includes("profile")) tools.push("get_profile");
  if (m.includes("คอลเลกชัน") || m.includes("collection") || m.includes("สะสมไพ่")) tools.push("get_collection");
  // Navigation intents — AI will guide, not auto-execute paid actions
  if (m.includes("เปิดไพ่") || m.includes("start reading") || m.includes("เปิดไพ่ใหม่")) tools.push("start_reading");
  if (m.includes("ประวัติ") || m.includes("history")) tools.push("open_history");
  return [...new Set(tools)];
}

export async function executeTool(
  name: ChatToolName,
  userId: string,
  message: string
): Promise<ToolResult | null> {
  const supabase = await createClient();
  try {
    switch (name) {
      case "get_daily": {
        const today = new Date().toISOString().slice(0, 10);
        const card = pickDailyCard(userId, today);
        const fallback = buildDailyFallback(userId, today);
        return {
          name,
          data: { card, fallback, date: today },
          widget: { type: "daily_card", props: { card, theme: fallback.theme } },
        };
      }
      case "get_recent_readings": {
        const { data } = await supabase
          .from("readings")
          .select("id, spread_type, question, cards, created_at, points_spent")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(3);
        return { name, data: data || [], widget: { type: "recent_readings", props: { readings: data || [] } } };
      }
      case "get_reading": {
        // Try to extract reading id from message? For now return most recent
        const { data } = await supabase.from("readings").select("id, spread_type, question, interpretation, cards, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(1).single();
        return { name, data };
      }
      case "get_card": {
        const m = message.toLowerCase();
        const found = ALL_CARDS.find((c) => m.includes(c.name.toLowerCase()) || m.includes(c.nameTh.toLowerCase()));
        if (!found) return null;
        return { name, data: found, widget: { type: "card", props: { card: found } } };
      }
      case "get_collection": {
        const { data } = await supabase.from("readings").select("cards").eq("user_id", userId).limit(100);
        const seen = new Set<number>();
        (data || []).forEach((r: { cards: unknown }) => {
          const cards = r.cards as Array<{ cardId?: number; id?: number }> | null;
          if (Array.isArray(cards)) cards.forEach((c) => {
            const id = (c.cardId ?? (c as { id?: number }).id) as number | undefined;
            if (typeof id === "number") seen.add(id);
          });
        });
        return { name, data: { total: 78, collected: seen.size, seen: [...seen] }, widget: { type: "collection", props: { collected: seen.size, total: 78 } } };
      }
      case "get_profile": {
        const { data } = await supabase.from("profiles").select("display_name, points, avatar_url").eq("id", userId).single();
        return { name, data };
      }
      case "start_reading":
        return { name, data: { route: "/dashboard/reading", cost: "5/15/50 แต้มตาม spread", note: "ต้องมีแต้มพอ, ชำระผ่านระบบปกติ" } };
      case "open_history":
        return { name, data: { route: "/dashboard/history" } };
      case "open_collection":
        return { name, data: { route: "/dashboard/collection" } };
      case "open_daily":
        return { name, data: { route: "/dashboard/daily" } };
      default:
        return null;
    }
  } catch {
    return null;
  }
}

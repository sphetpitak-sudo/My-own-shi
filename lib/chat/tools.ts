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
  "draw_cards",
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

// Intent-based detection: not keyword-only
export function detectToolsNeeded(message: string): ChatToolName[] {
  const m = message.toLowerCase();
  const tools: ChatToolName[] = [];

  // get_daily — only when asking about today
  if (/(วันนี้|ดวงวันนี้|daily)/i.test(m) && !/เมื่อวาน/.test(m)) {
    if (/ดูดวง|วันนี้เป็นยังไง|ดวงวันนี้/.test(m)) tools.push("get_daily");
  }

  // get_recent_readings — asking about latest
  if (/(ล่าสุด|ครั้งล่าสุด|ไพ่ล่าสุด|recent)/i.test(m)) tools.push("get_recent_readings");

  // get_card — asking ABOUT card meaning, not asking to draw
  if (/ไพ่\s*(the\s*)?[a-z\u0E00-\u0E7F]+/i.test(m) || m.includes("ความหมาย")) {
    const hasCard = ALL_CARDS.some((c) => m.includes(c.name.toLowerCase()) || m.includes(c.nameTh.toLowerCase()));
    const isQuestion = /คืออะไร|หมายถึง|แปลว่า|คือไพ่/.test(m);
    if (hasCard && isQuestion) tools.push("get_card");
  }

  // get_profile / collection
  if (/(โปรไฟล์|แต้ม|points|profile)/i.test(m) && /(ดู|เช็ค|เท่าไหร่|profile)/i.test(m)) tools.push("get_profile");
  if (/(คอลเลกชัน|collection|สะสมไพ่|มีไพ่กี่ใบ)/i.test(m)) tools.push("get_collection");

  // draw_cards vs start_reading — intent distinction
  const wantsSerious = /จริงจัง|แบบเต็ม|เสียแต้ม|จริงๆ.*เปิดไพ่|เปิดไพ่.*จริงจัง/.test(m);
  const wantsDrawNow = /(เปิดไพ่ให้ฉัน|สุ่มไพ่ให้หน่อย|จั่วไพ่ให้|draw.*for me|เปิดไพ่ให้หน่อย|sุ่มไพ่.*ให้ฉัน)/i.test(m);
  const isPastMention = /(เมื่อวาน|เมื่อกี้|แล้ว|เคยเปิด|เคยสุ่ม)/.test(m) && !wantsDrawNow;

  if (wantsSerious) {
    tools.push("start_reading");
  } else if (wantsDrawNow) {
    tools.push("draw_cards");
  } else if (!isPastMention && /(เปิดไพ่|จั่วไพ่|สุ่มไพ่)/.test(m) && /(ให้ฉัน|ให้หน่อย|หน่อย|ได้ไหม|นะ)/.test(m)) {
    // Generic request with polite particle → draw
    tools.push("draw_cards");
  }
  // else: casual mention like "เมื่อวานฉันเปิดไพ่แล้ว" → no tool

  if (/(ประวัติ|history)/i.test(m) && /(ดู|เปิด|เช็ค)/.test(m)) tools.push("open_history");

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
      case "draw_cards": {
        // Free inline draw in chat — no points, 1-3 cards based on message
        const wantsThree = /3\s*ใบ|สามใบ|three/i.test(message);
        const count = wantsThree ? 3 : 1;
        // Simple shuffle: pick random distinct cards
        const shuffled = [...ALL_CARDS].sort(() => Math.random() - 0.5).slice(0, count);
        const drawn = shuffled.map((card, i) => ({
          id: card.id,
          name: card.name,
          nameTh: card.nameTh,
          imageFile: card.imageFile,
          uprightTh: card.uprightTh,
          reversedTh: card.reversedTh,
          reversed: Math.random() < 0.5,
          position: count === 1 ? "คำตอบ" : count === 3 ? ["อดีต", "ปัจจุบัน", "อนาคต"][i]! : `ใบที่ ${i + 1}`,
        }));
        return { name, data: drawn, widget: { type: "drawn_cards", props: { cards: drawn } } };
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

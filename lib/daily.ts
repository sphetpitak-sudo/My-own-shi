import { ALL_CARDS } from "@/lib/cards";

export interface DailyCard {
  id: number;
  nameTh: string;
  imageFile: string;
  uprightTh: string;
  reversedTh: string;
  reversed: boolean;
}

export interface DailyAspects {
  love: string;
  career: string;
  finance: string;
  study: string;
  health: string;
}

export interface DailyFortune {
  card: DailyCard;
  theme: string;
  aspects: DailyAspects;
  opportunity: string;
  caution: string;
  advice: string;
  lucky: { number: number; color: string; colorTh: string };
  source: "ai" | "fallback";
}

const THEMES = [
  "วันแห่งการเริ่มต้น",
  "วันแห่งความสงบ",
  "วันแห่งพลังใจ",
  "วันแห่งความคิดสร้างสรรค์",
  "วันแห่งการเชื่อมต่อ",
  "วันแห่งการปล่อยวาง",
  "วันแห่งความกล้า",
];

const COLORS = [
  { name: "ทอง", hex: "#d4af37" },
  { name: "ม่วง", hex: "#a78bfa" },
  { name: "ชมพู", hex: "#f472b6" },
  { name: "เขียวมรกต", hex: "#14b8a6" },
  { name: "คราม", hex: "#818cf8" },
  { name: "อำพัน", hex: "#fbbf24" },
];

const ASPECT_TIPS: Record<string, { upright: string; reversed: string }> = {
  love: {
    upright: "เปิดใจให้โอกาสใหม่ ๆ และสื่อสารสิ่งที่รู้สึกอย่างตรงไปตรงมา",
    reversed: "ทบทวนความคาดหวังของตัวเอง ก่อนตัดสินใจเรื่องหัวใจ",
  },
  career: {
    upright: "ใช้จังหวะนี้แสดงศักยภาพให้คนรอบข้างเห็น กล้าเสนอความคิดใหม่",
    reversed: "ความมั่นคงกับความก้าวหน้าอาจต้องเลือก อย่าเพิ่งรีบร้อน",
  },
  finance: {
    upright: "มีโอกาสที่ดีเกี่ยวกับการเงิน วางแผนแล้วค่อยตัดสินใจ",
    reversed: "ระวังการใช้จ่ายเกินจำเป็น เลี่ยงการตัดสินใจเรื่องเงินแบบกะทันหัน",
  },
  study: {
    upright: "เหมาะแก่การเรียนรู้สิ่งใหม่ โฟกัสกับเป้าหมายทีละขั้น",
    reversed: "ถ้ารู้สึกท้อ ให้แบ่งงานเป็นชิ้นเล็ก ๆ และขอความช่วยเหลือเมื่อจำเป็น",
  },
  health: {
    upright: "พลังงานดี ให้เวลากับการเคลื่อนไหวและพักผ่อนให้เพียงพอ",
    reversed: "ฟังสัญญาณของร่างกาย หยุดพักก่อนจะเหนื่อยเกินไป",
  },
};

function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function pickDailyCard(userId: string, date: string): DailyCard {
  const seed = hashSeed(`${userId}:${date}`);
  const card = ALL_CARDS[seed % ALL_CARDS.length]!;
  return {
    id: card.id,
    nameTh: card.nameTh,
    imageFile: card.imageFile,
    uprightTh: card.uprightTh,
    reversedTh: card.reversedTh,
    reversed: (seed >> 7) % 2 === 1,
  };
}

export function buildDailyFallback(userId: string, date: string): DailyFortune {
  const card = pickDailyCard(userId, date);
  const seed = hashSeed(`${userId}:${date}:fallback`);
  const theme = THEMES[seed % THEMES.length]!;
  const color = COLORS[(seed >> 3) % COLORS.length]!;
  const luckyNumber = (seed % 99) + 1;

  const t = (id: string) => (card.reversed ? ASPECT_TIPS[id]!.reversed : ASPECT_TIPS[id]!.upright);

  return {
    card,
    theme,
    aspects: {
      love: t("love"),
      career: t("career"),
      finance: t("finance"),
      study: t("study"),
      health: t("health"),
    },
    opportunity: card.reversed
      ? "มองหาโอกาสที่ซ่อนอยู่ในสิ่งที่คุณมองข้าม"
      : "เปิดรับโอกาสใหม่ ๆ ที่เข้ามาอย่างไม่คาดคิด",
    caution: card.reversed
      ? "อย่าเร่งรีบ — ให้เวลากับกระบวนการ"
      : "ระวังการตัดสินใจที่รวดเร็วเกินไป",
    advice: card.reversed
      ? "หายใจเข้าลึก ๆ แล้วปล่อยให้ทุกอย่างค่อย ๆ เป็นไป"
      : "ทำตามสัญชาตญาณ — มันจะนำทางคุณได้ดี",
    lucky: { number: luckyNumber, color: color.hex, colorTh: color.name },
    source: "fallback",
  };
}

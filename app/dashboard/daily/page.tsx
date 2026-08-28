"use client";

import { useEffect, useState, useMemo } from "react";
import DashboardShell from "@/components/DashboardShell";
import { createClient } from "@/lib/supabase/client";
import { Sun, Sparkles, Heart, Briefcase, Wallet, GraduationCap, Activity } from "lucide-react";
import { drawCards, type DrawnCard } from "@/lib/cards";

interface DayData {
  date: string;
  theme: { th: string; en: string };
  focus: string;
  opportunity: string;
  caution: string;
  advice: string;
  card: DrawnCard;
  lucky: { number: number; color: string; colorTh: string };
}

const COLORS = [
  { id: "gold", name: "ทอง", hex: "#d4af37" },
  { id: "violet", name: "ม่วง", hex: "#a78bfa" },
  { id: "rose", name: "ชมพู", hex: "#f472b6" },
  { id: "teal", name: "เขียวมรกต", hex: "#14b8a6" },
  { id: "indigo", name: "คราม", hex: "#818cf8" },
  { id: "amber", name: "อำพัน", hex: "#fbbf24" },
];

const THEMES = [
  { th: "วันแห่งการเริ่มต้น", en: "A day of new beginnings" },
  { th: "วันแห่งความสงบ", en: "A day of stillness" },
  { th: "วันแห่งพลังใจ", en: "A day of inner strength" },
  { th: "วันแห่งความคิดสร้างสรรค์", en: "A day of creativity" },
  { th: "วันแห่งการเชื่อมต่อ", en: "A day of connection" },
  { th: "วันแห่งการปล่อยวาง", en: "A day of letting go" },
  { th: "วันแห่งความกล้า", en: "A day of courage" },
];

function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function buildDayData(userId: string, date: string): DayData {
  const seed = hashSeed(userId + ":" + date);
  const theme = THEMES[seed % THEMES.length]!;
  const color = COLORS[(seed >> 3) % COLORS.length]!;
  const luckyNumber = (seed % 99) + 1;
  // Use drawCards to pick a real card from the actual deck
  const drawn = drawCards({
    id: "single",
    name: "Single",
    nameTh: "ไพ่ใบเดียว",
    cardCount: 1,
    cost: 0,
    description: "",
    descriptionTh: "",
    positions: [{ label: "Today", labelTh: "วันนี้", x: 50, y: 50 }],
  });

  const focus = drawn[0]!.reversed
    ? `ให้ความสำคัญกับการพักผ่อนและฟื้นฟูพลัง`
    : `มุ่งเน้นสิ่งที่ทำให้หัวใจเต้น`;
  const opportunity = drawn[0]!.reversed
    ? `มองหาโอกาสที่ซ่อนอยู่ในสิ่งที่คุณมองข้าม`
    : `เปิดรับโอกาสใหม่ ๆ ที่เข้ามาอย่างไม่คาดคิด`;
  const caution = drawn[0]!.reversed
    ? `อย่าเร่งรีบ — ให้เวลากับกระบวนการ`
    : `ระวังการตัดสินใจที่รวดเร็วเกินไป`;
  const advice = drawn[0]!.reversed
    ? `หายใจเข้าลึก ๆ แล้วปล่อยให้ทุกอย่างค่อย ๆ เป็นไป`
    : `ทำตามสัญชาตญาณ — มันจะนำทางคุณได้ดี`;

  return {
    date,
    theme: { th: theme.th, en: theme.en },
    focus,
    opportunity,
    caution,
    advice,
    card: drawn[0]!,
    lucky: { number: luckyNumber, color: color.hex, colorTh: color.name },
  };
}

const ASPECTS = [
  { id: "love", label: "ความรัก", icon: Heart, color: "#f472b6" },
  { id: "career", label: "การงาน", icon: Briefcase, color: "#14b8a6" },
  { id: "finance", label: "การเงิน", icon: Wallet, color: "#fbbf24" },
  { id: "study", label: "การเรียน", icon: GraduationCap, color: "#a78bfa" },
  { id: "health", label: "สุขภาพ", icon: Activity, color: "#22c55e" },
];

const ASPECT_TIPS: Record<
  string,
  { upright: string; reversed: string }
> = {
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

function aspectTip(id: string, reversed: boolean): string {
  const tip = ASPECT_TIPS[id];
  return tip ? (reversed ? tip.reversed : tip.upright) : "";
}

export default function DailyPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [day, setDay] = useState<DayData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }: { data: { user: { id: string } | null } }) => {
      if (!data.user) {
        window.location.href = "/";
        return;
      }
      setUserId(data.user.id);
      const today = new Date().toISOString().slice(0, 10);
      setDay(buildDayData(data.user.id, today));
      setLoading(false);
    });
  }, []);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 5) return "ดึกแล้ว";
    if (h < 11) return "เช้านี้";
    if (h < 16) return "เที่ยงวัน";
    if (h < 19) return "เย็นนี้";
    return "ค่ำนี้";
  }, []);

  const today = new Date().toLocaleDateString("th-TH", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (loading || !day || !userId) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center" style={{ minHeight: "60vh" }}>
          <div className="flex flex-col items-center gap-4">
            <div className="mystical-loader">
              <div className="mystical-loader-dot" />
              <div className="mystical-loader-dot" />
              <div className="mystical-loader-dot" />
            </div>
            <p className="text-[13px] font-medium" style={{ color: "var(--text-muted)" }}>
              กำลังอ่านพลังงานของวัน...
            </p>
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="reading-page">
        <div className="step-header">
          <p className="step-eyebrow">ดูดวงรายวัน · ฟรี</p>
          <h1 className="step-title">{greeting} ของคุณเป็นอย่างไร</h1>
          <p className="step-sub">{today}</p>
        </div>

        {/* Hero card */}
        <div
          className="mx-4 mb-4 p-5 rounded-2xl relative overflow-hidden"
          style={{
            background:
              "linear-gradient(160deg, rgba(167,139,250,0.10) 0%, rgba(109,40,217,0.04) 60%, transparent 100%)",
            border: "1px solid rgba(167,139,250,0.18)",
          }}
        >
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: -30,
              right: -30,
              width: 140,
              height: 140,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(212,175,55,0.18), transparent 70%)",
              filter: "blur(8px)",
            }}
          />
          <div className="relative flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--primary-soft)", color: "var(--primary)" }}
            >
              <Sun size={22} />
            </div>
            <div>
              <div
                className="text-[10.5px] font-bold uppercase tracking-[0.12em]"
                style={{ color: "var(--primary)" }}
              >
                ธีมประจำวัน
              </div>
              <h2 className="text-[20px] font-extrabold mt-1" style={{ color: "var(--text)", letterSpacing: "-0.02em" }}>
                {day.theme.th}
              </h2>
            </div>
          </div>
        </div>

        {/* Card of the day */}
        <div className="mx-4 mb-4 card p-4 flex items-center gap-4">
          <div className="flex-shrink-0">
            <div
              className="w-[68px] aspect-[2/3] rounded-lg overflow-hidden flex items-center justify-center"
              style={{ background: "linear-gradient(160deg, #1e0e3a, #14082a)" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/Taro/${day.card.card.imageFile}`}
                alt={day.card.card.nameTh}
                className="w-full h-full"
                style={{
                  objectFit: "contain",
                  transform: day.card.reversed ? "rotate(180deg)" : undefined,
                }}
                loading="lazy"
              />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div
              className="text-[10.5px] font-bold uppercase tracking-[0.12em]"
              style={{ color: "var(--primary)" }}
            >
              ไพ่ประจำวัน
            </div>
            <div className="text-[16px] font-extrabold mt-1" style={{ color: "var(--text)" }}>
              {day.card.card.nameTh}
            </div>
            <div className="text-[12px] mt-1" style={{ color: "var(--text-muted)" }}>
              {day.card.reversed ? day.card.card.reversedTh : day.card.card.uprightTh}
            </div>
          </div>
        </div>

        {/* Aspects */}
        <div className="mx-4 mb-4">
          <div
            className="text-[11px] font-bold uppercase tracking-[0.12em] mb-2"
            style={{ color: "var(--text-muted)" }}
          >
            คำแนะนำตามด้าน
          </div>
          <div className="space-y-2">
            {ASPECTS.map((a) => {
              const Icon = a.icon;
              return (
                <div key={a.id} className="card p-3 flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${a.color}1A`, color: a.color }}
                  >
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12.5px] font-bold" style={{ color: "var(--text)" }}>
                      {a.label}
                    </div>
                    <div className="text-[11.5px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {aspectTip(a.id, day.card.reversed)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Focus grid */}
        <div className="mx-4 grid grid-cols-1 gap-2 mb-4">
          <div className="card p-4">
            <div
              className="text-[10.5px] font-bold uppercase tracking-[0.12em] mb-1.5"
              style={{ color: "#14b8a6" }}
            >
              โอกาสของวัน
            </div>
            <div className="text-[13.5px]" style={{ color: "var(--text)" }}>
              {day.opportunity}
            </div>
          </div>
          <div className="card p-4">
            <div
              className="text-[10.5px] font-bold uppercase tracking-[0.12em] mb-1.5"
              style={{ color: "#fbbf24" }}
            >
              ข้อควรระวัง
            </div>
            <div className="text-[13.5px]" style={{ color: "var(--text)" }}>
              {day.caution}
            </div>
          </div>
          <div
            className="p-4 rounded-2xl"
            style={{
              background: "linear-gradient(160deg, rgba(167,139,250,0.10), rgba(109,40,217,0.04))",
              border: "1px solid rgba(167,139,250,0.18)",
            }}
          >
            <div
              className="text-[10.5px] font-bold uppercase tracking-[0.12em] mb-1.5 flex items-center gap-1.5"
              style={{ color: "var(--primary)" }}
            >
              <Sparkles size={11} /> คำแนะนำ
            </div>
            <div className="text-[13.5px] font-medium" style={{ color: "var(--text)" }}>
              {day.advice}
            </div>
          </div>
        </div>

        {/* Lucky */}
        <div className="mx-4 grid grid-cols-2 gap-2 mb-4">
          <div className="card p-4 text-center">
            <div
              className="text-[10.5px] font-bold uppercase tracking-[0.12em] mb-1"
              style={{ color: "var(--text-muted)" }}
            >
              เลขมงคล
            </div>
            <div className="text-[26px] font-extrabold" style={{ color: "var(--gold)" }}>
              {day.lucky.number}
            </div>
          </div>
          <div className="card p-4 text-center">
            <div
              className="text-[10.5px] font-bold uppercase tracking-[0.12em] mb-1"
              style={{ color: "var(--text-muted)" }}
            >
              สีมงคล
            </div>
            <div className="flex items-center justify-center gap-2">
              <div
                className="w-6 h-6 rounded-full"
                style={{ background: day.lucky.color, boxShadow: `0 0 14px ${day.lucky.color}55` }}
              />
              <div className="text-[15px] font-bold" style={{ color: "var(--text)" }}>
                {day.lucky.colorTh}
              </div>
            </div>
          </div>
        </div>

        {/* Disclaimers */}
        <div
          className="mx-4 mt-2 mb-4 text-center text-[11px] leading-relaxed"
          style={{ color: "var(--text-muted)" }}
        >
          ข้อความนี้เป็นแนวทางเชิงสัญลักษณ์ ไม่ใช่คำทำนายที่แน่นอน
          <br />
          ใช้วิจารณญาณในการตัดสินใจเสมอ
        </div>
      </div>
    </DashboardShell>
  );
}

"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import DailyBonus from "./DailyBonus";
import PointsBalance from "./PointsBalance";
import FeatureCard from "@/components/ui/FeatureCard";
import SectionHeader from "@/components/ui/SectionHeader";
import AnnouncementCard from "@/components/ui/AnnouncementCard";
import { SPREADS, type SpreadType } from "@/lib/cards";
import { CATEGORY_META, FEATURES, type FeatureCategory } from "@/lib/features/catalog";
import { Coins, Sparkles, CircleHelp, Gift, Star, BookOpen, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { loadDraft, clearDraft } from "@/lib/useReadingDraft";

interface ProfileLite {
  display_name: string | null;
  points: number;
}

const CATEGORY_TONE: Record<FeatureCategory, { bg: string; color: string }> = {
  tarot: { bg: "rgba(167,139,250,0.10)", color: "var(--primary)" },
  astrology: { bg: "rgba(129,140,248,0.10)", color: "#818cf8" },
  oracle: { bg: "rgba(244,114,182,0.10)", color: "#f472b6" },
  quick: { bg: "rgba(251,191,36,0.10)", color: "#fbbf24" },
  daily: { bg: "rgba(212,175,55,0.10)", color: "var(--gold)" },
  numerology: { bg: "rgba(20,184,166,0.10)", color: "#14b8a6" },
};

const SPREAD_VISUAL: Record<SpreadType, { positions: { x: number; y: number }[] }> = {
  single: { positions: [{ x: 50, y: 50 }] },
  three_card: {
    positions: [
      { x: 18, y: 50 },
      { x: 50, y: 50 },
      { x: 82, y: 50 },
    ],
  },
  celtic: {
    positions: [
      { x: 35, y: 50 },
      { x: 50, y: 50 },
      { x: 35, y: 75 },
      { x: 35, y: 25 },
      { x: 35, y: 5 },
      { x: 65, y: 75 },
      { x: 65, y: 60 },
      { x: 65, y: 40 },
      { x: 65, y: 25 },
      { x: 80, y: 50 },
    ],
  },
};

const SPREAD_BADGE: Record<SpreadType, string> = {
  single: "เร็ว",
  three_card: "แนะนำ",
  celtic: "ลึก",
};

const CATEGORY_ORDER: FeatureCategory[] = [
  "tarot",
  "astrology",
  "oracle",
  "quick",
  "daily",
  "numerology",
];

export default function DashboardHome() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileLite | null>(null);
  const [costs, setCosts] = useState<Record<string, number>>({});
  const [activeCategory, setActiveCategory] = useState<FeatureCategory | "all">("all");
  const [recentReadings, setRecentReadings] = useState<Array<{ id: string; spread_type: string; question: string; created_at: string; points_spent: number }>>([]);
  const [draft, setDraft] = useState<ReturnType<typeof loadDraft>>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }: { data: { user: { id: string } | null } }) => {
      if (data.user) {
        setUserId(data.user.id);
        supabase
          .from("profiles")
          .select("display_name, points")
          .eq("id", data.user.id)
          .single()
          .then(({ data: p }: { data: ProfileLite | null }) => {
            if (p) setProfile(p);
          });
        supabase
          .from("readings")
          .select("id, spread_type, question, created_at, points_spent")
          .eq("user_id", data.user.id)
          .order("created_at", { ascending: false })
          .limit(3)
          .then(({ data: r }: { data: typeof recentReadings | null }) => {
            if (r) setRecentReadings(r);
          });
        setDraft(loadDraft());
      }
    });

    supabase
      .from("admin_settings")
      .select("key, value")
      .in("key", ["reading_costs"])
      .then(({ data }: { data: { key: string; value: Record<string, number> }[] | null }) => {
        if (!data) return;
        const costRow = data.find((r: { key: string; value: Record<string, number> }) => r.key === "reading_costs");
        if (costRow?.value && typeof costRow.value === "object") {
          setCosts(costRow.value as Record<string, number>);
        }
      });
  }, []);

  const handleSpreadSelect = (spreadId: SpreadType) => {
    router.push(`/dashboard/reading?spread=${spreadId}`);
  };

  const handleDailyBonus = (newAmount: number) => {
    setProfile((prev) => (prev ? { ...prev, points: prev.points + newAmount } : prev));
  };

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 5) return { hi: "ดึกแล้ว", emoji: "🌙" };
    if (h < 11) return { hi: "สวัสดีตอนเช้า", emoji: "☀️" };
    if (h < 16) return { hi: "สวัสดีตอนเที่ยง", emoji: "✨" };
    if (h < 19) return { hi: "สวัสดีตอนเย็น", emoji: "🌅" };
    return { hi: "สวัสดีตอนค่ำ", emoji: "🌙" };
  }, []);

  const filteredFeatures = useMemo(() => {
    if (activeCategory === "all") return FEATURES;
    return FEATURES.filter((f) => f.category === activeCategory);
  }, [activeCategory]);

  return (
    <div className="dashboard-premium">
      {/* Greeting + points */}
      <header className="dash-greeting">
        <div className="dash-greeting-text">
          <div className="dash-greeting-hi">
            {greeting.hi} {greeting.emoji}
          </div>
          <div className="dash-greeting-name">
            {profile?.display_name || "นักเดินทางแห่งดวงดาว"}
          </div>
          <div className="dash-greeting-sub">
            วันนี้ไพ่ของคุณรออยู่ — เปิดประตูแห่งความจริง
          </div>
        </div>
        <div className="dash-points-pill" aria-label={`คะแนนคงเหลือ ${profile?.points ?? 0}`}>
          <Coins size={13} />
          {(profile?.points ?? 0).toLocaleString()}
        </div>
      </header>

      {/* Continue reading */}
      {draft && draft.question && (
        <div className="dash-section">
          <div className="card p-4 flex items-center gap-3" style={{ borderLeft: "3px solid var(--primary)", background: "linear-gradient(135deg, var(--primary-soft), transparent)" }}>
            <span className="w-9 h-9 rounded-xl grid place-items-center flex-shrink-0" style={{ background: "var(--primary)", color: "white" }}>
              <BookOpen size={14} />
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-bold tracking-widest uppercase" style={{ color: "var(--primary)" }}>ทำต่อ</div>
              <div className="text-[13px] font-semibold truncate" style={{ color: "var(--text)" }}>{draft.question.slice(0, 48)}{draft.question.length > 48 ? "…" : ""}</div>
              <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>{draft.spreadType} · เหลือขั้นตอน {draft.step}</div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => router.push(`/dashboard/reading?spread=${draft.spreadType}`)} className="btn btn-primary text-[12px] px-4 py-2 rounded-xl">อ่านต่อ</button>
              <button onClick={() => { clearDraft(); setDraft(null); }} className="btn btn-ghost text-[12px] px-3 py-2">ลบ</button>
            </div>
          </div>
        </div>
      )}

      {/* Hero spread card */}
      <div className="dash-section">
        <FeatureCard
          feature={{
            id: "tarot-three-card",
            category: "tarot",
            title: "Three Card",
            titleTh: "อ่านไพ่ทาโรต์",
            subtitle: "Past · Present · Future",
            subtitleTh: "อดีต · ปัจจุบัน · อนาคต",
            descriptionTh: "เปิดไพ่สามใบ เชื่อมโยงอดีต ปัจจุบัน และอนาคตของคุณ พร้อมคำทำนายจาก AI",
            icon: Sparkles,
            status: "live",
            cost: costs["three_card"] ?? SPREADS.three_card.cost,
            route: "/dashboard/reading?spread=three_card",
            theme: "violet",
            badge: "แนะนำ",
            badgeTh: "แนะนำ",
          }}
          userPoints={profile?.points ?? 0}
          variant="hero"
          onClick={() => handleSpreadSelect("three_card")}
        />
      </div>

      {/* Spread variants */}
      <div className="dash-section">
        <SectionHeader
          title="เลือกรูปแบบการอ่าน"
          subtitle="แต่ละแบบให้มุมมองที่แตกต่าง"
          trailing={
            <span className="text-[11.5px] font-semibold" style={{ color: "var(--text-muted)" }}>
              ไพ่ Rider-Waite
            </span>
          }
        />
        <div className="dash-spreads" style={{ marginTop: 12 }}>
          {(Object.keys(SPREADS) as SpreadType[]).map((key) => {
            const spread = SPREADS[key];
            const cost = costs[key] ?? spread.cost;
            const insufficient = (profile?.points ?? 0) < cost;
            const positions = SPREAD_VISUAL[key].positions;
            return (
              <button
                key={key}
                onClick={() => handleSpreadSelect(key)}
                disabled={insufficient}
                className={cn("dash-spread", insufficient && "opacity-50 cursor-not-allowed")}
                aria-label={`${spread.nameTh} - ${spread.cardCount} ใบ, ${cost} แต้ม`}
              >
                <div className="dash-spread-thumb">
                  {positions.map((p, i) => (
                    <div
                      key={i}
                      style={{
                        position: "absolute",
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        width: 10,
                        height: 14,
                        borderRadius: 2,
                        background: "rgba(201,168,76,0.4)",
                        border: "1px solid rgba(201,168,76,0.5)",
                        transform: "translate(-50%, -50%)",
                      }}
                    />
                  ))}
                </div>
                <div className="dash-spread-name">{spread.nameTh}</div>
                <div className="dash-spread-meta">
                  <span>{spread.cardCount} ใบ</span>
                  <span className="dash-spread-cost flex items-center gap-1">
                    <Coins size={10} /> {cost}
                  </span>
                </div>
                <div
                  className="absolute top-2.5 right-3 text-[9px] font-bold uppercase tracking-wider"
                  style={{ color: "var(--primary)" }}
                >
                  {SPREAD_BADGE[key]}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Announcement */}
      <div className="dash-section">
        <AnnouncementCard
          tag="ใหม่"
          title="ดูดวงรายวันพร้อมไพ่แนะนำ"
          subtitle="ข้อความสั้น ๆ ประจำวัน ฟรี"
          icon={Gift}
          cta="ดูเลย"
          href="/dashboard/daily"
          tone="gold"
        />
      </div>

      {/* Daily bonus */}
      <div className="dash-section">
        <DailyBonusWrapper
          userId={userId}
          points={profile?.points ?? 0}
          onClaim={(amount) => {
            handleDailyBonus(amount);
          }}
        />
      </div>

      {/* Category pills */}
      <div className="dash-section">
        <SectionHeader title="เครื่องมือทั้งหมด" subtitle="สำรวจศาสตร์แห่งการพยากรณ์" />
        <div className="dash-category-pills" style={{ marginTop: 12 }}>
          <button
            onClick={() => setActiveCategory("all")}
            className={cn("dash-category-pill", activeCategory === "all" && "active")}
          >
            ทั้งหมด
          </button>
          {CATEGORY_ORDER.map((cat) => {
            const meta = CATEGORY_META[cat];
            const Icon = meta.icon as LucideIcon;
            const count = FEATURES.filter((f) => f.category === cat).length;
            if (count === 0) return null;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn("dash-category-pill", activeCategory === cat && "active")}
              >
                <Icon size={13} />
                {meta.labelTh}
              </button>
            );
          })}
        </div>
      </div>

      {/* Feature grid */}
      <div className="dash-section">
        <div className="dash-grid-2">
          {filteredFeatures.map((f) => (
            <FeatureCard
              key={f.id}
              feature={f}
              userPoints={profile?.points ?? 0}
            />
          ))}
        </div>
      </div>

      {/* Tarot only secondary tools */}
      {activeCategory === "all" && (
        <div className="dash-section">
          <SectionHeader
            title="เครื่องมือเสริม"
            subtitle="ทางลัดและฟีเจอร์อื่น ๆ"
          />
          <div className="dash-feature-row" style={{ marginTop: 12 }}>
            {[
              {
                id: "zodiac",
                icon: Star,
                title: "ดูดวงตามวันเกิด",
                sub: "ฟรี · ราศี + ปีนักษัตร",
                href: "/dashboard/zodiac",
                cat: "astrology" as FeatureCategory,
              },
              {
                id: "yesno",
                icon: CircleHelp,
                title: "ถามใช่หรือไม่",
                sub: "3 แต้ม · ไพ่ 1 ใบ",
                href: "/dashboard/yesno",
                cat: "quick" as FeatureCategory,
              },
              {
                id: "daily",
                icon: Gift,
                title: "ดูดวงรายวัน",
                sub: "ฟรี · อัปเดตทุกวัน",
                href: "/dashboard/daily",
                cat: "daily" as FeatureCategory,
              },
            ].map((tool) => {
              const Icon = tool.icon;
              const tone = CATEGORY_TONE[tool.cat];
              return (
                <a
                  key={tool.id}
                  href={tool.href}
                  className="fc-root"
                  style={{ padding: "14px 16px" }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{
                        background: tone.bg,
                        color: tone.color,
                      }}
                    >
                      <Icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13.5px] font-bold" style={{ color: "var(--text)" }}>
                        {tool.title}
                      </div>
                      <div className="text-[11.5px]" style={{ color: "var(--text-muted)" }}>
                        {tool.sub}
                      </div>
                    </div>
                    <div className="text-[18px]" style={{ color: "var(--text-muted)" }}>
                      ›
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent readings */}
      <div className="dash-section">
        <SectionHeader
          title="อ่านล่าสุด"
          subtitle={recentReadings.length ? "กลับไปอ่านบันทึกเดิมของคุณ" : "ยังไม่มีบันทึก — เริ่มทำนายครั้งแรกกัน"}
          trailing={
            recentReadings.length ? (
              <a href="/dashboard/history" className="text-[12px] font-semibold" style={{ color: "var(--primary)" }}>
                ดูทั้งหมด →
              </a>
            ) : undefined
          }
        />
        {recentReadings.length === 0 ? (
          <div className="card p-5 text-center" style={{ marginTop: 12 }}>
            <p className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
              ยังไม่มีประวัติการอ่าน — เปิดไพ่ครั้งแรกเพื่อเริ่มต้น
            </p>
            <a href="/dashboard/reading?spread=three_card" className="btn btn-primary mt-3">
              เริ่มทำนาย
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2" style={{ marginTop: 12 }}>
            {recentReadings.map((r) => (
              <a
                key={r.id}
                href="/dashboard/history"
                className="card p-3.5 flex items-center gap-3 hover:shadow-sm transition-shadow"
              >
                <span className="w-9 h-9 rounded-xl grid place-items-center flex-shrink-0" style={{ background: "var(--primary-soft)", color: "var(--primary)" }}>
                  <Sparkles size={14} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[13px] font-semibold truncate" style={{ color: "var(--text)" }}>
                    {r.question ? r.question.slice(0, 58) + (r.question.length > 58 ? "…" : "") : SPREADS[r.spread_type as SpreadType]?.nameTh ?? r.spread_type}
                  </span>
                  <span className="block text-[11px]" style={{ color: "var(--text-muted)" }}>
                    {new Date(r.created_at).toLocaleDateString("th-TH", { day: "numeric", month: "short" })} · {SPREADS[r.spread_type as SpreadType]?.nameTh ?? r.spread_type} · {r.points_spent} แต้ม
                  </span>
                </span>
                <span style={{ color: "var(--text-muted)" }}>›</span>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Points balance card */}
      <div className="dash-section">
        <PointsBalance points={profile?.points ?? 0} />
      </div>
    </div>
  );
}

function DailyBonusWrapper({
  userId,
  points,
  onClaim,
}: {
  userId: string | null;
  points: number;
  onClaim: (amount: number) => void;
}) {
  if (!userId) {
    return (
      <div className="daily-bonus-section" style={{ borderRadius: "var(--radius-lg)" }}>
        <div className="daily-bonus-inner">
          <div className="daily-bonus-title">+ โบนัสรายวัน +</div>
          <div className="daily-bonus-sub">รับแต้มทุกวัน</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="daily-bonus-section"
      style={{ borderRadius: "var(--radius-lg)", border: "1px solid rgba(255,255,255,0.05)" }}
    >
      <div className="daily-bonus-inner">
        <div className="daily-bonus-title">+ โบนัสรายวัน +</div>
        <div className="daily-bonus-sub">
          รับแต้มทุกวัน · ปัจจุบัน {points.toLocaleString()} แต้ม
        </div>
        <DailyBonus userId={userId} onClaim={onClaim} />
      </div>
    </div>
  );
}

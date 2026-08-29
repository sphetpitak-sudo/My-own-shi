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
import { Coins, Sparkles, CircleHelp, Gift, Star, BookOpen, ArrowRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { loadDraft, clearDraft } from "@/lib/useReadingDraft";
import { useShell } from "./DashboardShell";

interface ProfileLite {
  display_name: string | null;
  points: number;
}

const CATEGORY_TONE: Record<FeatureCategory, { bg: string; color: string }> = {
  tarot: { bg: "rgba(167,139,250,0.12)", color: "var(--primary)" },
  astrology: { bg: "rgba(129,140,248,0.12)", color: "#818cf8" },
  oracle: { bg: "rgba(244,114,182,0.12)", color: "#f472b6" },
  quick: { bg: "rgba(251,191,36,0.12)", color: "#fbbf24" },
  daily: { bg: "rgba(212,175,55,0.12)", color: "var(--gold)" },
  numerology: { bg: "rgba(20,184,166,0.12)", color: "#14b8a6" },
};

const SPREAD_VISUAL: Record<SpreadType, { positions: { x: number; y: number }[] }> = {
  single: { positions: [{ x: 50, y: 50 }] },
  three_card: {
    positions: [
      { x: 20, y: 50 },
      { x: 50, y: 50 },
      { x: 80, y: 50 },
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
  single: "ตอบไว",
  three_card: "ยอดนิยม",
  celtic: "วิเคราะห์ลึก",
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
  const shell = useShell();
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

  // Keep points/display_name in sync with Shell realtime (single source of truth)
  useEffect(() => {
    if (shell.profile) {
      setProfile((prev) => ({
        display_name: shell.profile!.display_name ?? prev?.display_name ?? null,
        points: shell.profile!.points,
      }));
    }
  }, [shell.profile]);

  const handleSpreadSelect = (spreadId: SpreadType) => {
    router.push(`/dashboard/reading?spread=${spreadId}`);
  };

  const handleDailyBonus = (newAmount: number) => {
    setProfile((prev) => (prev ? { ...prev, points: prev.points + newAmount } : prev));
  };

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 5) return { hi: "ดึกแล้ว", emoji: "🌙", sub: "ให้ไพ่ทาโรต์สะท้อนความสงบในค่ำคืนนี้" };
    if (h < 11) return { hi: "สวัสดีตอนเช้า", emoji: "☀️", sub: "เริ่มต้นวันใหม่ด้วยพลังงานและทิศทางที่ดี" };
    if (h < 16) return { hi: "สวัสดีตอนเที่ยง", emoji: "✨", sub: "พักใจรับสารจากจักรวาลระหว่างวัน" };
    if (h < 19) return { hi: "สวัสดีตอนเย็น", emoji: "🌅", sub: "ทบทวนสิ่งต่าง ๆ ที่ผ่านเข้ามาระหว่างวัน" };
    return { hi: "สวัสดีตอนค่ำ", emoji: "🌙", sub: "เปิดประตูแห่งสัญชาตญาณและความจริง" };
  }, []);

  const filteredFeatures = useMemo(() => {
    if (activeCategory === "all") return FEATURES;
    return FEATURES.filter((f) => f.category === activeCategory);
  }, [activeCategory]);

  return (
    <div className="dashboard-premium space-y-7 pb-24">
      {/* Header Greeting Banner */}
      <header className="dash-greeting pt-6 pb-2">
        <div className="dash-greeting-text">
          <div className="dash-greeting-hi flex items-center gap-1.5">
            <span>{greeting.hi}</span>
            <span>{greeting.emoji}</span>
          </div>
          <h1 className="dash-greeting-name text-[24px] sm:text-[28px] font-extrabold text-[var(--text)] tracking-tight">
            {profile?.display_name || "นักเดินทางแห่งดวงดาว"}
          </h1>
          <p className="dash-greeting-sub text-[13px] text-[var(--text-secondary)] mt-0.5">
            {greeting.sub}
          </p>
        </div>
        <div
          className="dash-points-pill cursor-pointer"
          onClick={() => router.push("/dashboard/profile")}
          aria-label={`แต้มคงเหลือ ${profile?.points ?? 0}`}
        >
          <Coins size={14} />
          <span>{(profile?.points ?? 0).toLocaleString()} แต้ม</span>
        </div>
      </header>

      {/* Continue reading draft (if exists) */}
      {draft && draft.question && (
        <div className="dash-section">
          <div
            className="card p-4 flex items-center gap-3.5"
            style={{
              borderLeft: "4px solid var(--primary)",
              background: "linear-gradient(135deg, var(--primary-soft), var(--bg-card))",
            }}
          >
            <span
              className="w-10 h-10 rounded-xl grid place-items-center shrink-0 shadow-xs"
              style={{ background: "var(--primary)", color: "white" }}
            >
              <BookOpen size={16} />
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-[10.5px] font-bold tracking-widest uppercase text-[var(--primary)]">
                ทำนายค้างไว้
              </div>
              <div className="text-[14px] font-bold truncate text-[var(--text)] mt-0.5">
                {draft.question.slice(0, 50)}{draft.question.length > 50 ? "…" : ""}
              </div>
              <div className="text-[11.5px] text-[var(--text-muted)] mt-0.5">
                {SPREADS[draft.spreadType as SpreadType]?.nameTh ?? draft.spreadType} · ขั้นตอนที่ {draft.step}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => router.push(`/dashboard/reading?spread=${draft.spreadType}`)}
                className="btn btn-primary text-[12.5px] px-4 py-2 rounded-xl"
              >
                ทำต่อ
              </button>
              <button
                onClick={() => { clearDraft(); setDraft(null); }}
                className="btn btn-ghost text-[12.5px] px-3 py-2"
                aria-label="ลบดราฟต์"
              >
                ลบ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Spread Showcase Card */}
      <div className="dash-section">
        <FeatureCard
          feature={{
            id: "tarot-three-card",
            category: "tarot",
            title: "Three Card",
            titleTh: "เปิดไพ่ทาโรต์ 3 ใบ",
            subtitle: "Past · Present · Future",
            subtitleTh: "อดีต · ปัจจุบัน · อนาคต",
            descriptionTh: "พิธีกรรมเปิดไพ่สามใบเพื่อเชื่อมโยงเส้นเวลา อธิบายสถานการณ์ และรับคำทำนายเชิงลึกจาก AI หมอดูทิพย์",
            icon: Sparkles,
            status: "live",
            cost: costs["three_card"] ?? SPREADS.three_card.cost,
            route: "/dashboard/reading?spread=three_card",
            theme: "violet",
            badge: "แนะนำ",
            badgeTh: "แนะนำยอดนิยม",
          }}
          userPoints={profile?.points ?? 0}
          variant="hero"
          onClick={() => handleSpreadSelect("three_card")}
        />
      </div>

      {/* Spreads Showcase Carousel */}
      <div className="dash-section space-y-3">
        <SectionHeader
          title="เลือกรูปแบบสำรับไพ่"
          subtitle="สำรับ Rider-Waite-Smith 78 ใบ พร้อมภาพความหมายสมบูรณ์"
          trailing={
            <span className="text-[12px] font-semibold text-[var(--text-muted)]">
              3 รูปแบบ
            </span>
          }
        />
        <div className="dash-spreads">
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
                className={cn(
                  "dash-spread group text-left",
                  insufficient && "opacity-50 cursor-not-allowed"
                )}
                aria-label={`${spread.nameTh} - ${spread.cardCount} ใบ, ${cost} แต้ม`}
              >
                <div className="dash-spread-thumb relative">
                  {positions.map((p, i) => (
                    <div
                      key={i}
                      style={{
                        position: "absolute",
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        width: 10,
                        height: 15,
                        borderRadius: 2.5,
                        background: "rgba(212, 175, 55, 0.45)",
                        border: "1px solid rgba(212, 175, 55, 0.7)",
                        transform: "translate(-50%, -50%)",
                        boxShadow: "0 0 6px rgba(212, 175, 55, 0.25)",
                      }}
                    />
                  ))}
                </div>
                <div className="dash-spread-name text-[14px] font-bold text-[var(--text)] group-hover:text-[var(--primary)] transition-colors">
                  {spread.nameTh}
                </div>
                <div className="dash-spread-meta flex items-center justify-between text-[11.5px] text-[var(--text-muted)]">
                  <span>{spread.cardCount} ใบ</span>
                  <span className="dash-spread-cost font-extrabold text-[var(--gold)] flex items-center gap-1">
                    <Coins size={11} /> {cost} แต้ม
                  </span>
                </div>
                <div
                  className="absolute top-2.5 right-3 text-[9.5px] font-extrabold uppercase tracking-wider text-[var(--primary)] bg-[var(--primary-soft)] px-2 py-0.5 rounded-full"
                >
                  {SPREAD_BADGE[key]}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Daily Ritual & Bonus Section */}
      <div className="dash-section">
        <DailyBonusWrapper
          userId={userId}
          points={profile?.points ?? 0}
          onClaim={(amount) => {
            handleDailyBonus(amount);
          }}
        />
      </div>

      {/* Announcement Banner */}
      <div className="dash-section">
        <AnnouncementCard
          tag="ประจำวัน"
          title="ดูดวงรายวันพร้อมคำแนะนำ 5 ด้าน"
          subtitle="ความรัก · การงาน · การเงิน · สุขภาพ · ความเครียด (ฟรีทุกวัน)"
          icon={Gift}
          cta="เปิดดูดวงวันนี้"
          href="/dashboard/daily"
          tone="gold"
        />
      </div>

      {/* Category Filter Pills */}
      <div className="dash-section space-y-3">
        <SectionHeader title="เครื่องมือทั้งหมด" subtitle="สำรวจศาสตร์แห่งการพยากรณ์และดวงชะตา" />
        <div className="dash-category-pills">
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
                <Icon size={14} />
                {meta.labelTh}
              </button>
            );
          })}
        </div>
      </div>

      {/* Feature Catalog Grid */}
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

      {/* Quick Shortcuts (when viewing All) */}
      {activeCategory === "all" && (
        <div className="dash-section space-y-3">
          <SectionHeader
            title="เครื่องมือด่วน"
            subtitle="คำถามเฉพาะทางและลางสังหรณ์"
          />
          <div className="dash-feature-row">
            {[
              {
                id: "zodiac",
                icon: Star,
                title: "ดูดวงตามวันเกิด",
                sub: "ฟรี · ราศี + 12 ปีนักษัตร",
                href: "/dashboard/zodiac",
                cat: "astrology" as FeatureCategory,
              },
              {
                id: "yesno",
                icon: CircleHelp,
                title: "ถามใช่หรือไม่",
                sub: "3 แต้ม · คำตอบชัดเจนใน 1 ใบ",
                href: "/dashboard/yesno",
                cat: "quick" as FeatureCategory,
              },
              {
                id: "daily",
                icon: Gift,
                title: "ดูดวงรายวัน",
                sub: "ฟรี · อัปเดตทุกเช้า",
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
                  className="fc-root p-3.5 transition-all duration-200 hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        background: tone.bg,
                        color: tone.color,
                      }}
                    >
                      <Icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13.5px] font-bold text-[var(--text)]">
                        {tool.title}
                      </div>
                      <div className="text-[11.5px] text-[var(--text-muted)]">
                        {tool.sub}
                      </div>
                    </div>
                    <div className="text-[16px] text-[var(--text-muted)]">
                      ›
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Readings (Tarot Journal Preview) */}
      <div className="dash-section space-y-3">
        <SectionHeader
          title="บันทึกคำทำนายล่าสุด"
          subtitle={recentReadings.length ? "ทบทวนข้อความและคำแนะนำจากไพ่" : "ยังไม่มีบันทึก — เริ่มเปิดไพ่ครั้งแรกได้เลย"}
          trailing={
            recentReadings.length ? (
              <a href="/dashboard/history" className="text-[12.5px] font-bold text-[var(--primary)] hover:underline flex items-center gap-1">
                ดูสมุดบันทึกทั้งหมด <ArrowRight size={13} />
              </a>
            ) : undefined
          }
        />
        {recentReadings.length === 0 ? (
          <div className="card p-6 text-center">
            <p className="text-[13.5px] text-[var(--text-secondary)]">
              ยังไม่มีประวัติการอ่าน — เริ่มต้นเปิดไพ่สำรับแรกของคุณวันนี้
            </p>
            <a href="/dashboard/reading?spread=three_card" className="btn btn-primary mt-3.5 inline-flex">
              เริ่มเปิดไพ่พยากรณ์
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5">
            {recentReadings.map((r) => (
              <a
                key={r.id}
                href="/dashboard/history"
                className="card p-4 flex items-center gap-3.5 hover:border-[var(--border-strong)] hover:shadow-sm transition-all duration-200 group"
              >
                <span
                  className="w-10 h-10 rounded-xl grid place-items-center shrink-0"
                  style={{ background: "var(--primary-soft)", color: "var(--primary)" }}
                >
                  <Sparkles size={16} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[13.5px] font-bold truncate text-[var(--text)] group-hover:text-[var(--primary)] transition-colors">
                    {r.question ? r.question.slice(0, 60) + (r.question.length > 60 ? "…" : "") : SPREADS[r.spread_type as SpreadType]?.nameTh ?? r.spread_type}
                  </span>
                  <span className="block text-[11.5px] text-[var(--text-muted)] mt-0.5">
                    {new Date(r.created_at).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })} · {SPREADS[r.spread_type as SpreadType]?.nameTh ?? r.spread_type} · {r.points_spent} แต้ม
                  </span>
                </span>
                <span className="text-[var(--text-muted)] text-[18px] group-hover:translate-x-1 transition-transform">›</span>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Points Balance Footer Widget */}
      <div className="dash-section">
        <PointsBalance points={profile?.points ?? 0} />
      </div>
    </div>
  );
}

function DailyBonusWrapper({
  userId,
  onClaim,
}: {
  userId: string | null;
  points?: number;
  onClaim: (amount: number) => void;
}) {
  return (
    <div
      className="card p-6 relative overflow-hidden text-center"
      style={{
        background: "radial-gradient(ellipse at 50% 20%, rgba(167, 139, 250, 0.12) 0%, var(--bg-card) 70%)",
        borderColor: "var(--border-gold)",
      }}
    >
      <div className="relative z-10 max-w-sm mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10.5px] font-extrabold uppercase tracking-widest text-[var(--gold)] bg-[var(--gold-soft)] border border-[var(--border-gold)]">
          <Star size={11} /> พิธีกรรมประจำวัน
        </div>
        <h3 className="text-[17px] font-extrabold text-[var(--text)] tracking-tight">
          รับแต้มสะสมฟรีทุกวัน
        </h3>
        <p className="text-[12.5px] text-[var(--text-secondary)] leading-relaxed">
          สะสมแต้มเพื่อใช้ในการเปิดไพ่ทาโรต์และเครื่องมือพยากรณ์ต่าง ๆ
        </p>
        <div className="pt-1">
          <DailyBonus userId={userId || ""} onClaim={onClaim} />
        </div>
      </div>
    </div>
  );
}

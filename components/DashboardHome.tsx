"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import DailyBonus from "./DailyBonus";
import PointsBalance from "./PointsBalance";
import FeatureCard from "@/components/ui/FeatureCard";
import SectionHeader from "@/components/ui/SectionHeader";
import AnnouncementCard from "@/components/ui/AnnouncementCard";
import InsufficientPoints from "@/components/ui/InsufficientPoints";
import { SPREADS, type SpreadType } from "@/lib/cards";
import { CATEGORY_META, FEATURES, type FeatureCategory } from "@/lib/features/catalog";
import { Coins, Sparkles, CircleHelp, Gift, Star, BookOpen, ArrowRight, Heart, Briefcase, GraduationCap, Wallet, Activity, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { loadDraft, clearDraft } from "@/lib/useReadingDraft";
import { draftTopicLabelTh, isReadingStepKey, readingStepLabelTh } from "@/lib/reading-flow";
import { useShell } from "./DashboardShell";
import dynamic from "next/dynamic";
const PushOptInWrapper = dynamic(() => import("./PushOptIn"), { ssr: false });
import OnboardingModal from "./OnboardingModal";

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

const TOPIC_ICONS: Record<string, LucideIcon> = {
  love: Heart,
  career: Briefcase,
  study: GraduationCap,
  finance: Wallet,
  health: Activity,
  general: Sparkles,
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
    const withDynamicCosts = FEATURES.map(f => {
      if (f.id === "tarot-single" && costs["single"] !== undefined) return { ...f, cost: costs["single"] };
      if (f.id === "tarot-three-card" && costs["three_card"] !== undefined) return { ...f, cost: costs["three_card"] };
      if (f.id === "tarot-celtic" && costs["celtic"] !== undefined) return { ...f, cost: costs["celtic"] };
      if (f.id === "yes-no" && costs["single"] !== undefined) return { ...f, cost: costs["single"] };
      if (["tarot-love","tarot-career","tarot-study","tarot-finance","tarot-health"].includes(f.id) && costs["three_card"] !== undefined) return { ...f, cost: costs["three_card"] };
      return f;
    });
    if (activeCategory === "all") return withDynamicCosts;
    return withDynamicCosts.filter((f) => f.category === activeCategory);
  }, [activeCategory, costs]);

  return (
    <div className="dashboard-premium space-y-8 pb-24">
      <OnboardingModal />
      {/* Header Greeting Banner — premium cozy */}
      <header className="dash-greeting pt-7 pb-3">
        <div className="dash-greeting-text">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold tracking-widest uppercase" style={{ background: "var(--primary-soft)", color: "var(--primary)", border: "1px solid rgba(167,139,250,0.18)" }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--primary)" }} />
            Sealo · {greeting.hi} {greeting.emoji}
          </div>
          <h1 className="dash-greeting-name text-[26px] sm:text-[30px] font-extrabold text-[var(--text)] tracking-tight mt-3">
            {profile?.display_name || "นักเดินทางแห่งดวงดาว"}
          </h1>
          <p className="dash-greeting-sub text-[13.5px] text-[var(--text-secondary)] mt-1.5 leading-relaxed max-w-[520px]">
            {greeting.sub}
          </p>
        </div>
        <button
          type="button"
          className="dash-points-pill cursor-pointer group"
          onClick={() => router.push("/dashboard/profile")}
          aria-label={`แต้มคงเหลือ ${(profile?.points ?? 0).toLocaleString()} แต้ม ไปหน้าโปรไฟล์`}
        >
          <span className="w-7 h-7 rounded-full grid place-items-center shrink-0" style={{ background: "linear-gradient(135deg,#f6c944,#d4af37)", color: "#3a2a00" }}><Coins size={13} aria-hidden /></span>
          <span className="group-hover:translate-x-0.5 transition-transform">{(profile?.points ?? 0).toLocaleString()} แต้ม</span>
        </button>
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
                {SPREADS[draft.spreadType as SpreadType]?.nameTh ?? draft.spreadType} · {draftTopicLabelTh(draft.topic)} · {isReadingStepKey(draft.step) ? readingStepLabelTh(draft.step) : draft.step}
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

      {/* Hero — primary CTA, magical */}
      <div className="dash-section">
        <button type="button" className="hero-card group cursor-pointer relative overflow-hidden w-full text-left" onClick={() => handleSpreadSelect("three_card")} aria-label="เริ่มอ่านไพ่ 3 ใบ">
          <div className="hero-glow" style={{ background: "radial-gradient(ellipse 70% 80% at 20% 20%, rgba(167,139,250,0.22), transparent 60%), radial-gradient(ellipse 60% 60% at 90% 30%, rgba(212,175,55,0.14), transparent 60%), linear-gradient(135deg, rgba(26,16,45,0.96), rgba(18,13,32,0.98))" }} />
          {/* subtle stars */}
          <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ backgroundImage: "radial-gradient(1px 1px at 20% 30%, white, transparent), radial-gradient(1px 1px at 40% 70%, white, transparent), radial-gradient(1.2px 1.2px at 80% 20%, white, transparent), radial-gradient(1px 1px at 90% 60%, white, transparent)" }} />
          <div className="hero-content relative z-10 !items-center !gap-5 py-1">
            <div className="hidden sm:flex w-[96px] h-[140px] rounded-xl shrink-0 relative overflow-hidden" style={{ background: "linear-gradient(160deg,#1e0e3a,#2d1548 35%,#1a0a2e 70%)", border: "1.5px solid rgba(212,175,55,0.45)", boxShadow: "0 12px 28px rgba(0,0,0,0.45), 0 0 0 1px rgba(212,175,55,0.15)" }}>
              <div className="absolute inset-[5px] rounded-[10px] border border-[rgba(201,168,76,0.18)]" />
              <div className="absolute inset-0 grid place-items-center"><div className="w-8 h-8 rounded-full border border-[rgba(201,168,76,0.18)] grid place-items-center"><div className="w-1.5 h-1.5 rounded-full bg-[rgba(212,175,55,0.9)] shadow-[0_0_8px_rgba(212,175,55,0.7)]" /></div></div>
              <div className="absolute inset-0 flex -space-x-3 items-center justify-center opacity-90"><div className="w-7 h-10 rounded-[3px] border border-[rgba(212,175,55,0.5)] bg-[rgba(26,16,45,0.9)] rotate-[-8deg]" /><div className="w-7 h-10 rounded-[3px] border border-[rgba(212,175,55,0.7)] bg-[rgba(45,21,72,0.95)] z-10" /><div className="w-7 h-10 rounded-[3px] border border-[rgba(212,175,55,0.5)] bg-[rgba(26,16,45,0.9)] rotate-[8deg]" /></div>
            </div>
            <div className="hero-body !gap-0">
              <div className="inline-flex items-center gap-2 mb-2">
                <span className="text-[10.5px] font-extrabold tracking-[0.14em] uppercase px-2.5 py-1 rounded-full" style={{ background: "rgba(167,139,250,0.16)", color: "#c4b5fd", border: "1px solid rgba(167,139,250,0.22)" }}>อดีต · ปัจจุบัน · อนาคต</span>
                <span className="text-[10.5px] font-bold px-2 py-1 rounded-full" style={{ background: "rgba(212,175,55,0.14)", color: "#fde68a", border: "1px solid rgba(212,175,55,0.18)" }}>แนะนำยอดนิยม</span>
              </div>
              <h3 className="hero-title !text-[22px] sm:!text-[24px] !leading-[1.15] !text-white">เปิดไพ่ทาโรต์ 3 ใบ</h3>
              <p className="hero-desc !text-white/70 !text-[13.5px] !leading-relaxed mt-2 max-w-[420px]">พิธีกรรมสามใบเชื่อมเส้นเวลา — เห็นอดีต เข้าใจปัจจุบัน รับคำทำนายเชิงลึกจาก AI หมอดูทิพย์</p>
              <div className="hero-meta !mt-4">
                <span className="inline-flex items-center gap-1.5 text-[13px] font-bold px-3 py-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)", color: "white", border: "1px solid rgba(255,255,255,0.12)" }}><Coins size={13} style={{ color: "#fde68a" }} /> {costs["three_card"] ?? SPREADS.three_card.cost} แต้ม</span>
                <span className="hero-cta !bg-white !text-[#1a1033] !pl-5 !pr-1.5 !py-1.5 !text-[13.5px] !font-extrabold !rounded-full !gap-2.5 !shadow-[0_8px_20px_rgba(0,0,0,0.22)] group-hover:!scale-[1.02] !transition-all">เริ่มเลย <span className="w-8 h-8 rounded-full grid place-items-center shrink-0" style={{ background: "#1a1033", color: "white" }}><ArrowRight size={14} /></span></span>
              </div>
            </div>
          </div>
          </button>
        </div>

      {/* Topics — quick access to topic-specific readings */}
      <div className="dash-section space-y-3">
        <SectionHeader
          title="เลือกหัวข้อที่สนใจ"
          subtitle={`ไพ่ 3 ใบ เน้นเรื่องที่คุณสนใจ ${costs["three_card"] ?? SPREADS.three_card.cost} แต้ม · ใช้ได้ทุก Spread`}
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {(["love", "career", "study", "finance", "health"] as const).map((topic) => {
            const Icon = TOPIC_ICONS[topic];
            const topicData = {
              love: { label: "ความรัก", color: "var(--topic-love)", bg: "var(--topic-love-soft)" },
              career: { label: "การงาน", color: "var(--topic-career)", bg: "var(--topic-career-soft)" },
              study: { label: "การเรียน", color: "var(--topic-study)", bg: "var(--topic-study-soft)" },
              finance: { label: "การเงิน", color: "var(--topic-finance)", bg: "var(--topic-finance-soft)" },
              health: { label: "สุขภาพ", color: "var(--topic-health)", bg: "var(--topic-health-soft)" },
            }[topic];
            return (
              <a
                key={topic}
                href={`/dashboard/reading?spread=three_card&topic=${topic}`}
                className="fc-root p-4 text-center transition-all duration-200 hover:-translate-y-0.5"
                style={{ borderColor: topicData.color } as React.CSSProperties}
              >
                <span
                  className="w-12 h-12 rounded-xl grid place-items-center mx-auto mb-3"
                  style={{ background: topicData.bg, color: topicData.color } as React.CSSProperties}
                >
                  <Icon size={20} />
                </span>
                <span className="text-[13.5px] font-bold text-[var(--text)] block">{topicData.label}</span>
                <span className="text-[11px] mt-1 block" style={{ color: "var(--text-muted)" }}>{costs["three_card"] ?? SPREADS.three_card.cost} แต้ม · 3 ใบ</span>
              </a>
            );
          })}
        </div>
      </div>

      {/* Spreads — tarot as hero */}
      <div className="dash-section space-y-3">
        <SectionHeader
          title="เลือกรูปแบบสำรับไพ่"
          subtitle="Rider-Waite 78 ใบ · เลือกไพ่ที่เรียกหาคุณ"
        />
        <div className="dash-spreads !gap-3">
          {(Object.keys(SPREADS) as SpreadType[]).map((key) => {
            const spread = SPREADS[key];
            const cost = costs[key] ?? spread.cost;
            const insufficient = (profile?.points ?? 0) < cost;
            const isPopular = key === "three_card";
            return (
              <button
                key={key}
                onClick={() => insufficient ? router.push("/dashboard/daily") : handleSpreadSelect(key)}
                className={cn(
                  "dash-spread group text-left !p-0 overflow-hidden !gap-0",
                  isPopular && "ring-2 ring-[rgba(167,139,250,0.28)] shadow-[0_8px_28px_rgba(167,139,250,0.18)]",
                  insufficient && "opacity-75"
                )}
                aria-label={`${spread.nameTh} - ${spread.cardCount} ใบ, ${cost} แต้ม${insufficient ? " (แต้มไม่พอ)" : ""}`}
              >
                {/* premium card back visual — like homepage hero */}
                <div className="relative h-[132px] flex items-center justify-center overflow-hidden" style={{ background: isPopular ? "radial-gradient(ellipse 90% 70% at 50% 0%, rgba(167,139,250,0.18) 0%, #0f0a1e 55%, #0a0614 100%)" : "radial-gradient(ellipse 90% 70% at 50% 0%, rgba(167,139,250,0.10) 0%, #0f0a1e 60%, #0a0614 100%)", borderBottom: "1px solid var(--border-subtle)" }}>
                  <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ backgroundImage: "radial-gradient(1px 1px at 22% 28%, white, transparent), radial-gradient(1px 1px at 68% 18%, white, transparent), radial-gradient(1px 1px at 84% 68%, white, transparent)" }} />
                  <div className="absolute inset-0 opacity-40 pointer-events-none" style={{ background: "radial-gradient(circle at 50% 35%, rgba(167,139,250,0.16), transparent 60%)" }} />
                  <div className="absolute w-20 h-20 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(212,175,55,0.10), transparent 70%)", filter: "blur(6px)", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />
                  <div className="relative flex items-center justify-center w-full h-full p-2">
                    {key === "single" && (
                      <div className="w-[46px] h-[72px] rounded-[5px] border flex items-center justify-center shadow-lg group-hover:-translate-y-1 transition-transform duration-300" style={{ background: "linear-gradient(160deg,#1e0e3a,#2d1548 35%,#1a0a2e 70%)", borderColor: "rgba(212,175,55,0.55)", boxShadow: "0 6px 18px rgba(0,0,0,0.45), 0 0 0 1px rgba(212,175,55,0.12)" }}>
                        <div className="absolute inset-[3px] rounded-[3px] border border-[rgba(201,168,76,0.18)] pointer-events-none" />
                        <div className="w-4 h-4 rounded-full border border-[rgba(201,168,76,0.18)] grid place-items-center"><div className="w-1.5 h-1.5 rounded-full bg-[rgba(212,175,55,0.9)] shadow-[0_0_6px_rgba(212,175,55,0.6)]" /></div>
                      </div>
                    )}
                    {key === "three_card" && (
                      <div className="flex items-center justify-center -space-x-1.5">
                        {[0, 1, 2].map(i => (
                          <div key={i} className="w-[36px] h-[56px] rounded-[4px] border flex items-center justify-center shrink-0 shadow-md group-hover:-translate-y-1 transition-transform" style={{ background: "linear-gradient(160deg,#1e0e3a,#2d1548)", borderColor: "rgba(212,175,55,0.50)", transform: `rotate(${(i-1)*6}deg)`, transitionDelay: `${i*40}ms`, zIndex: i===1?2:1 }}>
                            <div className="absolute inset-[3px] rounded-[3px] border border-[rgba(201,168,76,0.14)] pointer-events-none" />
                            <div className="w-3 h-3 rounded-full border border-[rgba(201,168,76,0.16)] grid place-items-center"><div className="w-1 h-1 rounded-full bg-[rgba(212,175,55,0.85)]" /></div>
                          </div>
                        ))}
                      </div>
                    )}
                    {key === "celtic" && (
                      <div className="relative w-full h-full max-w-[160px] max-h-[110px]">
                        {[
                          [35,50],[50,50],[35,80],[35,20],[35,5],[65,80],[65,60],[65,40],[65,20],[80,50]
                        ].map((pos, i) => (
                          <div key={i} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${pos[0]}%`, top: `${pos[1]}%` }}>
                            <div className="w-[16px] h-[24px] rounded-[2px] border flex items-center justify-center shadow-sm group-hover:scale-[1.03] transition-transform" style={{ background: isPopular ? "linear-gradient(160deg,#2d1a4a,#1e0e3a)" : "linear-gradient(160deg,#1d0e38,#1a0a2e)", borderColor: "rgba(212,175,55,0.50)", boxShadow: isPopular ? "0 0 6px rgba(212,175,55,0.22)" : "0 2px 6px rgba(0,0,0,0.35)" }}>
                              <span className="text-[4.5px] font-bold" style={{ color: "rgba(253,230,160,0.9)" }}>{i+1}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="absolute top-2 right-2 text-[9.5px] font-extrabold tracking-widest uppercase px-2 py-1 rounded-full backdrop-blur-sm" style={{ background: insufficient ? "rgba(239,68,68,0.14)" : isPopular ? "rgba(167,139,250,0.20)" : "rgba(255,255,255,0.08)", color: insufficient ? "#fca5a5" : isPopular ? "#ddd6fe" : "rgba(255,255,255,0.72)", border: `1px solid ${insufficient ? "rgba(239,68,68,0.20)" : isPopular ? "rgba(167,139,250,0.28)" : "rgba(255,255,255,0.14)"}` }}>{insufficient ? "แต้มไม่พอ" : SPREAD_BADGE[key]}</span>
                </div>
                <div className="p-3.5">
                  <div className="text-[14px] font-extrabold leading-none" style={{ color: "var(--text)" }}>{spread.nameTh}</div>
                  <div className="text-[12px] mt-1 leading-relaxed" style={{ color: "var(--text-secondary)" }}>{spread.descriptionTh}</div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-[11.5px] font-semibold px-2 py-1 rounded-full" style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>{spread.cardCount} ใบ</span>
                    {insufficient ? <InsufficientPoints variant="inline" needed={cost} current={profile?.points ?? 0} className="text-[12px] font-bold" /> : <span className="inline-flex items-center gap-1 text-[13px] font-extrabold" style={{ color: "var(--gold)" }}><Coins size={12} /> {cost}</span>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Daily Ritual — streak as reward */}
      <div className="dash-section">
        <DailyBonusWrapper
          userId={userId}
          points={profile?.points ?? 0}
          onClaim={(amount) => {
            handleDailyBonus(amount);
          }}
        />
      </div>
      <div className="dash-section">
        <PushOptInWrapper />
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
                sub: `${costs["single"] ?? 5} แต้ม · คำตอบชัดเจนใน 1 ใบ`,
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
                href={`/dashboard/history?r=${r.id}`}
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

      {/* Collection Teaser */}
      <div className="dash-section">
        <a href="/dashboard/collection" className="card p-4 flex items-center gap-3.5 hover:border-[var(--primary)] transition-all group">
          <div className="w-11 h-11 rounded-xl grid place-items-center" style={{ background: "var(--primary-soft)", color: "var(--primary)" }}><Sparkles size={18} /></div>
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-extrabold" style={{ color:"var(--text)"}}>คอลเลกชันไพ่ 78 ใบ</div>
            <div className="text-[12px]" style={{ color:"var(--text-muted)"}}>ดูไพ่ที่สะสม ธาตุ และไพ่เด่นของคุณ</div>
          </div>
          <span className="text-[18px]" style={{ color:"var(--text-muted)"}}>›</span>
        </a>
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
      className="card p-5 sm:p-6 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, rgba(26,16,45,0.96), rgba(18,13,32,0.98))",
        borderColor: "rgba(212,175,55,0.22)",
        boxShadow: "0 12px 32px rgba(0,0,0,0.22), 0 0 0 1px rgba(212,175,55,0.08)",
      }}
    >
      <div className="absolute inset-0 pointer-events-none opacity-40" style={{ background: "radial-gradient(ellipse 60% 50% at 20% 20%, rgba(167,139,250,0.16), transparent 60%), radial-gradient(ellipse 50% 40% at 90% 30%, rgba(212,175,55,0.12), transparent 60%)" }} />
      <div className="relative z-10 flex gap-4 items-center">
        <div className="hidden sm:grid w-14 h-14 rounded-2xl place-items-center shrink-0" style={{ background: "linear-gradient(135deg,#f6c944,#d4af37)", color: "#3a2a00", boxShadow: "0 8px 20px rgba(212,175,55,0.28)" }}><Gift size={20} /></div>
        <div className="flex-1 min-w-0 text-left">
          <div className="inline-flex items-center gap-1.5 text-[10.5px] font-extrabold tracking-widest uppercase px-2.5 py-1 rounded-full" style={{ background: "rgba(212,175,55,0.14)", color: "#fde68a", border: "1px solid rgba(212,175,55,0.18)" }}><Star size={11} /> พิธีกรรมประจำวัน</div>
          <h3 className="text-[16px] sm:text-[17px] font-extrabold text-white tracking-tight mt-1.5">รับแต้มสะสมฟรีทุกวัน</h3>
          <p className="text-[12.5px] leading-relaxed mt-1" style={{ color: "rgba(255,255,255,0.62)" }}>กลับมาเติมพลังทุกวัน สะสมต่อเนื่องยิ่งได้โบนัส</p>
        </div>
        <div className="hidden sm:block w-[220px] shrink-0">
          <DailyBonus userId={userId || ""} onClaim={onClaim} />
        </div>
      </div>
      <div className="sm:hidden mt-4">
        <DailyBonus userId={userId || ""} onClaim={onClaim} />
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import DashboardShell from "@/components/DashboardShell";
import SpreadSelector from "@/components/SpreadSelector";
import QuestionInput from "@/components/QuestionInput";
import CardDraw from "@/components/CardDraw";
import ReadingResult from "@/components/ReadingResult";
import InsufficientPoints from "@/components/ui/InsufficientPoints";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import {
  readingStepEyebrow,
  getConfirmSummary,
} from "@/lib/reading-flow";
import { ArrowLeft, Check, Sparkles, Wand2, HelpCircle, BookOpen, Heart, Briefcase, GraduationCap, Wallet, Activity, Compass } from "lucide-react";
import { SPREADS, type SpreadType, type DrawnCard } from "@/lib/cards";
import { useBeforeUnload } from "@/lib/useBeforeUnload";
import { cn } from "@/lib/cn";
import { saveDraft, loadDraft, clearDraft } from "@/lib/useReadingDraft";

type LucideIcon = React.ComponentType<{ size?: number; className?: string }>;

const STEPS = [
  { key: "spread", label: "เลือก Spread", icon: Sparkles },
  { key: "topic", label: "เลือกหัวข้อ", icon: Compass },
  { key: "question", label: "ถามคำถาม", icon: HelpCircle },
  { key: "draw", label: "จั่วไพ่", icon: Wand2 },
  { key: "result", label: "คำทำนาย", icon: BookOpen },
] as const;

type StepKey = "spread" | "topic" | "question" | "draw" | "result";

type TopicKey = "love" | "career" | "study" | "finance" | "health" | "general";

const TOPICS: Record<TopicKey, { label: string; icon: LucideIcon; desc: string; color: string }> = {
  love: { label: "ความรัก", icon: Heart, desc: "ความสัมพันธ์ ความรัก โสด มารดา", color: "var(--topic-love)" },
  career: { label: "การงาน", icon: Briefcase, desc: "อาชีพ การตัดสินใจ เส้นทาง", color: "var(--topic-career)" },
  study: { label: "การเรียน", icon: GraduationCap, desc: "การศึกษา สอบ การพัฒนาตนเอง", color: "var(--topic-study)" },
  finance: { label: "การเงิน", icon: Wallet, desc: "เงิน ลงทุน โอกาส การใช้จ่าย", color: "var(--topic-finance)" },
  health: { label: "สุขภาพ", icon: Activity, desc: "กาย ใจ โยคะ วิถีชีวิต", color: "var(--topic-health)" },
  general: { label: "ภาพรวม", icon: Sparkles, desc: "คำถามทั่วไป ไม่ระบุหัวข้อ", color: "var(--primary)" },
};

export default function ReadingPage() {
  return (
    <Suspense fallback={<ReadingFallback />}>
      <ReadingPageInner />
    </Suspense>
  );
}

function ReadingFallback() {
  return (
    <DashboardShell>
      <div className="flex items-center justify-center" style={{ minHeight: "60vh" }}>
        <div className="mystical-loader">
          <div className="mystical-loader-dot" />
          <div className="mystical-loader-dot" />
          <div className="mystical-loader-dot" />
        </div>
      </div>
    </DashboardShell>
  );
}

function ReadingPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [userId, setUserId] = useState<string | null>(null);
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [costs, setCosts] = useState<Record<string, number>>({});

  const rawInitialSpread = searchParams.get("spread") as SpreadType | null;
  const hasInitialSpread = !!rawInitialSpread && (["single", "three_card", "celtic"] as string[]).includes(rawInitialSpread);
  const initialSpread: SpreadType | null = hasInitialSpread ? (rawInitialSpread as SpreadType) : null;
  const rawInitialTopic = searchParams.get("topic") as TopicKey | null;
  const hasInitialTopic = !!rawInitialTopic && (Object.keys(TOPICS) as string[]).includes(rawInitialTopic);
  const initialTopic: TopicKey | null = hasInitialTopic ? (rawInitialTopic as TopicKey) : null;
  const [step, setStep] = useState<StepKey>("spread");
  const [spreadType, setSpreadType] = useState<SpreadType>(
    hasInitialSpread ? (rawInitialSpread as SpreadType) : "three_card"
  );
  const [topic, setTopic] = useState<TopicKey>(
    hasInitialTopic ? (rawInitialTopic as TopicKey) : "general"
  );
  const [question, setQuestion] = useState("");
  const [drawnCards, setDrawnCards] = useState<DrawnCard[] | null>(null);
  // Pre-spend confirmation (Phase C1): spend still happens server-side in
  // the result step; this dialog only gates advancing to the draw step.
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/");
        return;
      }
      setUserId(user.id);
      const { data: profile } = await supabase
        .from("profiles")
        .select("points")
        .eq("id", user.id)
        .single();
      if (profile) setPoints(profile.points);

      const { data: costRow } = await supabase
        .from("admin_settings")
        .select("value")
        .eq("key", "reading_costs")
        .single();
      if (costRow?.value && typeof costRow.value === "object") {
        setCosts(costRow.value as Record<string, number>);
      }

      if (hasInitialSpread && initialSpread) {
        setSpreadType(initialSpread);
        if (hasInitialTopic && initialTopic) {
          setTopic(initialTopic);
          setStep("question");
        } else {
          setStep("topic");
        }
      } else {
        setStep("spread");
      }

      setLoading(false);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useBeforeUnload(
    step === "draw" || step === "result",
    "คุณกำลังอ่านไพ่อยู่ หากออกจะสูญเสียแต้ม"
  );

  // Persist unfinished reading for "ทำต่อ" on dashboard / refresh
  useEffect(() => {
    if (step === "spread") {
      clearDraft();
      return;
    }
    saveDraft({ spreadType, question, drawnCards, step });
  }, [step, spreadType, question, drawnCards]);

  // Restore draft if user returns without ?spread
  useEffect(() => {
    if (loading) return;
    if (hasInitialSpread) return;
    const draft = loadDraft();
    if (draft && draft.question && draft.spreadType) {
      setSpreadType(draft.spreadType);
      setQuestion(draft.question);
      if (draft.drawnCards) setDrawnCards(draft.drawnCards as DrawnCard[]);
      if (draft.step === "draw" || draft.step === "result") {
        // Don't auto-restore to draw/result to avoid duplicate spend; stay at question
        setStep("question");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  if (loading) {
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
              กำลังเตรียมพลังงาน...
            </p>
          </div>
        </div>
      </DashboardShell>
    );
  }

  const spread = SPREADS[spreadType];
  const stepIndex = STEPS.findIndex((s) => s.key === step);

  const handleSpreadSelect = (type: SpreadType) => {
    setSpreadType(type);
    setStep("topic");
  };

  const handleTopicSelect = (t: TopicKey) => {
    setTopic(t);
    setStep("question");
  };

  const handleQuestionSubmit = () => {
    // Open the pre-spend confirmation instead of advancing directly.
    setConfirmOpen(true);
  };

  const handleConfirmProceed = () => {
    setConfirmOpen(false);
    setStep("draw");
  };

  const handleConfirmCancel = () => {
    setConfirmOpen(false);
  };

  const handleDrawComplete = (cards: DrawnCard[]) => {
    setDrawnCards(cards);
    setStep("result");
  };

  const handleResultDone = () => {
    clearDraft();
    setDrawnCards(null);
    setQuestion("");
    setStep("spread");
    if (userId) {
      const supabase = createClient();
      supabase
        .from("profiles")
        .select("points")
        .eq("id", userId)
        .single()
        .then(({ data }: { data: { points: number } | null }) => {
          if (data) setPoints(data.points);
        });
    }
  };

  return (
    <DashboardShell>
      <div className="reading-page">
        {/* Step indicator (compact) */}
        <div className="px-4 pt-4 pb-2">
          <div className="step-indicator justify-center">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const done = i < stepIndex;
              const active = i === stepIndex;
              return (
                <div key={s.key} className="contents">
                  <div className="flex flex-col items-center gap-1.5 min-w-0">
                    <div
                      className={cn("step-dot", done && "done", active && "active")}
                      aria-current={active ? "step" : undefined}
                    >
                      {done ? <Check size={12} /> : <Icon size={12} />}
                    </div>
                    <span
                      className={cn(
                        "step-label",
                        active && "active",
                        done && "done"
                      )}
                    >
                      {s.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className={cn("step-line", done && "done")}
                      style={{ marginBottom: 18 }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step content */}
        {step === "spread" && (
          <div className="step-header">
            <p className="step-eyebrow">{readingStepEyebrow("spread")}</p>
            <h1 className="step-title">เลือกรูปแบบการอ่านไพ่</h1>
            <p className="step-sub">
              แต่ละแบบจะเปิดมุมมองที่ลึกและกว้างต่างกัน
              เริ่มจากแบบที่ใช่สำหรับคำถามของคุณ
            </p>
          </div>
        )}

        {step === "topic" && (
          <div className="step-header">
            <p className="step-eyebrow">{readingStepEyebrow("topic")}</p>
            <h1 className="step-title">เลือกหัวข้อที่อยากให้ไพ่เน้น</h1>
            <p className="step-sub">
              เลือกหัวข้อที่ตรงกับสิ่งที่อยู่ในใจมากที่สุด
              จะได้คำตอบที่ตรงประเด็นและลึกที่สุด
            </p>
          </div>
        )}

        {step === "question" && (
          <div className="step-header">
            <p className="step-eyebrow">{readingStepEyebrow("question")}</p>
            <h1 className="step-title">ตั้งคำถามกับจักรวาล</h1>
            <p className="step-sub">
              ยิ่งคำถามชัดเจน ยิ่งได้คำตอบที่ตรงใจ
              ลองเขียนคำถามจากหัวใจของคุณ
            </p>
          </div>
        )}

        {step === "draw" && (
          <div className="step-header">
            <p className="step-eyebrow">{readingStepEyebrow("draw")}</p>
            <h1 className="step-title">สับไพ่และเลือกไพ่ของคุณ</h1>
            <p className="step-sub">
              ปล่อยใจให้สงบ แล้วเลือกไพ่ที่ดึงดูดคุณที่สุด
            </p>
          </div>
        )}

        {step === "result" && (
          <div className="sr-only" role="status" aria-live="polite">
            กำลังอ่านไพ่ของคุณ
          </div>
        )}

        {step === "spread" && (
          <SpreadSelector
            onSelect={handleSpreadSelect}
            selectedSpread={spreadType}
            userPoints={points}
            costs={costs}
          />
        )}

        {step === "topic" && (
          <div className="animate-in">
            <div className="flex items-center gap-3 px-4 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: "var(--primary-soft)",
                  color: "var(--primary)",
                }}
              >
                <Compass size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[14.5px] font-bold" style={{ color: "var(--text)" }}>
                  {spread.nameTh}
                </div>
                <div className="text-[11.5px]" style={{ color: "var(--text-muted)" }}>
                  {spread.cardCount} ใบ · ใช้{" "}
                  <span style={{ color: "var(--gold)", fontWeight: 700 }}>
                    {costs[spreadType] ?? spread.cost}
                  </span>{" "}
                  แต้ม · คงเหลือ {points.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 px-4 mb-4">
              {(Object.keys(TOPICS) as TopicKey[]).map((t) => {
                const topicData = TOPICS[t];
                const active = topic === t;
                const Icon = topicData.icon;
                return (
                  <button
                    key={t}
                    onClick={() => handleTopicSelect(t)}
                    className={cn(
                      "card p-4 text-left transition-all duration-200",
                      active && "ring-2 ring-[var(--primary)] shadow-md bg-[var(--primary-soft)]",
                      "hover:-translate-y-0.5 hover:border-[var(--primary)] hover:shadow-md cursor-pointer"
                    )}
                    style={{
                      borderColor: active ? "var(--primary)" : topicData.color,
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="w-8 h-8 rounded-lg grid place-items-center flex-shrink-0"
                        style={{
                          background: `${topicData.color}18`,
                          color: topicData.color,
                          border: `1px solid ${topicData.color}30`,
                        }}
                      >
                        <Icon size={16} />
                      </span>
                      <span className="text-[11px] font-bold tracking-widest uppercase text-[var(--text-muted)]">{topicData.label}</span>
                    </div>
                    <h3 className="text-[15px] font-bold text-[var(--text)]">{topicData.label}</h3>
                    <p className="text-[12px] mt-1 leading-relaxed" style={{ color: "var(--text-secondary)" }}>{topicData.desc}</p>
                    {active && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ background: "var(--primary)" }}>
                        <Check size={10} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setStep("spread")}
              className="btn btn-ghost mt-2 mx-4 text-[13px]"
            >
              <ArrowLeft size={14} />
              เลือก Spread ใหม่
            </button>
          </div>
        )}

        {step === "question" && (() => {
          const actualCost = costs[spreadType] ?? spread.cost;
          const insufficient = points < actualCost;
          return (
          <div className="animate-in">
            <div className="flex items-center gap-3 px-4 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: "var(--primary-soft)",
                  color: "var(--primary)",
                }}
              >
                <Sparkles size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[14.5px] font-bold" style={{ color: "var(--text)" }}>
                  {spread.nameTh}
                </div>
                <div className="text-[11.5px]" style={{ color: "var(--text-muted)" }}>
                  {spread.cardCount} ใบ · ใช้{" "}
                  <span style={{ color: insufficient ? "var(--red)" : "var(--gold)", fontWeight: 700 }}>
                    {actualCost}
                  </span>{" "}
                  แต้ม · คงเหลือ {points.toLocaleString()}
                </div>
              </div>
            </div>

            {insufficient && (
              <div className="mx-4 mb-3">
                <InsufficientPoints needed={actualCost} current={points} showTopUp />
              </div>
            )}

            <QuestionInput
              value={question}
              onChange={setQuestion}
              onSubmit={handleQuestionSubmit}
            />

            <div className="flex gap-2 mt-4 mx-4">
              <button
                onClick={() => setStep("topic")}
                className="btn btn-ghost text-[13px]"
              >
                <ArrowLeft size={14} />
                เลือกหัวข้อ
              </button>
              <button
                onClick={() => setStep("spread")}
                className="btn btn-ghost text-[13px]"
              >
                เลือก Spread ใหม่
              </button>
            </div>

            <ConfirmDialog
              open={confirmOpen}
              summary={getConfirmSummary({
                spreadNameTh: spread.nameTh,
                cardCount: spread.cardCount,
                cost: actualCost,
                current: points,
              })}
              confirmLabel={`ยืนยัน เปิดไพ่ (${actualCost} แต้ม)`}
              cancelLabel="กลับไปแก้คำถาม"
              onConfirm={handleConfirmProceed}
              onCancel={handleConfirmCancel}
            />
          </div>
          );
        })()}

        {step === "draw" && drawnCards === null && (
          <CardDraw
            spread={SPREADS[spreadType]}
            onComplete={handleDrawComplete}
          />
        )}

        {step === "result" && drawnCards && (
          <ReadingResult
            cards={drawnCards}
            spreadType={spreadType}
            topic={topic}
            question={question}
            onDone={handleResultDone}
            actualCost={costs[spreadType] ?? SPREADS[spreadType].cost}
            onPointsSpent={(cost) => setPoints((p) => Math.max(0, p - cost))}
          />
        )}
      </div>
    </DashboardShell>
  );
}

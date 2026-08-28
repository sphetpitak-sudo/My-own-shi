"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import DashboardShell from "@/components/DashboardShell";
import SpreadSelector from "@/components/SpreadSelector";
import QuestionInput from "@/components/QuestionInput";
import CardDraw from "@/components/CardDraw";
import ReadingResult from "@/components/ReadingResult";
import { ArrowLeft, Check, Sparkles, Wand2, HelpCircle, BookOpen } from "lucide-react";
import { SPREADS, type SpreadType, type DrawnCard } from "@/lib/cards";
import { useBeforeUnload } from "@/lib/useBeforeUnload";
import { cn } from "@/lib/cn";

const STEPS = [
  { key: "spread", label: "เลือก Spread", icon: Sparkles },
  { key: "question", label: "ถามคำถาม", icon: HelpCircle },
  { key: "draw", label: "จั่วไพ่", icon: Wand2 },
  { key: "result", label: "คำทำนาย", icon: BookOpen },
] as const;

type StepKey = typeof STEPS[number]["key"];

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

  const initialSpread = (searchParams.get("spread") as SpreadType) || "three_card";
  const [step, setStep] = useState<StepKey>("spread");
  const [spreadType, setSpreadType] = useState<SpreadType>(
    ["single", "three_card", "celtic"].includes(initialSpread) ? initialSpread : "three_card"
  );
  const [question, setQuestion] = useState("");
  const [drawnCards, setDrawnCards] = useState<DrawnCard[] | null>(null);

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

      if (initialSpread && ["single", "three_card", "celtic"].includes(initialSpread)) {
        setStep("question");
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
    setStep("question");
  };

  const handleQuestionSubmit = () => {
    if (!question.trim()) return;
    setStep("draw");
  };

  const handleDrawComplete = (cards: DrawnCard[]) => {
    setDrawnCards(cards);
    setStep("result");
  };

  const handleResultDone = () => {
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
            <p className="step-eyebrow">ขั้นตอนที่ 1 / 4</p>
            <h1 className="step-title">เลือกรูปแบบการอ่านไพ่</h1>
            <p className="step-sub">
              แต่ละแบบจะเปิดมุมมองที่ลึกและกว้างต่างกัน
              เริ่มจากแบบที่ใช่สำหรับคำถามของคุณ
            </p>
          </div>
        )}

        {step === "question" && (
          <div className="step-header">
            <p className="step-eyebrow">ขั้นตอนที่ 2 / 4</p>
            <h1 className="step-title">ตั้งคำถามกับจักรวาล</h1>
            <p className="step-sub">
              ยิ่งคำถามชัดเจน ยิ่งได้คำตอบที่ตรงใจ
              ลองเขียนคำถามจากหัวใจของคุณ
            </p>
          </div>
        )}

        {step === "draw" && (
          <div className="step-header">
            <p className="step-eyebrow">ขั้นตอนที่ 3 / 4</p>
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
            selectedSpread={null}
            userPoints={points}
            costs={costs}
          />
        )}

        {step === "question" && (
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
              <div>
                <div className="text-[14.5px] font-bold" style={{ color: "var(--text)" }}>
                  {spread.nameTh}
                </div>
                <div className="text-[11.5px]" style={{ color: "var(--text-muted)" }}>
                  {spread.cardCount} ใบ · ใช้{" "}
                  <span style={{ color: "var(--gold)", fontWeight: 700 }}>
                    {costs[spreadType] ?? spread.cost}
                  </span>{" "}
                  แต้ม
                </div>
              </div>
            </div>

            <QuestionInput
              value={question}
              onChange={setQuestion}
              onSubmit={handleQuestionSubmit}
            />

            <button
              onClick={() => setStep("spread")}
              className="btn btn-ghost mt-4 mx-4 text-[13px]"
            >
              <ArrowLeft size={14} />
              เลือก Spread ใหม่
            </button>
          </div>
        )}

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
            question={question}
            onDone={handleResultDone}
            onPointsSpent={(cost) => setPoints((p) => Math.max(0, p - cost))}
          />
        )}
      </div>
    </DashboardShell>
  );
}

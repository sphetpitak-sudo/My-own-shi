"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import DashboardShell from "@/components/DashboardShell";
import SpreadSelector from "@/components/SpreadSelector";
import QuestionInput from "@/components/QuestionInput";
import CardDraw from "@/components/CardDraw";
import ReadingResult from "@/components/ReadingResult";
import { ArrowLeft, Check } from "lucide-react";
import { SPREADS, type SpreadType, type DrawnCard } from "@/lib/cards";
import { useBeforeUnload } from "@/lib/useBeforeUnload";
import { cn } from "@/lib/cn";

const STEPS = [
  { key: "spread", label: "เลือก Spread" },
  { key: "question", label: "ถามคำถาม" },
  { key: "draw", label: "จั่วไพ่" },
  { key: "result", label: "คำทำนาย" },
] as const;

type StepKey = typeof STEPS[number]["key"];

export default function ReadingPage() {
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  const [step, setStep] = useState<StepKey>("spread");
  const [spreadType, setSpreadType] = useState<SpreadType>("single");
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
      setLoading(false);
    };
    init();
  }, [router]);

  useBeforeUnload(
    step === "draw" || step === "result",
    "คุณกำลังอ่านไพ่อยู่ หากออกจะสูญเสียแต้ม"
  );

  if (loading) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center" style={{ minHeight: "50vh" }}>
          <div className="flex flex-col items-center gap-3">
            <div
              className="w-8 h-8 border-2 rounded-full animate-spin"
              style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }}
            />
            <p className="text-[13px] font-medium" style={{ color: "var(--text-muted)" }}>
              กำลังโหลด...
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
      supabase.from("profiles").select("points").eq("id", userId).single().then(({ data }: { data: { points: number } | null }) => {
        if (data) setPoints(data.points);
      });
    }
  };

  return (
    <DashboardShell>
      <div className="p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          {/* Visual step indicator */}
          <div className="mb-10">
            <div className="step-indicator justify-center">
              {STEPS.map((s, i) => (
                <div key={s.key} className="contents">
                  <div className="flex flex-col items-center gap-1.5">
                    <div
                      className={cn(
                        "step-dot",
                        i < stepIndex && "done",
                        i === stepIndex && "active"
                      )}
                    >
                      {i < stepIndex ? <Check size={14} /> : i + 1}
                    </div>
                    <span
                      className={cn(
                        "step-label",
                        i === stepIndex && "active",
                        i < stepIndex && "done"
                      )}
                    >
                      {s.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={cn("step-line", i < stepIndex && "done")} style={{ marginBottom: 18 }} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          {step === "spread" && (
            <SpreadSelector
              onSelect={handleSpreadSelect}
              selectedSpread={null}
              userPoints={points}
            />
          )}

          {step === "question" && (
            <div className="card p-6 sm:p-8 animate-in">
              <h2
                className="text-xl font-bold mb-2"
                style={{ color: "var(--text)", letterSpacing: "-0.01em" }}
              >
                {spread.nameTh}
              </h2>
              <p className="text-[13px] mb-6" style={{ color: "var(--text-muted)" }}>
                {spread.descriptionTh} — {spread.cardCount} ใบ ใช้ {spread.cost} แต้ม
              </p>
              <QuestionInput
                value={question}
                onChange={setQuestion}
                onSubmit={handleQuestionSubmit}
              />
              <button
                onClick={() => setStep("spread")}
                className="btn btn-ghost mt-4 text-[13px]"
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
            />
          )}
        </div>
      </div>
    </DashboardShell>
  );
}

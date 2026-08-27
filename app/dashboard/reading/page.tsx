"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import DashboardShell from "@/components/DashboardShell";
import SpreadSelector from "@/components/SpreadSelector";
import QuestionInput from "@/components/QuestionInput";
import CardDraw from "@/components/CardDraw";
import ReadingResult from "@/components/ReadingResult";
import PointsBalance from "@/components/PointsBalance";
import DailyBonus from "@/components/DailyBonus";
import { Sparkles, ArrowLeft, Loader2 } from "lucide-react";
import type { SpreadType } from "@/lib/types";
import { SPREADS, type Spread } from "@/lib/cards";

export default function ReadingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [userId, setUserId] = useState<string | null>(null);
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  // Reading flow state
  const [step, setStep] = useState<"spread" | "question" | "draw" | "result">("spread");
  const [spreadType, setSpreadType] = useState<"single" | "three_card" | "celtic">("single");
  const [question, setQuestion] = useState("");
  const [drawnCards, setDrawnCards] = useState<{ card: any; position: string; positionTh: string; reversed: boolean }[] | null>(null);

  // Fetch user
  useEffect(() => {
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
  }, [supabase, router]);

  if (loading) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border-3 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
            <span className="text-[var(--muted)]">กำลังโหลด...</span>
          </div>
        </div>
      </DashboardShell>
    );
  }

  const spreadInfo = SPREADS[spreadType];

  const handleSpreadSelect = (type: SpreadType) => {
    setSpreadType(type);
    setStep("question");
  };

  const handleQuestionSubmit = () => {
    if (!question.trim()) return;
    setStep("draw");
  };

  const handleDrawComplete = (cards: any[]) => {
    // Convert CardDraw DrawnCard (position: SpreadPosition) to ReadingResult format
    const converted = cards.map((c) => ({
      card: c.card,
      position: c.position.label,
      positionTh: c.position.labelTh,
      reversed: c.reversed,
    }));
    setDrawnCards(converted);
    setStep("result");
  };

  const handleResultDone = () => {
    setDrawnCards(null);
    setQuestion("");
    setStep("spread");
    // Refresh points
    if (userId) {
      supabase.from("profiles").select("points").eq("id", userId).single().then(({ data }: { data: { points: number } | null }) => {
        if (data) setPoints(data.points);
      });
    }
  };

  return (
    <DashboardShell>
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          {/* Top bar with points */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-[var(--text)]">เปิดไพ่ทำนาย</h1>
            <PointsBalance points={points} />
          </div>

          {/* Daily bonus */}
          {userId && <DailyBonus userId={userId} onClaim={(amt) => setPoints(p => p + amt)} />}

          {/* Step indicator */}
          <div className="mb-6 flex gap-2 text-sm text-[var(--muted)]">
            <span className={step === "spread" ? "text-[var(--primary)] font-medium" : ""}>1. เลือกการกระจาย</span>
            <span className="hidden sm:inline">→</span>
            <span className={step === "question" ? "text-[var(--primary)] font-medium" : ""}>2. ถามคำถาม</span>
            <span className="hidden sm:inline">→</span>
            <span className={step === "draw" ? "text-[var(--primary)] font-medium" : ""}>3. จั่วไพ่</span>
            <span className="hidden sm:inline">→</span>
            <span className={step === "result" ? "text-[var(--primary)] font-medium" : ""}>4. คำทำนาย</span>
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
            <div className="card p-6">
              <h2 className="text-xl font-bold text-[var(--text)] mb-4">
                {spreadInfo?.nameTh} ({spreadInfo?.name})
              </h2>
              <p className="text-[var(--muted)] mb-6">
                {spreadInfo?.descriptionTh} — {spreadInfo?.cardCount} ใบ ใช้ {spreadInfo?.cost} พอยต์
              </p>
              <QuestionInput
                value={question}
                onChange={setQuestion}
                onSubmit={handleQuestionSubmit}
              />
              <button
                onClick={() => setStep("spread")}
                className="mt-4 btn bg-[var(--bg)] text-[var(--text)] border border-[var(--border)]"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                เลือกการกระจายใหม่
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
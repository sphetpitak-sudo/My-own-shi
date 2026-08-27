"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import DashboardShell from "@/components/DashboardShell";
import SpreadSelector from "@/components/SpreadSelector";
import QuestionInput from "@/components/QuestionInput";
import CardDraw from "@/components/CardDraw";
import ReadingResult from "@/components/ReadingResult";
import { ArrowLeft } from "lucide-react";
import { SPREADS, type SpreadType, type DrawnCard } from "@/lib/cards";
import { useBeforeUnload } from "@/lib/useBeforeUnload";

export default function ReadingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [userId, setUserId] = useState<string | null>(null);
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  const [step, setStep] = useState<"spread" | "question" | "draw" | "result">("spread");
  const [spreadType, setSpreadType] = useState<SpreadType>("single");
  const [question, setQuestion] = useState("");
  const [drawnCards, setDrawnCards] = useState<DrawnCard[] | null>(null);

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

  // Warn before leaving during active reading
  useBeforeUnload(
    step === "draw" || step === "result",
    "คุณกำลังอ่านไพ่อยู่ หากออกจะสูญเสียแต้ม"
  );

  if (loading) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center" style={{ minHeight: "50vh" }}>
          <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
        </div>
      </DashboardShell>
    );
  }

  const spread = SPREADS[spreadType];

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
      supabase.from("profiles").select("points").eq("id", userId).single().then(({ data }: { data: { points: number } | null }) => {
        if (data) setPoints(data.points);
      });
    }
  };

  return (
    <DashboardShell>
      <div className="p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          {/* Step indicator */}
          <div className="mb-6 flex gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
            <span style={step === "spread" ? { color: "var(--primary)", fontWeight: 600 } : {}}>1. เลือกSpread</span>
            <span className="hidden sm:inline">→</span>
            <span style={step === "question" ? { color: "var(--primary)", fontWeight: 600 } : {}}>2. ถามคำถาม</span>
            <span className="hidden sm:inline">→</span>
            <span style={step === "draw" ? { color: "var(--primary)", fontWeight: 600 } : {}}>3. จั่วไพ่</span>
            <span className="hidden sm:inline">→</span>
            <span style={step === "result" ? { color: "var(--primary)", fontWeight: 600 } : {}}>4. คำทำนาย</span>
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
              <h2 className="text-xl font-bold mb-4" style={{ color: "var(--text)" }}>
                {spread.nameTh} ({spread.name})
              </h2>
              <p className="mb-6" style={{ color: "var(--text-muted)" }}>
                {spread.descriptionTh} — {spread.cardCount} ใบ ใช้ {spread.cost} แต้ม
              </p>
              <QuestionInput
                value={question}
                onChange={setQuestion}
                onSubmit={handleQuestionSubmit}
              />
              <button
                onClick={() => setStep("spread")}
                className="btn btn-ghost mt-4"
              >
                <ArrowLeft size={14} />
                เลือกSpreadใหม่
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

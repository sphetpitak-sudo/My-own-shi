"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import DashboardShell from "@/components/DashboardShell";
import { drawCards, type DrawnCard } from "@/lib/cards";
import TarotCard from "@/components/TarotCard";
import { CircleHelp, Sparkles, ArrowLeft, RefreshCw, Coins, AlertTriangle } from "lucide-react";

type Phase = "question" | "shuffle" | "result";

export default function YesNoPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("question");
  const [question, setQuestion] = useState("");
  const [points, setPoints] = useState(0);
  const [costs, setCosts] = useState<Record<string, number>>({});
  const [drawnCard, setDrawnCard] = useState<DrawnCard | null>(null);
  const [answer, setAnswer] = useState<"yes" | "no" | "maybe" | null>(null);
  const [interpretation, setInterpretation] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);
  const textRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }: { data: { user: { id: string } | null } }) => {
      if (!data.user) {
        router.push("/");
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("points")
        .eq("id", data.user.id)
        .single();
      if (profile) setPoints(profile.points);

      const { data: costRow } = await supabase
        .from("admin_settings")
        .select("value")
        .in("key", ["reading_costs", "yes_no_cost"]);
      if (costRow) {
        // We re-use "single" spread cost for yes/no
        const yn = costRow.find((r: { key: string }) => r.key === "yes_no_cost");
        if (yn?.value && typeof yn.value === "object" && "amount" in yn.value) {
          setCosts({ yesno: (yn.value as { amount: number }).amount });
        } else {
          const rc = costRow.find((r: { key: string }) => r.key === "reading_costs");
          if (rc?.value && typeof rc.value === "object") {
            setCosts(rc.value as Record<string, number>);
          }
        }
      }
    });
  }, [router]);

  const cost = costs["yesno"] ?? costs["single"] ?? 3;

  const performReading = useCallback(async () => {
    setError("");
    setSubmitting(true);
    setAnswer(null);
    setInterpretation("");

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("กรุณาเข้าสู่ระบบ");
        setSubmitting(false);
        return;
      }

      // Draw a single card
      const drawn = drawCards({
        id: "single",
        name: "Single",
        nameTh: "ไพ่ใบเดียว",
        cardCount: 1,
        cost,
        description: "",
        descriptionTh: "",
        positions: [{ label: "Answer", labelTh: "คำตอบ", x: 50, y: 50 }],
      });
      setDrawnCard(drawn[0]!);

      // Compute deterministic answer from card
      const seed = (drawn[0]!.card.id * 13 + (drawn[0]!.reversed ? 7 : 3)) % 100;
      let next: "yes" | "no" | "maybe";
      if (seed < 45) next = "yes";
      else if (seed < 80) next = "no";
      else next = "maybe";

      if (aiEnabled) {
        // Server-side charge + recording via /api/reading (single spend)
        const res = await fetch("/api/reading", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: `[ถามใช่/ไม่] ${question} (คำตอบ: ${next})`,
            spreadType: "single",
            cards: [
              { cardId: drawn[0]!.card.id, positionLabel: "คำตอบ", reversed: drawn[0]!.reversed },
            ],
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          if (data.error === "Not enough points") {
            setError(`คะแนนไม่พอ (ต้องการ ${data.needed ?? cost})`);
          } else if (data.error === "Unauthorized") {
            setError("กรุณาเข้าสู่ระบบใหม่");
          } else if (res.status === 429) {
            setError("ทำนายถี่เกินไป กรุณารอสักครู่แล้วลองใหม่");
          } else {
            setError("ไม่สามารถทำนายได้ กรุณาลองใหม่");
          }
          setSubmitting(false);
          return;
        }

        // Charge succeeded — reveal the answer and stream interpretation
        setAnswer(next);
        setPoints((p) => Math.max(0, p - cost));
        setPhase("result");

        if (!res.body) {
          setSubmitting(false);
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") break;
              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  setInterpretation((prev) => prev + parsed.content);
                }
              } catch {
                // ignore malformed chunk
              }
            }
          }
        }
        setSubmitting(false);
      } else {
        // Non-AI path: single atomic spend (RPC also writes the ledger)
        const { data: spent, error: spendErr } = await supabase.rpc("spend_points", {
          p_user_id: user.id,
          p_amount: cost,
          p_description: "single reading (yes/no)",
        });
        if (spendErr) {
          setError("ไม่สามารถดำเนินการได้");
          setSubmitting(false);
          return;
        }
        if (!spent) {
          setError(`คะแนนไม่พอ (ต้องการ ${cost})`);
          setSubmitting(false);
          return;
        }

        setAnswer(next);
        setPoints((p) => Math.max(0, p - cost));
        setPhase("result");
        setSubmitting(false);
      }
    } catch {
      setError("เกิดข้อผิดพลาด");
      setSubmitting(false);
    }
  }, [aiEnabled, cost, question]);

  const handleStart = () => {
    if (!question.trim() || submitting) return;
    setSubmitting(true);
    setPhase("shuffle");
    setTimeout(() => {
      performReading();
    }, 1800);
  };

  const handleReset = () => {
    setPhase("question");
    setQuestion("");
    setDrawnCard(null);
    setAnswer(null);
    setInterpretation("");
    setError("");
    setSubmitting(false);
  };

  useEffect(() => {
    if (textRef.current) {
      textRef.current.scrollTop = textRef.current.scrollHeight;
    }
  }, [interpretation]);

  return (
    <DashboardShell>
      <div className="reading-page">
        <div className="step-header">
          <p className="step-eyebrow">เครื่องมือถามด่วน</p>
          <h1 className="step-title">ถามใช่หรือไม่</h1>
          <p className="step-sub">
            ตั้งคำถามง่าย ๆ แล้วให้ไพ่ช่วยตอบ — เร็วและตรงไปตรงมา
            <br />
            ไม่มีคำตอบที่ถูกต้อง 100% — ใช้เป็นแนวทาง ไม่ใช่คำตัดสิน
          </p>
        </div>

        {/* Cost badge */}
        <div className="px-4 mb-4 flex items-center justify-center gap-2">
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12.5px] font-bold"
            style={{
              background: "var(--gold-soft)",
              color: "var(--gold)",
              border: "1px solid rgba(212, 175, 55, 0.18)",
            }}
          >
            <Coins size={12} />
            {cost} แต้ม
          </div>
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12.5px] font-semibold"
            style={{
              background: "var(--bg-card)",
              color: "var(--text-muted)",
              border: "1px solid var(--border)",
            }}
          >
            คงเหลือ {points.toLocaleString()} แต้ม
          </div>
        </div>

        {phase === "question" && (
          <div className="animate-in">
            <div className="q-card">
              <label
                className="label flex items-center gap-2"
                style={{ color: "var(--text-secondary)" }}
                htmlFor="yn-q"
              >
                <CircleHelp size={14} style={{ color: "var(--primary)" }} />
                คำถามของคุณ
              </label>
              <textarea
                id="yn-q"
                value={question}
                onChange={(e) => setQuestion(e.target.value.slice(0, 200))}
                placeholder="เช่น ควรคุยกับเขาไหมตอนนี้?"
                rows={3}
                className="q-textarea"
                maxLength={200}
                style={{ minHeight: 80 }}
              />
              <div className="flex items-center justify-between">
                <span className="q-counter">{question.length}/200</span>
                <button
                  onClick={handleStart}
                  disabled={!question.trim() || points < cost}
                  className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-[13.5px] rounded-xl"
                  style={
                    !question.trim() || points < cost
                      ? { opacity: 0.45, cursor: "not-allowed" }
                      : undefined
                  }
                >
                  <Sparkles size={14} /> เปิดไพ่
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 mt-3 mx-4 text-[12px] cursor-pointer select-none"
              style={{ color: "var(--text-muted)" }}
            >
              <input
                type="checkbox"
                checked={aiEnabled}
                onChange={(e) => setAiEnabled(e.target.checked)}
                className="rounded"
              />
              ขอคำอธิบายเพิ่มเติมจาก AI
            </label>

            {points < cost && (
              <div
                className="mx-4 mt-3 p-3 rounded-xl text-[12.5px] font-medium flex items-center gap-2"
                style={{ background: "var(--red-soft)", color: "var(--red)" }}
              >
                <AlertTriangle size={14} /> คะแนนไม่พอ
              </div>
            )}
          </div>
        )}

        {phase === "shuffle" && (
          <div className="shuffle-stage">
            <div className="shuffle-stage-glow" />
            <div className="shuffle-deck-wrap" style={{ transform: "translateY(-4px)" }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="shuffle-deck-card"
                  style={{
                    zIndex: 6 - i,
                    transform: `translateY(${-i * 2}px) rotate(${(i % 2 === 0 ? 1 : -1) * 1.5}deg)`,
                    animation: `shuffleArc1 1.6s ${i * 0.06}s ease both`,
                  }}
                />
              ))}
            </div>
            <div className="shuffle-status">
              <div className="shuffle-status-title">กำลังสับไพ่</div>
              <div className="mystical-loader" style={{ marginTop: 10 }}>
                <div className="mystical-loader-dot" />
                <div className="mystical-loader-dot" />
                <div className="mystical-loader-dot" />
              </div>
            </div>
          </div>
        )}

        {phase === "result" && drawnCard && (
          <div className="reading-result animate-in">
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 mx-4 mb-3 text-[13px] font-semibold"
              style={{ color: "var(--text-secondary)" }}
            >
              <ArrowLeft size={14} /> ถามใหม่
            </button>

            {/* Big answer */}
            <div
              className="mx-4 mb-4 p-6 rounded-2xl text-center"
              style={{
                background: "var(--bg-card)",
                border: `1px solid ${
                  answer === "yes"
                    ? "rgba(45, 122, 79, 0.25)"
                    : answer === "no"
                      ? "rgba(194, 65, 48, 0.25)"
                      : "var(--border)"
                }`,
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <div
                className="text-[10.5px] font-bold uppercase tracking-[0.12em] mb-1.5"
                style={{
                  color:
                    answer === "yes"
                      ? "var(--green)"
                      : answer === "no"
                        ? "var(--red)"
                        : "var(--text-muted)",
                }}
              >
                ไพ่ตอบว่า
              </div>
              <div
                className="text-[36px] font-extrabold leading-none"
                style={{
                  letterSpacing: "-0.04em",
                  color:
                    answer === "yes"
                      ? "var(--green)"
                      : answer === "no"
                        ? "var(--red)"
                        : "var(--text)",
                }}
              >
                {answer === "yes" ? "ใช่" : answer === "no" ? "ไม่ใช่" : "ยังไม่แน่ใจ"}
              </div>
              <div className="text-[12.5px] mt-2" style={{ color: "var(--text-secondary)" }}>
                ไพ่ {drawnCard.card.nameTh}
                {drawnCard.reversed ? " (กลับหัว)" : ""}
              </div>
            </div>

            <div className="flex justify-center mb-4">
              <TarotCard
                card={drawnCard.card}
                reversed={drawnCard.reversed}
                flipped
                size="lg"
              />
            </div>

            {aiEnabled && interpretation && (
              <div className="reading-section-card">
                <div className="reading-section-title">คำอธิบาย</div>
                <div
                  ref={textRef}
                  className="reading-section-text"
                  aria-live="polite"
                >
                  {interpretation}
                  {submitting && <span className="reading-streaming" />}
                </div>
              </div>
            )}

            {aiEnabled && !interpretation && submitting && (
              <div className="reading-section-card">
                <div className="reading-empty-stream">
                  <div className="mystical-loader">
                    <div className="mystical-loader-dot" />
                    <div className="mystical-loader-dot" />
                    <div className="mystical-loader-dot" />
                  </div>
                  <span className="text-[12.5px] font-semibold" style={{ color: "var(--text-muted)" }}>
                    กำลังอ่านไพ่...
                  </span>
                </div>
              </div>
            )}

            {error && (
              <div className="reading-section-card" style={{ background: "var(--red-soft)", color: "var(--red)" }}>
                {error}
              </div>
            )}

            <div className="px-4 mt-3 mb-2 flex gap-2 justify-center">
              <button onClick={handleReset} className="btn btn-primary rounded-xl">
                <RefreshCw size={14} /> ถามอีกครั้ง
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

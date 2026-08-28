"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import DashboardShell from "@/components/DashboardShell";
import ShuffleAnimation from "@/components/ShuffleAnimation";
import OracleCard from "@/components/OracleCard";
import { Sparkles, Coins, ArrowLeft, RefreshCw, CircleHelp } from "lucide-react";
import { ORACLE_SPREADS, drawOracleCards, type OracleCard as OracleCardType, type OracleSpreadId } from "@/lib/oracle";
import { cn } from "@/lib/cn";

type Phase = "setup" | "shuffle" | "reveal";

export default function OraclePage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<Phase>("setup");
  const [spreadId, setSpreadId] = useState<OracleSpreadId>("single");
  const [question, setQuestion] = useState("");
  const [aiEnabled, setAiEnabled] = useState(true);
  const [cards, setCards] = useState<OracleCardType[]>([]);
  const [revealed, setRevealed] = useState(0);
  const [error, setError] = useState("");
  const [spent, setSpent] = useState(false);
  const [interpretation, setInterpretation] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const startedRef = useRef(false);
  const textRef = useRef<HTMLDivElement | null>(null);

  const spread = ORACLE_SPREADS.find((s) => s.id === spreadId)!;

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }: { data: { user: { id: string } | null } }) => {
      if (!data.user) {
        router.push("/");
        return;
      }
      setUserId(data.user.id);
      const { data: profile } = await supabase
        .from("profiles")
        .select("points")
        .eq("id", data.user.id)
        .single();
      if (profile) setPoints(profile.points);
      setLoading(false);
    });
  }, [router]);

  useEffect(() => {
    if (textRef.current) {
      textRef.current.scrollTop = textRef.current.scrollHeight;
    }
  }, [interpretation]);

  const handleStart = async () => {
    if (!userId) return;
    setError("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Atomic spend — writes ledger, self-only, race-safe
    const { data: spentOk, error: spendErr } = await supabase.rpc("spend_points", {
      p_user_id: user.id,
      p_amount: spread.cost,
      p_description: `oracle:${spreadId}`,
    });

    if (spendErr) {
      setError("ไม่สามารถดำเนินการได้ กรุณาลองใหม่");
      return;
    }
    if (!spentOk) {
      setError(`คะแนนไม่พอ (ต้องการ ${spread.cost})`);
      return;
    }

    setPoints((p) => Math.max(0, p - spread.cost));
    setSpent(true);
    setCards(drawOracleCards(spread.count));
    setRevealed(0);
    setInterpretation("");
    setPhase("shuffle");
  };

  const handleShuffleComplete = useCallback(() => {
    setPhase("reveal");
  }, []);

  // Reveal cards one by one, then optionally trigger AI
  const fetchInterpretation = async () => {
    setAiLoading(true);
    setError("");
    try {
      const res = await fetch("/api/oracle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          cards: cards.map((c) => ({ id: c.id })),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 403) {
          setError("กรุณาเปิดไพ่ออราเคิลก่อน");
        } else if (res.status === 429) {
          setError("ทำนายถี่เกินไป กรุณารอสักครู่");
        } else {
          setError(data.error || "ไม่สามารถอ่านคำอธิบายได้");
        }
        setAiLoading(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        setAiLoading(false);
        return;
      }

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
              // ignore
            }
          }
        }
      }
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    }
    setAiLoading(false);
  };

  useEffect(() => {
    if (phase !== "reveal") return;
    if (revealed < cards.length) {
      const t = setTimeout(() => setRevealed((r) => r + 1), 450);
      return () => clearTimeout(t);
    }
    // All cards revealed
    if (aiEnabled && !startedRef.current && cards.length > 0) {
      startedRef.current = true;
      fetchInterpretation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, revealed, cards.length]);

  const handleReset = () => {
    setPhase("setup");
    setCards([]);
    setRevealed(0);
    setInterpretation("");
    setError("");
    setSpent(false);
    startedRef.current = false;
  };

  if (loading) {
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

  return (
    <DashboardShell>
      <div className="reading-page">
        <div className="step-header">
          <p className="step-eyebrow">ไพ่ลางสังหรณ์ · Oracle</p>
          <h1 className="step-title">ข้อความจากจักรวาล</h1>
          <p className="step-sub">
            ไพ่ออราเคิลให้ข้อความสั้นกระชับ เน้นความรู้สึกและสัญชาตญาณ
            <br />
            เปิดใจรับ แล้วฟังเสียงข้างในของคุณ
          </p>
        </div>

        {phase === "setup" && (
          <div className="animate-in">
            {/* Cost + points */}
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
                {spread.cost} แต้ม
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

            {/* Spread selection */}
            <div className="px-4 mb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ORACLE_SPREADS.map((s) => {
                  const active = spreadId === s.id;
                  const insufficient = points < s.cost;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSpreadId(s.id)}
                      disabled={insufficient}
                      className={cn(
                        "spread-option",
                        active && "selected",
                        insufficient && "disabled"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="spread-option-title">{s.nameTh}</span>
                        <span className="spread-option-cost">
                          <Coins size={11} /> {s.cost}
                        </span>
                      </div>
                      <div className="spread-option-desc">{s.descTh}</div>
                      <div className="spread-option-bottom">
                        <span>{s.count} ใบ</span>
                        <span style={{ color: insufficient ? "var(--red)" : "var(--text-muted)" }}>
                          {insufficient ? "คะแนนไม่พอ" : s.nameEn}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Question */}
            <div className="q-card mb-3">
              <label className="label flex items-center gap-1.5" htmlFor="oracle-q">
                <CircleHelp size={13} style={{ color: "var(--primary)" }} />
                คำถามของคุณ (ไม่บังคับ)
              </label>
              <textarea
                id="oracle-q"
                value={question}
                onChange={(e) => setQuestion(e.target.value.slice(0, 200))}
                placeholder="เช่น วันนี้ฉันควรโฟกัสอะไรดี?"
                rows={2}
                maxLength={200}
                className="q-textarea"
                style={{ minHeight: 64 }}
              />
            </div>

            {/* AI toggle */}
            <label
              className="flex items-center gap-2 mt-1 mx-4 text-[12px] cursor-pointer select-none"
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

            {error && (
              <div
                className="mx-4 mt-3 p-3 rounded-xl text-[12.5px] font-medium"
                style={{ background: "var(--red-soft)", color: "var(--red)" }}
              >
                {error}
              </div>
            )}

            <div className="px-4 mt-4">
              <button
                onClick={handleStart}
                className="w-full btn-primary inline-flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[14px] font-bold"
                style={{
                  background: "linear-gradient(135deg, #d4af37, #b8942a)",
                  color: "#1a0a2e",
                  boxShadow: "0 6px 20px rgba(212, 175, 55, 0.3), inset 0 1px 0 rgba(255,255,255,0.25)",
                }}
              >
                <Sparkles size={15} />
                เปิดไพ่ออราเคิล
              </button>
            </div>
          </div>
        )}

        {phase === "shuffle" && (
          <ShuffleAnimation onComplete={handleShuffleComplete} />
        )}

        {phase === "reveal" && cards.length > 0 && (
          <div className="animate-in">
            <div className="text-center mb-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--primary)" }}>
                ไพ่ของคุณ
              </p>
              {revealed < cards.length && (
                <p className="text-[12px] mt-1" style={{ color: "var(--text-muted)" }}>
                  กำลังเปิดไพ่... {revealed}/{cards.length}
                </p>
              )}
            </div>

            <div className="oracle-grid">
              {cards.map((c, i) => {
                const isFlipped = i < revealed;
                return (
                  <div key={c.id} className="oracle-slot" style={{ animation: `fadeUp 0.5s var(--ease) ${i * 0.1}s both` }}>
                    <OracleCard card={c} flipped={isFlipped} size={spread.count === 3 ? "sm" : "lg"} />
                    <div className="text-center" style={{ opacity: isFlipped ? 1 : 0, transition: "opacity 0.3s var(--ease)" }}>
                      <div className="oracle-slot-name">{c.nameTh}</div>
                      <div className="oracle-slot-keyword">{c.keywordTh}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Messages for revealed cards */}
            {cards.slice(0, revealed).map((c, i) => (
              <div key={c.id} className="oracle-message-card" style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="oracle-message-name">{c.nameTh} · {c.keywordTh}</div>
                <p className="oracle-message-text">{c.messageTh}</p>
                <div className="oracle-affirmation">{c.affirmationTh}</div>
              </div>
            ))}

            {/* AI interpretation */}
            {revealed === cards.length && aiEnabled && (interpretation || aiLoading) && (
              <div className="reading-section-card">
                <div className="reading-section-title">เสียงจากจักรวาล</div>
                <div
                  ref={textRef}
                  className="reading-section-text"
                  aria-live="polite"
                  style={{ minHeight: aiLoading && !interpretation ? 60 : undefined }}
                >
                  {interpretation}
                  {aiLoading && !interpretation && (
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
                  )}
                  {aiLoading && interpretation && <span className="reading-streaming" />}
                </div>
              </div>
            )}

            {revealed === cards.length && aiEnabled && error && (
              <div className="reading-section-card" style={{ background: "var(--red-soft)", color: "var(--red)" }}>
                <div className="text-[13px] font-medium">{error}</div>
                <button
                  onClick={() => { startedRef.current = false; fetchInterpretation(); }}
                  className="btn btn-ghost mt-3 text-[12.5px]"
                >
                  <RefreshCw size={13} /> ลองใหม่
                </button>
              </div>
            )}

            {/* Restart */}
            {revealed === cards.length && !aiLoading && (
              <div className="px-4 mt-4 mb-2 flex gap-2 justify-center">
                <button onClick={handleReset} className="btn btn-ghost rounded-xl">
                  <ArrowLeft size={14} /> เปิดไพ่อีกครั้ง
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

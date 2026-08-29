"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import DashboardShell from "@/components/DashboardShell";
import ShuffleAnimation from "@/components/ShuffleAnimation";
import TarotCard from "@/components/TarotCard";
import { Sparkles, Coins, ArrowLeft, RefreshCw, CircleHelp } from "lucide-react";
import { ORACLE_SPREADS, type OracleSpreadId } from "@/lib/oracle";
import { SPREADS, drawCards, type DrawnCard } from "@/lib/cards";
import { cn } from "@/lib/cn";
import { stripMarkdownMultiline } from "@/lib/text";

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
  const [cards, setCards] = useState<DrawnCard[]>([]);
  const [revealed, setRevealed] = useState(0);
  const [error, setError] = useState("");
  const [interpretation, setInterpretation] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const startedRef = useRef(false);
  const textRef = useRef<HTMLDivElement | null>(null);
  const readingIdRef = useRef<string | null>(null);
  const lastCostRef = useRef<number | null>(null);

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

    // Atomic spend — authoritative cost via spend_for_spread
    const oracleSpreadKey = spreadId === "single" ? "oracle_single" : "oracle_three";
    const { data: charged, error: spendErr } = await supabase.rpc("spend_for_spread", {
      p_spread: oracleSpreadKey,
      p_description: `oracle:${spreadId}`,
    });

    if (spendErr) {
      setError("ไม่สามารถดำเนินการได้ กรุณาลองใหม่");
      return;
    }
    if (!charged || charged === 0) {
      setError(`คะแนนไม่พอ (ต้องการ ${spread.cost})`);
      return;
    }
    const actualCost = charged as number;
    lastCostRef.current = actualCost;

    setPoints((p) => Math.max(0, p - actualCost));
    // Oracle now uses the Tarot deck (78 Rider-Waite) - draw real tarot cards
    const tarotSpread = spread.count === 1 ? SPREADS.single : SPREADS.three_card;
    const drawnCards = drawCards(tarotSpread);
    setCards(drawnCards);
    setRevealed(0);
    setInterpretation("");
    setPhase("shuffle");

    // Save to history immediately (interpretation is filled in when AI completes)
    const { data: inserted } = await supabase
      .from("readings")
      .insert({
        user_id: user.id,
        spread_type: "oracle",
        cards: drawnCards.map((c) => ({
          cardId: c.card.id,
          positionLabel: c.position.labelTh,
          reversed: c.reversed,
        })),
        question,
        interpretation: "",
        points_spent: actualCost,
      })
      .select("id")
      .single();
    readingIdRef.current = inserted?.id ?? null;
  };

  const handleShuffleComplete = useCallback(() => {
    setPhase("reveal");
  }, []);

  // Reveal cards one by one, then optionally trigger AI
  const fetchInterpretation = async () => {
    setAiLoading(true);
    setError("");
    let fullText = "";
    const abortController = new AbortController();
    const clientTimeout = setTimeout(() => {
      try {
        abortController.abort();
      } catch {}
    }, 40000);
    const attemptRefund = async () => {
      const supabase = createClient();
      const rid = readingIdRef.current;
      const cost = lastCostRef.current ?? (cards.length === 1 ? 5 : 15);
      try {
        if (rid) {
          const { error } = await supabase.rpc("refund_by_reading", { p_reading_id: rid });
          if (!error) {
            setPoints((p) => p + cost);
            lastCostRef.current = null;
            try {
              await supabase.from("readings").delete().eq("id", rid);
            } catch {}
            readingIdRef.current = null;
            return true;
          }
        }
      } catch {}
      // Fallback: amount-based refund (requires recent purchase)
      try {
        const { data: userRes } = await supabase.auth.getUser();
        const uid = userRes.user?.id;
        if (uid && cost) {
          const { error } = await supabase.rpc("refund_points", { p_user_id: uid, p_amount: cost });
          if (!error) {
            setPoints((p) => p + cost);
            lastCostRef.current = null;
            if (rid) {
              try {
                await supabase.from("readings").delete().eq("id", rid);
              } catch {}
              readingIdRef.current = null;
            }
            return true;
          }
        }
      } catch {}
      return false;
    };
    try {
      const res = await fetch("/api/oracle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          cards: cards.map((c) => ({ cardId: c.card.id, reversed: c.reversed })),
        }),
        signal: abortController.signal,
      });

      if (!res.ok) {
        clearTimeout(clientTimeout);
        const data = await res.json().catch(() => ({}));
        if (res.status === 403) {
          setError("กรุณาเปิดไพ่ออราเคิลก่อน");
        } else if (res.status === 429) {
          setError("ทำนายถี่เกินไป กรุณารอสักครู่");
        } else if (res.status === 504 || data.error?.includes("ไม่ตอบสนอง")) {
          setError(data.error || "AI ไม่ตอบสนอง กรุณาลองใหม่ — แต้มคืนแล้ว");
          await attemptRefund();
        } else {
          setError(data.error || "ไม่สามารถอ่านคำอธิบายได้");
          // For 502/503, refund as points were spent before AI
          if (res.status === 502 || res.status === 503 || res.status === 500) {
            await attemptRefund();
          }
        }
        setAiLoading(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        clearTimeout(clientTimeout);
        setError("ไม่สามารถอ่านคำตอบได้");
        await attemptRefund();
        setAiLoading(false);
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";
      let hasErrorChunk = false;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const rawLine of lines) {
          const line = rawLine.replace(/\r$/, "");
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") break;
            try {
              const parsed = JSON.parse(data);
              if (parsed.error) {
                hasErrorChunk = true;
                setError(parsed.error);
                break;
              }
              if (parsed.readingId) continue;
              if (parsed.content) {
                fullText += parsed.content;
                setInterpretation((prev) => prev + parsed.content);
              }
            } catch {
              // ignore
            }
          }
        }
        if (hasErrorChunk) break;
      }
      clearTimeout(clientTimeout);

      if (hasErrorChunk) {
        await attemptRefund();
        setAiLoading(false);
        return;
      }

      // Persist the AI text into the reading history row
      if (readingIdRef.current && fullText) {
        const supabase = createClient();
        await supabase
          .from("readings")
          .update({ interpretation: fullText })
          .eq("id", readingIdRef.current)
          .catch(() => {});
        lastCostRef.current = null; // success, do not refund
      } else if (!fullText) {
        setError("AI ไม่ตอบสนอง กรุณาลองใหม่ — แต้มคืนแล้ว");
        await attemptRefund();
      } else {
        lastCostRef.current = null;
      }
    } catch (e: unknown) {
      clearTimeout(clientTimeout);
      // If we already have content, treat as success — don't overwrite with generic error
      if (fullText && fullText.trim().length > 20) {
        console.warn("oracle stream threw after content, ignoring generic error", e);
        // Persist partial/full content if not yet persisted
        if (readingIdRef.current) {
          const supabase = createClient();
          await supabase
            .from("readings")
            .update({ interpretation: fullText })
            .eq("id", readingIdRef.current)
            .catch(() => {});
          lastCostRef.current = null;
        }
        setError("");
      } else {
        const isAbort = e instanceof Error && e.name === "AbortError";
        console.error("oracle fetchInterpretation failed", e);
        if (isAbort) setError("AI ไม่ตอบสนอง กรุณาลองใหม่ — แต้มคืนแล้ว");
        else setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
        await attemptRefund();
      }
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
    startedRef.current = false;
    readingIdRef.current = null;
    lastCostRef.current = null;
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
                  <div key={i} className="oracle-slot" style={{ animation: `fadeUp 0.5s var(--ease) ${i * 0.1}s both` }}>
                    <TarotCard
                      card={c.card}
                      reversed={c.reversed}
                      flipped={isFlipped}
                      size={spread.count === 3 ? "sm" : "lg"}
                      showLabel
                    />
                    <div className="text-center" style={{ opacity: isFlipped ? 1 : 0, transition: "opacity 0.3s var(--ease)" }}>
                      <div className="oracle-slot-name">{c.position.labelTh}</div>
                      <div className="text-[11px] font-semibold" style={{ color: "var(--text-secondary)" }}>
                        {c.card.nameTh}
                        {c.reversed && <span style={{ color: "var(--gold)", marginLeft: 4 }}>กลับหัว</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Meanings for revealed cards - tarot upright/reversed */}
            {cards.slice(0, revealed).map((c, i) => (
              <div key={i} className="oracle-message-card" style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="oracle-message-name">
                  {c.position.labelTh} · {c.card.nameTh}
                  {c.reversed ? " · กลับหัว" : ""}
                </div>
                <p className="oracle-message-text">{c.reversed ? c.card.reversedTh : c.card.uprightTh}</p>
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
                  {stripMarkdownMultiline(interpretation)}
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

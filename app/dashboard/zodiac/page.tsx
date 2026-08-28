"use client";

import { useState, useEffect, useRef } from "react";
import DashboardShell from "@/components/DashboardShell";
import { getZodiacSign, getChineseZodiac, isValidBirthDate } from "@/lib/zodiac";
import { ZODIAC_SIGNS } from "@/lib/astrology/types";
import { Calendar, Sparkles, RefreshCw } from "lucide-react";

const STORAGE_KEY = "sealo_birth_date";

export default function ZodiacPage() {
  const [birthDate, setBirthDate] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [reading, setReading] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const textRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setBirthDate(saved);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (textRef.current) {
      textRef.current.scrollTop = textRef.current.scrollHeight;
    }
  }, [reading]);

  const todayLabel = new Date().toLocaleDateString("th-TH", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Compute identity instantly from the entered birth date
  const identity = (() => {
    if (!birthDate) return null;
    const [y, m, d] = birthDate.split("-").map(Number);
    if (!isValidBirthDate(y!, m!, d!)) return null;
    const sign = ZODIAC_SIGNS.find((s) => s.id === getZodiacSign(y!, m!, d!))!;
    const animal = getChineseZodiac(y!, m!, d!);
    return { sign, animal };
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!birthDate) {
      setError("กรุณาเลือกวันเกิดก่อน");
      return;
    }
    const [y, m, d] = birthDate.split("-").map(Number);
    if (!isValidBirthDate(y!, m!, d!)) {
      setError("วันเกิดไม่ถูกต้อง");
      return;
    }
    setError("");
    localStorage.setItem(STORAGE_KEY, birthDate);
    setSubmitted(true);
    setReading("");
    setLoading(true);
    try {
      const res = await fetch("/api/zodiac", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ birthDate }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 429) setError("อ่านถี่เกินไป กรุณารอสักครู่");
        else setError(data.error || "ไม่สามารถดูดวงได้ กรุณาลองใหม่");
        return;
      }
      const reader = res.body?.getReader();
      if (!reader) {
        setError("ไม่สามารถอ่านคำตอบได้");
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
              if (parsed.content) setReading((prev) => prev + parsed.content);
            } catch {
              // ignore
            }
          }
        }
      }
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setReading("");
    setError("");
  };

  return (
    <DashboardShell>
      <div className="reading-page">
        <div className="step-header">
          <p className="step-eyebrow">ดูดวงรายวัน · ฟรี</p>
          <h1 className="step-title">ดูดวงตามวันเกิด</h1>
          <p className="step-sub">
            ใส่วันเกิด แล้วรับคำทำนายประจำวันแบบละเอียด
            <br />
            ราศี + ปีนักษัตร + ความรัก · การงาน · เงิน · สุขภาพ · ความเครียด
          </p>
        </div>

        {!submitted && (
          <form onSubmit={handleSubmit} className="animate-in">
            <div className="q-card">
              <label className="label flex items-center gap-1.5" htmlFor="birth-date">
                <Calendar size={13} style={{ color: "var(--primary)" }} />
                วันเกิดของคุณ
              </label>
              <input
                id="birth-date"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="input"
                required
                max={new Date().toISOString().slice(0, 10)}
                style={{ fontSize: 16 }}
              />
              <p className="text-[11.5px]" style={{ color: "var(--text-muted)" }}>
                ใช้คำนวณราศีและปีนักษัตรของคุณเท่านั้น ไม่ถูกบันทึกบนเซิร์ฟเวอร์
              </p>
              {error && (
                <div
                  className="p-3 rounded-xl text-[12.5px] font-medium"
                  style={{ background: "var(--red-soft)", color: "var(--red)" }}
                >
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={!loaded || !birthDate}
                className="btn-primary w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[14px] font-bold"
                style={{
                  background: "linear-gradient(135deg, var(--primary), var(--primary-hover))",
                  color: "#fff",
                  boxShadow: "0 6px 20px rgba(109, 40, 217, 0.3)",
                }}
              >
                <Sparkles size={15} />
                ดูดวงของฉัน
              </button>
            </div>
          </form>
        )}

        {submitted && identity && (
          <div className="mt-5">
            {/* Identity */}
            <div className="mx-4 mb-4 grid grid-cols-2 gap-2.5">
              <div
                className="rounded-2xl p-4 text-center"
                style={{
                  background: "linear-gradient(160deg, rgba(129,140,248,0.10), rgba(99,102,241,0.04))",
                  border: "1px solid rgba(129,140,248,0.18)",
                }}
              >
                <div className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "#818cf8" }}>
                  ราศี
                </div>
                <div className="text-[34px] leading-none my-1.5" style={{ color: "#818cf8" }}>
                  {identity.sign.symbol}
                </div>
                <div className="text-[16px] font-extrabold" style={{ color: "var(--text)" }}>
                  {identity.sign.nameTh}
                </div>
                <div className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {identity.sign.range}
                </div>
              </div>
              <div
                className="rounded-2xl p-4 text-center"
                style={{
                  background: "linear-gradient(160deg, rgba(212,175,55,0.10), rgba(184,148,42,0.04))",
                  border: "1px solid rgba(212,175,55,0.18)",
                }}
              >
                <div className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--gold)" }}>
                  ปีนักษัตร
                </div>
                <div className="text-[34px] leading-none my-1.5">{identity.animal.symbol}</div>
                <div className="text-[16px] font-extrabold" style={{ color: "var(--text)" }}>
                  {identity.animal.yearTh}
                </div>
                <div className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                  ปี {identity.animal.animal}
                </div>
              </div>
            </div>

            {/* Reading card (streamed) */}
            <div
              className="reading-section-card"
              style={{ marginTop: 4 }}
            >
              <div className="reading-section-title flex items-center gap-1.5">
                <Sparkles size={11} /> คำทำนายของคุณ · {todayLabel}
              </div>
              <div
                ref={textRef}
                className="reading-section-text"
                aria-live="polite"
                style={{ minHeight: loading && !reading ? 80 : undefined }}
              >
                {reading}
                {loading && !reading && (
                  <div className="reading-empty-stream">
                    <div className="mystical-loader">
                      <div className="mystical-loader-dot" />
                      <div className="mystical-loader-dot" />
                      <div className="mystical-loader-dot" />
                    </div>
                    <span className="text-[12.5px] font-semibold" style={{ color: "var(--text-muted)" }}>
                      กำลังอ่านดวงของคุณด้วย AI...
                    </span>
                  </div>
                )}
                {loading && reading && <span className="reading-streaming" />}
              </div>
            </div>

            {error && (
              <div
                className="mx-4 mb-3 p-3 rounded-xl text-[12.5px] font-medium"
                style={{ background: "var(--red-soft)", color: "var(--red)" }}
              >
                {error}
              </div>
            )}

            {!loading && reading && (
              <div className="mx-4 mb-4 flex justify-center">
                <button onClick={handleReset} className="btn btn-ghost rounded-xl">
                  <RefreshCw size={14} /> เปลี่ยนวันเกิด
                </button>
              </div>
            )}

            <div className="mx-4 mb-4 text-center text-[11px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
              ข้อความนี้เป็นแนวทางเชิงสัญลักษณ์ ไม่ใช่คำทำนายที่แน่นอน
              <br />
              ใช้วิจารณญาณในการตัดสินใจเสมอ
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

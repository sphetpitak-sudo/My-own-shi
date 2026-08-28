"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/components/DashboardShell";
import { getZodiacSign, getChineseZodiac, isValidBirthDate, type ZodiacFortune } from "@/lib/zodiac";
import { ZODIAC_SIGNS } from "@/lib/astrology/types";
import { Calendar, Sparkles, GraduationCap, Heart, Wallet, Activity, Wind, RefreshCw } from "lucide-react";

const STORAGE_KEY = "sealo_birth_date";

export default function ZodiacPage() {
  const [birthDate, setBirthDate] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [fortune, setFortune] = useState<ZodiacFortune | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setBirthDate(saved);
    setLoaded(true);
  }, []);

  const todayLabel = new Date().toLocaleDateString("th-TH", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

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
    setLoading(true);
    setFortune(null);
    try {
      const res = await fetch("/api/zodiac", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ birthDate }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "ไม่สามารถดูดวงได้");
        return;
      }
      setFortune((await res.json()) as ZodiacFortune);
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  };

  // Show identity instantly while AI reads
  const identity = birthDate && !fortune
    ? (() => {
        const [y, m, d] = birthDate.split("-").map(Number);
        if (!isValidBirthDate(y!, m!, d!)) return null;
        const sign = ZODIAC_SIGNS.find((s) => s.id === getZodiacSign(y!, m!, d!))!;
        const animal = getChineseZodiac(y!, m!, d!);
        return { sign, animal };
      })()
    : null;

  const aspects = fortune
    ? [
        { id: "study", label: "เรียน / งาน", icon: GraduationCap, color: "#14b8a6", text: fortune.study },
        { id: "love", label: "ความรัก", icon: Heart, color: "#f472b6", text: fortune.love },
        { id: "money", label: "การเงิน", icon: Wallet, color: "#fbbf24", text: fortune.money },
        { id: "health", label: "สุขภาพ", icon: Activity, color: "#22c55e", text: fortune.health },
        { id: "stress", label: "ความเครียด", icon: Wind, color: "#a78bfa", text: fortune.stress },
      ]
    : [];

  const displaySign = fortune
    ? { symbol: fortune.signSymbol, nameTh: fortune.signNameTh, range: fortune.signRange }
    : identity
      ? { symbol: identity.sign.symbol, nameTh: identity.sign.nameTh, range: identity.sign.range }
      : null;

  const displayAnimal = fortune ? fortune.animal : identity?.animal ?? null;

  return (
    <DashboardShell>
      <div className="reading-page">
        <div className="step-header">
          <p className="step-eyebrow">ดูดวงรายวัน · ฟรี</p>
          <h1 className="step-title">ดูดวงตามวันเกิด</h1>
          <p className="step-sub">
            ใส่วันเกิด แล้วเราจะบอก ราศี ปีนักษัตร และคำทำนายประจำวันของคุณ
            <br />
            ครอบคลุม เรียน/งาน · ความรัก · เงิน · สุขภาพ · ความเครียด
          </p>
        </div>

        {!fortune && !loading && (
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

        {(fortune || identity) && (
          <div className="mt-5">
            {/* Identity: zodiac + animal */}
            {displaySign && displayAnimal && (
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
                    {displaySign.symbol}
                  </div>
                  <div className="text-[16px] font-extrabold" style={{ color: "var(--text)" }}>
                    {displaySign.nameTh}
                  </div>
                  <div className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {displaySign.range}
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
                  <div className="text-[34px] leading-none my-1.5">{displayAnimal.symbol}</div>
                  <div className="text-[16px] font-extrabold" style={{ color: "var(--text)" }}>
                    {displayAnimal.yearTh}
                  </div>
                  <div className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                    ปี {displayAnimal.animal}
                  </div>
                </div>
              </div>
            )}

            {/* Loading state */}
            {loading && (
              <div className="mx-4 mb-4 p-6 rounded-2xl flex flex-col items-center gap-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                <div className="mystical-loader">
                  <div className="mystical-loader-dot" />
                  <div className="mystical-loader-dot" />
                  <div className="mystical-loader-dot" />
                </div>
                <p className="text-[13px] font-medium" style={{ color: "var(--text-muted)" }}>
                  กำลังอ่านดวงของคุณด้วย AI...
                </p>
              </div>
            )}

            {error && !fortune && !loading && (
              <div className="mx-4 mb-4 p-3 rounded-xl text-[12.5px] font-medium" style={{ background: "var(--red-soft)", color: "var(--red)" }}>
                {error}
              </div>
            )}

            {fortune && (
              <div className="animate-in">
                {/* Overview */}
                <div
                  className="mx-4 mb-4 p-4 rounded-2xl"
                  style={{
                    background: "linear-gradient(160deg, rgba(129,140,248,0.10), rgba(99,102,241,0.04))",
                    border: "1px solid rgba(129,140,248,0.18)",
                  }}
                >
                  <div className="text-[10.5px] font-bold uppercase tracking-[0.12em] mb-1.5 flex items-center gap-1.5" style={{ color: "var(--primary)" }}>
                    <Sparkles size={11} /> ภาพรวมวันนี้
                  </div>
                  <p className="text-[14px] leading-[1.7]" style={{ color: "var(--text)" }}>
                    {fortune.overview}
                  </p>
                  <div className="text-[11px] mt-3" style={{ color: "var(--text-muted)" }}>
                    {todayLabel}
                  </div>
                </div>

                {/* Aspects */}
                <div className="mx-4 mb-4">
                  <div className="text-[11px] font-bold uppercase tracking-[0.12em] mb-2" style={{ color: "var(--text-muted)" }}>
                    คำแนะนำตามด้าน
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {aspects.map((a) => {
                      const Icon = a.icon;
                      return (
                        <div key={a.id} className="card p-3.5 flex items-start gap-3">
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: `${a.color}1A`, color: a.color }}
                          >
                            <Icon size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[12.5px] font-bold" style={{ color: "var(--text)" }}>
                              {a.label}
                            </div>
                            <div className="text-[12px] mt-0.5 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                              {a.text}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Lucky */}
                <div className="mx-4 grid grid-cols-2 gap-2 mb-4">
                  <div className="card p-4 text-center">
                    <div className="text-[10.5px] font-bold uppercase tracking-[0.12em] mb-1" style={{ color: "var(--text-muted)" }}>
                      เลขมงคล
                    </div>
                    <div className="text-[28px] font-extrabold" style={{ color: "var(--gold)" }}>
                      {fortune.lucky.number}
                    </div>
                  </div>
                  <div className="card p-4 text-center">
                    <div className="text-[10.5px] font-bold uppercase tracking-[0.12em] mb-1" style={{ color: "var(--text-muted)" }}>
                      สีมงคล
                    </div>
                    <div className="flex items-center justify-center gap-2 mt-1">
                      <div className="w-7 h-7 rounded-full" style={{ background: fortune.lucky.color, boxShadow: `0 0 16px ${fortune.lucky.color}55` }} />
                      <div className="text-[16px] font-bold" style={{ color: "var(--text)" }}>
                        {fortune.lucky.colorTh}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Source + actions */}
                <div className="mx-4 flex items-center justify-center gap-2 mb-2">
                  {fortune.source === "ai" ? (
                    <span
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold"
                      style={{ background: "var(--primary-soft)", color: "var(--primary)" }}
                    >
                      <Sparkles size={9} /> เรียบเรียงด้วย AI
                    </span>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold"
                      style={{ background: "var(--bg)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
                    >
                      โหมดสำรอง
                    </span>
                  )}
                </div>
                <div className="px-4 mt-2 mb-4 flex justify-center">
                  <button onClick={() => setFortune(null)} className="btn btn-ghost rounded-xl">
                    <RefreshCw size={14} /> เปลี่ยนวันเกิด
                  </button>
                </div>

                <div className="mx-4 mb-4 text-center text-[11px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  ข้อความนี้เป็นแนวทางเชิงสัญลักษณ์ ไม่ใช่คำทำนายที่แน่นอน
                  <br />
                  ใช้วิจารณญาณในการตัดสินใจเสมอ
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

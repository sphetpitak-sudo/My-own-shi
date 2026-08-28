"use client";

import { useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import { Compass, Calendar, Clock, MapPin, Sparkles, Lock } from "lucide-react";
import { astrologyProvider, ZODIAC_SIGNS, type BirthChart } from "@/lib/astrology";

export default function BirthChartPage() {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [place, setPlace] = useState("");
  const [loading, setLoading] = useState(false);
  const [chart, setChart] = useState<BirthChart | null>(null);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!date || !time || !place.trim()) {
      setError("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }
    setLoading(true);
    try {
      const result = await astrologyProvider.calculate({ date, time, place: place.trim() });
      setChart(result);
    } catch {
      setError("ไม่สามารถคำนวณได้");
    } finally {
      setLoading(false);
    }
  }

  const signMeta = chart ? ZODIAC_SIGNS.find((s) => s.id === chart.sun.sign) : null;

  return (
    <DashboardShell>
      <div className="reading-page">
        <div className="step-header">
          <p className="step-eyebrow">ดาราศาสตร์ · เร็ว ๆ นี้</p>
          <h1 className="step-title">แผนที่ดวงดาวส่วนบุคคล</h1>
          <p className="step-sub">
            กรอกวัน เวลา และสถานที่เกิด เพื่อสร้างแผนที่ตำแหน่งดาวเคราะห์ ณ ขณะที่คุณลืมตาดูโลก
          </p>
        </div>

        {!chart && (
          <form onSubmit={handleSubmit} className="mx-4 space-y-3">
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Compass size={16} style={{ color: "var(--primary)" }} />
                <div className="text-[12.5px] font-bold" style={{ color: "var(--text)" }}>
                  ข้อมูลการเกิดของคุณ
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="label flex items-center gap-1.5" htmlFor="bc-date">
                    <Calendar size={11} /> วันเกิด
                  </label>
                  <input
                    id="bc-date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="input"
                    required
                    style={{ fontSize: 16 }}
                  />
                </div>

                <div>
                  <label className="label flex items-center gap-1.5" htmlFor="bc-time">
                    <Clock size={11} /> เวลาเกิด (ถ้าไม่แน่ใจใส่เที่ยงวัน)
                  </label>
                  <input
                    id="bc-time"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="input"
                    required
                    style={{ fontSize: 16 }}
                  />
                </div>

                <div>
                  <label className="label flex items-center gap-1.5" htmlFor="bc-place">
                    <MapPin size={11} /> สถานที่เกิด
                  </label>
                  <input
                    id="bc-place"
                    type="text"
                    value={place}
                    onChange={(e) => setPlace(e.target.value)}
                    placeholder="เช่น เชียงใหม่, Bangkok, Tokyo"
                    className="input"
                    required
                    style={{ fontSize: 16 }}
                  />
                </div>
              </div>
            </div>

            <div
              className="p-3 rounded-xl text-[11.5px] flex items-start gap-2"
              style={{ background: "var(--primary-soft)", color: "var(--primary)" }}
            >
              <Lock size={13} className="flex-shrink-0 mt-0.5" />
              <div>
                <strong>ทำไมต้องใช้ข้อมูลเหล่านี้?</strong>{" "}
                ตำแหน่งของดาวเคราะห์ขึ้นอยู่กับเวลาและสถานที่บนโลก
                ข้อมูลของคุณใช้เพื่อคำนวณแผนที่เท่านั้น ไม่ถูกส่งไปไหน
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl text-[12.5px]" style={{ background: "var(--red-soft)", color: "var(--red)" }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full rounded-2xl py-3"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  กำลังคำนวณ...
                </span>
              ) : (
                <>
                  <Sparkles size={15} /> สร้างแผนที่ดวงดาว
                </>
              )}
            </button>
          </form>
        )}

        {chart && signMeta && (
          <div className="mx-4 space-y-3 animate-in">
            {/* Sun sign hero */}
            <div
              className="rounded-2xl p-5 relative overflow-hidden"
              style={{
                background:
                  "linear-gradient(160deg, rgba(129,140,248,0.10) 0%, rgba(99,102,241,0.04) 100%)",
                border: "1px solid rgba(129,140,248,0.18)",
              }}
            >
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  top: -40,
                  right: -40,
                  width: 180,
                  height: 180,
                  borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(129,140,248,0.18), transparent 70%)",
                  filter: "blur(8px)",
                }}
              />
              <div className="relative">
                <div
                  className="text-[10.5px] font-bold uppercase tracking-[0.12em]"
                  style={{ color: "#818cf8" }}
                >
                  ราศีดวงอาทิตย์
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-[28px]"
                    style={{
                      background: "rgba(129,140,248,0.15)",
                      color: "#818cf8",
                      border: "1px solid rgba(129,140,248,0.2)",
                    }}
                  >
                    {signMeta.symbol}
                  </div>
                  <div>
                    <div className="text-[22px] font-extrabold" style={{ color: "var(--text)" }}>
                      {signMeta.nameTh}
                    </div>
                    <div className="text-[12px]" style={{ color: "var(--text-muted)" }}>
                      {signMeta.range}
                    </div>
                  </div>
                </div>
                <p className="text-[13.5px] mt-3" style={{ color: "var(--text-secondary)" }}>
                  {chart.summary.personalityTh}
                </p>
              </div>
            </div>

            {/* Planets */}
            <div className="card p-4">
              <div
                className="text-[10.5px] font-bold uppercase tracking-[0.12em] mb-2"
                style={{ color: "var(--text-muted)" }}
              >
                ตำแหน่งดาวเคราะห์
              </div>
              <div className="space-y-1.5">
                {chart.planets.map((p) => {
                  const s = ZODIAC_SIGNS.find((z) => z.id === p.sign);
                  return (
                    <div key={p.planet} className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-[14px]"
                        style={{ background: "var(--bg)" }}
                      >
                        {s?.symbol}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12.5px] font-bold capitalize" style={{ color: "var(--text)" }}>
                          {p.planet}
                        </div>
                        <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                          {s?.nameTh}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Strengths / challenges */}
            <div className="grid grid-cols-2 gap-2">
              <div className="card p-4">
                <div
                  className="text-[10.5px] font-bold uppercase tracking-[0.12em] mb-2"
                  style={{ color: "var(--green)" }}
                >
                  จุดแข็ง
                </div>
                <ul className="space-y-1">
                  {chart.summary.strengthsTh.map((s) => (
                    <li key={s} className="text-[12.5px] flex items-center gap-1.5" style={{ color: "var(--text)" }}>
                      <span style={{ color: "var(--green)" }}>·</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="card p-4">
                <div
                  className="text-[10.5px] font-bold uppercase tracking-[0.12em] mb-2"
                  style={{ color: "#fbbf24" }}
                >
                  จุดที่ต้องระวัง
                </div>
                <ul className="space-y-1">
                  {chart.summary.challengesTh.map((c) => (
                    <li key={c} className="text-[12.5px] flex items-center gap-1.5" style={{ color: "var(--text)" }}>
                      <span style={{ color: "#fbbf24" }}>·</span> {c}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div
              className="p-3 rounded-xl text-[11px] text-center"
              style={{ background: "var(--bg)", color: "var(--text-muted)" }}
            >
              ข้อมูลนี้ใช้ตัวอย่างจาก mock provider — เวอร์ชันจริงจะใช้ astronomy calculation engine
              เพื่อความแม่นยำของตำแหน่งดาวเคราะห์
            </div>

            <button
              onClick={() => setChart(null)}
              className="btn btn-ghost w-full rounded-2xl"
            >
              เริ่มใหม่
            </button>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

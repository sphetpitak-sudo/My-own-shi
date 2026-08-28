"use client";

import { useEffect, useState, useMemo } from "react";
import DashboardShell from "@/components/DashboardShell";
import { createClient } from "@/lib/supabase/client";
import { Sun, Sparkles, Heart, Briefcase, Wallet, GraduationCap, Activity, RefreshCw } from "lucide-react";
import type { DailyFortune } from "@/lib/daily";

const ASPECTS = [
  { id: "love", label: "ความรัก", icon: Heart, color: "#f472b6" },
  { id: "career", label: "การงาน", icon: Briefcase, color: "#14b8a6" },
  { id: "finance", label: "การเงิน", icon: Wallet, color: "#fbbf24" },
  { id: "study", label: "การเรียน", icon: GraduationCap, color: "#a78bfa" },
  { id: "health", label: "สุขภาพ", icon: Activity, color: "#22c55e" },
];

export default function DailyPage() {
  const [day, setDay] = useState<DailyFortune | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDay = async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/";
        return;
      }
      const res = await fetch("/api/daily", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "ไม่สามารถโหลดดวงได้");
        return;
      }
      const data = (await res.json()) as DailyFortune;
      setDay(data);
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDay();
  }, []);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 5) return "ดึกแล้ว";
    if (h < 11) return "เช้านี้";
    if (h < 16) return "เที่ยงวัน";
    if (h < 19) return "เย็นนี้";
    return "ค่ำนี้";
  }, []);

  const today = new Date().toLocaleDateString("th-TH", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

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
              กำลังอ่านพลังงานของวันด้วย AI...
            </p>
          </div>
        </div>
      </DashboardShell>
    );
  }

  if (error && !day) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center" style={{ minHeight: "60vh" }}>
          <div className="text-center px-6">
            <p className="text-[14px] font-medium" style={{ color: "var(--red)" }}>{error}</p>
            <button onClick={() => loadDay()} className="btn btn-primary mt-4 rounded-xl">
              <RefreshCw size={14} /> ลองใหม่
            </button>
          </div>
        </div>
      </DashboardShell>
    );
  }

  if (!day) return null;

  return (
    <DashboardShell>
      <div className="reading-page">
        <div className="step-header">
          <p className="step-eyebrow">ดูดวงรายวัน · ฟรี</p>
          <h1 className="step-title">{greeting} ของคุณเป็นอย่างไร</h1>
          <p className="step-sub">{today}</p>
        </div>

        {/* Hero card */}
        <div
          className="mx-4 mb-4 p-5 rounded-2xl relative overflow-hidden"
          style={{
            background:
              "linear-gradient(160deg, rgba(167,139,250,0.10) 0%, rgba(109,40,217,0.04) 60%, transparent 100%)",
            border: "1px solid rgba(167,139,250,0.18)",
          }}
        >
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: -30,
              right: -30,
              width: 140,
              height: 140,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(212,175,55,0.18), transparent 70%)",
              filter: "blur(8px)",
            }}
          />
          <div className="relative flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--primary-soft)", color: "var(--primary)" }}
            >
              <Sun size={22} />
            </div>
            <div>
              <div
                className="text-[10.5px] font-bold uppercase tracking-[0.12em]"
                style={{ color: "var(--primary)" }}
              >
                ธีมประจำวัน
              </div>
              <h2 className="text-[20px] font-extrabold mt-1" style={{ color: "var(--text)", letterSpacing: "-0.02em" }}>
                {day.theme}
              </h2>
            </div>
          </div>
        </div>

        {/* Card of the day */}
        <div className="mx-4 mb-4 card p-4 flex items-center gap-4">
          <div className="flex-shrink-0">
            <div
              className="w-[68px] aspect-[2/3] rounded-lg overflow-hidden flex items-center justify-center"
              style={{ background: "linear-gradient(160deg, #1e0e3a, #14082a)" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/Taro/${day.card.imageFile}`}
                alt={day.card.nameTh}
                className="w-full h-full"
                style={{
                  objectFit: "contain",
                  transform: day.card.reversed ? "rotate(180deg)" : undefined,
                }}
              />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div
              className="text-[10.5px] font-bold uppercase tracking-[0.12em]"
              style={{ color: "var(--primary)" }}
            >
              ไพ่ประจำวัน
            </div>
            <div className="text-[16px] font-extrabold mt-1" style={{ color: "var(--text)" }}>
              {day.card.nameTh}
              {day.card.reversed && (
                <span className="text-[11px] font-semibold ml-1.5" style={{ color: "var(--text-muted)" }}>
                  กลับหัว
                </span>
              )}
            </div>
            <div className="text-[12px] mt-1" style={{ color: "var(--text-muted)" }}>
              {day.card.reversed ? day.card.reversedTh : day.card.uprightTh}
            </div>
          </div>
        </div>

        {/* Energy */}
        <div className="mx-4 mb-4 card p-4">
          <div className="text-[11px] font-bold uppercase tracking-[0.12em] mb-3 flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
            <Sparkles size={11} /> พลังงานวันนี้
          </div>
          {[
            { label: "ความรัก", pct: ((day.card.id * 13 + day.lucky.number * 7) % 35) + 58, color: "#f472b6" },
            { label: "การงาน", pct: ((day.card.id * 7 + day.lucky.number * 11) % 35) + 60, color: "#14b8a6" },
            { label: "การเงิน", pct: ((day.card.id * 11 + day.lucky.number * 13) % 35) + 55, color: "#fbbf24" },
          ].map((b) => (
            <div key={b.label} className="mb-3 last:mb-0">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[12px] font-semibold" style={{ color: "var(--text)" }}>{b.label}</span>
                <span className="text-[11px] font-bold" style={{ color: b.color }}>{b.pct}%</span>
              </div>
              <div className="bar"><div style={{ width: `${b.pct}%`, background: b.color }} /></div>
            </div>
          ))}
          <p className="text-[11px] mt-3 text-center" style={{ color: "var(--text-muted)" }}>กลับมาเปิดไพ่ใหม่พรุ่งนี้เพื่อเติมพลังใหม่</p>
        </div>

        {/* Aspects */}
        <div className="mx-4 mb-4">
          <div
            className="text-[11px] font-bold uppercase tracking-[0.12em] mb-2"
            style={{ color: "var(--text-muted)" }}
          >
            คำแนะนำตามด้าน
          </div>
          <div className="space-y-2">
            {ASPECTS.map((a) => {
              const Icon = a.icon;
              return (
                <div key={a.id} className="card p-3 flex items-center gap-3">
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
                    <div className="text-[11.5px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {day.aspects[a.id as keyof typeof day.aspects]}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Focus grid */}
        <div className="mx-4 grid grid-cols-1 gap-2 mb-4">
          <div className="card p-4">
            <div
              className="text-[10.5px] font-bold uppercase tracking-[0.12em] mb-1.5"
              style={{ color: "#14b8a6" }}
            >
              โอกาสของวัน
            </div>
            <div className="text-[13.5px]" style={{ color: "var(--text)" }}>
              {day.opportunity}
            </div>
          </div>
          <div className="card p-4">
            <div
              className="text-[10.5px] font-bold uppercase tracking-[0.12em] mb-1.5"
              style={{ color: "#fbbf24" }}
            >
              ข้อควรระวัง
            </div>
            <div className="text-[13.5px]" style={{ color: "var(--text)" }}>
              {day.caution}
            </div>
          </div>
          <div
            className="p-4 rounded-2xl"
            style={{
              background: "linear-gradient(160deg, rgba(167,139,250,0.10), rgba(109,40,217,0.04))",
              border: "1px solid rgba(167,139,250,0.18)",
            }}
          >
            <div
              className="text-[10.5px] font-bold uppercase tracking-[0.12em] mb-1.5 flex items-center gap-1.5"
              style={{ color: "var(--primary)" }}
            >
              <Sparkles size={11} /> คำแนะนำ
            </div>
            <div className="text-[13.5px] font-medium" style={{ color: "var(--text)" }}>
              {day.advice}
            </div>
          </div>
        </div>

        {/* Lucky */}
        <div className="mx-4 grid grid-cols-2 gap-2 mb-4">
          <div className="card p-4 text-center">
            <div
              className="text-[10.5px] font-bold uppercase tracking-[0.12em] mb-1"
              style={{ color: "var(--text-muted)" }}
            >
              เลขมงคล
            </div>
            <div className="text-[26px] font-extrabold" style={{ color: "var(--gold)" }}>
              {day.lucky.number}
            </div>
          </div>
          <div className="card p-4 text-center">
            <div
              className="text-[10.5px] font-bold uppercase tracking-[0.12em] mb-1"
              style={{ color: "var(--text-muted)" }}
            >
              สีมงคล
            </div>
            <div className="flex items-center justify-center gap-2">
              <div
                className="w-6 h-6 rounded-full"
                style={{ background: day.lucky.color, boxShadow: `0 0 14px ${day.lucky.color}55` }}
              />
              <div className="text-[15px] font-bold" style={{ color: "var(--text)" }}>
                {day.lucky.colorTh}
              </div>
            </div>
          </div>
        </div>

        {/* Source + refresh */}
        <div className="mx-4 flex items-center justify-center gap-2 mb-2">
          {day.source === "ai" ? (
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
          {error && <span className="text-[11px]" style={{ color: "var(--red)" }}>{error}</span>}
        </div>
        <div className="mx-4 mb-4 flex justify-center">
          <button onClick={() => loadDay(true)} className="btn btn-ghost rounded-xl text-[12.5px]">
            <RefreshCw size={13} /> เปิดดวงใหม่
          </button>
        </div>

        {/* Disclaimers */}
        <div
          className="mx-4 mt-2 mb-4 text-center text-[11px] leading-relaxed"
          style={{ color: "var(--text-muted)" }}
        >
          ข้อความนี้เป็นแนวทางเชิงสัญลักษณ์ ไม่ใช่คำทำนายที่แน่นอน
          <br />
          ใช้วิจารณญาณในการตัดสินใจเสมอ
        </div>
      </div>
    </DashboardShell>
  );
}

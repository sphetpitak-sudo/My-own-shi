"use client";

import { useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import { ZODIAC_SIGNS, type ZodiacSign } from "@/lib/astrology/types";
import { buildZodiacDay, type ZodiacDay } from "@/lib/zodiac";
import { Heart, Briefcase, Wallet, Activity, Sparkles, Star } from "lucide-react";

export default function ZodiacPage() {
  const [signId, setSignId] = useState<ZodiacSign | null>(null);

  const today = new Date().toISOString().slice(0, 10);
  const todayLabel = new Date().toLocaleDateString("th-TH", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const day: ZodiacDay | null = signId ? buildZodiacDay(signId, today) : null;

  const aspects = day
    ? [
        { id: "love", label: "ความรัก", icon: Heart, color: "#f472b6", text: day.love },
        { id: "career", label: "การงาน", icon: Briefcase, color: "#14b8a6", text: day.career },
        { id: "finance", label: "การเงิน", icon: Wallet, color: "#fbbf24", text: day.finance },
        { id: "health", label: "สุขภาพ", icon: Activity, color: "#22c55e", text: day.health },
      ]
    : [];

  return (
    <DashboardShell>
      <div className="reading-page">
        <div className="step-header">
          <p className="step-eyebrow">ดูดวงรายวัน · ฟรี</p>
          <h1 className="step-title">ดูดวงตามราศี</h1>
          <p className="step-sub">
            เลือกราศีของคุณ แล้วรับคำทำนายประจำวัน
            <br />
            อัปเดตทุกวัน · ครอบคลุม ความรัก การงาน การเงิน สุขภาพ
          </p>
        </div>

        {/* Sign selector */}
        <div className="px-4">
          <div
            className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2.5"
            role="radiogroup"
            aria-label="เลือกราศีของคุณ"
          >
            {ZODIAC_SIGNS.map((s) => {
              const active = signId === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setSignId(s.id)}
                  role="radio"
                  aria-checked={active}
                  className="rounded-2xl px-2 py-3 text-center transition-all duration-200"
                  style={{
                    background: active ? "var(--primary)" : "var(--bg-card)",
                    border: `1px solid ${active ? "var(--primary)" : "var(--border)"}`,
                    boxShadow: active ? "0 6px 20px rgba(109,40,217,0.25)" : "var(--shadow-xs)",
                    transform: active ? "translateY(-2px)" : undefined,
                  }}
                >
                  <div
                    className="text-[26px] leading-none mb-1.5"
                    style={{ color: active ? "#fff" : "var(--primary)" }}
                  >
                    {s.symbol}
                  </div>
                  <div
                    className="text-[12px] font-bold"
                    style={{ color: active ? "#fff" : "var(--text-secondary)" }}
                  >
                    {s.nameTh}
                  </div>
                  <div
                    className="text-[9.5px] mt-0.5"
                    style={{ color: active ? "rgba(255,255,255,0.75)" : "var(--text-muted)" }}
                  >
                    {s.nameEn}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {!day && (
          <div className="px-4 mt-6">
            <div
              className="p-4 rounded-2xl flex items-center justify-center gap-2 text-[12.5px]"
              style={{ background: "var(--primary-soft)", color: "var(--primary)" }}
            >
              <Star size={14} />
              เลือกราศีของคุณเพื่อดูดวงวันนี้
            </div>
          </div>
        )}

        {day && (
          <div className="mt-5 animate-in">
            {/* Sign hero */}
            <div
              className="mx-4 mb-4 p-5 rounded-2xl relative overflow-hidden"
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
                  top: -30,
                  right: -30,
                  width: 140,
                  height: 140,
                  borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(129,140,248,0.18), transparent 70%)",
                  filter: "blur(8px)",
                }}
              />
              <div className="relative flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-[32px] flex-shrink-0"
                  style={{
                    background: "rgba(129,140,248,0.15)",
                    color: "#818cf8",
                    border: "1px solid rgba(129,140,248,0.2)",
                  }}
                >
                  {day.signSymbol}
                </div>
                <div>
                  <div className="text-[10.5px] font-bold uppercase tracking-[0.12em]" style={{ color: "#818cf8" }}>
                    ราศีของคุณ
                  </div>
                  <h2 className="text-[22px] font-extrabold" style={{ color: "var(--text)", letterSpacing: "-0.02em" }}>
                    {day.signNameTh}
                  </h2>
                  <div className="text-[11.5px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {day.range} · {todayLabel}
                  </div>
                </div>
              </div>
            </div>

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
                {day.overview}
              </p>
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
                  {day.lucky.number}
                </div>
              </div>
              <div className="card p-4 text-center">
                <div className="text-[10.5px] font-bold uppercase tracking-[0.12em] mb-1" style={{ color: "var(--text-muted)" }}>
                  สีมงคล
                </div>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <div className="w-7 h-7 rounded-full" style={{ background: day.lucky.color, boxShadow: `0 0 16px ${day.lucky.color}55` }} />
                  <div className="text-[16px] font-bold" style={{ color: "var(--text)" }}>
                    {day.lucky.colorTh}
                  </div>
                </div>
              </div>
            </div>

            {/* Disclaimers */}
            <div className="mx-4 mt-2 mb-4 text-center text-[11px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
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

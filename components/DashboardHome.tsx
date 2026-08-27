"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import DailyBonus from "./DailyBonus";
import PointsBalance from "./PointsBalance";
import { SPREADS, type SpreadType } from "@/lib/cards";

export default function DashboardHome() {
  const [userId, setUserId] = useState<string | null>(null);
  const [points, setPoints] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }: { data: { user: { id: string } | null } }) => {
      if (data.user) {
        setUserId(data.user.id);
        supabase
          .from("profiles")
          .select("points")
          .eq("id", data.user.id)
          .single()
          .then(({ data: p }: { data: { points: number } | null }) => {
            if (p) setPoints(p.points);
          });
      }
    });
  }, []);

  const handleDailyBonus = (amount: number) => {
    setPoints((prev) => prev + amount);
  };

  const handleSpreadSelect = (spreadId: SpreadType) => {
    window.location.href = `/dashboard/reading?spread=${spreadId}`;
  };

  const spreads = Object.entries(SPREADS) as [SpreadType, typeof SPREADS[SpreadType]][];

  return (
    <div className="dashboard-home">
      {/* Daily Bonus Section */}
      <div className="daily-bonus-section">
        <div className="daily-bonus-inner">
          <div className="daily-bonus-title">+ โบนัสรายวัน +</div>
          <div className="daily-bonus-sub">รับแต้มทุกวัน</div>
          {userId && <DailyBonus userId={userId} onClaim={handleDailyBonus} />}
        </div>
      </div>

      {/* Main Tarot CTA */}
      <div className="dashboard-section" style={{ paddingTop: 20 }}>
        <div className="spread-card-main" onClick={() => handleSpreadSelect("three_card")}>
          <div className="spread-card-content">
            <div className="spread-card-icon">🔮</div>
            <div>
              <div className="spread-card-label">ไพ่ทาโรต์</div>
              <div className="spread-card-name">อ่านไพ่ทาโรต์</div>
              <div className="spread-card-desc">ดูดวงชะตา และรับคำทำนาย</div>
            </div>
          </div>
          <div className="spread-card-arrow">›</div>
        </div>
      </div>

      {/* Spread Selection Grid */}
      <div className="dashboard-section">
        <h2 className="section-title-lg" style={{ marginBottom: 10 }}>เลือกการทำนาย</h2>
        <div className="feature-grid">
          {spreads.map(([key, spread]) => (
            <div
              key={key}
              className="feature-card"
              onClick={() => handleSpreadSelect(key)}
            >
              <div className="feature-icon">
                {key === "single" ? "✨" : key === "three_card" ? "🃏" : "🔮"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="feature-title">{spread.nameTh}</div>
                <div className="feature-desc">{spread.cardCount} ใบ · {spread.cost} แต้ม</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Coming Soon - compact single row */}
      <div className="dashboard-section">
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {[
            { icon: "♈", label: " Birth Chart" },
            { icon: "🌙", label: "Oracle" },
            { icon: "💕", label: "ความรัก" },
            { icon: "🎴", label: "Horoscope" },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-2 px-3 py-2 rounded-lg flex-shrink-0"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                opacity: 0.6,
              }}
            >
              <span className="text-sm">{item.icon}</span>
              <span className="text-[12px] font-medium whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                {item.label}
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                style={{ background: "var(--primary-soft)", color: "var(--primary)" }}>
                เร็วๆ นี้
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Points */}
      <div className="dashboard-section">
        <PointsBalance points={points} />
      </div>
    </div>
  );
}

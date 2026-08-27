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

      {/* Main Spread Card */}
      <div className="dashboard-section">
        <h2 className="section-title-lg">ไพ่ทาโรส</h2>
        <div className="spread-card-main" onClick={() => handleSpreadSelect("three_card")}>
          <div className="spread-card-content">
            <div className="spread-card-icon">🔮</div>
            <div>
              <div className="spread-card-label">ไพ่ทาโรส</div>
              <div className="spread-card-name">อ่านไพ่ทาโรส</div>
              <div className="spread-card-desc">ดูดวงชะตา และรับคำทำนาย</div>
            </div>
          </div>
          <div className="spread-card-arrow">›</div>
        </div>
      </div>

      {/* Birth Chart - Coming Soon */}
      <div className="dashboard-section">
        <div className="spread-card-secondary coming-soon-card">
          <div className="spread-card-content">
            <div className="spread-card-icon-small">♈</div>
            <div>
              <div className="spread-card-label-tag">
                <span className="label-tag">BIRTH CHART</span>
                <span className="label-badge-new">+ ใหม่</span>
              </div>
              <div className="spread-card-name">แผนที่ดวงชะตาราศี</div>
              <div className="spread-card-sub">Sun · Moon · Ascendant</div>
            </div>
          </div>
          <span className="coming-soon-badge">เร็วๆ นี้</span>
        </div>
      </div>

      {/* Oracle - Coming Soon */}
      <div className="dashboard-section">
        <div className="oracle-card coming-soon-card">
          <div className="spread-card-content">
            <div className="spread-card-icon-small">🌙</div>
            <div>
              <div className="spread-card-label-tag">
                <span className="label-tag-oracle">ORACLE</span>
              </div>
              <div className="spread-card-name-oracle">ทำนายฝัน</div>
              <div className="spread-card-desc-oracle">เปิดดวงชะตา ทำนายความฝัน</div>
            </div>
          </div>
          <span className="coming-soon-badge coming-soon-dark">เร็วๆ นี้</span>
        </div>
      </div>

      {/* Quick Spread Selection */}
      <div className="dashboard-section">
        <h2 className="section-title-lg mb-3">เลือกการทำนาย</h2>
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

      {/* Coming Soon Features */}
      <div className="dashboard-section">
        <div className="feature-grid">
          <div className="feature-card coming-soon-card">
            <div className="feature-icon">💕</div>
            <div className="flex-1 min-w-0">
              <div className="feature-title">ความรัก</div>
              <div className="feature-desc">ดวงความรัก</div>
            </div>
            <span className="coming-soon-badge-sm">เร็วๆ นี้</span>
          </div>
          <div className="feature-card coming-soon-card">
            <div className="feature-icon">🌙</div>
            <div className="flex-1 min-w-0">
              <div className="feature-title">ดูดวง.ai</div>
              <div className="feature-desc">AI ทำนาย</div>
            </div>
            <span className="coming-soon-badge-sm">เร็วๆ นี้</span>
          </div>
          <div className="feature-card coming-soon-card">
            <div className="feature-icon">📞</div>
            <div className="flex-1 min-w-0">
              <div className="feature-title">เบอร์โทรศัพท์</div>
              <div className="feature-desc">เช็คดวงเบอร์</div>
            </div>
            <span className="coming-soon-badge-sm">เร็วๆ นี้</span>
          </div>
          <div className="feature-card coming-soon-card">
            <div className="feature-icon">🎴</div>
            <div className="flex-1 min-w-0">
              <div className="feature-title">Horoscope</div>
              <div className="feature-desc">ดวงรายวัน</div>
            </div>
            <span className="coming-soon-badge-sm">เร็วๆ นี้</span>
          </div>
        </div>
      </div>

      {/* Points */}
      <div className="dashboard-section">
        <PointsBalance points={points} />
      </div>
    </div>
  );
}

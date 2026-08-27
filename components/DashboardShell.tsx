"use client";

import { useState, useEffect } from "react";
import Topbar from "./Topbar";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import { createClient } from "@/lib/supabase/client";
import DailyBonus from "./DailyBonus";
import PointsBalance from "./PointsBalance";
import SpreadSelector from "./SpreadSelector";
import { Sparkles, CreditCard, LayoutDashboard } from "lucide-react";

interface DashboardShellProps {
  children?: React.ReactNode;
}

export default function DashboardShell({ children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<{
    display_name: string;
    avatar_url: string;
    points: number;
    is_admin: boolean;
  } | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }: { data: { user: { id: string } | null } }) => {
      if (data.user) {
        supabase
          .from("profiles")
          .select("display_name, avatar_url, points, is_admin")
          .eq("id", data.user.id)
          .single()
          .then(({ data: p }: { data: { display_name: string; avatar_url: string; points: number; is_admin: boolean } | null }) => {
            if (p) setProfile(p);
          });
      }
    });
  }, []);

  const handleDailyBonus = (amount: number) => {
    setProfile((prev) => (prev ? { ...prev, points: prev.points + amount } : prev));
  };

  const handleSpreadSelect = (spreadId: string) => {
    window.location.href = `/dashboard/reading?spread=${spreadId}`;
  };

  return (
    <div className="app-shell">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isAdmin={profile?.is_admin}
      />

      <div className="main-area">
        <Topbar
          userName={profile?.display_name}
          userAvatar={profile?.avatar_url}
          points={profile?.points ?? 0}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="content" style={{ padding: 0 }}>
          {children ?? (
            <div className="dashboard-home">
              {/* Daily Bonus Section */}
              <div className="daily-bonus-section">
                <div className="daily-bonus-inner">
                  <div className="daily-bonus-title">+ โบนัสรายวัน +</div>
                  <div className="daily-bonus-sub">แต้มBonusทุกวัน</div>
                  <DailyBonus userId="" onClaim={handleDailyBonus} />
                </div>
              </div>

              {/* Tarot Section */}
              <div className="dashboard-section">
                <div className="section-header">
                  <h2 className="section-title-lg">ไพ่ทาโรส</h2>
                </div>
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

              {/* Birth Chart Section */}
              <div className="dashboard-section">
                <div className="section-header">
                  <h2 className="section-title-sm">แผนที่ดวงชะตาราศี และ ไพ่ทาโรต์ ๗</h2>
                </div>
                <div className="spread-card-secondary">
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
                  <div className="spread-card-arrow">›</div>
                </div>
              </div>

              {/* Oracle Section */}
              <div className="dashboard-section">
                <div className="oracle-card">
                  <div className="spread-card-content">
                    <div className="spread-card-icon-small">🌙</div>
                    <div>
                      <div className="spread-card-label-tag">
                        <span className="label-tag">ORACLE</span>
                      </div>
                      <div className="spread-card-name-oracle">อยากฝันรึเปล่ามาก답</div>
                      <div className="spread-card-desc-oracle">เปิดดวงชะตา นอนนี้ฝันอะไรเอ่ย</div>
                    </div>
                  </div>
                  <div className="spread-card-arrow-oracle">›</div>
                </div>
              </div>

              {/* Quick Features Grid */}
              <div className="dashboard-section">
                <div className="feature-grid">
                  <div className="feature-card" onClick={() => handleSpreadSelect("single")}>
                    <div className="feature-icon">✨</div>
                    <div>
                      <div className="feature-title">Yes / No</div>
                      <div className="feature-desc">คำถามสั้นๆ</div>
                    </div>
                  </div>
                  <div className="feature-card">
                    <div className="feature-icon">💕</div>
                    <div>
                      <div className="feature-title">ความรัก</div>
                      <div className="feature-desc">ดวงความรัก</div>
                    </div>
                    <span className="feature-badge-new">ใหม่</span>
                  </div>
                  <div className="feature-card">
                    <div className="feature-icon">🌙</div>
                    <div>
                      <div className="feature-title">ดูดวง.ai</div>
                      <div className="feature-desc">ดูดวงAI</div>
                    </div>
                  </div>
                  <div className="feature-card">
                    <div className="feature-icon">🔮</div>
                    <div>
                      <div className="feature-title">เบอร์โทรส์</div>
                      <div className="feature-desc">เช็คดวงเบอร์</div>
                    </div>
                    <span className="feature-badge-new">ใหม่</span>
                  </div>
                </div>
              </div>

              {/* Points Section */}
              <div className="dashboard-section">
                <PointsBalance points={profile?.points ?? 0} />
              </div>
            </div>
          )}
        </main>
      </div>

      <BottomNav isAdmin={profile?.is_admin} />
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Topbar from "./Topbar";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import { createClient } from "@/lib/supabase/client";
import DailyBonus from "./DailyBonus";
import PointsBalance from "./PointsBalance";
import SpreadSelector from "./SpreadSelector";

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

        <main className="content">
          {children ?? (
            <div className="dashboard-home">
              {/* Daily Bonus */}
              <DailyBonus userId="" onClaim={handleDailyBonus} />

              {/* Spread Selector */}
              <div className="section-title">เลือกการทำนาย</div>
              <SpreadSelector
                onSelect={handleSpreadSelect}
                selectedSpread={null}
                userPoints={profile?.points ?? 0}
              />

              {/* Points */}
              <div className="section-title">คะแนนของฉัน</div>
              <PointsBalance points={profile?.points ?? 0} />
            </div>
          )}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}

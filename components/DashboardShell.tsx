"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import Topbar from "./Topbar";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";

interface DashboardShellProps {
  userName?: string;
  userAvatar?: string;
  points?: number;
  isAdmin?: boolean;
  children?: React.ReactNode;
}

export default function DashboardShell({
  userName,
  userAvatar,
  points = 0,
  isAdmin = false,
  children,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isAdmin={isAdmin}
      />

      <div className="main-area">
        <Topbar
          userName={userName}
          userAvatar={userAvatar}
          points={points}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="content">
          {children ?? (
            <div className="empty">
              <div className="empty-icon">
                <Sparkles size={24} />
              </div>
              <div className="empty-title">ยินดีต้อนรับ</div>
              <div className="empty-sub">เริ่มต้นทำนายชะตาของคุณ</div>
            </div>
          )}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}

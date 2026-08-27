"use client";

import { useTheme } from "@/lib/theme";
import { Moon, Sun, Menu, Coins } from "lucide-react";

interface TopbarProps {
  userName?: string;
  userAvatar?: string;
  points?: number;
  onMenuClick?: () => void;
}

export default function Topbar({ userName, userAvatar, points = 0, onMenuClick }: TopbarProps) {
  const { theme, toggle } = useTheme();

  return (
    <header
      className="sticky top-0 z-50 flex items-center justify-between gap-3 px-4 lg:px-6 h-14"
      style={{
        background: "color-mix(in srgb, var(--bg) 85%, transparent)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="btn-icon lg:hidden"
          aria-label="เปิดเมนู"
        >
          <Menu size={18} />
        </button>
        <span className="text-[15px] font-bold tracking-tight hidden sm:block">
          Tarot Destiny
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* Points balance */}
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-semibold"
          style={{ background: "var(--amber-soft)", color: "var(--amber)" }}
        >
          <Coins size={14} />
          <span>{points.toLocaleString()}</span>
        </div>

        {/* Theme toggle */}
        <button onClick={toggle} className="btn-icon" aria-label="toggle theme">
          {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
        </button>

        {/* User avatar */}
        {userName && (
          <div className="flex items-center gap-2">
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={userName}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold"
                style={{ background: "var(--primary)", color: "var(--text-invert)" }}
              >
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

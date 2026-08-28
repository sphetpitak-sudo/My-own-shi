"use client";

import Image from "next/image";
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
        background: "color-mix(in srgb, var(--bg) 80%, transparent)",
        backdropFilter: "blur(20px) saturate(1.2)",
        WebkitBackdropFilter: "blur(20px) saturate(1.2)",
        borderBottom: "1px solid var(--border-subtle)",
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
        <Image
          src="/LOGO.png"
          alt="Sealo"
          width={28}
          height={28}
          className="w-7 h-7 rounded-lg lg:hidden"
        />
        <span className="text-[15px] font-bold tracking-tight hidden sm:block">
          Sealo
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* Points balance */}
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-semibold"
          style={{
            background: "var(--amber-soft)",
            color: "var(--gold)",
            border: "1px solid rgba(212, 175, 55, 0.08)",
          }}
          role="status"
          aria-label={`คะแนนคงเหลือ ${points.toLocaleString()}`}
        >
          <Coins size={14} />
          <span>{points.toLocaleString()}</span>
        </div>

        {/* Theme toggle */}
        <button onClick={toggle} className="btn-icon" aria-label={theme === "light" ? "โหมดมืด" : "โหมดสว่าง"}>
          {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
        </button>

        {/* User avatar */}
        {userName && (
          <div className="flex items-center gap-2">
            {userAvatar ? (
              <Image
                src={userAvatar}
                alt={userName}
                width={32}
                height={32}
                unoptimized
                className="w-8 h-8 rounded-full object-cover"
                style={{
                  border: "2px solid var(--border)",
                }}
              />
            ) : (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold"
                style={{
                  background: "linear-gradient(135deg, var(--primary), #a78bfa)",
                  color: "white",
                }}
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

"use client";

import Image from "next/image";
import { useTheme } from "@/lib/theme";
import { Moon, Sun, Menu, Bell } from "lucide-react";
import PointsBadge from "./ui/PointsBadge";
import { useToast } from "@/components/Toast";

interface TopbarProps {
  userName?: string;
  userAvatar?: string;
  points?: number;
  onMenuClick?: () => void;
}

export default function Topbar({
  userName,
  userAvatar,
  points,
  onMenuClick,
}: TopbarProps) {
  const { theme, toggle } = useTheme();
  const { toast } = useToast();

  return (
    <header
      className="sticky top-0 z-50 flex items-center justify-between gap-3 px-4 lg:px-8 h-15 border-b border-[var(--border-subtle)]"
      style={{
        background: "color-mix(in srgb, var(--bg) 82%, transparent)",
        backdropFilter: "blur(20px) saturate(1.2)",
        WebkitBackdropFilter: "blur(20px) saturate(1.2)",
      }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="btn-icon touch-hit lg:hidden text-[var(--text-secondary)] hover:text-[var(--text)]"
          aria-label="เปิดเมนู"
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center relative overflow-hidden shrink-0 shadow-sm"
            style={{
              background: "linear-gradient(135deg, var(--primary), #c4b5fd)",
            }}
          >
            <Image
              src="/logo-512.webp"
              alt="Sealo"
              width={32}
              height={32}
              className="w-full h-full object-cover"
              priority
            />
          </div>
          <span className="text-[16px] font-extrabold tracking-tight hidden sm:inline-block" style={{ letterSpacing: "-0.02em" }}>
            Sealo
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <PointsBadge points={points} size="sm" showPopOnChange tone="gold" />

        <button
          className="btn-icon touch-hit"
          aria-label="การแจ้งเตือน"
          title="การแจ้งเตือน"
          onClick={() => toast("ฟีเจอร์การแจ้งเตือนเร็ว ๆ นี้", "info")}
        >
          <Bell size={16} />
        </button>

        <button
          onClick={toggle}
          className="btn-icon touch-hit"
          aria-label={theme === "light" ? "เปลี่ยนเป็นโหมดมืด" : "เปลี่ยนเป็นโหมดสว่าง"}
          title={theme === "light" ? "โหมดมืด" : "โหมดสว่าง"}
        >
          {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
        </button>

        {userName && (
          <div className="flex items-center pl-1">
            {userAvatar ? (
              <Image
                src={userAvatar}
                alt={userName}
                width={32}
                height={32}
                unoptimized
                className="w-8 h-8 rounded-full object-cover border border-[var(--border-strong)] shadow-xs"
              />
            ) : (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-extrabold shadow-xs"
                style={{
                  background: "linear-gradient(135deg, var(--primary), #c4b5fd)",
                  color: "#ffffff",
                }}
                aria-hidden
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

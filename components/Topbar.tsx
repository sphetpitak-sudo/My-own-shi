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
  points = 0,
  onMenuClick,
}: TopbarProps) {
  const { theme, toggle } = useTheme();
  const { toast } = useToast();

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
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          onClick={onMenuClick}
          className="btn-icon lg:hidden"
          aria-label="เปิดเมนู"
        >
          <Menu size={18} />
        </button>
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, var(--primary), #a78bfa)",
              boxShadow: "0 2px 6px rgba(109, 40, 217, 0.25)",
            }}
          >
            <Image
              src="/LOGO.png"
              alt="Sealo"
              width={28}
              height={28}
              className="w-full h-full object-cover"
              priority
            />
          </div>
          <span className="text-[15px] font-bold tracking-tight" style={{ letterSpacing: "-0.02em" }}>
            Sealo
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <PointsBadge points={points} size="sm" showPopOnChange />

        <button
          className="btn-icon"
          aria-label="การแจ้งเตือน"
          title="การแจ้งเตือน"
          onClick={() => toast("ฟีเจอร์การแจ้งเตือนเร็ว ๆ นี้", "info")}
        >
          <Bell size={15} />
        </button>

        <button
          onClick={toggle}
          className="btn-icon"
          aria-label={theme === "light" ? "โหมดมืด" : "โหมดสว่าง"}
        >
          {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
        </button>

        {userName && (
          <div className="flex items-center">
            {userAvatar ? (
              <Image
                src={userAvatar}
                alt={userName}
                width={32}
                height={32}
                unoptimized
                className="w-8 h-8 rounded-full object-cover"
                style={{ border: "2px solid var(--border)" }}
              />
            ) : (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold"
                style={{
                  background: "linear-gradient(135deg, var(--primary), #a78bfa)",
                  color: "white",
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

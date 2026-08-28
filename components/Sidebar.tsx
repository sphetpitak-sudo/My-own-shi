"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard,
  Sparkles,
  Clock,
  User,
  Shield,
  LogOut,
  X,
  Settings,
  Compass,
  Eye,
  CircleHelp,
  Sun,
  Star,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabase/client";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  isAdmin?: boolean;
  userPoints?: number;
}

const PRIMARY = [
  { href: "/dashboard", label: "หน้าหลัก", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/reading", label: "ทำนายใหม่", icon: Sparkles },
  { href: "/dashboard/daily", label: "ดูดวงรายวัน", icon: Sun },
  { href: "/dashboard/yesno", label: "ถามใช่หรือไม่", icon: CircleHelp },
  { href: "/dashboard/history", label: "ประวัติ", icon: Clock },
];

const TOOLS = [
  { href: "/dashboard/birthchart", label: "แผนที่ดวงดาว", icon: Compass },
  { href: "/dashboard/oracle", label: "ไพ่ลางสังหรณ์", icon: Eye },
];

const PERSONAL = [
  { href: "/dashboard/profile", label: "โปรไฟล์", icon: User },
  { href: "/dashboard/settings", label: "ตั้งค่า", icon: Settings },
];

export default function Sidebar({ open, onClose, isAdmin, userPoints = 0 }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {open && <div className="overlay lg:hidden" onClick={onClose} />}

      <aside className={cn("sidebar", open && "open")}>
        {/* Brand */}
        <div className="sidebar-brand">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, var(--primary), #a78bfa)",
              boxShadow: "0 2px 8px rgba(167, 139, 250, 0.3)",
            }}
          >
            <Image src="/LOGO.png" alt="Sealo" width={36} height={36} className="w-full h-full object-cover" />
          </div>
          <div>
            <span className="text-[15px] font-bold tracking-tight text-white block leading-none">Sealo</span>
            <span className="text-[10px] font-semibold tracking-wider uppercase" style={{ color: "rgba(255,255,255,0.35)" }}>
              ไพ่ทาโรต์ · AI
            </span>
          </div>
          <button
            onClick={onClose}
            className="ml-auto lg:hidden text-white/30 hover:text-white/80 transition-colors"
            aria-label="ปิดเมนู"
          >
            <X size={18} />
          </button>
        </div>

        {/* Quick stats */}
        <div
          className="rounded-xl p-3 mb-3 flex items-center gap-2.5"
          style={{
            background: "rgba(212, 175, 55, 0.08)",
            border: "1px solid rgba(212, 175, 55, 0.15)",
          }}
        >
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, #f6c944, #b8942a)",
            }}
          >
            <Star size={15} style={{ color: "#3a2a00" }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "rgba(212, 175, 55, 0.7)" }}>
              คะแนน
            </div>
            <div className="text-[15px] font-extrabold" style={{ color: "var(--gold)" }}>
              {userPoints.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Main */}
        <div className="sidebar-label">เมนูหลัก</div>
        <nav className="flex flex-col gap-0.5">
          {PRIMARY.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn("nav-item", isActive && "active")}
              >
                <span className="nav-icon">
                  <Icon size={18} />
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Tools */}
        <div className="sidebar-label">เครื่องมือ</div>
        <nav className="flex flex-col gap-0.5">
          {TOOLS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn("nav-item", isActive && "active")}
              >
                <span className="nav-icon">
                  <Icon size={18} />
                </span>
                <span className="flex-1">{item.label}</span>
                {(item as { soon?: boolean }).soon && (
                  <span
                    className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-md"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      color: "rgba(255,255,255,0.4)",
                    }}
                  >
                    เร็ว ๆ นี้
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Personal */}
        <div className="sidebar-label">ส่วนตัว</div>
        <nav className="flex flex-col gap-0.5">
          {PERSONAL.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn("nav-item", isActive && "active")}
              >
                <span className="nav-icon">
                  <Icon size={18} />
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {isAdmin && (
          <>
            <div className="sidebar-label">จัดการ</div>
            <Link
              href="/admin"
              onClick={onClose}
              className={cn("nav-item", pathname.startsWith("/admin") && "active")}
            >
              <span className="nav-icon">
                <Shield size={18} />
              </span>
              แอดมิน
            </Link>
          </>
        )}

        <div className="sidebar-footer">
          <button
            onClick={async () => {
              const supabase = createClient();
              await supabase.auth.signOut();
              window.location.href = "/";
            }}
            className="nav-item"
            aria-label="ออกจากระบบ"
          >
            <span className="nav-icon">
              <LogOut size={18} />
            </span>
            ออกจากระบบ
          </button>
        </div>
      </aside>
    </>
  );
}

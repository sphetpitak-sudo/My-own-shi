"use client";

import { usePathname, useRouter } from "next/navigation";
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
  Coins,
  Layers,
  MessageCircle,
  Globe,
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
  { href: "/dashboard/chat", label: "Sealo Chat", icon: MessageCircle },
  { href: "/dashboard/reading", label: "เปิดไพ่พยากรณ์", icon: Sparkles },
  { href: "/dashboard/daily", label: "ดูดวงรายวัน", icon: Sun },
  { href: "/dashboard/yesno", label: "ถามใช่หรือไม่", icon: CircleHelp },
  { href: "/dashboard/collection", label: "คอลเลกชันไพ่", icon: Layers },
  { href: "/dashboard/history", label: "บันทึกคำทำนาย", icon: Clock },
];

const TOOLS: Array<{ href: string; label: string; icon: typeof Star; soon?: boolean }> = [
  { href: "/dashboard/zodiac", label: "ดูดวงตามวันเกิด", icon: Star },
  { href: "/dashboard/birthchart", label: "แผนที่ดวงดาว", icon: Compass },
  { href: "/dashboard/atlas", label: "Atlas แผนที่โลก", icon: Globe },
  { href: "/dashboard/oracle", label: "ไพ่ลางสังหรณ์", icon: Eye },
];

const PERSONAL = [
  { href: "/dashboard/profile", label: "โปรไฟล์", icon: User },
  { href: "/dashboard/settings", label: "ตั้งค่าบัญชี", icon: Settings },
];

export default function Sidebar({ open, onClose, isAdmin, userPoints = 0 }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99] lg:hidden animate-fade"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={cn("sidebar", open && "open")}>
        {/* Brand */}
        <div className="sidebar-brand">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center relative overflow-hidden shrink-0"
            style={{
              background: "linear-gradient(135deg, var(--primary), #c4b5fd)",
              boxShadow: "0 2px 10px rgba(167, 139, 250, 0.25)",
            }}
          >
            <Image src="/logo-192.webp" alt="Sealo" width={40} height={40} className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0">
            <span className="text-[16px] font-extrabold tracking-tight text-white block leading-tight">Sealo</span>
            <span className="text-[10px] font-semibold tracking-wider uppercase text-white/40 block">
              Thai AI Tarot
            </span>
          </div>
          <button
            onClick={onClose}
            className="ml-auto lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white/90 hover:bg-white/5 transition-all"
            aria-label="ปิดเมนู"
          >
            <X size={18} />
          </button>
        </div>

        {/* Quick points widget */}
        <Link
          href="/dashboard/profile"
          onClick={onClose}
          className="rounded-xl p-3 mb-2 flex items-center gap-3 transition-all duration-200 hover:brightness-110 group"
          style={{
            background: "linear-gradient(135deg, rgba(212, 175, 55, 0.12), rgba(184, 148, 42, 0.04))",
            border: "1px solid rgba(212, 175, 55, 0.22)",
          }}
        >
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 shadow-sm"
            style={{
              background: "linear-gradient(135deg, #f6c944, #b8942a)",
              color: "#281c00",
            }}
          >
            <Coins size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#d4af37]/80">
              แต้มสะสม
            </div>
            <div className="text-[16px] font-extrabold text-[#d4af37] leading-none mt-0.5 tabular-nums">
              {userPoints.toLocaleString()}
            </div>
          </div>
        </Link>

        {/* Main Nav */}
        <div className="sidebar-label">เมนูหลัก</div>
        <nav className="flex flex-col gap-1">
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

        {/* Tools Nav */}
        <div className="sidebar-label">เครื่องมือพยากรณ์</div>
        <nav className="flex flex-col gap-1">
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
                {item.soon && (
                  <span
                    className="text-[9.5px] font-bold px-2 py-0.5 rounded-full"
                    style={{
                      background: "rgba(255, 255, 255, 0.08)",
                      color: "rgba(255, 255, 255, 0.45)",
                    }}
                  >
                    เร็ว ๆ นี้
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Personal Nav */}
        <div className="sidebar-label">ส่วนตัว</div>
        <nav className="flex flex-col gap-1">
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
            <div className="sidebar-label">จัดการระบบ</div>
            <Link
              href="/admin"
              onClick={onClose}
              className={cn("nav-item", pathname.startsWith("/admin") && "active")}
            >
              <span className="nav-icon">
                <Shield size={18} />
              </span>
              แผงควบคุมแอดมิน
            </Link>
          </>
        )}

        <div className="sidebar-footer">
          <button
            onClick={async () => {
              const supabase = createClient();
              await supabase.auth.signOut();
              router.push("/");
            }}
            className="nav-item text-white/50 hover:text-red-400 hover:bg-red-500/10"
            aria-label="ออกจากระบบ"
          >
            <span className="nav-icon text-inherit">
              <LogOut size={18} />
            </span>
            ออกจากระบบ
          </button>
        </div>
      </aside>
    </>
  );
}

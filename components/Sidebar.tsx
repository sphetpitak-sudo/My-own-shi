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
} from "lucide-react";
import { cn } from "@/lib/cn";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  isAdmin?: boolean;
}

const navItems = [
  { href: "/dashboard", label: "หน้าหลัก", icon: LayoutDashboard },
  { href: "/dashboard/reading", label: "ทำนายใหม่", icon: Sparkles },
  { href: "/dashboard/history", label: "ประวัติ", icon: Clock },
  { href: "/dashboard/profile", label: "โปรไฟล์", icon: User },
  { href: "/dashboard/settings", label: "ตั้งค่า", icon: Settings },
];

export default function Sidebar({ open, onClose, isAdmin }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="overlay lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "sidebar",
          open && "open"
        )}
      >
        <div className="sidebar-brand">
          <Image
            src="/LOGO.png"
            alt="Sealo"
            width={36}
            height={36}
            className="w-9 h-9 rounded-xl"
          />
          <span className="text-[15px] font-bold tracking-tight text-white">
            Sealo
          </span>
          <button
            onClick={onClose}
            className="ml-auto lg:hidden text-white/30 hover:text-white/80 transition-colors"
            aria-label="ปิดเมนู"
          >
            <X size={18} />
          </button>
        </div>

        <div className="sidebar-label">เมนูหลัก</div>

        <nav className="flex flex-col gap-0.5">
          {navItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn("nav-item", isActive && "active")}
              >
                <span className="nav-icon">
                  <item.icon size={18} />
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
              const { createClient } = await import("@/lib/supabase/client");
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

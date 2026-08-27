"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Calendar, Sparkles, User, BarChart3 } from "lucide-react";
import { cn } from "@/lib/cn";

const items = [
  { href: "/dashboard", label: "หน้าหลัก", icon: LayoutDashboard },
  { href: "/dashboard/reading", label: "ไพ่", icon: Sparkles },
  { href: "/dashboard/history", label: "ประวัติ", icon: Calendar },
  { href: "/dashboard/stats", label: "สถิติ", icon: BarChart3 },
  { href: "/dashboard/profile", label: "โปรไฟล์", icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav">
      {items.map((item) => {
        const isActive =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn("bottom-nav-item", isActive && "active")}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

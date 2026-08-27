"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, Sparkles, User } from "lucide-react";
import { cn } from "@/lib/cn";

export default function BottomNav() {
  const pathname = usePathname();

  const items = [
    { href: "/dashboard", label: "หน้าหลัก", icon: Home },
    { href: "/dashboard/reading", label: "ไพ่", icon: Sparkles },
    { href: "/dashboard/history", label: "ประวัติ", icon: Calendar },
    { href: "/dashboard/profile", label: "โปรไฟล์", icon: User },
  ];

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
            aria-label={item.label}
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

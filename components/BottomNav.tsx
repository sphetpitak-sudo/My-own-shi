"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Sparkles, Sun, Clock, User } from "lucide-react";
import { cn } from "@/lib/cn";

export default function BottomNav() {
  const pathname = usePathname();

  const items = [
    { href: "/dashboard", label: "หน้าหลัก", icon: Home, exact: true },
    { href: "/dashboard/reading", label: "ไพ่", icon: Sparkles },
    { href: "/dashboard/daily", label: "รายวัน", icon: Sun },
    { href: "/dashboard/history", label: "ประวัติ", icon: Clock },
    { href: "/dashboard/profile", label: "ฉัน", icon: User },
  ];

  return (
    <nav className="bottom-nav" aria-label="นำทางหลัก">
      {items.map((item) => {
        const isActive = item.exact
          ? pathname === item.href
          : pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            aria-current={isActive ? "page" : undefined}
            className={cn("bottom-nav-item", isActive && "active")}
          >
            <Icon size={20} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

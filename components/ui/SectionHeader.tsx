"use client";

import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
  align?: "left" | "center";
}

export default function SectionHeader({
  title,
  subtitle,
  trailing,
  className,
  size = "md",
  align = "left",
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-end justify-between gap-3 flex-wrap",
        align === "center" && "justify-center text-center",
        className
      )}
    >
      <div className="min-w-0">
        <h2
          className={cn(
            "font-bold tracking-tight",
            size === "sm" && "text-[14px] text-[var(--text-secondary)]",
            size === "md" && "text-[18px] text-[var(--text)]",
            size === "lg" && "text-[22px] text-[var(--text)]"
          )}
          style={{ letterSpacing: "-0.01em" }}
        >
          {title}
        </h2>
        {subtitle && (
          <p className="text-[12px] mt-1 text-[var(--text-muted)] leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
      {trailing && <div className="flex items-center gap-2">{trailing}</div>}
    </div>
  );
}

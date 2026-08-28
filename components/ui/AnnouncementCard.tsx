"use client";

import { cn } from "@/lib/cn";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";

interface AnnouncementCardProps {
  tag: string;
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  cta?: string;
  onClick?: () => void;
  href?: string;
  className?: string;
  tone?: "violet" | "gold" | "rose" | "teal" | "indigo" | "amber";
}

const TONE_GRADIENT: Record<NonNullable<AnnouncementCardProps["tone"]>, string> = {
  violet: "linear-gradient(135deg, rgba(167, 139, 250, 0.12), rgba(109, 40, 217, 0.04))",
  gold: "linear-gradient(135deg, rgba(212, 175, 55, 0.12), rgba(184, 148, 42, 0.04))",
  rose: "linear-gradient(135deg, rgba(244, 114, 182, 0.12), rgba(236, 72, 153, 0.04))",
  teal: "linear-gradient(135deg, rgba(20, 184, 166, 0.12), rgba(13, 148, 136, 0.04))",
  indigo: "linear-gradient(135deg, rgba(129, 140, 248, 0.12), rgba(99, 102, 241, 0.04))",
  amber: "linear-gradient(135deg, rgba(251, 191, 36, 0.12), rgba(245, 158, 11, 0.04))",
};

const TONE_ACCENT: Record<NonNullable<AnnouncementCardProps["tone"]>, string> = {
  violet: "var(--primary)",
  gold: "var(--gold)",
  rose: "#f472b6",
  teal: "#14b8a6",
  indigo: "#818cf8",
  amber: "#fbbf24",
};

export default function AnnouncementCard({
  tag,
  title,
  subtitle,
  icon: Icon,
  cta,
  onClick,
  href,
  className,
  tone = "violet",
}: AnnouncementCardProps) {
  const content = (
    <div
      className={cn("announce-card", className)}
      style={{ background: TONE_GRADIENT[tone] }}
    >
      <div
        className="announce-icon"
        style={{ background: `${TONE_ACCENT[tone]}1F`, color: TONE_ACCENT[tone] }}
      >
        <Icon size={20} />
      </div>
      <div className="announce-body">
        <div className="announce-tag" style={{ color: TONE_ACCENT[tone] }}>
          {tag}
        </div>
        <div className="announce-title">{title}</div>
        {subtitle && <div className="announce-sub">{subtitle}</div>}
      </div>
      {cta && (
        <div
          className="flex items-center gap-1 text-[12px] font-bold whitespace-nowrap"
          style={{ color: TONE_ACCENT[tone] }}
        >
          {cta}
          <ArrowRight size={13} />
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <a href={href} className="block">
        {content}
      </a>
    );
  }
  if (onClick) {
    return (
      <button onClick={onClick} className="block w-full text-left">
        {content}
      </button>
    );
  }
  return content;
}

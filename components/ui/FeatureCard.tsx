"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import { Coins, Lock, Sparkles, type LucideIcon } from "lucide-react";
import type { FeatureMeta } from "@/lib/features/catalog";

interface FeatureCardProps {
  feature: FeatureMeta;
  userPoints?: number;
  onClick?: () => void;
  className?: string;
  variant?: "default" | "compact" | "hero";
}

const THEME_GRADIENT: Record<FeatureMeta["theme"], string> = {
  violet: "linear-gradient(140deg, rgba(167, 139, 250, 0.10), rgba(109, 40, 217, 0.04))",
  gold: "linear-gradient(140deg, rgba(212, 175, 55, 0.10), rgba(184, 148, 42, 0.04))",
  rose: "linear-gradient(140deg, rgba(244, 114, 182, 0.10), rgba(236, 72, 153, 0.04))",
  teal: "linear-gradient(140deg, rgba(20, 184, 166, 0.10), rgba(13, 148, 136, 0.04))",
  indigo: "linear-gradient(140deg, rgba(129, 140, 248, 0.10), rgba(99, 102, 241, 0.04))",
  amber: "linear-gradient(140deg, rgba(251, 191, 36, 0.10), rgba(245, 158, 11, 0.04))",
};

const THEME_ACCENT: Record<FeatureMeta["theme"], string> = {
  violet: "var(--primary)",
  gold: "var(--gold)",
  rose: "#f472b6",
  teal: "#14b8a6",
  indigo: "#818cf8",
  amber: "#fbbf24",
};

const THEME_SOFT: Record<FeatureMeta["theme"], string> = {
  violet: "var(--primary-soft)",
  gold: "var(--gold-soft)",
  rose: "rgba(244, 114, 182, 0.10)",
  teal: "rgba(20, 184, 166, 0.10)",
  indigo: "rgba(129, 140, 248, 0.10)",
  amber: "rgba(251, 191, 36, 0.10)",
};

export default function FeatureCard({
  feature,
  userPoints = 0,
  onClick,
  className,
  variant = "default",
}: FeatureCardProps) {
  const Icon = feature.icon as LucideIcon;
  const isLocked = feature.status !== "live";
  const insufficient = !isLocked && userPoints < feature.cost && feature.cost > 0;
  const disabled = isLocked || insufficient;

  if (variant === "hero") {
    return (
      <FeatureCardLink
        feature={feature}
        disabled={disabled}
        onClick={onClick}
        className={cn("hero-card", className)}
      >
        <div
          className="hero-glow"
          style={{ background: THEME_GRADIENT[feature.theme] }}
        />
        <div className="hero-content">
          <div
            className="hero-icon"
            style={{
              background: THEME_SOFT[feature.theme],
              color: THEME_ACCENT[feature.theme],
            }}
          >
            <Icon size={24} />
          </div>
          <div className="hero-body">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="hero-tag" style={{ color: THEME_ACCENT[feature.theme] }}>
                {feature.subtitleTh}
              </span>
              {feature.badgeTh && (
                <span
                  className="hero-badge"
                  style={{
                    background: THEME_SOFT[feature.theme],
                    color: THEME_ACCENT[feature.theme],
                  }}
                >
                  {feature.badgeTh}
                </span>
              )}
            </div>
            <h3 className="hero-title">{feature.titleTh}</h3>
            <p className="hero-desc">{feature.descriptionTh}</p>
            <div className="hero-meta">
              {isLocked ? (
                <span className="hero-status-soon">
                  <Lock size={11} /> เร็ว ๆ นี้
                </span>
              ) : (
                <span
                  className="hero-status-cost"
                  style={{ color: THEME_ACCENT[feature.theme] }}
                >
                  {feature.cost === 0 ? (
                    <>
                      <Sparkles size={12} /> ฟรี
                    </>
                  ) : (
                    <>
                      <Coins size={12} /> {feature.cost} แต้ม
                    </>
                  )}
                </span>
              )}
              <span className="hero-cta" style={{ color: THEME_ACCENT[feature.theme] }}>
                {isLocked ? "ดูตัวอย่าง" : "เริ่มเลย"} →
              </span>
            </div>
          </div>
        </div>
      </FeatureCardLink>
    );
  }

  if (variant === "compact") {
    return (
      <FeatureCardLink
        feature={feature}
        disabled={disabled}
        onClick={onClick}
        className={cn("feature-card-compact", className)}
      >
        <div
          className="fc-icon"
          style={{
            background: THEME_SOFT[feature.theme],
            color: THEME_ACCENT[feature.theme],
          }}
        >
          <Icon size={18} />
        </div>
        <div className="fc-body">
          <div className="fc-title">{feature.titleTh}</div>
          <div className="fc-sub">{feature.subtitleTh}</div>
        </div>
        {isLocked && <Lock size={12} className="fc-lock" />}
        {!isLocked && feature.cost > 0 && (
          <span
            className="fc-cost"
            style={{ color: insufficient ? "var(--red)" : THEME_ACCENT[feature.theme] }}
          >
            {feature.cost}
          </span>
        )}
      </FeatureCardLink>
    );
  }

  return (
    <FeatureCardLink
      feature={feature}
      disabled={disabled}
      onClick={onClick}
      className={cn("feature-card", className)}
    >
      <div
        className="fc-icon-lg"
        style={{
          background: THEME_SOFT[feature.theme],
          color: THEME_ACCENT[feature.theme],
        }}
      >
        <Icon size={22} />
      </div>
      <div className="fc-content">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="fc-title">{feature.titleTh}</span>
          {feature.badgeTh && (
            <span
              className="fc-tag"
              style={{ color: THEME_ACCENT[feature.theme] }}
            >
              {feature.badgeTh}
            </span>
          )}
        </div>
        <div className="fc-sub">{feature.subtitleTh}</div>
        {feature.descriptionTh && (
          <p className="fc-desc">{feature.descriptionTh}</p>
        )}
      </div>
      <div className="fc-bottom">
        {isLocked ? (
          <span className="fc-status-soon">
            <Lock size={11} /> เร็ว ๆ นี้
          </span>
        ) : feature.cost === 0 ? (
          <span className="fc-status-free" style={{ color: THEME_ACCENT[feature.theme] }}>
            <Sparkles size={11} /> ฟรี
          </span>
        ) : (
          <span
            className="fc-status-cost"
            style={{ color: insufficient ? "var(--red)" : THEME_ACCENT[feature.theme] }}
          >
            <Coins size={11} /> {feature.cost} แต้ม
          </span>
        )}
      </div>
    </FeatureCardLink>
  );
}

function FeatureCardLink({
  feature,
  disabled,
  onClick,
  className,
  children,
}: {
  feature: FeatureMeta;
  disabled: boolean;
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  const content = (
    <div className={cn(disabled && "opacity-70", "w-full")}>{children}</div>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={disabled ? undefined : onClick}
        className={cn("fc-root", disabled && "cursor-not-allowed", className)}
        aria-label={`${feature.titleTh} - ${feature.subtitleTh}`}
        aria-disabled={disabled}
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      href={feature.route}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      onClick={(e) => {
        if (disabled) e.preventDefault();
      }}
      className={cn("fc-root", disabled && "cursor-not-allowed", className)}
      style={disabled ? { pointerEvents: "none" } : undefined}
    >
      {content}
    </Link>
  );
}

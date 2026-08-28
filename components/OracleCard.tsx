"use client";

import { cn } from "@/lib/cn";
import type { OracleCard as OracleCardType, OracleTheme } from "@/lib/oracle";

interface Props {
  card: OracleCardType;
  flipped?: boolean;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES = {
  sm: { w: 96, h: 154, radius: 10, icon: 28 },
  md: { w: 132, h: 212, radius: 12, icon: 40 },
  lg: { w: 168, h: 270, radius: 14, icon: 52 },
} as const;

const THEME_GRADIENT: Record<OracleTheme, string> = {
  violet: "linear-gradient(160deg, #2d1548 0%, #1a0a2e 100%)",
  gold: "linear-gradient(160deg, #4a3a14 0%, #2a2008 100%)",
  rose: "linear-gradient(160deg, #4a1530 0%, #2a0a1a 100%)",
  teal: "linear-gradient(160deg, #0f3a33 0%, #06211e 100%)",
  indigo: "linear-gradient(160deg, #1b2b4d 0%, #0e1628 100%)",
  amber: "linear-gradient(160deg, #4a3012 0%, #2a1a06 100%)",
};

export default function OracleCard({ card, flipped = false, onClick, size = "md", className }: Props) {
  const dim = SIZES[size];
  const interactive = !!onClick;
  const Icon = card.symbol;

  return (
    <div
      className={cn(
        "oracle-card-root",
        interactive && !flipped && "interactive",
        flipped && "flipped",
        className
      )}
      style={{
        width: dim.w,
        height: dim.h,
        perspective: 1200,
      }}
      onClick={interactive && !flipped ? onClick : undefined}
      onKeyDown={
        interactive && !flipped
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      role={interactive && !flipped ? "button" : undefined}
      tabIndex={interactive && !flipped ? 0 : undefined}
      aria-label={flipped ? card.nameTh : "ไพ่ออราเคิล (ปิด)"}
    >
      <div
        className="oracle-card-inner"
        style={{
          position: "absolute",
          inset: 0,
          transformStyle: "preserve-3d",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          transition: "transform 0.7s cubic-bezier(0.34, 1.2, 0.64, 1)",
        }}
      >
        {/* BACK */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            borderRadius: dim.radius,
            border: "1.5px solid #c9a84c",
            background: "linear-gradient(160deg, #1e0e3a 0%, #2d1548 30%, #1a0a2e 60%, #14082a 100%)",
            boxShadow: "inset 0 0 24px rgba(147,97,203,0.1), 0 2px 8px rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 6,
              border: "1px solid rgba(201,168,76,0.2)",
              borderRadius: dim.radius - 4,
            }}
          />
          <div
            style={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
              color: "rgba(201,168,76,0.55)",
            }}
          >
            <SparkleGlyph />
            <span
              style={{
                fontSize: Math.max(8, dim.icon * 0.22),
                fontWeight: 800,
                letterSpacing: "0.3em",
                textIndent: "0.3em",
              }}
            >
              SEALO
            </span>
          </div>
        </div>

        {/* FRONT */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            borderRadius: dim.radius,
            border: "1.5px solid rgba(212,175,55,0.45)",
            background: THEME_GRADIENT[card.theme],
            boxShadow: "0 8px 24px rgba(0,0,0,0.45), inset 0 0 30px rgba(0,0,0,0.25)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: Math.max(6, dim.icon * 0.15),
            padding: 10,
            overflow: "hidden",
            textAlign: "center",
          }}
        >
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 5,
              border: "1px solid rgba(212,175,55,0.15)",
              borderRadius: dim.radius - 3,
            }}
          />
          <div
            style={{
              position: "relative",
              width: dim.icon * 1.9,
              height: dim.icon * 1.9,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(212,175,55,0.25)",
              color: "#e8c84a",
            }}
          >
            <Icon size={dim.icon} strokeWidth={1.6} />
          </div>
          <div
            style={{
              position: "relative",
              fontSize: Math.max(11, dim.icon * 0.28),
              fontWeight: 800,
              color: "#f5f2ec",
              letterSpacing: "-0.01em",
              lineHeight: 1.3,
            }}
          >
            {card.nameTh}
          </div>
          <div
            style={{
              position: "relative",
              fontSize: Math.max(8, dim.icon * 0.17),
              fontWeight: 600,
              color: "#e8c84a",
              letterSpacing: "0.06em",
            }}
          >
            {card.keywordTh}
          </div>
        </div>
      </div>
    </div>
  );
}

function SparkleGlyph() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.9 5.8L19.7 10l-5.8 1.9L12 17.7l-1.9-5.8L4.3 10l5.8-1.9L12 3z" />
      <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z" />
    </svg>
  );
}

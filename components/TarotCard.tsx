"use client";

import { cn } from "@/lib/cn";
import type { TarotCard as TarotCardType } from "@/lib/cards";

interface Props {
  card: TarotCardType;
  reversed?: boolean;
  onClick?: () => void;
  flipped?: boolean;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  ariaLabel?: string;
  style?: React.CSSProperties;
  showLabel?: boolean;
  disabled?: boolean;
  selected?: boolean;
}

const SIZES: Record<NonNullable<Props["size"]>, { w: number; h: number; radius: number; border: number }> = {
  xs: { w: 64, h: 100, radius: 7, border: 1 },
  sm: { w: 96, h: 154, radius: 8, border: 1.2 },
  md: { w: 132, h: 212, radius: 10, border: 1.5 },
  lg: { w: 168, h: 270, radius: 12, border: 1.6 },
  xl: { w: 200, h: 320, radius: 14, border: 1.8 },
};

export default function TarotCard({
  card,
  reversed = false,
  onClick,
  flipped = false,
  size = "md",
  className,
  ariaLabel,
  style,
  showLabel = false,
  disabled = false,
  selected = false,
}: Props) {
  const dim = SIZES[size];
  const interactive = !!onClick && !disabled;

  const flipTransform = flipped ? "rotateY(180deg)" : "rotateY(0deg)";
  const shadowDepth = flipped ? "0 12px 28px rgba(0,0,0,0.48), 0 0 0 1px rgba(212,175,55,0.38)" : "0 4px 14px rgba(0,0,0,0.32)";

  return (
    <div
      className={cn(
        "tarot-card",
        interactive && !flipped && "interactive",
        flipped && "flipped",
        selected && "selected",
        disabled && "disabled",
        className
      )}
      style={{
        width: dim.w,
        height: dim.h,
        transformOrigin: "center center",
        ...style,
      }}
      onClick={interactive ? onClick : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={ariaLabel ?? (flipped ? `${card.nameTh}${reversed ? " กลับหัว" : ""}` : "ไพ่ปิด")}
      aria-pressed={flipped}
      aria-disabled={disabled}
    >
      <div
        className="tarot-card-inner"
        style={{
          transformStyle: "preserve-3d",
          transform: flipTransform,
          transition: "transform 0.75s cubic-bezier(0.34, 1.25, 0.64, 1), box-shadow 0.35s var(--ease)",
          boxShadow: shadowDepth,
          willChange: "transform",
        }}
      >
        {/* ===== BACK ===== */}
        <div
          className="tarot-face tarot-back"
          style={{
            backfaceVisibility: "hidden",
            borderRadius: dim.radius,
            border: `${dim.border}px solid #c9a84c`,
            background:
              "linear-gradient(160deg, #1e0e3a 0%, #2d1548 30%, #1a0a2e 60%, #14082a 100%)",
            boxShadow:
              "inset 0 0 24px rgba(147,97,203,0.1), 0 2px 8px rgba(0,0,0,0.4)",
          }}
          aria-hidden={flipped}
        >
          <div
            style={{
              position: "absolute",
              inset: 5,
              border: "1px solid rgba(201,168,76,0.2)",
              borderRadius: Math.max(4, dim.radius - 3),
            }}
          />

          {/* Corner decorations */}
          {[
            { top: 7, left: 7 },
            { top: 7, right: 7 },
            { bottom: 7, left: 7 },
            { bottom: 7, right: 7 },
          ].map((pos, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                ...pos,
                width: Math.max(4, dim.w * 0.05),
                height: Math.max(4, dim.w * 0.05),
                border: "1px solid rgba(201,168,76,0.18)",
                borderRadius: 1,
              }}
            />
          ))}

          {/* Center: mandala-ish star + sun + crescent lines */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                position: "absolute",
                width: dim.w * 0.55,
                height: dim.h * 0.35,
                borderRadius: "50%",
                border: "1px solid rgba(201,168,76,0.14)",
              }}
            />
            <div
              style={{
                position: "relative",
                width: dim.w * 0.22,
                height: dim.h * 0.16,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(201,168,76,0.18)",
                  clipPath:
                    "polygon(50% 0%, 61% 35%, 100% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 0% 35%, 39% 35%)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  width: 4,
                  height: 4,
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  borderRadius: "50%",
                  background: "rgba(201,168,76,0.5)",
                  boxShadow: "0 0 6px rgba(212,175,55,0.6)",
                }}
              />
            </div>
            <div
              style={{
                position: "absolute",
                width: 1,
                height: dim.h * 0.42,
                background:
                  "linear-gradient(to bottom, transparent, rgba(201,168,76,0.12), transparent)",
              }}
            />
            <div
              style={{
                position: "absolute",
                width: dim.w * 0.42,
                height: 1,
                background:
                  "linear-gradient(to right, transparent, rgba(201,168,76,0.12), transparent)",
              }}
            />
          </div>
        </div>

        {/* ===== FRONT ===== */}
        <div
          className={cn("tarot-face tarot-front", flipped && "tarot-front-glow")}
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            borderRadius: dim.radius,
            border: `${dim.border}px solid #c9a84c`,
            boxShadow: "0 2px 12px rgba(0,0,0,0.35)",
          }}
          aria-hidden={!flipped}
        >
          <picture className="w-full h-full block">
            <source srcSet={`/Taro/${card.imageFile.replace(/\.jpg$/i, ".webp")}`} type="image/webp" />
            <img
              src={`/Taro/${card.imageFile}`}
              alt={card.name}
              className="w-full h-full"
              loading="lazy"
              decoding="async"
              style={{
                objectFit: "contain",
                transform: reversed ? "rotate(180deg)" : undefined,
                borderRadius: Math.max(2, dim.radius - 2),
                background: "#0e0e14",
              }}
            />
          </picture>

          {reversed && flipped && (
            <div
              className="reversed-badge"
              style={{
                position: "absolute",
                bottom: 6,
                right: 6,
                padding: "2px 7px",
                borderRadius: 5,
                fontSize: 9.5,
                fontWeight: 700,
                background: "rgba(0,0,0,0.72)",
                color: "rgba(212,175,55,0.95)",
                backdropFilter: "blur(4px)",
                letterSpacing: "0.04em",
              }}
            >
              กลับหัว
            </div>
          )}

          {showLabel && flipped && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                padding: "6px 8px 14px",
                background:
                  "linear-gradient(to bottom, rgba(0,0,0,0.65), transparent)",
                color: "#f5f2ec",
                fontSize: 10.5,
                fontWeight: 700,
                textAlign: "center",
                letterSpacing: "0.02em",
                borderTopLeftRadius: dim.radius - 1,
                borderTopRightRadius: dim.radius - 1,
                pointerEvents: "none",
              }}
            >
              {card.nameTh}
            </div>
          )}
        </div>
      </div>

      {/* selection ring */}
      {selected && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: -6,
            borderRadius: dim.radius + 4,
            border: "2px solid var(--primary)",
            boxShadow: "0 0 0 4px var(--primary-soft)",
            pointerEvents: "none",
            animation: "tarotRingPulse 1.8s ease-in-out infinite",
          }}
        />
      )}
      <style jsx>{`
        @keyframes tarotRingPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.04); opacity: 0.85; }
        }
      `}</style>
    </div>
  );
}

"use client";
import { cn } from "@/lib/cn";
import type { TarotCard as TarotCardType } from "@/lib/cards";

interface Props {
  card: TarotCardType;
  reversed?: boolean;
  onClick?: () => void;
  flipped?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  ariaLabel?: string;
}

const SIZES = {
  sm: { w: 100, h: 160 },
  md: { w: 140, h: 224 },
  lg: { w: 180, h: 288 },
};

export default function TarotCard({
  card,
  reversed = false,
  onClick,
  flipped = false,
  size = "md",
  className,
  ariaLabel,
}: Props) {
  const dim = SIZES[size];

  return (
    <div
      className={cn(
        "relative select-none",
        onClick && !flipped && "cursor-pointer hover:-translate-y-2",
        "transition-all duration-300",
        className
      )}
      style={{
        width: dim.w,
        height: dim.h,
        perspective: 900,
        filter: onClick && !flipped ? "drop-shadow(0 4px 12px rgba(0,0,0,0.25))" : undefined,
      }}
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick();
        }
      }}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={ariaLabel}
    >
      {/* Inner card that rotates */}
      <div
        className="absolute inset-0"
        style={{
          transformStyle: "preserve-3d",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          transition: "transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* ===== BACK ===== */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{
            backfaceVisibility: "hidden",
            borderRadius: 10,
            border: "1.5px solid #c9a84c",
            background:
              "linear-gradient(160deg, #1e0e3a 0%, #2d1548 30%, #1a0a2e 60%, #14082a 100%)",
            boxShadow:
              "inset 0 0 24px rgba(147,97,203,0.1), 0 2px 8px rgba(0,0,0,0.4)",
          }}
        >
          {/* Inner border frame */}
          <div
            className="absolute"
            style={{
              inset: 5,
              border: "1px solid rgba(201,168,76,0.2)",
              borderRadius: 5,
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
              className="absolute"
              style={{
                ...pos,
                width: 6,
                height: 6,
                border: "1px solid rgba(201,168,76,0.18)",
                borderRadius: 1,
              }}
            />
          ))}

          {/* Center decoration */}
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Outer circle */}
            <div
              className="absolute"
              style={{
                width: dim.w * 0.55,
                height: dim.h * 0.35,
                borderRadius: "50%",
                border: "1px solid rgba(201,168,76,0.14)",
              }}
            />

            {/* Inner star - 8 pointed */}
            <div
              className="relative"
              style={{ width: dim.w * 0.2, height: dim.h * 0.14 }}
            >
              <div
                className="absolute inset-0"
                style={{
                  background: "rgba(201,168,76,0.15)",
                  clipPath:
                    "polygon(50% 0%, 61% 35%, 100% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 0% 35%, 39% 35%)",
                }}
              />
              {/* Center dot */}
              <div
                className="absolute rounded-full"
                style={{
                  width: 4,
                  height: 4,
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  background: "rgba(201,168,76,0.4)",
                }}
              />
            </div>

            {/* Vertical line */}
            <div
              className="absolute"
              style={{
                width: 1,
                height: dim.h * 0.4,
                background:
                  "linear-gradient(to bottom, transparent, rgba(201,168,76,0.1), transparent)",
              }}
            />
            {/* Horizontal line */}
            <div
              className="absolute"
              style={{
                width: dim.w * 0.4,
                height: 1,
                background:
                  "linear-gradient(to right, transparent, rgba(201,168,76,0.1), transparent)",
              }}
            />
          </div>
        </div>

        {/* ===== FRONT ===== */}
        <div
          className={cn(
            "absolute inset-0 overflow-hidden",
            flipped && "card-reveal-glow"
          )}
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            borderRadius: 10,
            border: "1.5px solid #c9a84c",
            boxShadow: "0 2px 12px rgba(0,0,0,0.35)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/Taro/${card.imageFile}`}
            alt={card.name}
            className="w-full h-full"
            loading="lazy"
            style={{
              objectFit: "contain",
              transform: reversed ? "rotate(180deg)" : undefined,
              borderRadius: 8,
              background: "#0e0e14",
            }}
          />

          {/* Reversed indicator */}
          {reversed && flipped && (
            <div
              className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded text-[8px] font-bold"
              style={{
                background: "rgba(0,0,0,0.7)",
                color: "rgba(201,168,76,0.9)",
                backdropFilter: "blur(4px)",
              }}
            >
              กลับ
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

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
}

const SIZES = {
  sm: { w: 100, h: 160 },
  md: { w: 140, h: 220 },
  lg: { w: 180, h: 280 },
};

export default function TarotCard({
  card,
  reversed = false,
  onClick,
  flipped = false,
  size = "md",
  className,
}: Props) {
  const dim = SIZES[size];

  return (
    <div
      className={cn(
        "relative cursor-pointer select-none",
        onClick && "hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(147,97,203,0.45)]",
        "transition-all duration-300 ease-out",
        className
      )}
      style={{ width: dim.w, height: dim.h, perspective: 800 }}
      onClick={onClick}
    >
      {/* Inner card that rotates */}
      <div
        className="absolute inset-0"
        style={{
          transformStyle: "preserve-3d",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* ===== BACK ===== */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{
            backfaceVisibility: "hidden",
            borderRadius: 10,
            border: "2px solid #c9a84c",
            background:
              "linear-gradient(145deg, #1a0a2e 0%, #2d1548 30%, #1e0e3a 60%, #14082a 100%)",
            boxShadow:
              "inset 0 0 20px rgba(147,97,203,0.15), 0 2px 8px rgba(0,0,0,0.4)",
          }}
        >
          {/* Inner border */}
          <div
            className="absolute"
            style={{
              inset: 5,
              border: "1px solid rgba(201,168,76,0.35)",
              borderRadius: 6,
            }}
          />

          {/* Mandala / Star pattern */}
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Outer ring */}
            <div
              className="absolute"
              style={{
                width: dim.w * 0.55,
                height: dim.h * 0.55,
                borderRadius: "50%",
                border: "1px solid rgba(201,168,76,0.25)",
              }}
            />
            {/* Middle ring */}
            <div
              className="absolute"
              style={{
                width: dim.w * 0.38,
                height: dim.h * 0.38,
                borderRadius: "50%",
                border: "1px solid rgba(201,168,76,0.3)",
              }}
            />
            {/* Central star — 8-pointed using two rotated squares */}
            <div className="relative" style={{ width: dim.w * 0.3, height: dim.h * 0.3 }}>
              {/* Star shape 1 */}
              <div
                className="absolute inset-0"
                style={{
                  background: "rgba(201,168,76,0.2)",
                  clipPath:
                    "polygon(50% 0%, 61% 35%, 100% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 0% 35%, 39% 35%)",
                }}
              />
              {/* Star shape 2 (rotated) */}
              <div
                className="absolute inset-0"
                style={{
                  background: "rgba(201,168,76,0.15)",
                  transform: "rotate(45deg)",
                  clipPath:
                    "polygon(50% 0%, 61% 35%, 100% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 0% 35%, 39% 35%)",
                }}
              />
              {/* Center dot */}
              <div
                className="absolute rounded-full"
                style={{
                  width: dim.w * 0.06,
                  height: dim.h * 0.06,
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  background: "rgba(201,168,76,0.45)",
                }}
              />
            </div>
            {/* Radiating lines */}
            {[0, 45, 90, 135].map((deg) => (
              <div
                key={deg}
                className="absolute"
                style={{
                  width: 1,
                  height: dim.h * 0.5,
                  background:
                    "linear-gradient(to bottom, transparent, rgba(201,168,76,0.15), transparent)",
                  transform: `rotate(${deg}deg)`,
                }}
              />
            ))}
          </div>

          {/* Corner decorations */}
          {[
            { top: 8, left: 8 },
            { top: 8, right: 8 },
            { bottom: 8, left: 8 },
            { bottom: 8, right: 8 },
          ].map((pos, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                ...pos,
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "rgba(201,168,76,0.3)",
              }}
            />
          ))}
        </div>

        {/* ===== FRONT ===== */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            borderRadius: 10,
            border: "2px solid #c9a84c",
            boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/Taro/${card.imageFile}`}
            alt={card.name}
            className="w-full h-full"
            style={{
              objectFit: "contain",
              transform: reversed ? "rotate(180deg)" : undefined,
              borderRadius: 8,
              background: "#0e0e14",
            }}
          />
        </div>
      </div>
    </div>
  );
}

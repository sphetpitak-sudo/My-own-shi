"use client";

import { cn } from "@/lib/cn";
import { SPREADS, type SpreadType } from "@/lib/cards";
import { Coins, Check } from "lucide-react";

interface Props {
  onSelect: (spreadId: SpreadType) => void;
  selectedSpread: SpreadType | null;
  userPoints: number;
  costs?: Record<string, number>;
}

const SPREAD_META: Record<SpreadType, { dots: number[][]; tag: string }> = {
  single: { dots: [[50, 50]], tag: "คำตอบด่วน" },
  three_card: { dots: [[20, 50], [50, 50], [80, 50]], tag: "แนะนำยอดนิยม" },
  celtic: {
    dots: [
      [35, 50],
      [50, 50],
      [35, 80],
      [35, 20],
      [35, 5],
      [65, 80],
      [65, 60],
      [65, 40],
      [65, 20],
      [80, 50],
    ],
    tag: "วิเคราะห์ลึก 10 มิติ",
  },
};

export default function SpreadSelector({
  onSelect,
  selectedSpread,
  userPoints,
  costs = {},
}: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-4 max-w-4xl mx-auto">
      {(Object.keys(SPREADS) as SpreadType[]).map((key) => {
        const spread = SPREADS[key];
        const cost = costs[key] ?? spread.cost;
        const disabled = userPoints < cost;
        const active = selectedSpread === key;
        const meta = SPREAD_META[key];

        return (
          <button
            key={key}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(key)}
            aria-label={`${spread.nameTh} - ${spread.cardCount} ใบ ${cost} แต้ม${disabled ? " (แต้มไม่พอ)" : ""}`}
            className={cn(
              "card p-5 text-left relative overflow-hidden transition-all duration-300 flex flex-col group",
              active && "ring-2 ring-[var(--primary)] shadow-md bg-[var(--primary-soft)]",
              disabled ? "opacity-50 cursor-not-allowed" : "hover:-translate-y-1 hover:border-[var(--primary)] hover:shadow-md cursor-pointer"
            )}
          >
            {/* Position Layout Diagram Preview */}
            <div
              className="h-24 rounded-xl relative overflow-hidden mb-4 flex items-center justify-center border border-[var(--border-subtle)]"
              style={{
                background: "linear-gradient(160deg, #180d28 0%, #0a0614 100%)",
              }}
            >
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: "radial-gradient(circle at 50% 30%, rgba(167, 139, 250, 0.15), transparent 65%)",
                }}
              />
              {meta.dots.map((pos, i) => (
                <div
                  key={i}
                  className="absolute"
                  style={{
                    width: 10,
                    height: 15,
                    left: `${pos[0]}%`,
                    top: `${pos[1]}%`,
                    transform: "translate(-50%, -50%)",
                    background: active ? "rgba(212, 175, 55, 0.6)" : "rgba(212, 175, 55, 0.35)",
                    border: "1px solid rgba(212, 175, 55, 0.7)",
                    borderRadius: 2,
                    zIndex: 1,
                    boxShadow: active ? "0 0 8px rgba(212, 175, 55, 0.4)" : "none",
                  }}
                />
              ))}
            </div>

            {/* Content */}
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--primary)]">
                {meta.tag}
              </span>
            </div>

            <h3 className="text-[17px] font-bold text-[var(--text)] group-hover:text-[var(--primary)] transition-colors">
              {spread.nameTh}
            </h3>

            <p className="text-[12.5px] text-[var(--text-secondary)] mt-1.5 leading-relaxed flex-1">
              {spread.descriptionTh}
            </p>

            {/* Bottom Meta */}
            <div className="flex items-center justify-between pt-4 mt-3 border-t border-[var(--border-subtle)] text-[12px]">
              <span className="font-semibold text-[var(--text-muted)]">{spread.cardCount} ใบ</span>
              <span className="font-extrabold text-[var(--gold)] flex items-center gap-1">
                <Coins size={12} /> {cost} แต้ม
              </span>
            </div>

            {/* Active Check Badge */}
            {active && (
              <div
                className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px] font-bold shadow-sm"
                style={{
                  background: "var(--primary)",
                }}
              >
                <Check size={14} />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

"use client";
import { cn } from "@/lib/cn";
import { SPREADS, type SpreadType } from "@/lib/cards";
import { Coins } from "lucide-react";

interface Props {
  onSelect: (spreadId: SpreadType) => void;
  selectedSpread: SpreadType | null;
  userPoints: number;
  costs?: Record<string, number>;
}

const SPREAD_META: Record<SpreadType, { dots: number[][] }> = {
  single: { dots: [[50, 50]] },
  three_card: { dots: [[20, 50], [50, 50], [80, 50]] },
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
  },
};

export default function SpreadSelector({
  onSelect,
  selectedSpread,
  userPoints,
  costs = {},
}: Props) {
  return (
    <div className="spread-row">
      {(Object.keys(SPREADS) as SpreadType[]).map((key) => {
        const spread = SPREADS[key];
        const cost = costs[key] ?? spread.cost;
        const disabled = userPoints < cost;
        const active = selectedSpread === key;
        const dots = SPREAD_META[key].dots;

        return (
          <button
            key={key}
            disabled={disabled}
            onClick={() => onSelect(key)}
            aria-label={`${spread.nameTh} - ${spread.cardCount} ใบ ${cost} แต้ม${disabled ? ' (คะแนนไม่พอ)' : ''}`}
            className={cn(
              "spread-option",
              disabled && "disabled",
              active && "selected"
            )}
          >
            <div className="spread-option-preview">
              {dots.map((pos, i) => (
                <div
                  key={i}
                  className="absolute rounded"
                  style={{
                    width: 10,
                    height: 14,
                    left: `${pos[0]}%`,
                    top: `${pos[1]}%`,
                    transform: "translate(-50%, -50%)",
                    background: "rgba(201,168,76,0.35)",
                    border: "1px solid rgba(201,168,76,0.45)",
                    borderRadius: 2,
                    zIndex: 1,
                  }}
                />
              ))}
            </div>

            <div className="spread-option-title">{spread.nameTh}</div>
            <div className="spread-option-desc">{spread.descriptionTh}</div>

            <div className="spread-option-bottom">
              <span>{spread.cardCount} ใบ</span>
              <span className="spread-option-cost">
                <Coins size={11} /> {cost} แต้ม
              </span>
            </div>

            {active && (
              <div
                className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px] font-bold"
                style={{
                  background: "var(--primary)",
                  boxShadow: "0 2px 8px rgba(109, 40, 217, 0.4)",
                  zIndex: 2,
                }}
              >
                ✓
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

"use client";
import { cn } from "@/lib/cn";
import { SPREADS, type SpreadType } from "@/lib/cards";

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
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              "relative flex flex-col items-center gap-3 p-5 rounded-2xl border transition-all duration-300",
              "text-left",
              disabled
                ? "opacity-40 cursor-not-allowed border-[var(--border)] bg-[var(--bg-card)]"
                : active
                  ? "border-[var(--primary)] bg-[var(--primary-soft)]"
                  : "border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-sm)] hover:-translate-y-0.5",
              "dark:bg-[var(--bg-card)]"
            )}
          >
            {/* Visual layout preview */}
            <div
              className="relative w-full rounded-xl overflow-hidden"
              style={{
                height: 80,
                background: "linear-gradient(160deg, #1a0a2e, #2d1548)",
                border: "1px solid rgba(201,168,76,0.12)",
                boxShadow: "inset 0 0 12px rgba(0,0,0,0.2)",
              }}
            >
              {dots.map((pos, i) => (
                <div
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    width: 10,
                    height: 14,
                    left: `${pos[0]}%`,
                    top: `${pos[1]}%`,
                    transform: "translate(-50%, -50%)",
                    background: "rgba(201,168,76,0.3)",
                    border: "1px solid rgba(201,168,76,0.4)",
                  }}
                />
              ))}
            </div>

            {/* Name */}
            <div className="text-center w-full">
              <div className="font-bold text-[14px] text-[var(--text)]" style={{ letterSpacing: "-0.01em" }}>
                {spread.nameTh}
              </div>
              <div className="text-[11px] text-[var(--text-muted)] mt-0.5 font-medium">
                {spread.name}
              </div>
            </div>

            {/* Info */}
            <div className="flex items-center gap-2 text-[11px] text-[var(--text-secondary)]">
              <span>{spread.cardCount} ใบ</span>
              <span className="w-1 h-1 rounded-full bg-[var(--text-muted)]" />
              <span className="font-semibold" style={{ color: "var(--gold)" }}>
                {cost} แต้ม
              </span>
            </div>

            {/* Description */}
            <p className="text-[11px] text-[var(--text-muted)] text-center leading-relaxed">
              {spread.descriptionTh}
            </p>

            {/* Disabled reason */}
            {disabled && (
              <p className="text-[10px] font-semibold text-center" style={{ color: "var(--red)" }}>
                คะแนนไม่พอ
              </p>
            )}

            {/* Active indicator */}
            {active && (
              <div
                className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px] font-bold"
                style={{
                  background: "var(--primary)",
                  boxShadow: "0 2px 8px rgba(109, 40, 217, 0.4)",
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

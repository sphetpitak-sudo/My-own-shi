"use client";
import { cn } from "@/lib/cn";
import { SPREADS, type SpreadType } from "@/lib/cards";

interface Props {
  onSelect: (spreadId: SpreadType) => void;
  selectedSpread: SpreadType | null;
  userPoints: number;
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
}: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {(Object.keys(SPREADS) as SpreadType[]).map((key) => {
        const spread = SPREADS[key];
        const disabled = userPoints < spread.cost;
        const active = selectedSpread === key;
        const dots = SPREAD_META[key].dots;

        return (
          <button
            key={key}
            disabled={disabled}
            onClick={() => onSelect(key)}
            className={cn(
              "relative flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all duration-200",
              "text-left",
              disabled
                ? "opacity-40 cursor-not-allowed border-[var(--border)] bg-[var(--bg-card)]"
                : active
                  ? "border-[#c9a84c] bg-[#1a0a2e]/10 shadow-[0_0_20px_rgba(201,168,76,0.15)]"
                  : "border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-sm)]",
              "dark:bg-[var(--bg-card)]"
            )}
          >
            {/* Visual layout preview */}
            <div
              className="relative w-full rounded-lg mb-2"
              style={{
                height: 80,
                background: "linear-gradient(145deg, #1a0a2e, #2d1548)",
                border: "1px solid rgba(201,168,76,0.2)",
              }}
            >
              {dots.map((pos, i) => (
                <div
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    width: 12,
                    height: 16,
                    left: `${pos[0]}%`,
                    top: `${pos[1]}%`,
                    transform: "translate(-50%, -50%)",
                    background: "rgba(201,168,76,0.4)",
                    border: "1px solid rgba(201,168,76,0.6)",
                  }}
                />
              ))}
            </div>

            {/* Name */}
            <div className="text-center w-full">
              <div className="font-bold text-sm text-[var(--text)]">
                {spread.nameTh}
              </div>
              <div className="text-xs text-[var(--text-muted)] mt-0.5">
                {spread.name}
              </div>
            </div>

            {/* Info */}
            <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)]">
              <span>{spread.cardCount} ใบ</span>
              <span className="w-1 h-1 rounded-full bg-[var(--text-muted)]" />
              <span className="font-semibold text-[#c9a84c]">
                {spread.cost} แต้ม
              </span>
            </div>

            {/* Description */}
            <p className="text-xs text-[var(--text-muted)] text-center leading-relaxed">
              {spread.descriptionTh}
            </p>

            {/* Active indicator */}
            {active && (
              <div
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px]"
                style={{ background: "#c9a84c" }}
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

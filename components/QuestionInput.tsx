"use client";
import { cn } from "@/lib/cn";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  loading?: boolean;
}

export default function QuestionInput({
  value,
  onChange,
  onSubmit,
  loading = false,
}: Props) {
  return (
    <div className="w-full">
      <div
        className="relative rounded-xl overflow-hidden"
        style={{
          border: "1px solid rgba(201,168,76,0.3)",
          background: "linear-gradient(145deg, #1a0a2e08, #2d154808)",
        }}
      >
        {/* Glow border top */}
        <div
          className="absolute top-0 left-0 right-0 h-[1px]"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(201,168,76,0.5), transparent)",
          }}
        />

        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="ถามไพ่ทาโรต์... เช่น อนาคตความรักจะเป็นอย่างไร?"
          rows={4}
          maxLength={500}
          disabled={loading}
          className={cn(
            "w-full p-4 pb-12 bg-transparent resize-none outline-none",
            "text-[var(--text)] text-sm leading-relaxed",
            "placeholder:text-[var(--text-muted)]",
            "disabled:opacity-50"
          )}
          style={{ fontFamily: "inherit" }}
        />

        {/* Bottom bar */}
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 py-2.5 border-t border-[var(--border)]">
          <span className="text-xs text-[var(--text-muted)]">
            {value.length}/500
          </span>
          <button
            onClick={onSubmit}
            disabled={!value.trim() || loading}
            className={cn(
              "px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200",
              value.trim() && !loading
                ? "bg-[#c9a84c] text-[#1a0a2e] hover:bg-[#d4b45c] shadow-[0_2px_8px_rgba(201,168,76,0.3)]"
                : "bg-[var(--border)] text-[var(--text-muted)] cursor-not-allowed"
            )}
          >
            {loading ? (
              <span className="flex items-center gap-1.5">
                <span
                  className="inline-block w-3 h-3 rounded-full border-2 border-[#1a0a2e] border-t-transparent"
                  style={{ animation: "spin 0.6s linear infinite" }}
                />
                กำลังทำนาย...
              </span>
            ) : (
              "ทำนาย"
            )}
          </button>
        </div>
      </div>


    </div>
  );
}

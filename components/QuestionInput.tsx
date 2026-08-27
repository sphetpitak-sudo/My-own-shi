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
        className="rounded-xl overflow-hidden relative"
        style={{
          border: "1px solid var(--border-strong)",
          background: "var(--bg-card)",
        }}
      >
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="ถามไพ่ทาโรต์... เช่น อนาคตความรักจะเป็นอย่างไร?"
          rows={4}
          maxLength={500}
          disabled={loading}
          className={cn(
            "w-full p-4 pb-12 bg-transparent resize-none outline-none",
            "text-[var(--text)] text-[14px] leading-relaxed",
            "placeholder:text-[var(--text-muted)]",
            "disabled:opacity-50"
          )}
          style={{ fontFamily: "inherit", letterSpacing: "-0.005em" }}
        />

        {/* Bottom bar */}
        <div
          className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 py-2.5 border-t"
          style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}
        >
          <span className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>
            {value.length}/500
          </span>
          <button
            onClick={onSubmit}
            disabled={!value.trim() || loading}
            className={cn(
              "px-5 py-1.5 rounded-lg text-[12px] font-bold transition-all duration-200",
              value.trim() && !loading
                ? "bg-[var(--primary)] text-white hover:opacity-90 shadow-sm"
                : "bg-[var(--border)] text-[var(--text-muted)] cursor-not-allowed"
            )}
          >
            {loading ? (
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
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

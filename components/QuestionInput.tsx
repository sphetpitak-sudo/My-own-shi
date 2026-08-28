"use client";
import { cn } from "@/lib/cn";
import { Sparkles } from "lucide-react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  loading?: boolean;
}

const SUGGESTIONS = [
  "อนาคตความรักของฉันจะเป็นอย่างไร?",
  "งานใหม่ที่กำลังจะเริ่มจะเป็นอย่างไร?",
  "ฉันควรโฟกัสเรื่องอะไรในเดือนนี้?",
];

export default function QuestionInput({
  value,
  onChange,
  onSubmit,
  loading = false,
}: Props) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && value.trim() && !loading) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="w-full">
      <div className="q-card">
        <label htmlFor="question-input" className="label flex items-center gap-1.5">
          <Sparkles size={12} style={{ color: "var(--primary)" }} />
          คำถามของคุณ
        </label>
        <textarea
          id="question-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="ถามไพ่ทาโรต์... เขียนจากหัวใจของคุณ"
          rows={3}
          maxLength={500}
          disabled={loading}
          aria-label="คำถามของคุณ"
          className="q-textarea"
        />

        {!value && (
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onChange(s)}
                className="text-[11.5px] font-semibold px-2.5 py-1.5 rounded-full transition-all hover:shadow-sm hover:-translate-y-[1px] active:scale-[0.98]"
                style={{
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  color: "var(--text-secondary)",
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="q-actions">
          <span
            className="q-counter"
            style={{
              color: value.length > 450 ? (value.length > 480 ? "var(--red)" : "var(--amber)") : "var(--text-muted)",
              fontWeight: value.length > 450 ? 700 : 600,
            }}
          >
            {value.length}/500
          </span>
          <button
            onClick={onSubmit}
            disabled={!value.trim() || loading}
            aria-label="จั่วไพ่"
            className={cn(
              "btn px-6 py-2.5 text-[13px] font-bold rounded-xl",
              value.trim() && !loading
                ? "btn-primary"
                : "bg-[var(--border)] text-[var(--text-muted)] cursor-not-allowed"
            )}
            style={
              value.trim() && !loading
                ? {
                    background: "linear-gradient(135deg, var(--primary), var(--primary-hover))",
                    boxShadow: "0 4px 14px rgba(109, 40, 217, 0.25)",
                  }
                : undefined
            }
          >
            {loading ? (
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                กำลังเตรียมสำรับ...
              </span>
            ) : (
              "เริ่มจั่วไพ่ →"
            )}
          </button>
        </div>
      </div>
      <p className="q-helper" style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span className="w-1 h-1 rounded-full" style={{ background: "var(--text-muted)" }} />
        กด Enter เพื่อจั่วไพ่ · Shift+Enter เพื่อขึ้นบรรทัดใหม่
      </p>
    </div>
  );
}

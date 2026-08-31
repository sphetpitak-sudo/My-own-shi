"use client";

import { Sparkles, ArrowRight, Heart, Briefcase, Compass, Wallet } from "lucide-react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  loading?: boolean;
}

const CATEGORY_PROMPTS = [
  { icon: Heart, text: "อนาคตความรักและความสัมพันธ์ของฉันจะเป็นอย่างไร?" },
  { icon: Briefcase, text: "ทิศทางและการตัดสินใจเรื่องงานในตอนนี้ควรทำอย่างไร?" },
  { icon: Wallet, text: "แนวโน้มการเงินและโอกาสใหม่ ๆ ในช่วงนี้เป็นอย่างไร?" },
  { icon: Compass, text: "สิ่งที่ไพ่อยากบอกเพื่อเป็นแนวทางชีวิตในขณะนี้คืออะไร?" },
];

function qualityHint(len: number, text: string) {
  if (!text.trim()) return { label: "ไม่ระบุก็ได้ — จะอ่านภาพรวมทั่วไป", color: "var(--text-muted)" };
  if (len < 12) return { label: "ลองเพิ่มบริบทอีกนิด — เรื่องอะไร ช่วงไหน?", color: "var(--amber)" };
  if (len < 30) return { label: "ดี — เพิ่มรายละเอียดจะตรงใจขึ้น", color: "var(--text-secondary)" };
  return { label: "เยี่ยม — คำถามชัดเจน จะได้คำตอบตรงใจ", color: "var(--green)" };
}

export default function QuestionInput({
  value,
  onChange,
  onSubmit,
  loading = false,
}: Props) {
  const hint = qualityHint(value.length, value);
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !loading) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 px-4">
      <div className="card p-4 border-[var(--border)] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <label htmlFor="question-input" className="text-[13px] font-extrabold uppercase tracking-wider text-[var(--primary)] flex items-center gap-1.5">
            <Sparkles size={14} />
            ตั้งจิตและคำถามของคุณ
          </label>
          <span
            className="text-[11.5px] tabular-nums font-bold"
            style={{
              color: value.length > 450 ? (value.length > 480 ? "var(--red)" : "var(--amber)") : "var(--text-muted)",
            }}
          >
            {value.length}/500
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: hint.color }} aria-hidden />
          <p className="text-[11.5px] font-semibold" style={{ color: hint.color }}>{hint.label}</p>
        </div>
        <div className="relative">
          <textarea
            id="question-input"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="เช่น เรื่องงานที่ลังเลตอนนี้ ควรตัดสินใจอย่างไรดี?"
            rows={3}
            maxLength={500}
            disabled={loading}
            aria-label="คำถามของคุณ"
            className="input resize-none text-[14.5px] leading-[1.7] p-4 min-h-[100px] sm:min-h-[120px] bg-[var(--bg-card)] border-[var(--border-strong)] focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_var(--primary-soft)] rounded-xl placeholder:text-[13.5px] placeholder:leading-relaxed shadow-inner"
            style={{ background: "color-mix(in srgb, var(--bg) 88%, white)" }}
          />
          <div className="absolute bottom-2 right-2 h-1 w-24 rounded-full overflow-hidden pointer-events-none" style={{ background: "var(--border-subtle)" }} aria-hidden>
            <div className="h-full transition-all duration-200" style={{ width: `${Math.min(100, (value.length / 500) * 100)}%`, background: value.length > 480 ? "var(--red)" : value.length > 350 ? "var(--amber)" : "var(--primary)", opacity: 0.7 }} />
          </div>
        </div>

        {/* Suggestion Chips */}
        <div className="space-y-2 pt-1">
          <div className="text-[11.5px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
            คำถามแนะนำยอดนิยม
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {CATEGORY_PROMPTS.map((p, i) => {
              const Icon = p.icon;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    const next = value ? `${value.trim()} ${p.text}` : p.text;
                    onChange(next.slice(0, 500));
                    document.getElementById("question-input")?.focus();
                  }}
                  className="text-left text-[12px] p-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--primary)] hover:bg-[var(--primary-soft)] transition-all flex items-start gap-2 text-[var(--text-secondary)] hover:text-[var(--text)] group"
                >
                  <Icon size={14} className="text-[var(--primary)] shrink-0 mt-0.5" />
                  <span className="leading-snug flex-1">{p.text}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit Action */}
        <div className="pt-3 flex items-center justify-between border-t border-[var(--border-subtle)] gap-3 flex-wrap">
          <p className="text-[11.5px] text-[var(--text-muted)] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)]" />
            กด Enter เพื่อไปต่อ (Shift+Enter ขึ้นบรรทัดใหม่)
          </p>

          <button
            onClick={onSubmit}
            disabled={loading}
            aria-label="เริ่มขั้นตอนสับไพ่"
            className="btn btn-gold px-7 py-3 text-[14px] font-extrabold rounded-xl shrink-0"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-amber-900 border-t-transparent animate-spin" />
                กำลังเตรียมพิธีกรรม...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                เริ่มพิธีกรรมสับไพ่ <ArrowRight size={16} />
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

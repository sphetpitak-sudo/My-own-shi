"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Heart, Briefcase, GraduationCap, Wallet, Sprout, X, ArrowRight, ArrowLeft } from "lucide-react";

type Interest = "love" | "career" | "study" | "finance" | "growth";

const INTERESTS: { id: Interest; label: string; labelEn: string; icon: typeof Heart; color: string; bg: string }[] = [
  { id: "love", label: "ความรัก", labelEn: "Love", icon: Heart, color: "var(--topic-love)", bg: "var(--topic-love-soft)" },
  { id: "career", label: "การงาน", labelEn: "Career", icon: Briefcase, color: "var(--topic-career)", bg: "var(--topic-career-soft)" },
  { id: "study", label: "การเรียน", labelEn: "Study", icon: GraduationCap, color: "var(--topic-study)", bg: "var(--topic-study-soft)" },
  { id: "finance", label: "การเงิน", labelEn: "Money", icon: Wallet, color: "var(--topic-finance)", bg: "var(--topic-finance-soft)" },
  { id: "growth", label: "เติบโต", labelEn: "Self-growth", icon: Sprout, color: "var(--topic-health)", bg: "var(--topic-health-soft)" },
];

const STORAGE_KEY = "sealo_onboarding_done";
const INTERESTS_KEY = "sealo_interests";

export function shouldShowOnboarding(): boolean {
  if (typeof window === "undefined") return false;
  return !localStorage.getItem(STORAGE_KEY);
}

export function markOnboardingDone(interests: Interest[]) {
  localStorage.setItem(STORAGE_KEY, "1");
  localStorage.setItem(INTERESTS_KEY, JSON.stringify(interests));
}

export function getStoredInterests(): Interest[] {
  try {
    return JSON.parse(localStorage.getItem(INTERESTS_KEY) || "[]");
  } catch { return []; }
}

export default function OnboardingModal({ onComplete }: { onComplete?: () => void }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<Interest[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (shouldShowOnboarding()) setVisible(true);
  }, []);

  if (!visible) return null;

  const toggleInterest = (id: Interest) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleNext = () => {
    if (step < 2) setStep(s => s + 1);
    else {
      markOnboardingDone(selected);
      setVisible(false);
      onComplete?.();
      // Navigate to first reading with top interest or general
      const top = selected[0];
      if (top) router.push(`/dashboard/reading?spread=three_card&topic=${top}`);
    }
  };

  const handleSkip = () => {
    markOnboardingDone(selected);
    setVisible(false);
    onComplete?.();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="ยินดีต้อนรับสู่ Sealo">
      <button className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleSkip} aria-label="ปิด" />
      <div className="relative w-full max-w-[480px] rounded-2xl overflow-hidden shadow-2xl animate-in" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
        {/* Progress */}
        <div className="h-1 bg-[var(--border-subtle)]">
          <div className="h-full bg-[var(--primary)] transition-all duration-300" style={{ width: `${((step + 1) / 3) * 100}%` }} />
        </div>

        <button onClick={handleSkip} className="touch-hit absolute top-3 right-3 w-8 h-8 grid place-items-center rounded-full hover:bg-[var(--bg)]" aria-label="ข้าม">
          <X size={16} style={{ color: "var(--text-muted)" }} />
        </button>

        <div className="p-6 sm:p-8">
          {step === 0 && (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl grid place-items-center mb-4" style={{ background: "var(--primary-soft)", color: "var(--primary)" }}>
                <Sparkles size={28} />
              </div>
              <p className="text-[11px] font-bold tracking-[0.18em] uppercase" style={{ color: "var(--primary)" }}>ยินดีต้อนรับสู่ Sealo</p>
              <h2 className="text-[24px] font-extrabold tracking-tight mt-2" style={{ color: "var(--text)" }}>ไพ่พร้อมแล้ว<br />คุณล่ะ พร้อมหรือยัง?</h2>
              <p className="text-[13.5px] leading-relaxed mt-3" style={{ color: "var(--text-secondary)" }}>
                พื้นที่ปลอดภัยสำหรับตั้งคำถาม ฟังเสียงข้างใน<br />และรับคำตอบที่อ่อนโยนจากไพ่ทาโรต์
              </p>
              <div className="flex items-center justify-center gap-2 mt-6 text-[12px]" style={{ color: "var(--text-muted)" }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--primary)" }} />
                ใช้เวลาไม่ถึง 1 นาที
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="text-[20px] font-extrabold tracking-tight" style={{ color: "var(--text)" }}>คุณอยากได้ความชัดเจนเรื่องไหน?</h2>
              <p className="text-[13px] mt-1" style={{ color: "var(--text-secondary)" }}>เลือกได้มากกว่า 1 ข้อ — เราจะแนะนำไพ่ที่เหมาะกับคุณ</p>
              <div className="grid grid-cols-2 gap-3 mt-5">
                {INTERESTS.map(item => {
                  const active = selected.includes(item.id);
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => toggleInterest(item.id)}
                      className={`p-4 rounded-xl text-left border-2 transition-all ${active ? "scale-[0.98]" : "hover:scale-[1.01]"}`}
                      style={{
                        background: active ? item.bg : "var(--bg-card)",
                        borderColor: active ? item.color : "var(--border)",
                        color: "var(--text)",
                      }}
                    >
                      <span className="w-9 h-9 rounded-lg grid place-items-center mb-2" style={{ background: item.bg, color: item.color }}>
                        <Icon size={18} />
                      </span>
                      <span className="text-[14px] font-bold block">{item.label}</span>
                      <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{item.labelEn}</span>
                      {active && <span className="mt-2 inline-flex text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: item.color, color: "white" }}>เลือกแล้ว ✓</span>}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-center mt-3" style={{ color: "var(--text-muted)" }}>เลือก {selected.length} หัวข้อ · ข้ามได้</p>
            </div>
          )}

          {step === 2 && (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl grid place-items-center mb-4" style={{ background: "var(--gold-soft)", color: "var(--gold)" }}>
                <Sparkles size={28} />
              </div>
              <h2 className="text-[22px] font-extrabold tracking-tight" style={{ color: "var(--text)" }}>พร้อมเปิดไพ่ใบแรกหรือยัง?</h2>
              <p className="text-[13.5px] leading-relaxed mt-2" style={{ color: "var(--text-secondary)" }}>
                {selected.length ? (
                  <>เราเตรียม <span style={{ color: "var(--primary)", fontWeight: 700 }}>{selected.map(s => INTERESTS.find(i => i.id === s)?.label).join(" · ")}</span> ไว้ให้แล้ว<br />เริ่มด้วยไพ่ 3 ใบ — ใช้แค่ 10 แต้ม</>
                ) : (
                  <>เริ่มด้วยไพ่ 3 ใบ — ภาพรวม อดีต · ปัจจุบัน · อนาคต<br />ใช้แค่ 10 แต้มสำหรับหัวข้อที่คุณเลือก</>
                )}
              </p>
              <div className="mt-5 p-3 rounded-xl flex items-center gap-3" style={{ background: "var(--primary-soft)", border: "1px solid rgba(167,139,250,0.18)" }}>
                <span className="w-8 h-8 rounded-lg grid place-items-center shrink-0" style={{ background: "var(--primary)", color: "white" }}><Sparkles size={14} /></span>
                <span className="text-[12.5px] font-semibold text-left" style={{ color: "var(--text)" }}>คุณจะได้: ภาพรวม → การอ่านไพ่ → คำแนะนำ ที่แบ่งเป็นหัวข้อชัดเจน</span>
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)} className="btn btn-ghost flex-1 rounded-xl">
                <ArrowLeft size={14} /> ย้อนกลับ
              </button>
            )}
            {step === 0 && (
              <button onClick={handleSkip} className="btn btn-ghost flex-1 rounded-xl">ข้ามไปก่อน</button>
            )}
            <button onClick={handleNext} className="btn btn-primary flex-1 rounded-xl gap-2">
              {step === 2 ? <>เริ่มเปิดไพ่ <ArrowRight size={14} /></> : <>ต่อไป <ArrowRight size={14} /></>}
            </button>
          </div>

          <div className="flex justify-center gap-1.5 mt-5">
            {[0, 1, 2].map(i => (
              <span key={i} className="h-1.5 rounded-full transition-all" style={{ width: i === step ? 24 : 8, background: i === step ? "var(--primary)" : "var(--border)" }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

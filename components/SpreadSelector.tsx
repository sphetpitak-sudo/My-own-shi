"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { SPREADS, type SpreadType } from "@/lib/cards";
import { Coins, Check, Sparkles, X } from "lucide-react";
import Link from "next/link";
import InsufficientPoints from "./ui/InsufficientPoints";
import { useDialogFocus } from "./ui/useDialogFocus";

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
  const [preview, setPreview] = useState<SpreadType | null>(null);

  const handleSelect = (key: SpreadType) => {
    if (key === "celtic") {
      setPreview("celtic");
      return;
    }
    onSelect(key);
  };

  return (
    <>
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
            onClick={() => handleSelect(key)}
            aria-label={`${spread.nameTh} - ${spread.cardCount} ใบ ${cost} แต้ม${disabled ? " (แต้มไม่พอ)" : ""}`}
            aria-pressed={active}
            className={cn(
              "card p-4 text-left relative overflow-hidden flex flex-col group",
              active && "ring-2 ring-[var(--primary)] shadow-md bg-[var(--primary-soft)]",
              disabled ? "opacity-60 cursor-not-allowed" : "hover:-translate-y-0.5 hover:border-[var(--primary)] hover:shadow-sm cursor-pointer"
            )}
            style={{ transition: "transform 200ms var(--ease), border-color 200ms var(--ease), box-shadow 200ms var(--ease)" }}
          >
            {/* Premium Position Layout Diagram — like homepage hero */}
            <div
              className="h-36 rounded-xl relative overflow-hidden mb-4 flex items-center justify-center border"
              style={{
                background: "radial-gradient(ellipse 90% 70% at 50% 0%, rgba(167,139,250,0.18) 0%, #0f0a1e 55%, #0a0614 100%)",
                borderColor: active ? "rgba(212,175,55,0.45)" : "var(--border-subtle)",
                boxShadow: active ? "0 8px 24px rgba(212,175,55,0.18), inset 0 1px 0 rgba(255,255,255,0.06)" : "inset 0 1px 0 rgba(255,255,255,0.04)",
              }}
            >
              {/* starfield dots like hero */}
              <div className="absolute inset-0 pointer-events-none opacity-40" style={{ backgroundImage: "radial-gradient(1px 1px at 20% 30%, white, transparent), radial-gradient(1px 1px at 70% 20%, white, transparent), radial-gradient(1px 1px at 85% 70%, white, transparent), radial-gradient(1px 1px at 30% 75%, white, transparent)" }} />
              <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(circle at 50% 35%, rgba(167,139,250,0.16), transparent 60%)" }} />
              {/* centered glow */}
              <div className="absolute w-24 h-24 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(212,175,55,0.10), transparent 70%)", filter: "blur(6px)" }} />
              {/* Cards layout */}
              <div className="relative flex items-center justify-center w-full h-full p-2">
                {key === "single" && (
                  <div className="relative w-[54px] h-[84px] rounded-[6px] border flex items-center justify-center shadow-lg group-hover:-translate-y-1 transition-transform duration-300" style={{ background: "linear-gradient(160deg,#1e0e3a,#2d1548 35%,#1a0a2e 70%)", borderColor: "rgba(212,175,55,0.55)", boxShadow: "0 6px 18px rgba(0,0,0,0.45), 0 0 0 1px rgba(212,175,55,0.12)" }}>
                    <div className="absolute inset-[4px] rounded-[4px] border border-[rgba(201,168,76,0.18)]" />
                    <div className="w-5 h-5 rounded-full border border-[rgba(201,168,76,0.20)] grid place-items-center"><div className="w-1.5 h-1.5 rounded-full bg-[rgba(212,175,55,0.9)] shadow-[0_0_6px_rgba(212,175,55,0.7)]" /></div>
                    <div className="absolute w-5 h-5" style={{ background: "rgba(201,168,76,0.14)", clipPath: "polygon(50% 0%, 61% 35%, 100% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 0% 35%, 39% 35%)", top: "50%", left: "50%", transform: "translate(-50%,-50%) scale(0.6)", opacity: 0.9 }} />
                  </div>
                )}
                {key === "three_card" && (
                  <div className="flex items-center justify-center -space-x-2">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="w-[42px] h-[64px] rounded-[5px] border flex items-center justify-center shrink-0 shadow-md group-hover:-translate-y-1 transition-transform" style={{ background: "linear-gradient(160deg,#1e0e3a,#2d1548)", borderColor: "rgba(212,175,55,0.50)", transform: `rotate(${(i-1)*6}deg)`, transitionDelay: `${i*50}ms`, zIndex: i===1?2:1 }}>
                        <div className="absolute inset-[3px] rounded-[3px] border border-[rgba(201,168,76,0.14)] pointer-events-none" />
                        <div className="w-3.5 h-3.5 rounded-full border border-[rgba(201,168,76,0.18)] grid place-items-center"><div className="w-1 h-1 rounded-full bg-[rgba(212,175,55,0.85)]" /></div>
                      </div>
                    ))}
                  </div>
                )}
                {key === "celtic" && (
                  <div className="relative w-full h-full max-w-[180px] max-h-[120px]">
                    {meta.dots.map((pos, i) => (
                      <div key={i} className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center" style={{ left: `${pos[0]}%`, top: `${pos[1]}%` }}>
                        <div className="w-[18px] h-[26px] rounded-[3px] border flex items-center justify-center shadow-sm group-hover:scale-[1.02] transition-transform" style={{ background: active ? "linear-gradient(160deg,#2d1a4a,#1e0e3a)" : "linear-gradient(160deg,#1d0e38,#1a0a2e)", borderColor: "rgba(212,175,55,0.55)", boxShadow: active ? "0 0 6px rgba(212,175,55,0.25)" : "0 2px 6px rgba(0,0,0,0.35)" }}>
                          <span className="text-[5px] font-bold" style={{ color: "rgba(253,230,160,0.9)" }}>{i+1}</span>
                        </div>
                      </div>
                    ))}
                    {/* center cross glow */}
                    <div className="absolute w-10 h-10 rounded-full pointer-events-none" style={{ left: "50%", top: "50%", transform: "translate(-50%,-50%)", background: "radial-gradient(circle, rgba(212,175,55,0.12), transparent 70%)", filter: "blur(4px)" }} />
                  </div>
                )}
              </div>
              {/* active ring */}
              {active && <div className="absolute inset-0 rounded-xl pointer-events-none" style={{ boxShadow: "inset 0 0 0 1px rgba(212,175,55,0.22), inset 0 1px 0 rgba(255,255,255,0.06)" }} />}
            </div>

            {/* Content */}
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--primary)]">
                {meta.tag}
              </span>
            </div>

            <h3 className="text-[14.5px] font-bold text-[var(--text)] group-hover:text-[var(--primary)] transition-colors leading-tight">
              {spread.nameTh}
            </h3>

            <p className="text-[13px] text-[var(--text-secondary)] mt-1 leading-relaxed flex-1">
              {spread.descriptionTh}
            </p>

            {/* Bottom Meta */}
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-[var(--border-subtle)] text-[12px]">
              <span className="font-semibold text-[var(--text-muted)]">{spread.cardCount} ใบ</span>
              <span className={cn("font-extrabold flex items-center gap-1", disabled ? "text-[var(--red)]" : "text-[var(--gold)]")}>
                <Coins size={12} /> {cost} แต้ม
              </span>
            </div>
            {disabled && (
              <div className="mt-3">
                <InsufficientPoints needed={cost} current={userPoints} />
              </div>
            )}

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

      {/* Global balance footer */}
      <div className="max-w-4xl mx-auto px-4 mt-5">
        <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl border" style={{ background: "var(--bg-card)", borderColor: "var(--border-subtle)" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg grid place-items-center" style={{ background: "var(--gold-soft)", color: "var(--gold)" }}><Coins size={14} /></div>
            <div>
              <div className="text-[11px] font-bold tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>คงเหลือ</div>
              <div className="text-[15px] font-extrabold" style={{ color: "var(--text)" }}>{userPoints.toLocaleString()} แต้ม</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11.5px]" style={{ color: "var(--text-secondary)" }}>เลือก Spread ที่เหมาะกับคำถามของคุณ</div>
            <Link href="/dashboard/profile" className="text-[11.5px] font-bold hover:underline" style={{ color: "var(--primary)" }}>เติมแต้ม / แลกโค้ด →</Link>
          </div>
        </div>
      </div>

      {/* Celtic preview modal */}
      <CelticPreviewModal
        open={preview === "celtic"}
        onClose={() => setPreview(null)}
        onSelect={() => { setPreview(null); onSelect("celtic"); }}
        cost={costs["celtic"] ?? SPREADS.celtic.cost}
        userPoints={userPoints}
      />
    </>
  );
}

function CelticPreviewModal({
  open,
  onClose,
  onSelect,
  cost,
  userPoints,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: () => void;
  cost: number;
  userPoints: number;
}) {
  const panelRef = useDialogFocus<HTMLDivElement>(open, { onClose });
  if (!open) return null;
  const disabled = userPoints < cost;
  return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-label="ปิด" tabIndex={-1} />
          <div ref={panelRef} tabIndex={-1} className="relative card p-6 max-w-[520px] w-full max-h-[85dvh] overflow-auto animate-fade" style={{ background: "var(--bg-elevated)", outline: "none" }} role="dialog" aria-modal="true" aria-labelledby="celtic-preview-title">
            <button onClick={onClose} aria-label="ปิดหน้าต่างตัวอย่าง" className="touch-hit absolute top-3 right-3 w-8 h-8 grid place-items-center rounded-full hover:bg-[var(--bg)]" style={{ color: "var(--text-muted)" }}><X size={16} /></button>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-9 h-9 rounded-xl grid place-items-center" style={{ background: "var(--primary-soft)", color: "var(--primary)" }}><Sparkles size={16} /></div>
              <div>
                <h3 id="celtic-preview-title" className="text-[18px] font-extrabold" style={{ color: "var(--text)" }}>กางเขนเคลติก — 10 ใบ</h3>
                <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>วิเคราะห์ลึก 10 มิติ • คุ้มเมื่ออยากเห็นภาพรวมครบ</p>
              </div>
            </div>
            <div className="rounded-xl overflow-hidden border p-4 mt-3" style={{ background: "#0a0614", borderColor: "var(--border-subtle)" }}>
              <div className="relative h-[190px] rounded-lg overflow-hidden" style={{ background: "radial-gradient(circle at 50% 30%, rgba(167,139,250,0.12), transparent 65%)" }}>
                {SPREADS.celtic.positions.map((pos, i) => (
                  <div key={i} className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5" style={{ left: `${pos.x}%`, top: `${pos.y}%` }}>
                    <div className="w-[22px] h-[32px] rounded-[3px] border flex items-center justify-center text-[7px] font-bold" style={{ background: "rgba(212,175,55,0.28)", borderColor: "rgba(212,175,55,0.7)", color: "#fde6a0" }}>{i+1}</div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-4">
                {SPREADS.celtic.positions.map((p, i) => (
                  <div key={i} className="flex gap-1.5 text-[11.5px]">
                    <span className="font-bold" style={{ color: "var(--gold)" }}>{i+1}.</span>
                    <span style={{ color: "#c9c2b8" }}>{p.labelTh}</span>
                    <span style={{ color: "rgba(255,255,255,0.35)" }}>({p.label})</span>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-[12.5px] mt-3 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              เหมาะสำหรับคำถามที่ต้องการความละเอียดทุกมิติ — อดีต รากฐาน อุปสรรค อนาคตใกล้ ทัศนคติ สิ่งรอบตัว ความหวัง และบทสรุปสุดท้าย เชื่อม 10 ใบเป็นเรื่องเดียว
            </p>
            <div className="flex items-center gap-2 mt-4">
              <div className="flex items-center gap-1.5 text-[13px] font-extrabold" style={{ color: "var(--gold)" }}><Coins size={14} /> {cost} แต้ม</div>
              <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>คงเหลือ {userPoints.toLocaleString()}</span>
              {disabled && <span className="text-[11.5px] font-bold ml-auto" style={{ color: "var(--red)" }}>แต้มไม่พอ</span>}
            </div>
            <div className="flex gap-2.5 mt-5">
              <button onClick={onClose} className="btn btn-ghost flex-1">ไว้ก่อน</button>
              <button
                disabled={disabled}
                onClick={onSelect}
                className="btn btn-primary flex-1"
              >
                ยืนยันเปิด 10 ใบ
              </button>
            </div>
          </div>
        </div>
  );
}

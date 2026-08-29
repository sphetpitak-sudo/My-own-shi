"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { SPREADS, type SpreadType } from "@/lib/cards";
import { Coins, Check, AlertTriangle, Sparkles, X } from "lucide-react";
import Link from "next/link";

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
          const shortage = cost - userPoints;

        return (
          <button
            key={key}
            type="button"
            disabled={disabled}
            onClick={() => handleSelect(key)}
            aria-label={`${spread.nameTh} - ${spread.cardCount} ใบ ${cost} แต้ม${disabled ? " (แต้มไม่พอ)" : ""}`}
            className={cn(
              "card p-5 text-left relative overflow-hidden transition-all duration-300 flex flex-col group",
              active && "ring-2 ring-[var(--primary)] shadow-md bg-[var(--primary-soft)]",
              disabled ? "opacity-60 cursor-not-allowed" : "hover:-translate-y-1 hover:border-[var(--primary)] hover:shadow-md cursor-pointer"
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
              <span className={cn("font-extrabold flex items-center gap-1", disabled ? "text-[var(--red)]" : "text-[var(--gold)]")}>
                <Coins size={12} /> {cost} แต้ม
              </span>
            </div>
            {disabled && (
              <div className="mt-3 flex items-center gap-1.5 text-[11.5px] font-semibold text-[var(--red)] bg-[var(--red-soft)] border border-[rgba(194,65,48,0.12)] rounded-lg px-3 py-2">
                <AlertTriangle size={12} />
                ขาดอีก {shortage} แต้ม
                <Link href="/dashboard/daily" className="ml-auto text-[11px] font-bold underline hover:no-underline">รับแต้มฟรี</Link>
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
      {preview === "celtic" && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal>
          <button className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setPreview(null)} aria-label="ปิด" />
          <div className="relative card p-6 max-w-[520px] w-full max-h-[86vh] overflow-auto" style={{ background: "var(--bg-elevated)" }}>
            <button onClick={() => setPreview(null)} className="absolute top-3 right-3 w-8 h-8 grid place-items-center rounded-full hover:bg-[var(--bg)]" style={{ color: "var(--text-muted)" }}><X size={16} /></button>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-9 h-9 rounded-xl grid place-items-center" style={{ background: "var(--primary-soft)", color: "var(--primary)" }}><Sparkles size={16} /></div>
              <div>
                <h3 className="text-[18px] font-extrabold" style={{ color: "var(--text)" }}>กางเขนเคลติก — 10 ใบ</h3>
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
              <div className="flex items-center gap-1.5 text-[13px] font-extrabold" style={{ color: "var(--gold)" }}><Coins size={14} /> {(costs["celtic"] ?? SPREADS.celtic.cost)} แต้ม</div>
              <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>คงเหลือ {userPoints.toLocaleString()}</span>
              {userPoints < (costs["celtic"] ?? SPREADS.celtic.cost) && <span className="text-[11.5px] font-bold ml-auto" style={{ color: "var(--red)" }}>แต้มไม่พอ</span>}
            </div>
            <div className="flex gap-2.5 mt-5">
              <button onClick={() => setPreview(null)} className="btn btn-ghost flex-1">ไว้ก่อน</button>
              <button
                disabled={userPoints < (costs["celtic"] ?? SPREADS.celtic.cost)}
                onClick={() => { setPreview(null); onSelect("celtic"); }}
                className="btn btn-primary flex-1"
              >
                ยืนยันเปิด 10 ใบ
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";

interface Props {
  onComplete: () => void;
  cardCount?: number;
  reducedMotion?: boolean;
}

type Phase = "enter" | "lift" | "split" | "riffle" | "fan" | "settle" | "done";

const DEFAULT_COUNT = 14;

export default function ShuffleAnimation({ onComplete, cardCount = DEFAULT_COUNT, reducedMotion: prop }: Props) {
  const prefersReduced = useReducedMotion();
  const reduced = prop ?? prefersReduced;
  const [phase, setPhase] = useState<Phase>("enter");
  const doneRef = useRef(false);
  const timers = useRef<number[]>([]);

  const cards = useMemo(() => {
    const seed = 8391;
    const r = (i: number, s: number) => {
      const x = Math.sin((i + 7) * seed + s * 12.91) * 10000;
      return x - Math.floor(x);
    };
    return Array.from({ length: cardCount }, (_, i) => ({
      id: i,
      rot: r(i, 1) * 2.8 - 1.4,
      offX: r(i, 2) * 3.2 - 1.6,
      offY: r(i, 3) * 2.2 - 1.1,
      d: i * 0.018,
      rx: (r(i, 5) - 0.5) * 6,
      ry: (r(i, 6) - 0.5) * 10,
      f: (r(i, 7) - 0.5) * 1.8,
    }));
  }, [cardCount]);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    if (reduced) {
      setPhase("done");
      const t = window.setTimeout(finish, 260);
      timers.current = [t];
      return () => timers.current.forEach((id) => clearTimeout(id));
    }
    if (doneRef.current) return;
    // Timeline: enter 420 calm → lift 220 anticipate → split 620 → riffle 780 tactile → fan 700 peak → settle 480 calm
    const seq: Array<{ p: Phase; at: number }> = [
      { p: "lift", at: 420 },
      { p: "split", at: 640 },
      { p: "riffle", at: 1260 },
      { p: "fan", at: 2040 },
      { p: "settle", at: 2740 },
    ];
    seq.forEach(({ p, at }) => {
      const id = window.setTimeout(() => setPhase(p), at);
      timers.current.push(id);
    });
    const doneId = window.setTimeout(() => {
      setPhase("done");
      finish();
    }, 3220);
    timers.current.push(doneId);
    return () => timers.current.forEach((id) => clearTimeout(id));
  }, [finish, reduced]);

  if (phase === "done") return null;

  if (reduced) {
    return (
      <div className="shuffle-stage">
        <div className="mystical-loader"><div className="mystical-loader-dot" /><div className="mystical-loader-dot" /><div className="mystical-loader-dot" /></div>
        <div className="shuffle-status"><div className="shuffle-status-title">กำลังเตรียมไพ่...</div></div>
      </div>
    );
  }

  const isEnter = phase === "enter";
  const isLift = phase === "lift";
  const isSplit = phase === "split";
  const isRiffle = phase === "riffle";
  const isFan = phase === "fan";
  const isSettle = phase === "settle";

  const title = isEnter ? "วางสำรับ" : isLift ? "ยกสำรับ" : isSplit ? "แยกกอง" : isRiffle ? "สับไพ่" : isFan ? "คลี่วงกลม" : "พร้อมแล้ว";
  const sub = isEnter ? "ตั้งสมาธิ" : isLift ? "เตรียมสับ" : isSplit ? "จิตใจสงบ" : isRiffle ? "ไพ่สอดประสาน" : isFan ? "พลังงานก่อตัว" : "แตะไพ่เพื่อเลือก";

  return (
    <div className="shuffle-stage" style={{ overflow: "visible" }}>
      {/* Soft table */}
      <div
        aria-hidden
        className="absolute rounded-full"
        style={{
          width: "78%",
          maxWidth: 520,
          aspectRatio: "1.2",
          top: "54%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: "radial-gradient(ellipse at 50% 38%, rgba(167,139,250,0.06) 0%, transparent 62%), radial-gradient(ellipse at 50% 88%, rgba(0,0,0,0.12) 0%, transparent 42%)",
          border: "1px solid rgba(167,139,250,0.07)",
          pointerEvents: "none",
        }}
      />

      <div
        className="shuffle-deck-wrap"
        style={{
          transform: isLift ? "translateY(-10px) scale(1.015)" : isSplit ? "translateY(-8px) scale(1.012)" : isRiffle ? "translateY(-6px) scale(1.01)" : isFan ? "translateY(-2px) scale(1.006)" : "translateY(0) scale(1)",
          transition: "transform 0.62s var(--ease-magic)",
          transformOrigin: "center center",
          willChange: "transform",
        }}
      >
        {cards.map((c, i) => {
          const left = i % 2 === 0;
          let tx = 0, ty = 0, rot = c.rot, sc = 1, op = 1, z = c.id;

          if (isEnter) {
            tx = c.offX * 0.4; ty = c.offY * 0.4 - i * 0.22; rot *= 0.3; op = 0.94; z = c.id;
          } else if (isLift) {
            tx = c.offX * 0.2; ty = -6 - i * 0.18; rot *= 0.2; sc = 1.01; op = 1; z = c.id;
          } else if (isSplit) {
            const s = left ? -1 : 1;
            tx = s * (58 + (i % 3) * 4) + c.rx; ty = -4 + (i % 2) * 2 + c.ry * 0.12; rot = s * 6 + c.rx * 0.4; sc = 0.987; op = 0.97; z = left ? i : cardCount - i;
          } else if (isRiffle) {
            const s = left ? -1 : 1;
            const st = (i % 5) * 1.6;
            tx = s * 11 + (i % 2 ? -6 : 6) + Math.sin(i * 0.95) * 3.5 + c.f * 0.4;
            ty = c.ry * 0.5 + (left ? -2 : 2) + st * 0.45;
            rot = s * -3.8 + c.rx * 0.35 + Math.sin(i * 1.08) * 2.2;
            sc = 0.99; op = 1; z = left ? 100 + i : 100 - i;
          } else if (isFan) {
            const w = typeof window !== "undefined" ? window.innerWidth : 390;
            const total = 300, start = -150, step = total / (cardCount - 1), ang = start + i * step, rad = w <= 320 ? 84 : w <= 360 ? 96 : 108;
            tx = Math.sin((ang * Math.PI) / 180) * rad + c.f * 0.3;
            ty = -Math.cos((ang * Math.PI) / 180) * rad * 0.86 - 10 + c.ry * 0.06;
            rot = ang * 0.88 + c.rot * 0.25;
            sc = 0.96 + (1 - Math.abs(ang) / 160) * 0.04;
            op = 0.98; z = i;
          } else if (isSettle) {
            tx = c.offX * 0.18; ty = -i * 0.16; rot *= 0.18; sc = 1; op = 1; z = c.id;
          }

          const elev = isLift ? 10 : isSplit ? 12 : isRiffle ? 14 : isFan ? 9 : isSettle ? 5 : 3;
          const so = isRiffle ? 0.22 : isSplit ? 0.19 : isFan ? 0.15 : 0.11;

          return (
            <div
              key={c.id}
              className="shuffle-deck-card"
              style={{
                zIndex: z,
                transform: `translate3d(${tx}px, ${ty}px, 0) rotate(${rot}deg) scale(${sc})`,
                opacity: op,
                transition: `transform 0.68s var(--ease-spring) ${c.d}s, opacity 0.42s var(--ease-soft) ${c.d}s, box-shadow 0.5s var(--ease)`,
                boxShadow: `0 ${elev}px ${elev * 1.7}px rgba(0,0,0,${so}), 0 1px 3px rgba(0,0,0,0.16)`,
                willChange: "transform, opacity",
                backfaceVisibility: "hidden",
              }}
            >
              <div className="shuffle-card-back-design">
                <div className="shuffle-card-vignette" />
                <div className="shuffle-card-center">
                  <div className="shuffle-card-ring" />
                  <div className="shuffle-card-ring inner" />
                  <div className="shuffle-card-star" />
                  <div className="shuffle-card-dot" />
                  <div className="shuffle-card-cross-h" />
                  <div className="shuffle-card-cross-v" />
                </div>
                <div className="shuffle-card-corners"><span /><span /><span /><span /></div>
              </div>
            </div>
          );
        })}
        {(isSplit || isRiffle) && <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at center, rgba(167,139,250,${isRiffle ? 0.07 : 0.05}), transparent 68%)`, filter: "blur(8px)" }} />}
      </div>

      <div className="shuffle-status" aria-live="polite">
        <div className="shuffle-status-title" key={phase}>{title}</div>
        <div className="shuffle-status-sub">{sub}</div>
        {(isSplit || isRiffle) && <div className="mystical-loader" style={{ marginTop: 10 }}><div className="mystical-loader-dot" /><div className="mystical-loader-dot" /><div className="mystical-loader-dot" /></div>}
      </div>
    </div>
  );
}

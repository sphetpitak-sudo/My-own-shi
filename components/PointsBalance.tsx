"use client";

import { useEffect, useState, useRef } from "react";
import { Coins } from "lucide-react";

interface PointsBalanceProps {
  points: number;
  className?: string;
}

export default function PointsBalance({ points, className = "" }: PointsBalanceProps) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number | null>(null);
  const fromRef = useRef(0);

  useEffect(() => {
    fromRef.current = display;
    startRef.current = null;
    const duration = 600;
    const targetPoints = points;

    const animate = (timestamp: number) => {
      if (!startRef.current) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(fromRef.current + (targetPoints - fromRef.current) * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points]);

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <div className="relative">
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #f6c944 0%, #e8a917 30%, #d4af37 60%, #b8942a 100%)",
            boxShadow: "0 6px 24px rgba(212, 175, 55, 0.25), inset 0 1px 0 rgba(255,255,255,0.4)",
          }}
        >
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background: "linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.5) 45%, transparent 60%)",
              animation: "coinShimmer 3s ease-in-out infinite",
            }}
          />
          <Coins size={36} className="relative z-10" style={{ color: "#6a4e00" }} />
        </div>
      </div>

      <div className="text-center">
        <div className="text-3xl font-bold tracking-tight" style={{ color: "var(--text)", letterSpacing: "-0.02em" }}>
          {display.toLocaleString()}
        </div>
        <div className="text-xs font-semibold mt-1" style={{ color: "var(--text-muted)", letterSpacing: "0.05em" }}>
          แต้ม
        </div>
      </div>
    </div>
  );
}

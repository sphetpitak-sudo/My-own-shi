"use client";

import { useEffect, useRef, useState } from "react";
import { Coins } from "lucide-react";
import { cn } from "@/lib/cn";

interface PointsBadgeProps {
  points: number;
  size?: "sm" | "md" | "lg";
  className?: string;
  showPopOnChange?: boolean;
  tone?: "default" | "gold" | "violet";
}

export default function PointsBadge({
  points,
  size = "md",
  className,
  showPopOnChange = false,
  tone = "gold",
}: PointsBadgeProps) {
  const [display, setDisplay] = useState(points);
  const [popDelta, setPopDelta] = useState<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const fromRef = useRef<number>(points);
  const prevPointsRef = useRef<number>(points);

  useEffect(() => {
    fromRef.current = display;
    const from = fromRef.current;
    const to = points;
    const duration = 700;
    const start = performance.now();
    const animate = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    if (showPopOnChange) {
      const delta = to - prevPointsRef.current;
      if (delta !== 0) {
        setPopDelta(delta);
        const t = setTimeout(() => setPopDelta(null), 1100);
        prevPointsRef.current = to;
        return () => {
          clearTimeout(t);
          if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
      }
    } else {
      prevPointsRef.current = to;
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points]);

  const toneClass = cn(
    tone === "gold" && "points-badge-gold",
    tone === "violet" && "points-badge-violet",
    tone === "default" && "points-badge-default"
  );

  return (
    <div className={cn("points-badge", `points-badge-${size}`, toneClass, className)}>
      <Coins size={size === "lg" ? 16 : size === "md" ? 13 : 11} />
      <span className="points-badge-number">{display.toLocaleString()}</span>
      {popDelta !== null && (
        <span
          key={popDelta}
          className={cn(
            "points-pop",
            popDelta > 0 ? "points-pop-up" : "points-pop-down"
          )}
          aria-live="polite"
        >
          {popDelta > 0 ? "+" : ""}
          {popDelta}
        </span>
      )}
    </div>
  );
}

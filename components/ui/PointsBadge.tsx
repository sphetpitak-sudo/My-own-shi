"use client";

import { useEffect, useRef, useState } from "react";
import { Coins } from "lucide-react";
import { cn } from "@/lib/cn";

interface PointsBadgeProps {
  points?: number;
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
  const isLoading = points == null;
  const pointsVal = points ?? 0;
  const [display, setDisplay] = useState(pointsVal);
  const [popDelta, setPopDelta] = useState<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const fromRef = useRef<number>(pointsVal);
  const prevPointsRef = useRef<number>(pointsVal);
  const mountedRef = useRef(false);
  const mountTimeRef = useRef<number>(0);

  useEffect(() => {
    if (isLoading) return;
    // First mount: sync without animation/pop to avoid flash on navigation
    if (!mountedRef.current) {
      mountedRef.current = true;
      mountTimeRef.current = performance.now();
      prevPointsRef.current = pointsVal;
      fromRef.current = pointsVal;
      setDisplay(pointsVal);
      return;
    }
    // No change: skip animation/pop
    if (pointsVal === prevPointsRef.current) {
      if (display !== pointsVal) setDisplay(pointsVal);
      return;
    }
    // Suppress animation/pop for initial load artifact: 0 -> actual within 2s of mount
    // This is navigation remount (DashboardShell remount with 0 then fetch), not a real earn/spend
    const isInitialLoad = performance.now() - mountTimeRef.current < 2000 && prevPointsRef.current === 0 && pointsVal !== 0;
    if (isInitialLoad) {
      prevPointsRef.current = pointsVal;
      fromRef.current = pointsVal;
      setDisplay(pointsVal);
      return;
    }
    fromRef.current = display;
    const from = fromRef.current;
    const to = pointsVal;
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
      prevPointsRef.current = to;
    } else {
      prevPointsRef.current = to;
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pointsVal, isLoading]);

  const toneClass = cn(
    tone === "gold" && "points-badge-gold",
    tone === "violet" && "points-badge-violet",
    tone === "default" && "points-badge-default"
  );

  return (
    <div className={cn("points-badge", `points-badge-${size}`, toneClass, className)}>
      <Coins size={size === "lg" ? 16 : size === "md" ? 13 : 11} />
      <span className="points-badge-number">{isLoading ? "…" : display.toLocaleString()}</span>
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

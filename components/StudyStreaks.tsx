"use client";

import { useMemo } from "react";
import { useLang } from "@/lib/i18n";
import type { Assignment } from "@/lib/types";
import { getLocalDate, getLocalDateOffset } from "@/lib/utils";
import { Flame, Trophy, Star } from "lucide-react";

interface Props {
  assignments: Assignment[];
}

export default function StudyStreaks({ assignments }: Props) {
  const { lang } = useLang();

  const stats = useMemo(() => {
    const today = getLocalDate();
    const doneDates = new Set(
      assignments
        .filter((a) => a.status === "done")
        .map((a) => a.updated_at.slice(0, 10))
    );

    // Calculate current streak
    let streak = 0;
    let d = new Date();
    while (true) {
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (doneDates.has(dateStr)) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }

    // Best streak (last 30 days)
    let bestStreak = 0;
    let currentRun = 0;
    for (let i = 30; i >= 0; i--) {
      const dateStr = getLocalDateOffset(-i);
      if (doneDates.has(dateStr)) {
        currentRun++;
        bestStreak = Math.max(bestStreak, currentRun);
      } else {
        currentRun = 0;
      }
    }

    // This week completions
    const weekAgo = getLocalDateOffset(-7);
    const thisWeek = assignments.filter(
      (a) => a.status === "done" && a.updated_at.slice(0, 10) >= weekAgo
    ).length;

    // Today completions
    const todayCount = assignments.filter(
      (a) => a.status === "done" && a.updated_at.slice(0, 10) === today
    ).length;

    return { streak, bestStreak, thisWeek, todayCount };
  }, [assignments]);

  const streakLevel = stats.streak >= 7 ? "fire" : stats.streak >= 3 ? "warm" : "cold";

  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Flame size={16} style={{ color: "var(--text-secondary)" }} />
        <span className="sec-title">{lang === "th" ? "สถิติการเรียน" : "Study Streaks"}</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Current streak */}
        <div className="p-3 rounded-xl" style={{ background: streakLevel === "fire" ? "var(--red-soft)" : streakLevel === "warm" ? "var(--amber-soft)" : "var(--bg)" }}>
          <div className="flex items-center gap-2 mb-1">
            <Flame size={14} style={{ color: streakLevel === "fire" ? "var(--red)" : streakLevel === "warm" ? "var(--amber)" : "var(--text-muted)" }} />
            <span className="text-[11px] font-semibold" style={{ color: "var(--text-muted)" }}>
              {lang === "th" ? "ต่อเนื่อง" : "Streak"}
            </span>
          </div>
          <div className="text-[22px] font-bold">{stats.streak}</div>
          <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>
            {lang === "th" ? "วัน" : "days"}
          </div>
        </div>

        {/* Best streak */}
        <div className="p-3 rounded-xl" style={{ background: "var(--amber-soft)" }}>
          <div className="flex items-center gap-2 mb-1">
            <Trophy size={14} style={{ color: "var(--amber)" }} />
            <span className="text-[11px] font-semibold" style={{ color: "var(--text-muted)" }}>
              {lang === "th" ? "ดีที่สุด" : "Best"}
            </span>
          </div>
          <div className="text-[22px] font-bold">{stats.bestStreak}</div>
          <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>
            {lang === "th" ? "วัน" : "days"}
          </div>
        </div>

        {/* This week */}
        <div className="p-3 rounded-xl" style={{ background: "var(--green-soft)" }}>
          <div className="flex items-center gap-2 mb-1">
            <Star size={14} style={{ color: "var(--green)" }} />
            <span className="text-[11px] font-semibold" style={{ color: "var(--text-muted)" }}>
              {lang === "th" ? "สัปดาห์นี้" : "This week"}
            </span>
          </div>
          <div className="text-[22px] font-bold">{stats.thisWeek}</div>
          <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>
            {lang === "th" ? "งานเสร็จ" : "completed"}
          </div>
        </div>

        {/* Today */}
        <div className="p-3 rounded-xl" style={{ background: "var(--blue-soft)" }}>
          <div className="flex items-center gap-2 mb-1">
            <Star size={14} style={{ color: "var(--blue)" }} />
            <span className="text-[11px] font-semibold" style={{ color: "var(--text-muted)" }}>
              {lang === "th" ? "วันนี้" : "Today"}
            </span>
          </div>
          <div className="text-[22px] font-bold">{stats.todayCount}</div>
          <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>
            {lang === "th" ? "งานเสร็จ" : "completed"}
          </div>
        </div>
      </div>
    </div>
  );
}

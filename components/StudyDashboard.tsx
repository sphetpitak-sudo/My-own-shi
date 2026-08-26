"use client";

import { useState, useMemo } from "react";
import { useLang } from "@/lib/i18n";
import type { Assignment, Subject } from "@/lib/types";
import { getLocalDate, getLocalDateOffset, formatDaysLeft } from "@/lib/utils";
import { useSubjectMap } from "@/lib/useSubjectMap";
import { AlertTriangle, CheckCircle2, Clock, BookOpen, CalendarDays, Minus, Plus } from "lucide-react";

interface Props {
  assignments: Assignment[];
  subjects: Subject[];
}

export default function StudyDashboard({ assignments, subjects }: Props) {
  const { t, lang } = useLang();
  const today = getLocalDate();
  const weekLater = getLocalDateOffset(7);

  const [weeklyGoal, setWeeklyGoal] = useState(() => {
    if (typeof window !== "undefined") {
      return parseInt(localStorage.getItem("weeklyGoal") || "10", 10);
    }
    return 10;
  });
  const completedThisWeek = assignments.filter((a) => {
    if (a.status !== "done") return false;
    const d = new Date(a.updated_at);
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    return d >= weekStart;
  }).length;

  const subjectMap = useSubjectMap(subjects);

  const { stats, upcoming } = useMemo(() => {
    const pending = assignments.filter((a) => a.status === "pending");
    const inProgress = assignments.filter((a) => a.status === "in_progress");
    const done = assignments.filter((a) => a.status === "done");
    const overdue = pending.filter((a) => a.due_date && a.due_date < today);
    const dueToday = pending.filter((a) => a.due_date === today);
    const dueThisWeek = pending.filter((a) => a.due_date && a.due_date > today && a.due_date <= weekLater);

    const stats = [
      { label: t.pending_count, value: pending.length + inProgress.length, icon: Clock, color: "var(--amber)", bg: "var(--amber-soft)" },
      { label: t.completed_count, value: done.length, icon: CheckCircle2, color: "var(--green)", bg: "var(--green-soft)" },
      { label: t.overdue_count, value: overdue.length, icon: AlertTriangle, color: "var(--red)", bg: "var(--red-soft)" },
    ];

    const upcoming = [...dueToday, ...dueThisWeek, ...overdue].slice(0, 5);

    return { stats, upcoming };
  }, [assignments, subjects, today, weekLater, t]);

  return (
    <div className="space-y-4 animate-in">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="stat-card">
            <div className="stat-icon" style={{ background: bg }}>
              <Icon size={18} style={{ color }} />
            </div>
            <div className="stat-label">{label}</div>
            <div className="stat-value">{value}</div>
          </div>
        ))}
      </div>

      {/* Weekly Goal */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-[var(--text)] mb-3">
          {t.weekly_goal}
        </h3>
        <div className="flex items-center gap-3 mb-2">
          <div className="flex-1 h-2 bg-[var(--bg)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--primary)] rounded-full transition-all"
              style={{ width: `${Math.min((completedThisWeek / weeklyGoal) * 100, 100)}%` }}
            />
          </div>
          <span className="text-sm font-medium text-[var(--text)]">{completedThisWeek}/{weeklyGoal}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setWeeklyGoal(Math.max(1, weeklyGoal - 1)); localStorage.setItem("weeklyGoal", String(Math.max(1, weeklyGoal - 1))); }}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--bg)] hover:bg-[var(--border)] text-[var(--muted)]"
            aria-label={lang === "th" ? "ลดเป้าหมาย" : "Decrease goal"}
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setWeeklyGoal(weeklyGoal + 1); localStorage.setItem("weeklyGoal", String(weeklyGoal + 1)); }}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--bg)] hover:bg-[var(--border)] text-[var(--muted)]"
            aria-label={lang === "th" ? "เพิ่มเป้าหมาย" : "Increase goal"}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Upcoming deadlines */}
      {upcoming.length > 0 && (
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays size={16} className="text-secondary" />
            <span className="sec-title">{t.upcoming_deadlines}</span>
          </div>
          <div className="space-y-1.5">
            {upcoming.map((a) => {
              const sub = a.subject_id ? subjectMap[a.subject_id] : null;
              const isOverdue = a.due_date && a.due_date < today;

              return (
                <div key={a.id} className="list-item bg-card">
                  {isOverdue ? (
                    <AlertTriangle size={16} style={{ color: "var(--red)", flexShrink: 0 }} />
                  ) : (
                    <CalendarDays size={16} className="text-muted" style={{ flexShrink: 0 }} />
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-[13px]">{a.title}</span>
                    {sub && (
                      <span className="badge ml-2" style={{ background: `${sub.color}18`, color: sub.color }}>
                        {sub.name}
                      </span>
                    )}
                  </div>
                  {a.due_date && (
                    <span className={`badge ${isOverdue ? "badge-red" : "badge-amber"}`}>
                      {formatDaysLeft(a.due_date, lang)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Subject breakdown */}
      {subjects.length > 0 && (
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen size={16} className="text-secondary" />
            <span className="sec-title">{t.by_subject}</span>
          </div>
          <div className="space-y-2">
            {subjects.map((s) => {
              const subAssignments = assignments.filter((a) => a.subject_id === s.id);
              const subPending = subAssignments.filter((a) => a.status !== "done").length;
              const subDone = subAssignments.filter((a) => a.status === "done").length;
              const total = subAssignments.length;
              const pct = total > 0 ? Math.round((subDone / total) * 100) : 0;

              return (
                <div key={s.id} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: s.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[13px] font-semibold truncate">{s.name}</span>
                      <span className="text-[11px] text-muted">{subDone}/{total}</span>
                    </div>
                    <div className="bar">
                      <div style={{ width: `${pct}%`, background: s.color }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

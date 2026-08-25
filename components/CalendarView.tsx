"use client";

import { useState, useMemo } from "react";
import { useLang } from "@/lib/i18n";
import type { Assignment, Subject } from "@/lib/types";
import { getLocalDate } from "@/lib/utils";
import { ChevronLeft, ChevronRight, BookOpen, AlertTriangle, CheckCircle2 } from "lucide-react";

const WEEKDAYS_TH = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
const WEEKDAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS_TH = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
const MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

interface Props {
  assignments: Assignment[];
  subjects: Subject[];
}

export default function CalendarView({ assignments, subjects }: Props) {
  const { t, lang } = useLang();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const weekdays = lang === "th" ? WEEKDAYS_TH : WEEKDAYS_EN;
  const monthName = lang === "th" ? MONTHS_TH[month] : MONTHS_EN[month];

  const subjectMap = Object.fromEntries(subjects.map((s) => [s.id, s]));

  const assignmentsByDate = useMemo(() => {
    const map: Record<string, Assignment[]> = {};
    assignments.forEach((a) => {
      if (a.due_date) {
        if (!map[a.due_date]) map[a.due_date] = [];
        map[a.due_date].push(a);
      }
    });
    return map;
  }, [assignments]);

  const selectedAssignments = selectedDate ? assignmentsByDate[selectedDate] || [] : [];

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const navigate = (dir: number) => {
    setCurrentDate(new Date(year, month + dir, 1));
    setSelectedDate(null);
  };

  const today = getLocalDate();

  return (
    <div className="space-y-4 animate-in">
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate(-1)} className="icon-btn-sm"><ChevronLeft size={18} /></button>
          <div className="flex items-center gap-2">
            <h3 className="text-[16px] font-bold">{monthName} {year + 543}</h3>
            <button onClick={() => { setCurrentDate(new Date()); setSelectedDate(null); }}
              className="badge badge-blue cursor-pointer hover:opacity-80">
              {lang === "th" ? "วันนี้" : "Today"}
            </button>
          </div>
          <button onClick={() => navigate(1)} className="icon-btn-sm"><ChevronRight size={18} /></button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {weekdays.map((wd) => (
            <div key={wd} className="text-center text-[11px] font-semibold py-1" style={{ color: "var(--text-muted)" }}>
              {wd}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 cal-grid">
          {days.map((day, i) => {
            if (day === null) return <div key={`empty-${i}`} />;
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const dayAssignments = assignmentsByDate[dateStr] || [];
            const hasPending = dayAssignments.some((a) => a.status !== "done");
            const hasDone = dayAssignments.some((a) => a.status === "done");
            const isToday = dateStr === today;
            const isSelected = dateStr === selectedDate;

            return (
              <button
                key={day}
                onClick={() => setSelectedDate(dateStr)}
                className="relative flex flex-col items-center py-2 rounded-lg transition-all cal-day"
                style={{
                  background: isSelected ? "var(--primary)" : isToday ? "var(--blue-soft)" : "transparent",
                  color: isSelected ? "var(--text-invert)" : "var(--text)",
                  fontWeight: isToday || isSelected ? 700 : 500,
                }}
              >
                <span className="text-[13px]">{day}</span>
                {dayAssignments.length > 0 && (
                  <div className="flex gap-0.5 mt-0.5">
                    {hasPending && <div className="w-1.5 h-1.5 rounded-full cal-dot" style={{ background: isSelected ? "#fff" : "var(--amber)" }} />}
                    {hasDone && <div className="w-1.5 h-1.5 rounded-full cal-dot" style={{ background: isSelected ? "#fff" : "var(--green)" }} />}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selectedDate && (
        <div className="card p-5 animate-in">
          <h3 className="sec-title mb-3">
            {selectedDate}
            {selectedAssignments.length > 0 && (
              <span className="text-[12px] font-normal ml-2" style={{ color: "var(--text-muted)" }}>
                {selectedAssignments.length} {lang === "th" ? "งาน" : "items"}
              </span>
            )}
          </h3>
          {selectedAssignments.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>{t.no_items}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedAssignments.map((a) => {
                const sub = a.subject_id ? subjectMap[a.subject_id] : null;
                const isOverdue = a.status !== "done" && a.due_date && a.due_date < today;
                return (
                  <div key={a.id} className="list-item" style={{ background: "var(--bg-card)" }}>
                    {a.status === "done" ? (
                      <CheckCircle2 size={18} style={{ color: "var(--green)", flexShrink: 0 }} />
                    ) : isOverdue ? (
                      <AlertTriangle size={18} style={{ color: "var(--red)", flexShrink: 0 }} />
                    ) : (
                      <BookOpen size={18} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-[14px]" style={{ textDecoration: a.status === "done" ? "line-through" : "none" }}>
                        {a.title}
                      </span>
                      {sub && (
                        <span className="badge ml-2" style={{ background: `${sub.color}18`, color: sub.color }}>
                          {sub.name}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

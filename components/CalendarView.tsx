"use client";

import { useState, useMemo } from "react";
import { useLang } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import type { Assignment, Subject } from "@/lib/types";
import { getLocalDate } from "@/lib/utils";
import { useSubjectMap } from "@/lib/useSubjectMap";
import { ChevronLeft, ChevronRight, BookOpen, AlertTriangle, CheckCircle2, CalendarDays } from "lucide-react";

const WEEKDAYS_TH = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
const WEEKDAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS_TH = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
const MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

interface Props {
  assignments: Assignment[];
  subjects: Subject[];
  onEdit?: (a: Assignment) => void;
  onCreated?: () => void;
}

export default function CalendarView({ assignments, subjects, onEdit, onCreated }: Props) {
  const { t, lang } = useLang();
  const supabase = createClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [newQuickTitle, setNewQuickTitle] = useState("");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const weekdays = lang === "th" ? WEEKDAYS_TH : WEEKDAYS_EN;
  const monthName = lang === "th" ? MONTHS_TH[month] : MONTHS_EN[month];

  const subjectMap = useSubjectMap(subjects);

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
    setExpandedDay(null);
  };

  const today = getLocalDate();

  const handleQuickCreate = async (title: string, dateStr: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("assignments").insert({
      user_id: user.id,
      title,
      due_date: dateStr,
      priority: "medium",
      status: "pending",
    });
    onCreated?.();
  };

  return (
    <div className="space-y-4 animate-in">
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate(-1)} className="icon-btn-sm"
            aria-label={t.previous_month}><ChevronLeft size={18} /></button>
          <div className="flex items-center gap-2">
            <h3 className="text-[16px] font-bold">{monthName} {lang === "th" ? year + 543 : year}</h3>
            <button onClick={() => { setCurrentDate(new Date()); setSelectedDate(null); }}
              className="badge badge-blue cursor-pointer hover:opacity-80"
              aria-label={t.today_label}>
              {t.today_label}
            </button>
          </div>
          <button onClick={() => navigate(1)} className="icon-btn-sm"
            aria-label={t.next_month}><ChevronRight size={18} /></button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {weekdays.map((wd) => (
            <div key={wd} className="text-center text-[11px] font-semibold py-1" style={{ color: "var(--text-muted)" }}>
              {wd}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 cal-grid" role="grid" aria-label={t.calendar}>
          {days.map((day, i) => {
            if (day === null) return <div key={`empty-${i}`} />;
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const dayAssignments = assignmentsByDate[dateStr] || [];
            const isToday = dateStr === today;
            const isSelected = dateStr === selectedDate;

            return (
              <button
                key={day}
                onClick={() => {
                  if (expandedDay === dateStr) {
                    setExpandedDay(null);
                  } else if (dayAssignments.length === 0) {
                    setExpandedDay(dateStr);
                  } else {
                    setSelectedDate(dateStr);
                    setExpandedDay(null);
                  }
                }}
                className="relative flex flex-col items-center py-2 rounded-lg transition-all cal-day"
                role="gridcell"
                aria-selected={isSelected ? true : undefined}
                style={{
                  background: expandedDay === dateStr ? "var(--primary)" : isSelected ? "var(--primary)" : isToday ? "var(--blue-soft)" : "transparent",
                  color: expandedDay === dateStr || isSelected ? "var(--text-invert)" : "var(--text)",
                  fontWeight: isToday || isSelected || expandedDay === dateStr ? 700 : 500,
                }}
                aria-label={`${t.day_label} ${day}, ${monthName} ${year}${dayAssignments.length > 0 ? `, ${dayAssignments.length} ${t.assignments_label}` : ""}`}
              >
                <span className="text-[13px]">{day}</span>
                {dayAssignments.length > 0 && (
                  <div className="flex gap-0.5 mt-0.5">
                    {dayAssignments.slice(0, 3).map((da, i) => {
                      const subj = da.subject_id ? subjects.find((s) => s.id === da.subject_id) : null;
                      return (
                        <span key={i} className="w-1.5 h-1.5 rounded-full cal-dot"
                          style={{ background: expandedDay === dateStr || isSelected ? "#fff" : subj?.color || "var(--primary)" }} />
                      );
                    })}
                    {dayAssignments.length > 3 && (
                      <span className="text-[10px]" style={{ color: expandedDay === dateStr || isSelected ? "var(--text-invert)" : "var(--text-muted)" }}>+{dayAssignments.length - 3}</span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {expandedDay && (
        <div className="card p-4 animate-in">
          <p className="text-sm font-medium mb-2">
            {t.add_from_calendar}{" "}
            {expandedDay.split("-")[2]} {(lang === "th" ? MONTHS_TH : MONTHS_EN)[parseInt(expandedDay.split("-")[1], 10) - 1]}
          </p>
          <div className="flex gap-2">
            <input
              value={newQuickTitle}
              onChange={(e) => setNewQuickTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newQuickTitle.trim()) {
                  handleQuickCreate(newQuickTitle, expandedDay);
                  setNewQuickTitle("");
                  setExpandedDay(null);
                }
              }}
              placeholder={t.assignment_name}
              className="flex-1 bg-transparent border rounded-lg px-3 py-2 text-sm"
              style={{ borderColor: "var(--border)", color: "var(--text)" }}
              autoFocus
            />
            <button
              onClick={() => {
                if (newQuickTitle.trim()) {
                  handleQuickCreate(newQuickTitle, expandedDay);
                  setNewQuickTitle("");
                  setExpandedDay(null);
                }
              }}
              className="btn btn-primary !py-2 !px-3 !text-[13px]"
            >
              {t.add}
            </button>
          </div>
        </div>
      )}

      {selectedDate && (
        <div className="card p-5 animate-in">
          <h3 className="sec-title mb-3">
            {selectedDate}
            {selectedAssignments.length > 0 && (
              <span className="text-[12px] font-normal ml-2" style={{ color: "var(--text-muted)" }}>
                {selectedAssignments.length} {t.items_label}
              </span>
            )}
          </h3>
          {selectedAssignments.length === 0 ? (
            <div className="text-center py-6">
              <CalendarDays size={28} className="mx-auto mb-2" style={{ color: "var(--text-muted)", opacity: 0.4 }} />
              <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>{t.no_items}</p>
              <p className="text-[12px] mt-1" style={{ color: "var(--text-muted)", opacity: 0.6 }}>{t.no_data}</p>
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

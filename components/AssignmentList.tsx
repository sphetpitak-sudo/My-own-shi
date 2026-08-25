"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLang } from "@/lib/i18n";
import type { Assignment, Subject } from "@/lib/types";
import { getLocalDate } from "@/lib/utils";
import {
  BookOpen, CalendarDays, CheckCircle2, Clock, Circle,
  Pencil, Trash2, Search, AlertTriangle,
} from "lucide-react";

const PRIORITY_COLORS: Record<string, string> = {
  high: "var(--red)",
  medium: "var(--amber)",
  low: "var(--green)",
};

const STATUS_ICONS: Record<string, typeof Circle> = {
  pending: Circle,
  in_progress: Clock,
  done: CheckCircle2,
};

interface Props {
  assignments: Assignment[];
  subjects: Subject[];
  onEdit: (a: Assignment) => void;
  onDeleted: () => void;
  onStatusChange: () => void;
}

export default function AssignmentList({ assignments, subjects, onEdit, onDeleted, onStatusChange }: Props) {
  const { t, lang } = useLang();
  const supabase = createClient();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [swipedId, setSwipedId] = useState<string | null>(null);
  const touchStartX = useRef(0);

  const subjectMap = Object.fromEntries(subjects.map((s) => [s.id, s]));

  const today = getLocalDate();

  const getDaysLeft = (dueDate: string | null) => {
    if (!dueDate) return null;
    const diff = Math.ceil((new Date(dueDate).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const filtered = assignments.filter((a) => {
    if (filterStatus !== "all" && a.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      const subName = a.subject_id ? subjectMap[a.subject_id]?.name?.toLowerCase() || "" : "";
      if (!a.title.toLowerCase().includes(q) && !subName.includes(q)) return false;
    }
    return true;
  }).sort((a, b) => {
    if (a.status === "done" && b.status !== "done") return 1;
    if (a.status !== "done" && b.status === "done") return -1;
    if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
    if (a.due_date) return -1;
    if (b.due_date) return 1;
    return 0;
  });

  const cycleStatus = async (a: Assignment) => {
    const next = a.status === "pending" ? "in_progress" : a.status === "in_progress" ? "done" : "pending";
    await supabase.from("assignments").update({ status: next, updated_at: new Date().toISOString() }).eq("id", a.id);
    onStatusChange();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("assignments").delete().eq("id", id);
    onDeleted();
  };

  return (
    <div className="space-y-3">
      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.search_placeholder}
            className="input !pl-9"
          />
        </div>
        <div className="flex gap-1.5">
          {["all", "pending", "in_progress", "done"].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`chip flex-shrink-0 ${filterStatus === s ? "on" : ""}`}
            >
              {s === "all" ? t.all : s === "in_progress" ? t.in_progress : t[s as keyof typeof t]}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="empty">
          <div className="empty-icon"><BookOpen size={24} /></div>
          <div className="empty-title">{search ? t.no_items : t.no_assignments}</div>
          <div className="empty-sub">{search ? (lang === "th" ? "ลองค้นหาด้วยคำอื่น" : "Try a different search") : t.no_assignments_sub}</div>
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map((a) => {
            const daysLeft = getDaysLeft(a.due_date);
            const isOverdue = daysLeft !== null && daysLeft < 0 && a.status !== "done";
            const isDueToday = daysLeft === 0 && a.status !== "done";
            const sub = a.subject_id ? subjectMap[a.subject_id] : null;
            const StatusIcon = STATUS_ICONS[a.status] || Circle;

            return (
              <div
                key={a.id}
                className="list-item group relative overflow-hidden"
                style={{
                  background: "var(--bg-card)",
                  opacity: a.status === "done" ? 0.6 : 1,
                  transform: swipedId === a.id ? "translateX(-120px)" : "translateX(0)",
                  transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1)",
                }}
                onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
                onTouchEnd={(e) => {
                  const dx = e.changedTouches[0].clientX - touchStartX.current;
                  if (dx < -60) setSwipedId(a.id);
                  else setSwipedId(null);
                }}
              >
                {/* Swipe action layers */}
                {swipedId === a.id && (
                  <div className="absolute inset-0 flex items-center justify-end gap-2 pr-4 z-0"
                    style={{ background: "var(--red-soft)" }}>
                    <button onClick={() => { setSwipedId(null); onEdit(a); }}
                      className="btn btn-ghost !py-1.5 !px-3 !text-[12px]" style={{ color: "var(--blue)" }}>
                      <Pencil size={13} /> {t.edit}
                    </button>
                    <button onClick={() => { setSwipedId(null); handleDelete(a.id); }}
                      className="btn btn-ghost !py-1.5 !px-3 !text-[12px]" style={{ color: "var(--red)" }}>
                      <Trash2 size={13} /> {t.delete}
                    </button>
                  </div>
                )}

                {/* Status toggle */}
                <button
                  onClick={() => cycleStatus(a)}
                  className="flex-shrink-0 transition-colors"
                  style={{ color: a.status === "done" ? "var(--green)" : "var(--text-muted)" }}
                >
                  <StatusIcon size={20} />
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="font-semibold text-[14px]"
                      style={{ textDecoration: a.status === "done" ? "line-through" : "none" }}
                    >
                      {a.title}
                    </span>
                    {isOverdue && <AlertTriangle size={13} style={{ color: "var(--red)" }} />}
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {sub && (
                      <span className="badge" style={{ background: `${sub.color}18`, color: sub.color }}>
                        <BookOpen size={10} /> {sub.name}
                      </span>
                    )}
                    {a.due_date && (
                      <span className={`badge ${isOverdue ? "badge-red" : isDueToday ? "badge-amber" : "badge-neutral"}`}>
                        <CalendarDays size={10} /> {a.due_date}
                        {daysLeft !== null && a.status !== "done" && (
                          isOverdue ? ` (${lang === "th" ? "เลย" : ""}${Math.abs(daysLeft)}${lang === "th" ? " วัน" : "d"})` :
                          daysLeft === 0 ? (lang === "th" ? " (วันนี้)" : " (today)") :
                          ` (${daysLeft}${lang === "th" ? " วัน" : "d"})`
                        )}
                      </span>
                    )}
                    <span className="badge badge-neutral" style={{ color: PRIORITY_COLORS[a.priority] }}>
                      {t[a.priority]}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => onEdit(a)} className="icon-btn-sm"><Pencil size={14} /></button>
                  <button onClick={() => handleDelete(a.id)} className="icon-btn-sm danger"><Trash2 size={14} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

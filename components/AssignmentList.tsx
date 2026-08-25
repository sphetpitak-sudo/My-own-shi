"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLang } from "@/lib/i18n";
import { useToast } from "./Toast";
import type { Assignment, Subject } from "@/lib/types";
import { getLocalDate } from "@/lib/utils";
import {
  BookOpen, CalendarDays, CheckCircle2, Clock, Circle,
  Pencil, Trash2, Search, AlertTriangle, CheckSquare, ArrowUpDown, Check,
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
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [swipedId, setSwipedId] = useState<string | null>(null);
  const [srAnnouncement, setSrAnnouncement] = useState("");
  const [sortBy, setSortBy] = useState<"created" | "due" | "priority" | "title">("created");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const touchStartX = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const subjectMap = Object.fromEntries(subjects.map((s) => [s.id, s]));

  const today = getLocalDate();

  const getDaysLeft = (dueDate: string | null) => {
    if (!dueDate) return null;
    const diff = Math.ceil((new Date(dueDate).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const filtered = assignments.filter((a) => {
    if (filterStatus !== "all" && a.status !== filterStatus) return false;
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      const subName = a.subject_id ? subjectMap[a.subject_id]?.name?.toLowerCase() || "" : "";
      const tagMatch = a.tags?.some((tag) => tag.toLowerCase().includes(q));
      if (!a.title.toLowerCase().includes(q) && !subName.includes(q) && !tagMatch) return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (a.status === "done" && b.status !== "done") return 1;
    if (a.status !== "done" && b.status === "done") return -1;
    if (sortBy === "due") {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return a.due_date.localeCompare(b.due_date);
    }
    if (sortBy === "priority") {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.priority] - order[b.priority];
    }
    if (sortBy === "title") return a.title.localeCompare(b.title);
    return 0;
  });

  const cycleStatus = async (a: Assignment) => {
    const next = a.status === "pending" ? "in_progress" : a.status === "in_progress" ? "done" : "pending";
    await supabase.from("assignments").update({ status: next, updated_at: new Date().toISOString() }).eq("id", a.id);
    if (navigator.vibrate) navigator.vibrate(10);
    setSrAnnouncement(lang === "th" ? "เปลี่ยนสถานะแล้ว" : "Status changed");
    setTimeout(() => setSrAnnouncement(""), 1000);
    onStatusChange();
  };

  const handleDelete = async (id: string) => {
    const a = assignments.find((x) => x.id === id);
    if (!a) return;
    await supabase.from("assignments").delete().eq("id", id);
    onDeleted();
    toast(lang === "th" ? "ลบงานแล้ว" : "Assignment deleted", "success", {
      label: lang === "th" ? "เลิกทำ" : "Undo",
      onClick: async () => {
        await supabase.from("assignments").insert({
          id: a.id, user_id: a.user_id, subject_id: a.subject_id,
          title: a.title, description: a.description, due_date: a.due_date,
          priority: a.priority, status: a.status, estimated_minutes: a.estimated_minutes,
          recurring: a.recurring || "none", tags: a.tags || [], subtasks: a.subtasks || [],
        });
        onDeleted();
      },
    });
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const bulkComplete = async () => {
    if (selected.size === 0) return;
    await supabase.from("assignments").update({ status: "done", updated_at: new Date().toISOString() }).in("id", [...selected]);
    setSelected(new Set());
    onStatusChange();
  };

  const bulkDelete = async () => {
    if (selected.size === 0) return;
    await supabase.from("assignments").delete().in("id", [...selected]);
    setSelected(new Set());
    onDeleted();
  };

  return (
    <div className="space-y-3">
      <span className="sr-only" role="status" aria-live="polite">{srAnnouncement}</span>

      {selected.size > 0 && (
        <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: "var(--primary)", color: "var(--text-invert)" }}>
          <span className="text-sm font-medium">{selected.size} {lang === "th" ? "เลือกแล้ว" : "selected"}</span>
          <div className="flex-1" />
          <button onClick={bulkComplete} className="text-xs px-2 py-1 rounded bg-white/20 hover:bg-white/30">
            <Check size={12} className="inline mr-1" />
            {lang === "th" ? "เสร็จทั้งหมด" : "Complete All"}
          </button>
          <button onClick={bulkDelete} className="text-xs px-2 py-1 rounded bg-white/20 hover:bg-white/30">
            <Trash2 size={12} className="inline mr-1" />
            {lang === "th" ? "ลบ" : "Delete"}
          </button>
          <button onClick={() => setSelected(new Set())} className="text-xs px-2 py-1 rounded bg-white/20 hover:bg-white/30">
            {lang === "th" ? "ยกเลิก" : "Cancel"}
          </button>
        </div>
      )}

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
        <div className="flex items-center gap-1">
          <ArrowUpDown size={14} style={{ color: "var(--text-muted)" }} />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="select !py-1.5 !text-xs"
          >
            <option value="created">{lang === "th" ? "วันที่สร้าง" : "Created"}</option>
            <option value="due">{lang === "th" ? "กำหนดส่ง" : "Due date"}</option>
            <option value="priority">{lang === "th" ? "ความสำคัญ" : "Priority"}</option>
            <option value="title">{lang === "th" ? "ชื่อ" : "Title"}</option>
          </select>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="empty">
          <div className="empty-icon"><BookOpen size={24} /></div>
          <div className="empty-title">{search ? t.no_items : t.no_assignments}</div>
          <div className="empty-sub">{search ? (lang === "th" ? "ลองค้นหาด้วยคำอื่น" : "Try a different search") : t.no_assignments_sub}</div>
        </div>
      ) : (
        <div className="space-y-1.5">
          {sorted.map((a) => {
            const daysLeft = getDaysLeft(a.due_date);
            const isOverdue = daysLeft !== null && daysLeft < 0 && a.status !== "done";
            const isDueToday = daysLeft === 0 && a.status !== "done";
            const sub = a.subject_id ? subjectMap[a.subject_id] : null;
            const StatusIcon = STATUS_ICONS[a.status] || Circle;

            return (
              <div key={a.id}>
                <div
                  className="list-item group relative overflow-hidden"
                  style={{
                    background: "var(--bg-card)",
                    opacity: a.status === "done" ? 0.6 : 1,
                    transform: swipedId === a.id ? "translateX(-120px)" : "translateX(0)",
                    transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1)",
                  }}
                  onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
                  onTouchMove={() => { touchStartX.current = 9999; }}
                  onTouchEnd={(e) => {
                    const dx = e.changedTouches[0].clientX - touchStartX.current;
                    if (dx < -60) setSwipedId(a.id);
                    else setSwipedId(null);
                  }}
                  onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}
                  onKeyDown={(e) => {
                  if (e.key === "Delete") {
                    setSwipedId(a.id);
                  }
                }}
                tabIndex={0}
              >
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

                <input
                  type="checkbox"
                  checked={selected.has(a.id)}
                  onChange={() => toggleSelect(a.id)}
                  className="flex-shrink-0 w-4 h-4 accent-[var(--primary)]"
                />

                <button
                  onClick={() => cycleStatus(a)}
                  className="flex-shrink-0 transition-colors"
                  style={{ color: a.status === "done" ? "var(--green)" : "var(--text-muted)" }}
                  aria-label={`${lang === "th" ? "เปลี่ยนสถานะ" : "Change status"}: ${a.status}`}
                >
                  <StatusIcon size={20} />
                </button>

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

                  {a.subtasks && a.subtasks.length > 0 && (
                    <div className="mt-1 flex items-center gap-2 text-xs text-[var(--muted)]">
                      <CheckSquare className="w-3.5 h-3.5" />
                      <span>
                        {a.subtasks.filter((s) => s.completed).length}/{a.subtasks.length}
                      </span>
                      <div className="flex-1 h-1 bg-[var(--bg)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[var(--green)] rounded-full"
                          style={{ width: `${(a.subtasks.filter((s) => s.completed).length / a.subtasks.length) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

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
                    {a.recurring && a.recurring !== "none" && (
                      <span className="badge badge-neutral">
                        {lang === "th" ? { daily: "ทุกวัน", weekly: "ทุกสัปดาห์", monthly: "ทุกเดือน" }[a.recurring] : a.recurring}
                      </span>
                    )}
                    {a.estimated_minutes && a.status === "done" && a.actual_minutes != null && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        a.actual_minutes <= a.estimated_minutes ? "bg-[var(--green)]/10 text-[var(--green)]" : "bg-[var(--red)]/10 text-[var(--red)]"
                      }`}>
                        {a.actual_minutes}m / {a.estimated_minutes}m
                      </span>
                    )}
                    {a.tags && a.tags.length > 0 && a.tags.map((tag) => (
                      <span key={tag} className="badge badge-neutral">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => onEdit(a)} className="icon-btn-sm"><Pencil size={14} /></button>
                  <button onClick={() => handleDelete(a.id)} className="icon-btn-sm danger"><Trash2 size={14} /></button>
                </div>
                </div>

                {expandedId === a.id && (
                  <div className="px-4 pb-3 text-sm" style={{ background: "var(--bg-card)", color: "var(--text-muted)" }}>
                    {a.description && <p className="mb-2">{a.description}</p>}
                    {a.subtasks && a.subtasks.length > 0 && (
                      <div className="mb-2">
                        <p className="font-medium mb-1" style={{ color: "var(--text)" }}>{lang === "th" ? "งานย่อย" : "Subtasks"}</p>
                        {a.subtasks.map((s) => (
                          <div key={s.id} className="flex items-center gap-2">
                            <CheckSquare className={`w-3.5 h-3.5 ${s.completed ? "text-[var(--green)]" : "text-[var(--muted)]"}`} />
                            <span className={s.completed ? "line-through opacity-50" : ""}>{s.title}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-4 text-xs">
                      {a.estimated_minutes && <span>{a.estimated_minutes}m</span>}
                      {a.due_date && <span>{a.due_date}</span>}
                      {a.recurring !== "none" && <span>{a.recurring}</span>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

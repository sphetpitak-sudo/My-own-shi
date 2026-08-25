"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLang } from "@/lib/i18n";
import type { Subject, Assignment } from "@/lib/types";
import { Plus, CalendarDays, Tag, Flag, Timer, X } from "lucide-react";

interface Props {
  subjects: Subject[];
  onSaved: () => void;
  editing: Assignment | null;
  onCancelEdit: () => void;
  template?: { title: string; description: string; priority: "low" | "medium" | "high"; estimatedMinutes: number } | null;
}

export default function AssignmentForm({ subjects, onSaved, editing, onCancelEdit, template }: Props) {
  const { t, lang } = useLang();
  const supabase = createClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [estimatedMinutes, setEstimatedMinutes] = useState<string>("");
  const [subtasks, setSubtasks] = useState<{ title: string; completed: boolean }[]>([]);
  const [newSubtask, setNewSubtask] = useState("");
  const [recurring, setRecurring] = useState<"none" | "daily" | "weekly" | "monthly">("none");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (editing) {
      setTitle(editing.title);
      setDescription(editing.description || "");
      setSubjectId(editing.subject_id);
      setDueDate(editing.due_date || "");
      setPriority(editing.priority);
      setEstimatedMinutes(editing.estimated_minutes ? String(editing.estimated_minutes) : "");
      setSubtasks(editing.subtasks || []);
      setRecurring(editing.recurring || "none");
      setTags(editing.tags || []);
    } else if (template) {
      setTitle(template.title);
      setDescription(template.description);
      setSubjectId(null);
      setDueDate("");
      setPriority(template.priority);
      setEstimatedMinutes(String(template.estimatedMinutes));
      setSubtasks([]);
      setRecurring("none");
      setTags([]);
    } else {
      setTitle("");
      setDescription("");
      setSubjectId(null);
      setDueDate("");
      setPriority("medium");
      setEstimatedMinutes("");
      setSubtasks([]);
      setRecurring("none");
      setTags([]);
    }
  }, [editing, template]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const subtasksData = subtasks.map((s) => ({
      id: crypto.randomUUID(),
      title: s.title,
      completed: s.completed,
    }));

    if (editing) {
      await supabase.from("assignments").update({
        title: title.trim(),
        description: description.trim(),
        subject_id: subjectId,
        due_date: dueDate || null,
        priority,
        estimated_minutes: estimatedMinutes ? parseInt(estimatedMinutes) : null,
        subtasks: subtasksData,
        recurring,
        tags,
        updated_at: new Date().toISOString(),
      }).eq("id", editing.id);
    } else {
      await supabase.from("assignments").insert({
        user_id: user.id,
        subject_id: subjectId,
        title: title.trim(),
        description: description.trim(),
        due_date: dueDate || null,
        priority,
        estimated_minutes: estimatedMinutes ? parseInt(estimatedMinutes) : null,
        subtasks: subtasksData,
        recurring,
        tags,
        status: "pending",
      });
    }

    setTitle("");
    setDescription("");
    setSubjectId(null);
    setDueDate("");
    setPriority("medium");
    setEstimatedMinutes("");
    setSubtasks([]);
    setRecurring("none");
    setTags([]);
    setLoading(false);
    onCancelEdit();
    onSaved();
  };

  return (
    <form onSubmit={handleSubmit} className="card p-4 form-card">
      <div className="flex items-center gap-2 mb-3">
        <Plus size={16} style={{ color: "var(--text-secondary)" }} />
        <span className="sec-title">{editing ? (lang === "th" ? "แก้ไขงาน" : "Edit Assignment") : t.new_assignment}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <div className="field">
          <label className="label flex items-center gap-1.5"><Tag size={12} /> {t.title}</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t.title_placeholder}
            className="input"
          />
        </div>
        <div className="field">
          <label className="label flex items-center gap-1.5"><CalendarDays size={12} /> {t.due_date}</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="input"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="text-sm text-[var(--text-muted)] md:hidden mb-3"
      >
        {collapsed ? (lang === "th" ? "แสดงเพิ่มเติม" : "Show more") : (lang === "th" ? "ซ่อน" : "Hide")}
      </button>
      {!collapsed && (
        <>
      <div className="field mb-3">
        <label className="label">{t.description}</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t.description_placeholder}
          className="input min-h-[60px] resize-y"
          rows={2}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className="field">
          <label className="label flex items-center gap-1.5"><Tag size={12} /> {t.subject}</label>
          <select value={subjectId || ""} onChange={(e) => setSubjectId(e.target.value || null)} className="select">
            <option value="">{t.no_subject}</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label className="label flex items-center gap-1.5"><Timer size={12} /> {t.estimated_time}</label>
          <input
            type="number"
            min="0"
            value={estimatedMinutes}
            onChange={(e) => setEstimatedMinutes(e.target.value)}
            placeholder={lang === "th" ? "นาที" : "minutes"}
            className="input"
          />
        </div>
        <div className="field">
          <label className="label flex items-center gap-1.5"><Flag size={12} /> {t.priority}</label>
          <div className="flex gap-2">
            {(["low", "medium", "high"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className={`chip flex-1 ${priority === p ? "on" : ""}`}
                style={priority === p ? {
                  background: p === "high" ? "var(--red)" : p === "medium" ? "var(--amber)" : "var(--green)",
                  borderColor: p === "high" ? "var(--red)" : p === "medium" ? "var(--amber)" : "var(--green)",
                } : {}}
              >
                {t[p]}
              </button>
            ))}
          </div>
        </div>
      </div>
        </>
      )}

      {/* Subtasks */}
      <div className="mb-3">
        <label className="label">{lang === "th" ? "งานย่อย" : "Subtasks"}</label>
        {subtasks.map((s, i) => (
          <div key={i} className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              checked={s.completed}
              onChange={() => {
                const updated = [...subtasks];
                updated[i].completed = !updated[i].completed;
                setSubtasks(updated);
              }}
              className="w-4 h-4 accent-[var(--primary)]"
            />
            <input
              value={s.title}
              onChange={(e) => {
                const updated = [...subtasks];
                updated[i].title = e.target.value;
                setSubtasks(updated);
              }}
              className="flex-1 bg-transparent border border-[var(--border)] rounded-lg px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => setSubtasks(subtasks.filter((_, j) => j !== i))}
              className="text-[var(--muted)] hover:text-[var(--red)]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
        <div className="flex gap-2">
          <input
            value={newSubtask}
            onChange={(e) => setNewSubtask(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newSubtask.trim()) {
                e.preventDefault();
                setSubtasks([...subtasks, { title: newSubtask.trim(), completed: false }]);
                setNewSubtask("");
              }
            }}
            placeholder={lang === "th" ? "เพิ่มงานย่อย..." : "Add subtask..."}
            className="flex-1 bg-transparent border border-[var(--border)] rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>

      {/* Recurring */}
      <div className="mb-3">
        <label className="label">{lang === "th" ? "ทำซ้ำ" : "Recurring"}</label>
        <select
          value={recurring}
          onChange={(e) => setRecurring(e.target.value as typeof recurring)}
          className="select"
        >
          <option value="none">{lang === "th" ? "ไม่ทำซ้ำ" : "None"}</option>
          <option value="daily">{lang === "th" ? "ทุกวัน" : "Daily"}</option>
          <option value="weekly">{lang === "th" ? "ทุกสัปดาห์" : "Weekly"}</option>
          <option value="monthly">{lang === "th" ? "ทุกเดือน" : "Monthly"}</option>
        </select>
      </div>

      {/* Tags */}
      <div className="mb-4">
        <label className="label">{lang === "th" ? "แท็ก" : "Tags"}</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map((tag) => (
            <span key={tag} className="px-2 py-0.5 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full text-xs flex items-center gap-1">
              {tag}
              <button type="button" onClick={() => setTags(tags.filter((t) => t !== tag))}>
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <input
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && newTag.trim()) {
              e.preventDefault();
              setTags([...tags, newTag.trim()]);
              setNewTag("");
            }
          }}
          placeholder={lang === "th" ? "เพิ่มแท็ก..." : "Add tag..."}
          className="w-full bg-transparent border border-[var(--border)] rounded-lg px-3 py-2 text-sm"
        />
      </div>

      <div className="flex gap-2">
        <button type="submit" disabled={loading || !title.trim()} className="btn btn-primary">
          {editing ? (lang === "th" ? "บันทึก" : "Save") : (lang === "th" ? "เพิ่มงาน" : "Add Assignment")}
        </button>
        {editing && (
          <button type="button" onClick={onCancelEdit} className="btn btn-ghost">
            {t.cancel}
          </button>
        )}
      </div>
    </form>
  );
}

"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLang } from "@/lib/i18n";
import type { Subject, Assignment } from "@/lib/types";
import { Plus, CalendarDays, Tag, Flag, Timer } from "lucide-react";

interface Props {
  subjects: Subject[];
  onSaved: () => void;
  editing: Assignment | null;
  onCancelEdit: () => void;
}

export default function AssignmentForm({ subjects, onSaved, editing, onCancelEdit }: Props) {
  const { t, lang } = useLang();
  const supabase = createClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [estimatedMinutes, setEstimatedMinutes] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editing) {
      setTitle(editing.title);
      setDescription(editing.description || "");
      setSubjectId(editing.subject_id);
      setDueDate(editing.due_date || "");
      setPriority(editing.priority);
      setEstimatedMinutes(editing.estimated_minutes ? String(editing.estimated_minutes) : "");
    } else {
      setTitle("");
      setDescription("");
      setSubjectId(null);
      setDueDate("");
      setPriority("medium");
      setEstimatedMinutes("");
    }
  }, [editing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (editing) {
      await supabase.from("assignments").update({
        title: title.trim(),
        description: description.trim(),
        subject_id: subjectId,
        due_date: dueDate || null,
        priority,
        estimated_minutes: estimatedMinutes ? parseInt(estimatedMinutes) : null,
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
        status: "pending",
      });
    }

    setTitle("");
    setDescription("");
    setSubjectId(null);
    setDueDate("");
    setPriority("medium");
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

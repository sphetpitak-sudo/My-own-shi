"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLang } from "@/lib/i18n";
import { Plus } from "lucide-react";

const SUBJECT_COLORS = [
  "#4F7CFF", "#22C55E", "#F59E0B", "#EF4444", "#A855F7",
  "#EC4899", "#0D9488", "#F97316", "#6366F1", "#84CC16",
];

interface Props {
  onSaved: () => void;
  editing: { id: string; name: string; color: string } | null;
  onCancelEdit: () => void;
}

export default function SubjectForm({ onSaved, editing, onCancelEdit }: Props) {
  const { t, lang } = useLang();
  const supabase = createClient();
  const [name, setName] = useState("");
  const [color, setColor] = useState(SUBJECT_COLORS[0]);
  const [loading, setLoading] = useState(false);

  useState(() => {
    if (editing) {
      setName(editing.name);
      setColor(editing.color);
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);

    if (editing) {
      await supabase.from("subjects").update({ name: name.trim(), color }).eq("id", editing.id);
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("subjects").insert({
          user_id: user.id,
          name: name.trim(),
          color,
          icon: "BookOpen",
          is_default: false,
        });
      }
    }

    setName("");
    setColor(SUBJECT_COLORS[0]);
    setLoading(false);
    onCancelEdit();
    onSaved();
  };

  return (
    <form onSubmit={handleSubmit} className="card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Plus size={16} style={{ color: "var(--text-secondary)" }} />
        <span className="sec-title">{editing ? (lang === "th" ? "แก้ไขวิชา" : "Edit Subject") : t.new_subject}</span>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 field">
          <label className="label">{t.subject_name}</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.subject_name_placeholder}
            className="input"
          />
        </div>

        <div className="field">
          <label className="label">{t.subject_color}</label>
          <div className="flex gap-1.5 flex-wrap">
            {SUBJECT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className="w-7 h-7 rounded-full border-2 transition-all"
                style={{
                  background: c,
                  borderColor: color === c ? "var(--text)" : "transparent",
                  transform: color === c ? "scale(1.15)" : "scale(1)",
                }}
              />
            ))}
          </div>
        </div>

        <div className="flex items-end gap-2">
          <button type="submit" disabled={loading || !name.trim()} className="btn btn-primary !py-2.5">
            {editing ? (lang === "th" ? "บันทึก" : "Save") : (lang === "th" ? "เพิ่ม" : "Add")}
          </button>
          {editing && (
            <button type="button" onClick={onCancelEdit} className="btn btn-ghost !py-2.5">
              {t.cancel}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}

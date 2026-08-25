"use client";

import { createClient } from "@/lib/supabase/client";
import { useLang } from "@/lib/i18n";
import type { Subject } from "@/lib/types";
import { BookOpen, Pencil, Trash2 } from "lucide-react";

interface Props {
  subjects: Subject[];
  onEdit: (s: Subject) => void;
  onDeleted: () => void;
}

const SUB_ICONS: Record<string, typeof BookOpen> = {
  BookOpen,
};

export default function SubjectList({ subjects, onEdit, onDeleted }: Props) {
  const { lang } = useLang();
  const supabase = createClient();

  const handleDelete = async (id: string) => {
    if (!confirm(lang === "th" ? "ลบวิชานี้?" : "Delete this subject?")) return;
    await supabase.from("subjects").delete().eq("id", id);
    onDeleted();
  };

  if (subjects.length === 0) {
    return (
      <div className="empty">
        <div className="empty-icon"><BookOpen size={24} /></div>
        <div className="empty-title">{lang === "th" ? "ยังไม่มีวิชา" : "No subjects yet"}</div>
        <div className="empty-sub">{lang === "th" ? "เริ่มเพิ่มวิชาแรกของคุณ" : "Add your first subject"}</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {subjects.map((s) => (
        <div key={s.id} className="card p-4 group relative">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0"
              style={{ background: `${s.color}18` }}
            >
              <BookOpen size={18} style={{ color: s.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-[14px] truncate">{s.name}</div>
              <div className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                {s.is_default ? (lang === "th" ? "วิชาพื้นฐาน" : "Default") : (lang === "th" ? "วิชาที่เพิ่มเอง" : "Custom")}
              </div>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => onEdit(s)} className="icon-btn-sm"><Pencil size={14} /></button>
              {!s.is_default && (
                <button onClick={() => handleDelete(s.id)} className="icon-btn-sm danger"><Trash2 size={14} /></button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

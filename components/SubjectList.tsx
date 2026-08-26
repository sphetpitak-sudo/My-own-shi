"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLang } from "@/lib/i18n";
import type { Subject } from "@/lib/types";
import { BookOpen, Pencil, Trash2 } from "lucide-react";
import ConfirmModal from "./ConfirmModal";

interface Props {
  subjects: Subject[];
  onEdit: (s: Subject) => void;
  onDeleted: () => void;
}

export default function SubjectList({ subjects, onEdit, onDeleted }: Props) {
  const { t, lang } = useLang();
  const supabase = createClient();
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);

  if (subjects.length === 0) {
    return (
      <div className="empty">
        <div className="empty-icon"><BookOpen size={32} /></div>
        <div className="empty-title">{t.no_subjects}</div>
        <div className="empty-sub">{t.no_subjects_hint}</div>
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
                {s.is_default ? t.default_subjects : t.custom_subjects}
              </div>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => onEdit(s)} className="icon-btn-sm"><Pencil size={14} /></button>
              {!s.is_default && (
                <button onClick={() => setConfirmDelete({ id: s.id, name: s.name })} className="icon-btn-sm danger"><Trash2 size={14} /></button>
              )}
            </div>
          </div>
        </div>
      ))}
      <ConfirmModal
        open={!!confirmDelete}
        title={t.delete_subject_confirm}
        message={lang === "th" ? `ต้องการลบวิชา "${confirmDelete?.name}" ใช่หรือไม่?` : `Delete subject "${confirmDelete?.name}"?`}
        onConfirm={async () => {
          if (!confirmDelete) return;
          await supabase.from("subjects").delete().eq("id", confirmDelete.id);
          if (navigator.vibrate) navigator.vibrate(10);
          onDeleted();
          setConfirmDelete(null);
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}

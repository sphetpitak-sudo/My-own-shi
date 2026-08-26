"use client";

import { useLang } from "@/lib/i18n";
import { AlertTriangle, X } from "lucide-react";

interface Props {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({ open, title, message, onConfirm, onCancel }: Props) {
  const { t } = useLang();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative card p-6 max-w-sm w-full">
        <button onClick={onCancel} className="absolute top-3 right-3 text-[var(--muted)] hover:text-[var(--text)]" aria-label={t.close}>
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-[var(--red-soft)] flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-[var(--red)]" />
          </div>
          <h3 id="confirm-title" className="text-lg font-semibold text-[var(--text)]">{title}</h3>
        </div>
        <p className="text-sm text-[var(--text-muted)] mb-6">{message}</p>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="btn bg-[var(--bg)] text-[var(--text)] border border-[var(--border)]">{t.cancel}</button>
          <button onClick={onConfirm} className="btn bg-[var(--red)] text-white">{t.confirm}</button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Coins, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useDialogFocus } from "./useDialogFocus";
import type { ConfirmSummary } from "@/lib/reading-flow";

interface ConfirmDialogProps {
  open: boolean;
  summary: ConfirmSummary;
  confirmLabel: string;
  cancelLabel: string;
  /** Runs on confirm. Must not spend points itself — spend stays server-side. */
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Pre-spend confirmation dialog (Phase C1).
 * Shows spread, cost, current balance and resulting balance BEFORE anything
 * is spent. Confirm only advances the local flow; the actual spend still
 * happens in the existing backend operation afterwards.
 * Double-submit safe: buttons disable after the first confirm/cancel.
 */
export default function ConfirmDialog({
  open,
  summary,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [decided, setDecided] = useState(false);
  // Reset per opening — the instance persists while hidden (returns null).
  useEffect(() => {
    if (open) setDecided(false);
  }, [open ]);
  const panelRef = useDialogFocus<HTMLDivElement>(open, {
    onClose: () => {
      if (!decided) {
        setDecided(true);
        onCancel();
      }
    },
  });

  if (!open) return null;

  const handleConfirm = () => {
    if (decided || summary.insufficient) return;
    setDecided(true);
    onConfirm();
  };
  const handleCancel = () => {
    if (decided) return;
    setDecided(true);
    onCancel();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleCancel}
        aria-label="ยกเลิก"
        tabIndex={-1}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        tabIndex={-1}
        className="relative card p-6 max-w-[440px] w-full animate-fade"
        style={{ background: "var(--bg-elevated)", outline: "none" }}
      >
        <h3
          id="confirm-dialog-title"
          className="text-[18px] font-extrabold"
          style={{ color: "var(--text)" }}
        >
          ยืนยันก่อนเปิดไพ่
        </h3>
        <p className="text-[12.5px] mt-1" style={{ color: "var(--text-muted)" }}>
          กดยืนยันเพื่อจั่วไพ่ — แต้มจะถูกหักตอนเริ่มทำนายเท่านั้น ยังไม่ถูกหักตอนนี้
        </p>

        <dl className="mt-4 space-y-2 text-[13px]">
          <div className="flex items-center justify-between gap-3">
            <dt style={{ color: "var(--text-muted)" }}>รูปแบบ</dt>
            <dd className="font-bold" style={{ color: "var(--text)" }}>
              {summary.spreadNameTh} · {summary.cardCount} ใบ
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt style={{ color: "var(--text-muted)" }}>ใช้แต้ม</dt>
            <dd className="font-extrabold inline-flex items-center gap-1" style={{ color: "var(--gold)" }}>
              <Coins size={13} aria-hidden /> {summary.cost.toLocaleString()} แต้ม
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt style={{ color: "var(--text-muted)" }}>คงเหลือปัจจุบัน</dt>
            <dd className="font-bold tabular-nums" style={{ color: "var(--text)" }}>
              {summary.current.toLocaleString()} แต้ม
            </dd>
          </div>
          <div
            className="flex items-center justify-between gap-3 rounded-lg px-3 py-2"
            style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
          >
            <dt style={{ color: "var(--text-muted)" }}>คงเหลือหลังหัก</dt>
            <dd
              className="font-extrabold tabular-nums"
              style={{ color: summary.insufficient ? "var(--red)" : "var(--green)" }}
            >
              {summary.resulting.toLocaleString()} แต้ม
            </dd>
          </div>
        </dl>

        {summary.insufficient && (
          <p className="mt-3 flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: "var(--red)" }} role="status">
            <AlertTriangle size={13} aria-hidden />
            ขาดอีก {summary.shortage.toLocaleString()} แต้ม —{" "}
            <Link href="/dashboard/daily" className="underline">
              รับแต้มฟรี
            </Link>
          </p>
        )}

        <div className="flex gap-2.5 mt-5">
          <button onClick={handleCancel} disabled={decided} className="btn btn-ghost flex-1">
            {cancelLabel}
          </button>
          <button
            onClick={handleConfirm}
            disabled={decided || summary.insufficient}
            className="btn btn-primary flex-1"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

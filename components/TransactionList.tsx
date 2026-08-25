"use client";

import { useState, useRef } from "react";
import { useLang } from "@/lib/i18n";
import type { Transaction } from "@/lib/types";
import { Inbox, Pencil, Trash2, ArrowDownLeft, ArrowUpRight, Utensils, Bus, BookOpen, Gamepad2, Banknote, Gift, Box } from "lucide-react";

const CAT_ICONS: Record<string, typeof Utensils> = {
  food: Utensils, transport: Bus, study: BookOpen, entertainment: Gamepad2,
  salary: Banknote, gift: Gift, other: Box,
};

const SWIPE_THRESHOLD = 80;

interface Props {
  transactions: Transaction[];
  onEdit: (t: Transaction) => void;
  onDelete: (id: string) => void;
  compact?: boolean;
  onDragStart?: (id: string) => void;
}

export default function TransactionList({ transactions, onEdit, onDelete, compact, onDragStart }: Props) {
  const { t, lang } = useLang();
  const [swipedId, setSwipedId] = useState<string | null>(null);
  const touchStartX = useRef(0);
  const touchCurrentX = useRef(0);
  const swipingId = useRef<string | null>(null);

  if (transactions.length === 0) {
    return (
      <div className="card empty animate-in d1">
        <div className="empty-icon"><Inbox size={22} /></div>
        <div className="empty-title">{t.no_transactions}</div>
        <div className="empty-sub">{lang === "th" ? "ลองเพิ่มรายการแรกของคุณ" : "Try adding your first transaction"}</div>
      </div>
    );
  }

  const handleTouchStart = (e: React.TouchEvent, id: string) => {
    touchStartX.current = e.touches[0].clientX;
    swipingId.current = id;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!swipingId.current) return;
    touchCurrentX.current = e.touches[0].clientX;
    const diff = touchCurrentX.current - touchStartX.current;
    const el = document.getElementById(`tx-${swipingId.current}`);
    if (el) {
      const clamped = Math.max(-120, Math.min(120, diff));
      el.style.transform = `translateX(${clamped}px)`;
      el.style.transition = "none";
    }
  };

  const handleTouchEnd = () => {
    if (!swipingId.current) return;
    const diff = touchCurrentX.current - touchStartX.current;
    const el = document.getElementById(`tx-${swipingId.current}`);
    const id = swipingId.current;

    if (el) {
      el.style.transition = "transform 0.25s var(--ease)";
      if (diff < -SWIPE_THRESHOLD) {
        el.style.transform = "translateX(-120px)";
        setSwipedId(id);
      } else if (diff > SWIPE_THRESHOLD) {
        el.style.transform = "translateX(120px)";
        setSwipedId(id);
      } else {
        el.style.transform = "translateX(0)";
        setSwipedId(null);
      }
    }

    swipingId.current = null;
    touchStartX.current = 0;
    touchCurrentX.current = 0;
  };

  const resetSwipe = (id: string) => {
    const el = document.getElementById(`tx-${id}`);
    if (el) {
      el.style.transition = "transform 0.25s var(--ease)";
      el.style.transform = "translateX(0)";
    }
    setSwipedId(null);
  };

  const handleActionEdit = (tx: Transaction) => {
    if (swipedId) resetSwipe(swipedId);
    onEdit(tx);
  };

  const handleActionDelete = (id: string) => {
    if (swipedId) resetSwipe(swipedId);
    onDelete(id);
  };

  return (
    <div className="card animate-in">
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <h3 className="sec-title">{t.transaction_list}</h3>
        <span className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>{transactions.length} {lang === "th" ? "รายการ" : "items"}</span>
      </div>
      <div className="px-3 pb-3">
        {transactions.map((tx) => {
          const CatIcon = CAT_ICONS[tx.category] || Box;
          return (
            <div key={tx.id} className="relative overflow-hidden rounded-xl mb-0.5">
              {/* Background action buttons */}
              <div className="absolute inset-0 flex items-center justify-between px-4 rounded-xl"
                style={{ background: "var(--bg-card)" }}>
                <button onClick={() => handleActionEdit(tx)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold"
                  style={{ background: "var(--blue-soft)", color: "var(--blue)" }}>
                  <Pencil size={15} /> {t.edit}
                </button>
                <button onClick={() => handleActionDelete(tx.id)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold"
                  style={{ background: "var(--red-soft)", color: "var(--red)" }}>
                  <Trash2 size={15} /> {t.delete}
                </button>
              </div>

              {/* Swipeable content */}
              <div
                id={`tx-${tx.id}`}
                className="list-item group relative z-10"
                style={{ background: "var(--bg-card)", touchAction: "pan-y" }}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/plain", tx.id);
                  e.dataTransfer.effectAllowed = "move";
                  onDragStart?.(tx.id);
                }}
                onTouchStart={(e) => handleTouchStart(e, tx.id)}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <div className="item-icon" style={{ background: tx.type === "income" ? "var(--green-soft)" : "var(--red-soft)" }}>
                  {tx.type === "income"
                    ? <ArrowDownLeft size={17} style={{ color: "var(--green)" }} />
                    : <ArrowUpRight size={17} style={{ color: "var(--red)" }} />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <CatIcon size={14} style={{ color: "var(--text-muted)" }} />
                    <span className="font-semibold text-[14px] truncate">{t[tx.category as keyof typeof t]}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>{tx.date}</span>
                    {tx.note && <span className="text-[12px] truncate" style={{ color: "var(--text-muted)" }}>· {tx.note}</span>}
                  </div>
                </div>
                <span className="font-bold text-[14px] tabular-nums" style={{ color: tx.type === "income" ? "var(--green)" : "var(--red)" }}>
                  {tx.type === "income" ? "+" : "-"}฿{tx.amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                </span>
                {/* Desktop hover buttons */}
                <div className="hidden md:flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => onEdit(tx)} className="icon-btn-sm"><Pencil size={14} /></button>
                  <button onClick={() => onDelete(tx.id)} className="icon-btn-sm danger"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
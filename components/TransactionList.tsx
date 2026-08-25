"use client";

import { useLang } from "@/lib/i18n";
import type { Transaction } from "@/lib/types";
import { Inbox, Pencil, Trash2, ArrowDownLeft, ArrowUpRight } from "lucide-react";

const CAT_ICONS: Record<string, string> = {
  food: "🍖", transport: "🚌", study: "📚", entertainment: "🎮",
  salary: "💰", gift: "🎁", other: "📦",
};

interface Props {
  transactions: Transaction[];
  onEdit: (t: Transaction) => void;
  onDelete: (id: string) => void;
  compact?: boolean;
}

export default function TransactionList({ transactions, onEdit, onDelete, compact }: Props) {
  const { t, lang } = useLang();

  if (transactions.length === 0) {
    return (
      <div className="card empty animate-in d1">
        <div className="empty-icon"><Inbox size={22} /></div>
        <div className="empty-title">{t.no_transactions}</div>
        <div className="empty-sub">{lang === "th" ? "ลองเพิ่มรายการแรกของคุณ" : "Try adding your first transaction"}</div>
      </div>
    );
  }

  return (
    <div className="card animate-in">
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <h3 className="sec-title">{t.transaction_list}</h3>
        <span className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>{transactions.length} {lang === "th" ? "รายการ" : "items"}</span>
      </div>
      <div className="px-3 pb-3">
        {transactions.map((tx) => (
          <div key={tx.id} className="list-item group">
            <div className="item-icon" style={{ background: tx.type === "income" ? "var(--green-soft)" : "var(--red-soft)" }}>
              {tx.type === "income"
                ? <ArrowDownLeft size={17} style={{ color: "var(--green)" }} />
                : <ArrowUpRight size={17} style={{ color: "var(--red)" }} />
              }
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[14px]">{CAT_ICONS[tx.category]}</span>
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
            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => onEdit(tx)} className="icon-btn-sm"><Pencil size={14} /></button>
              <button onClick={() => onDelete(tx.id)} className="icon-btn-sm danger"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
"use client";

import { useLang } from "@/lib/i18n";
import type { Transaction } from "@/lib/types";
import { Pencil, Trash2, ArrowUpRight, ArrowDownLeft, Inbox } from "lucide-react";

interface Props { transactions: Transaction[]; onEdit: (t: Transaction) => void; onDelete: (id: string) => void; }

export default function TransactionList({ transactions, onEdit, onDelete }: Props) {
  const { t, lang } = useLang();

  if (transactions.length === 0) {
    return (
      <div className="card p-10 text-center animate-in" style={{ animationDelay: "0.1s" }}>
        <Inbox className="w-8 h-8 mx-auto mb-3" style={{ color: "var(--text-light)" }} />
        <p className="font-pixel text-sm" style={{ color: "var(--text-muted)" }}>{t.no_transactions}</p>
      </div>
    );
  }

  return (
    <div className="card p-5 animate-in" style={{ animationDelay: "0.1s" }}>
      <h3 className="sec mb-3" style={{ color: "var(--text)" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
        {t.transaction_list}
      </h3>
      <div className="space-y-2">
        {transactions.map((tx) => (
          <div key={tx.id}
            className="flex items-center justify-between p-3 rounded-xl transition-all group"
            style={{ border: "1px solid var(--border)" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-focus)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{
                background: tx.type === "income" ? "var(--green-bg)" : "var(--red-bg)",
              }}>
                {tx.type === "income"
                  ? <ArrowDownLeft className="w-4 h-4" style={{ color: "var(--green)" }} />
                  : <ArrowUpRight className="w-4 h-4" style={{ color: "var(--red)" }} />
                }
              </div>
              <div>
                <p className="font-pixel text-sm font-semibold" style={{ color: "var(--text)" }}>{t[tx.category as keyof typeof t]}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="font-pixel text-xs" style={{ color: "var(--text-light)" }}>{tx.date}</span>
                  {tx.note && <span className="font-pixel text-xs" style={{ color: "var(--text-light)" }}>· {tx.note}</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-pixel text-sm font-bold" style={{ color: tx.type === "income" ? "var(--green)" : "var(--red)" }}>
                {tx.type === "income" ? "+" : "-"}฿{tx.amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
              </span>
              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onEdit(tx)} className="p-1.5 rounded-lg transition-colors" style={{ color: "var(--text-light)" }}>
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => onDelete(tx.id)} className="p-1.5 rounded-lg transition-colors" style={{ color: "var(--red)" }}>
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

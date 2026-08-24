"use client";

import { useLang } from "@/lib/i18n";
import type { Transaction } from "@/lib/types";

const CATEGORY_ICONS: Record<string, string> = {
  food: "🍖", transport: "🚌", study: "📚", entertainment: "🎮",
  salary: "💰", gift: "🎁", other: "📦",
};

interface Props { transactions: Transaction[]; onEdit: (t: Transaction) => void; onDelete: (id: string) => void; }

export default function TransactionList({ transactions, onEdit, onDelete }: Props) {
  const { t, lang } = useLang();

  if (transactions.length === 0) {
    return (
      <div className="forest-card p-12 text-center animate-in" style={{ animationDelay: "0.2s" }}>
        <span className="text-5xl mb-4 block animate-float">🦊</span>
        <p className="font-pixel text-lg" style={{ color: "#b8a88a" }}>{t.no_transactions}</p>
        <p className="font-pixel text-sm mt-2" style={{ color: "#d4c5a0" }}>{lang === "th" ? "ลองเพิ่มรายการแรกของคุณ 🌿" : "Try adding your first transaction 🌿"}</p>
      </div>
    );
  }

  return (
    <div className="forest-card p-6 animate-in" style={{ animationDelay: "0.2s" }}>
      <h3 className="section-header mb-4" style={{ color: "#2d5016" }}>
        <span className="text-xl">📋</span> {t.transaction_list}
      </h3>
      <div className="space-y-3">
        {transactions.map((tx, i) => (
          <div key={tx.id} className="flex items-center justify-between p-4 rounded-2xl transition-all group"
            style={{ background: "#fffef9", border: "2px solid #e8dcc8" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#a5d6a7"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(45,80,22,0.1)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e8dcc8"; e.currentTarget.style.boxShadow = "none"; }}>
            <div className="flex items-center gap-4">
              <div className="animal-avatar green">
                <span className="text-xl">{tx.type === "income" ? "🌱" : "🍂"}</span>
              </div>
              <div>
                <p className="font-pixel text-sm font-bold" style={{ color: "#2d5016" }}>
                  {CATEGORY_ICONS[tx.category] || "📦"} {t[tx.category as keyof typeof t]}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-pixel text-xs" style={{ color: "#b8a88a" }}>{tx.date}</span>
                  {tx.note && <span className="font-pixel text-xs" style={{ color: "#b8a88a" }}>· {tx.note}</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-pixel text-base font-bold" style={{ color: tx.type === "income" ? "#2d5016" : "#c0392b" }}>
                {tx.type === "income" ? "+" : "-"}฿{tx.amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
              </span>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onEdit(tx)}
                  className="p-2 rounded-xl transition-all"
                  style={{ background: "#e8f5e9", color: "#4a7c23" }}>
                  ✏️
                </button>
                <button onClick={() => onDelete(tx.id)}
                  className="p-2 rounded-xl transition-all"
                  style={{ background: "#fbe9e7", color: "#c0392b" }}>
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

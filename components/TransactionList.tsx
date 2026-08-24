"use client";

import { useLang } from "@/lib/i18n";
import type { Transaction } from "@/lib/types";
import { Pencil, Trash2, ArrowUpRight, ArrowDownLeft, Receipt } from "lucide-react";

interface Props {
  transactions: Transaction[];
  onEdit: (t: Transaction) => void;
  onDelete: (id: string) => void;
}

export default function TransactionList({ transactions, onEdit, onDelete }: Props) {
  const { t } = useLang();

  if (transactions.length === 0) {
    return (
      <div className="glass-card p-12 text-center animate-in" style={{ animationDelay: "0.2s" }}>
        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
          <Receipt className="w-8 h-8 text-blue-400" />
        </div>
        <p className="font-pixel text-lg text-slate-400">{t.no_transactions}</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 animate-in" style={{ animationDelay: "0.2s" }}>
      <h3 className="font-pixel text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
        <Receipt className="w-5 h-5 text-blue-500" />
        {t.transaction_list}
      </h3>
      <div className="space-y-3">
        {transactions.map((tx, i) => (
          <div key={tx.id}
            className="flex items-center justify-between p-4 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 hover:border-blue-200 dark:hover:border-blue-800 hover:bg-white dark:hover:bg-slate-800 transition-all group"
            style={{ animationDelay: `${0.05 * i}s` }}>
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                tx.type === "income"
                  ? "bg-green-500/10 text-green-500"
                  : "bg-red-500/10 text-red-500"
              }`}>
                {tx.type === "income" ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
              </div>
              <div>
                <p className="font-pixel text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {t[tx.category as keyof typeof t]}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-pixel text-xs text-slate-400">{tx.date}</span>
                  {tx.note && <span className="font-pixel text-xs text-slate-400">· {tx.note}</span>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className={`font-pixel text-base font-bold ${
                tx.type === "income" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              }`}>
                {tx.type === "income" ? "+" : "-"}฿{tx.amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
              </span>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onEdit(tx)}
                  className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950 text-slate-400 hover:text-blue-500 transition-colors">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => onDelete(tx.id)}
                  className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-slate-400 hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

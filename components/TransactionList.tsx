"use client";

import { useLang } from "@/lib/i18n";
import type { Transaction } from "@/lib/types";

interface Props {
  transactions: Transaction[];
  onEdit: (t: Transaction) => void;
  onDelete: (id: string) => void;
}

export default function TransactionList({ transactions, onEdit, onDelete }: Props) {
  const { t } = useLang();

  if (transactions.length === 0) {
    return (
      <div className="pixel-card text-center py-12">
        <p className="font-pixel text-lg text-pixel-400">✦ ✦ ✦</p>
        <p className="font-pixel text-sm text-pixel-400 mt-3">{t.no_transactions}</p>
      </div>
    );
  }

  return (
    <div className="pixel-card">
      <h3 className="font-pixel text-base font-bold text-pixel-700 dark:text-pixel-300 mb-4">
        ✦ {t.transaction_list}
      </h3>
      <div className="space-y-2">
        {transactions.map((tx) => (
          <div
            key={tx.id}
            className="flex items-center justify-between px-4 py-3 border-2 border-pixel-100 dark:border-pixel-800 hover:border-pixel-300 dark:hover:border-pixel-600 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-lg">
                  {tx.type === "income" ? "◈" : "◇"}
                </span>
                <span className="font-pixel text-sm font-semibold text-pixel-700 dark:text-pixel-300 truncate">
                  {t[tx.category as keyof typeof t]}
                </span>
                {tx.note && (
                  <span className="font-pixel text-xs text-pixel-400 truncate">
                    ({tx.note})
                  </span>
                )}
              </div>
              <div className="font-pixel text-xs text-pixel-400 mt-1 ml-6">
                {tx.date}
              </div>
            </div>

            <div className="flex items-center gap-3 ml-4">
              <span
                className={`font-pixel text-sm font-bold whitespace-nowrap ${
                  tx.type === "income" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                }`}
              >
                {tx.type === "income" ? "+" : "-"}฿
                {tx.amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
              </span>
              <button
                onClick={() => onEdit(tx)}
                className="font-pixel text-xs text-pixel-500 hover:text-pixel-700 dark:hover:text-pixel-300 border-2 border-pixel-200 dark:border-pixel-700 px-2 py-1 hover:bg-pixel-100 dark:hover:bg-pixel-900 transition-colors"
              >
                ✎
              </button>
              <button
                onClick={() => onDelete(tx.id)}
                className="font-pixel text-xs text-red-400 hover:text-red-600 border-2 border-pixel-200 dark:border-pixel-700 px-2 py-1 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
              >
                ✗
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

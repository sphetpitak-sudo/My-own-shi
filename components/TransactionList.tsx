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
      <div className="bg-white rounded-2xl shadow-md p-6 text-center text-gray-400">
        {t.no_transactions}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-md p-4">
      <h3 className="text-lg font-semibold mb-3 px-2">{t.transaction_list}</h3>
      <div className="space-y-2">
        {transactions.map((tx) => (
          <div
            key={tx.id}
            className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-lg">
                  {tx.type === "income" ? "💰" : "💸"}
                </span>
                <span className="font-medium text-sm truncate">
                  {t[tx.category as keyof typeof t]}
                </span>
                {tx.note && (
                  <span className="text-xs text-gray-400 truncate">
                    ({tx.note})
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-400 mt-0.5 ml-8">
                {tx.date}
              </div>
            </div>

            <div className="flex items-center gap-3 ml-4">
              <span
                className={`font-bold text-sm whitespace-nowrap ${
                  tx.type === "income" ? "text-green-600" : "text-red-600"
                }`}
              >
                {tx.type === "income" ? "+" : "-"}฿
                {tx.amount.toLocaleString("th-TH", {
                  minimumFractionDigits: 2,
                })}
              </span>
              <button
                onClick={() => onEdit(tx)}
                className="text-xs text-blue-500 hover:text-blue-700"
              >
                ✏️
              </button>
              <button
                onClick={() => onDelete(tx.id)}
                className="text-xs text-red-500 hover:text-red-700"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useLang } from "@/lib/i18n";

interface Props {
  income: number;
  expense: number;
}

export default function SummaryCards({ income, expense }: Props) {
  const { t } = useLang();
  const balance = income - expense;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="pixel-card-sm text-center">
        <p className="font-pixel text-xs font-semibold text-pixel-500 uppercase mb-2">{t.total_income}</p>
        <p className="font-pixel text-xl font-bold text-green-600 dark:text-green-400">
          +฿{income.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
        </p>
      </div>
      <div className="pixel-card-sm text-center">
        <p className="font-pixel text-xs font-semibold text-pixel-500 uppercase mb-2">{t.total_expense}</p>
        <p className="font-pixel text-xl font-bold text-red-600 dark:text-red-400">
          -฿{expense.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
        </p>
      </div>
      <div className="pixel-card-sm text-center">
        <p className="font-pixel text-xs font-semibold text-pixel-500 uppercase mb-2">{t.balance}</p>
        <p className={`font-pixel text-xl font-bold ${balance >= 0 ? "text-pixel-600 dark:text-pixel-300" : "text-yellow-600 dark:text-yellow-400"}`}>
          ฿{balance.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
        </p>
      </div>
    </div>
  );
}

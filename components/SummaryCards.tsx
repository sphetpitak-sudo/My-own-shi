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
    <div className="grid grid-cols-3 gap-3">
      <div className="bg-green-50 rounded-2xl p-4 text-center shadow-sm">
        <p className="text-xs text-green-600 font-medium">{t.total_income}</p>
        <p className="text-xl font-bold text-green-700 mt-1">
          ฿{income.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
        </p>
      </div>
      <div className="bg-red-50 rounded-2xl p-4 text-center shadow-sm">
        <p className="text-xs text-red-600 font-medium">{t.total_expense}</p>
        <p className="text-xl font-bold text-red-700 mt-1">
          ฿{expense.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
        </p>
      </div>
      <div
        className={`rounded-2xl p-4 text-center shadow-sm ${
          balance >= 0 ? "bg-blue-50" : "bg-yellow-50"
        }`}
      >
        <p
          className={`text-xs font-medium ${
            balance >= 0 ? "text-blue-600" : "text-yellow-600"
          }`}
        >
          {t.balance}
        </p>
        <p
          className={`text-xl font-bold mt-1 ${
            balance >= 0 ? "text-blue-700" : "text-yellow-700"
          }`}
        >
          ฿{balance.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
        </p>
      </div>
    </div>
  );
}

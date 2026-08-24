"use client";

import { useLang } from "@/lib/i18n";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";

interface Props { income: number; expense: number; }

export default function SummaryCards({ income, expense }: Props) {
  const { t } = useLang();
  const balance = income - expense;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 animate-in">
      <div className="stat">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--green-bg)" }}>
            <TrendingUp className="w-3.5 h-3.5" style={{ color: "var(--green)" }} />
          </div>
          <span className="font-pixel text-xs font-semibold" style={{ color: "var(--text-muted)" }}>{t.total_income}</span>
        </div>
        <p className="font-pixel text-xl font-bold" style={{ color: "var(--green)" }}>
          +฿{income.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
        </p>
        <div className="bar-track mt-3">
          <div className="bar-fill" style={{ width: income + expense > 0 ? `${(income / (income + expense)) * 100}%` : "0%" }} />
        </div>
      </div>

      <div className="stat">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--red-bg)" }}>
            <TrendingDown className="w-3.5 h-3.5" style={{ color: "var(--red)" }} />
          </div>
          <span className="font-pixel text-xs font-semibold" style={{ color: "var(--text-muted)" }}>{t.total_expense}</span>
        </div>
        <p className="font-pixel text-xl font-bold" style={{ color: "var(--red)" }}>
          -฿{expense.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
        </p>
        <div className="bar-track mt-3">
          <div className="bar-fill red" style={{ width: income + expense > 0 ? `${(expense / (income + expense)) * 100}%` : "0%" }} />
        </div>
      </div>

      <div className="stat">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--blue-bg)" }}>
            <Wallet className="w-3.5 h-3.5" style={{ color: "var(--blue)" }} />
          </div>
          <span className="font-pixel text-xs font-semibold" style={{ color: "var(--text-muted)" }}>{t.balance}</span>
        </div>
        <p className="font-pixel text-xl font-bold" style={{ color: balance >= 0 ? "var(--green)" : "var(--red)" }}>
          ฿{balance.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
        </p>
        <div className="bar-track mt-3">
          <div className="bar-fill yellow" style={{ width: income > 0 ? `${Math.min((balance / income) * 100, 100)}%` : "0%" }} />
        </div>
      </div>
    </div>
  );
}

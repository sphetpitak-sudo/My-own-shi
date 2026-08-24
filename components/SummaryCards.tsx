"use client";

import { useLang } from "@/lib/i18n";

interface Props { income: number; expense: number; }

export default function SummaryCards({ income, expense }: Props) {
  const { t } = useLang();
  const balance = income - expense;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in" style={{ animationDelay: "0.05s" }}>
      <div className="stat-card-forest income">
        <span className="text-3xl mb-2 block animate-float">🌱</span>
        <p className="font-pixel text-xs font-bold uppercase tracking-wide" style={{ color: "#4a6b14" }}>{t.total_income}</p>
        <p className="font-pixel text-2xl font-bold mt-2" style={{ color: "#2d5016" }}>
          +฿{income.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
        </p>
        <div className="progress-bar mt-3">
          <div className="progress-fill" style={{ width: income + expense > 0 ? `${(income / (income + expense)) * 100}%` : "0%" }} />
        </div>
      </div>

      <div className="stat-card-forest expense">
        <span className="text-3xl mb-2 block animate-float" style={{ animationDelay: "0.3s" }}>🍂</span>
        <p className="font-pixel text-xs font-bold uppercase tracking-wide" style={{ color: "#8b4513" }}>{t.total_expense}</p>
        <p className="font-pixel text-2xl font-bold mt-2" style={{ color: "#c0392b" }}>
          -฿{expense.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
        </p>
        <div className="progress-bar mt-3">
          <div className="progress-fill berry" style={{ width: income + expense > 0 ? `${(expense / (income + expense)) * 100}%` : "0%" }} />
        </div>
      </div>

      <div className="stat-card-forest balance">
        <span className="text-3xl mb-2 block animate-float" style={{ animationDelay: "0.6s" }}>🏠</span>
        <p className="font-pixel text-xs font-bold uppercase tracking-wide" style={{ color: "#1565c0" }}>{t.balance}</p>
        <p className="font-pixel text-2xl font-bold mt-2" style={{ color: balance >= 0 ? "#2d5016" : "#c0392b" }}>
          ฿{balance.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
        </p>
        <div className="progress-bar mt-3">
          <div className="progress-fill honey" style={{ width: income > 0 ? `${Math.min((balance / income) * 100, 100)}%` : "0%" }} />
        </div>
      </div>
    </div>
  );
}

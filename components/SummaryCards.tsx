"use client";

import { useLang } from "@/lib/i18n";
import { TrendingUp, TrendingDown, Wallet, ListTodo, AlertCircle } from "lucide-react";

interface Props { income: number; expense: number; balance: number; pendingTodos: number; }

export default function SummaryCards({ income, expense, balance, pendingTodos }: Props) {
  const { t } = useLang();

  return (
    <div className="grid-stats">
      <div className="stat-card animate-in d1">
        <div className="stat-icon" style={{ background: "var(--green-soft)" }}>
          <TrendingUp size={17} style={{ color: "var(--green)" }} />
        </div>
        <div className="stat-label">{t.total_income}</div>
        <div className="stat-value" style={{ color: "var(--green)" }}>
          +฿{income.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
        </div>
      </div>

      <div className="stat-card animate-in d2">
        <div className="stat-icon" style={{ background: "var(--red-soft)" }}>
          <TrendingDown size={17} style={{ color: "var(--red)" }} />
        </div>
        <div className="stat-label">{t.total_expense}</div>
        <div className="stat-value" style={{ color: "var(--red)" }}>
          -฿{expense.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
        </div>
      </div>

      <div className="stat-card animate-in d3">
        <div className="stat-icon" style={{ background: balance >= 0 ? "var(--green-soft)" : "var(--amber-soft)" }}>
          <Wallet size={17} style={{ color: balance >= 0 ? "var(--green)" : "var(--amber)" }} />
        </div>
        <div className="stat-label">{t.balance}</div>
        <div className="stat-value" style={{ color: balance >= 0 ? "var(--green)" : "var(--red)" }}>
          ฿{balance.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
        </div>
      </div>
    </div>
  );
}
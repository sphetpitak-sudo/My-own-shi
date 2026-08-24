"use client";

import { useLang } from "@/lib/i18n";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";

interface Props {
  income: number;
  expense: number;
}

export default function SummaryCards({ income, expense }: Props) {
  const { t } = useLang();
  const balance = income - expense;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in" style={{ animationDelay: "0.05s" }}>
      <div className="stat-card bg-gradient-to-br from-green-500/10 to-emerald-500/5 dark:from-green-500/15 dark:to-emerald-500/10 border border-green-200/50 dark:border-green-700/30">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-green-500/10 mb-3 mx-auto">
          <TrendingUp className="w-5 h-5 text-green-500" />
        </div>
        <p className="font-pixel text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{t.total_income}</p>
        <p className="font-pixel text-2xl font-bold text-green-600 dark:text-green-400 mt-2">
          +฿{income.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
        </p>
      </div>

      <div className="stat-card bg-gradient-to-br from-red-500/10 to-rose-500/5 dark:from-red-500/15 dark:to-rose-500/10 border border-red-200/50 dark:border-red-700/30">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-500/10 mb-3 mx-auto">
          <TrendingDown className="w-5 h-5 text-red-500" />
        </div>
        <p className="font-pixel text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{t.total_expense}</p>
        <p className="font-pixel text-2xl font-bold text-red-600 dark:text-red-400 mt-2">
          -฿{expense.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
        </p>
      </div>

      <div className={`stat-card bg-gradient-to-br ${balance >= 0 ? "from-blue-500/10 to-indigo-500/5 dark:from-blue-500/15 dark:to-indigo-500/10 border-blue-200/50 dark:border-blue-700/30" : "from-yellow-500/10 to-amber-500/5 dark:from-yellow-500/15 dark:to-amber-500/10 border-yellow-200/50 dark:border-yellow-700/30"}`}>
        <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${balance >= 0 ? "bg-blue-500/10" : "bg-yellow-500/10"} mb-3 mx-auto`}>
          <Wallet className={`w-5 h-5 ${balance >= 0 ? "text-blue-500" : "text-yellow-500"}`} />
        </div>
        <p className="font-pixel text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{t.balance}</p>
        <p className={`font-pixel text-2xl font-bold ${balance >= 0 ? "text-blue-600 dark:text-blue-400" : "text-yellow-600 dark:text-yellow-400"} mt-2`}>
          ฿{balance.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
        </p>
      </div>
    </div>
  );
}

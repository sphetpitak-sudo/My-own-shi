"use client";

import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useLang } from "@/lib/i18n";
import type { Transaction } from "@/lib/types";
import { BarChart3, PieChart as PieIcon } from "lucide-react";

interface Props { transactions: Transaction[] }

const COLORS = ["#0a7cff", "#6c5ce7", "#00b894", "#fdcb6e", "#e17055", "#d63031", "#0984e3"];

export default function Charts({ transactions }: Props) {
  const { t } = useLang();
  const expenses = transactions.filter((tx) => tx.type === "expense");

  const categoryData = Object.entries(
    expenses.reduce((acc, tx) => { acc[tx.category] = (acc[tx.category] || 0) + Number(tx.amount); return acc; }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name: t[name as keyof typeof t] || name, value }));

  const monthlyData = Object.entries(
    expenses.reduce((acc, tx) => { const m = tx.date.slice(0, 7); acc[m] = (acc[m] || 0) + Number(tx.amount); return acc; }, {} as Record<string, number>)
  ).sort(([a], [b]) => a.localeCompare(b)).map(([name, value]) => ({ name, value }));

  if (categoryData.length === 0 && monthlyData.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in" style={{ animationDelay: "0.15s" }}>
      {categoryData.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="font-pixel text-sm font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-purple-500" /> {t.category_chart}
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value" stroke="none">
                {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => `฿${Number(v).toLocaleString("th-TH")}`}
                contentStyle={{ background: "rgba(255,255,255,0.95)", border: "none", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontFamily: "K2D", fontSize: "14px" }} />
              <Legend wrapperStyle={{ fontFamily: "K2D", fontSize: "13px" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {monthlyData.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="font-pixel text-sm font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-500" /> {t.monthly_chart}
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyData}>
              <XAxis dataKey="name" tick={{ fontSize: 12, fontFamily: "K2D" }} stroke="#cbd5e1" />
              <YAxis tick={{ fontSize: 12, fontFamily: "K2D" }} stroke="#cbd5e1" />
              <Tooltip formatter={(v) => `฿${Number(v).toLocaleString("th-TH")}`}
                contentStyle={{ background: "rgba(255,255,255,0.95)", border: "none", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontFamily: "K2D", fontSize: "14px" }} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {monthlyData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

"use client";

import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useLang } from "@/lib/i18n";
import type { Transaction } from "@/lib/types";

interface Props { transactions: Transaction[] }

const COLORS = ["#1a1a2e", "#3a7d44", "#c0392b", "#2563eb", "#d4a017", "#7c3aed", "#0891b2"];

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
    <div className="grid-2 animate-in" style={{ animationDelay: "0.08s" }}>
      {categoryData.length > 0 && (
        <div className="card p-5">
          <h3 className="sec mb-3" style={{ color: "var(--text)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
            {t.category_chart}
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={3} dataKey="value" stroke="none">
                {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => `฿${Number(v).toLocaleString("th-TH")}`}
                contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", fontFamily: "K2D", fontSize: "12px" }} />
              <Legend wrapperStyle={{ fontFamily: "K2D", fontSize: "11px" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {monthlyData.length > 0 && (
        <div className="card p-5">
          <h3 className="sec mb-3" style={{ color: "var(--text)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><rect x="3" y="12" width="4" height="9" rx="1"/><rect x="10" y="7" width="4" height="14" rx="1"/><rect x="17" y="3" width="4" height="18" rx="1"/></svg>
            {t.monthly_chart}
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: "K2D" }} stroke="var(--border)" />
              <YAxis tick={{ fontSize: 11, fontFamily: "K2D" }} stroke="var(--border)" />
              <Tooltip formatter={(v) => `฿${Number(v).toLocaleString("th-TH")}`}
                contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", fontFamily: "K2D", fontSize: "12px" }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {monthlyData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

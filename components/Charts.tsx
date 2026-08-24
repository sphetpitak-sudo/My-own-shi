"use client";

import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useLang } from "@/lib/i18n";
import type { Transaction } from "@/lib/types";

interface Props { transactions: Transaction[] }

const COLORS = ["#6b8e23", "#8b6914", "#2d5016", "#c0392b", "#1565c0", "#f39c12", "#6c3483"];

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
    <div className="nature-grid animate-in" style={{ animationDelay: "0.15s" }}>
      {categoryData.length > 0 && (
        <div className="forest-card p-6">
          <h3 className="section-header mb-4" style={{ color: "#2d5016" }}>
            <span className="text-xl">📊</span> {t.category_chart}
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value" stroke="none">
                {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => `฿${Number(v).toLocaleString("th-TH")}`}
                contentStyle={{ background: "#fffef9", border: "2px solid #d4c5a0", borderRadius: "16px", boxShadow: "0 4px 16px rgba(45,80,22,0.15)", fontFamily: "K2D", fontSize: "14px" }} />
              <Legend wrapperStyle={{ fontFamily: "K2D", fontSize: "13px" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {monthlyData.length > 0 && (
        <div className="forest-card p-6">
          <h3 className="section-header mb-4" style={{ color: "#2d5016" }}>
            <span className="text-xl">📈</span> {t.monthly_chart}
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyData}>
              <XAxis dataKey="name" tick={{ fontSize: 12, fontFamily: "K2D" }} stroke="#b8a88a" />
              <YAxis tick={{ fontSize: 12, fontFamily: "K2D" }} stroke="#b8a88a" />
              <Tooltip formatter={(v) => `฿${Number(v).toLocaleString("th-TH")}`}
                contentStyle={{ background: "#fffef9", border: "2px solid #d4c5a0", borderRadius: "16px", boxShadow: "0 4px 16px rgba(45,80,22,0.15)", fontFamily: "K2D", fontSize: "14px" }} />
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

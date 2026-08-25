"use client";

import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useLang } from "@/lib/i18n";
import type { Transaction } from "@/lib/types";

interface Props { transactions: Transaction[] }

const COLORS = ["#17171f", "#2f7d4f", "#c2402f", "#2f5fd0", "#b07d10", "#7c5cbf", "#0d7a8f"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="tt-label">{label || payload[0]?.name}</div>
      <div className="tt-value">฿{Number(payload[0]?.value).toLocaleString("th-TH")}</div>
    </div>
  );
};

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
    <div className="grid-charts">
      {categoryData.length > 0 && (
        <div className="card p-5">
          <h3 className="sec-title mb-4">{t.category_chart}</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" innerRadius={52} outerRadius={78} paddingAngle={3} dataKey="value" stroke="none">
                {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: "12px", fontFamily: "K2D" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {monthlyData.length > 0 && (
        <div className="card p-5">
          <h3 className="sec-title mb-4">{t.monthly_chart}</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData} barSize={28}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: "K2D" }} stroke="var(--border)" tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fontFamily: "K2D" }} stroke="var(--border)" tickLine={false} axisLine={false} width={50} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--border)", opacity: 0.4 }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {monthlyData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
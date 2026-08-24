"use client";

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useLang } from "@/lib/i18n";
import type { Transaction } from "@/lib/types";

interface Props {
  transactions: Transaction[];
}

const COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#3b82f6",
  "#a855f7",
  "#ec4899",
];

export default function Charts({ transactions }: Props) {
  const { t } = useLang();
  const expenses = transactions.filter((tx) => tx.type === "expense");

  const categoryData = Object.entries(
    expenses.reduce(
      (acc, tx) => {
        acc[tx.category] = (acc[tx.category] || 0) + Number(tx.amount);
        return acc;
      },
      {} as Record<string, number>
    )
  ).map(([name, value]) => ({
    name: t[name as keyof typeof t] || name,
    value,
  }));

  const monthlyData = Object.entries(
    expenses.reduce(
      (acc, tx) => {
        const month = tx.date.slice(0, 7);
        acc[month] = (acc[month] || 0) + Number(tx.amount);
        return acc;
      },
      {} as Record<string, number>
    )
  )
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) => ({ name, value }));

  if (categoryData.length === 0 && monthlyData.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {categoryData.length > 0 && (
        <div className="bg-white rounded-2xl shadow-md p-4">
          <h3 className="text-sm font-semibold mb-3">{t.category_chart}</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {categoryData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v) => `฿${Number(v).toLocaleString("th-TH")}`}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {monthlyData.length > 0 && (
        <div className="bg-white rounded-2xl shadow-md p-4">
          <h3 className="text-sm font-semibold mb-3">{t.monthly_chart}</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(v) => `฿${Number(v).toLocaleString("th-TH")}`}
              />
              <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

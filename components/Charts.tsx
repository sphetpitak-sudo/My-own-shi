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
  "#3378fc",
  "#1d5af1",
  "#1545de",
  "#1838b4",
  "#19338e",
  "#142056",
  "#599eff",
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
        <div className="pixel-card">
          <h3 className="font-pixel text-sm font-bold text-pixel-700 dark:text-pixel-300 mb-3">
            ✦ {t.category_chart}
          </h3>
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
                stroke="none"
              >
                {categoryData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v) => `฿${Number(v).toLocaleString("th-TH")}`}
                contentStyle={{
                  border: "2px solid #bcd7ff",
                  boxShadow: "3px 3px 0px 0px #8ebfff",
                  fontFamily: "K2D",
                  fontSize: "16px",
                }}
              />
              <Legend
                wrapperStyle={{ fontFamily: "K2D", fontSize: "14px" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {monthlyData.length > 0 && (
        <div className="pixel-card">
          <h3 className="font-pixel text-sm font-bold text-pixel-700 dark:text-pixel-300 mb-3">
            ✦ {t.monthly_chart}
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData}>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fontFamily: "K2D" }}
                stroke="#8ebfff"
              />
              <YAxis
                tick={{ fontSize: 12, fontFamily: "K2D" }}
                stroke="#8ebfff"
              />
              <Tooltip
                formatter={(v) => `฿${Number(v).toLocaleString("th-TH")}`}
                contentStyle={{
                  border: "2px solid #bcd7ff",
                  boxShadow: "3px 3px 0px 0px #8ebfff",
                  fontFamily: "K2D",
                  fontSize: "16px",
                }}
              />
              <Bar dataKey="value" fill="#3378fc" radius={[0, 0, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

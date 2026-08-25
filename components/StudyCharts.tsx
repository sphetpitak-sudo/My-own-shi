"use client";

import { useMemo } from "react";
import { useLang } from "@/lib/i18n";
import type { Assignment } from "@/lib/types";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { BarChart3, PieChart as PieChartIcon } from "lucide-react";

interface Props {
  assignments: Assignment[];
}

const COLORS = ["var(--green)", "var(--amber)", "var(--red)", "var(--blue)", "#A855F7", "#EC4899", "#0D9488", "#F97316"];

export default function StudyCharts({ assignments }: Props) {
  const { lang } = useLang();

  const weeklyData = useMemo(() => {
    const days = lang === "th" ? ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"] : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());

    return days.map((day, i) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

      const done = assignments.filter((a) => a.status === "done" && a.updated_at.slice(0, 10) === dateStr).length;
      const created = assignments.filter((a) => a.created_at.slice(0, 10) === dateStr).length;

      return { name: day, done, created };
    });
  }, [assignments, lang]);

  const statusData = useMemo(() => {
    const pending = assignments.filter((a) => a.status === "pending").length;
    const inProgress = assignments.filter((a) => a.status === "in_progress").length;
    const done = assignments.filter((a) => a.status === "done").length;

    return [
      { name: lang === "th" ? "รอทำ" : "Pending", value: pending, color: "var(--amber)" },
      { name: lang === "th" ? "กำลังทำ" : "In Progress", value: inProgress, color: "var(--blue)" },
      { name: lang === "th" ? "เสร็จแล้ว" : "Done", value: done, color: "var(--green)" },
    ].filter((d) => d.value > 0);
  }, [assignments, lang]);

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string }>; label?: string }) => {
    if (!active || !payload) return null;
    return (
      <div className="chart-tooltip">
        <div className="tt-label">{label}</div>
        {payload.map((p, i) => (
          <div key={i} className="tt-value" style={{ color: i === 0 ? "var(--green)" : "var(--blue)" }}>
            {p.name}: {p.value}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Weekly bar chart */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 size={16} style={{ color: "var(--text-secondary)" }} />
          <span className="sec-title">{lang === "th" ? "งานตามวัน" : "By Day of Week"}</span>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={weeklyData} barGap={2}>
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} width={25} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="done" fill="var(--green)" radius={[4, 4, 0, 0]} name={lang === "th" ? "เสร็จ" : "Done"} />
            <Bar dataKey="created" fill="var(--blue)" radius={[4, 4, 0, 0]} name={lang === "th" ? "สร้าง" : "Created"} opacity={0.5} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Status pie chart */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <PieChartIcon size={16} style={{ color: "var(--text-secondary)" }} />
          <span className="sec-title">{lang === "th" ? "สถานะงาน" : "By Status"}</span>
        </div>
        {statusData.length === 0 ? (
          <div className="h-[180px] flex items-center justify-center">
            <span className="text-[13px]" style={{ color: "var(--text-muted)" }}>{lang === "th" ? "ยังไม่มีข้อมูล" : "No data yet"}</span>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="50%" height={160}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                  {statusData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {statusData.map((d, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: d.color }} />
                  <span className="text-[12px] flex-1">{d.name}</span>
                  <span className="text-[13px] font-bold">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

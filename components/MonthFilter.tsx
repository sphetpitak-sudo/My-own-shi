"use client";

import { useLang } from "@/lib/i18n";
import { Filter } from "lucide-react";

interface Props {
  months: string[];
  categories: string[];
  selectedMonth: string;
  selectedCategory: string;
  onMonthChange: (v: string) => void;
  onCategoryChange: (v: string) => void;
}

export default function MonthFilter({
  months, categories, selectedMonth, selectedCategory, onMonthChange, onCategoryChange,
}: Props) {
  const { t } = useLang();

  return (
    <div className="flex gap-3 flex-wrap animate-in" style={{ animationDelay: "0.08s" }}>
      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
        <Filter className="w-4 h-4" />
        <span className="font-pixel text-sm font-semibold">{t.filter_month}:</span>
      </div>
      <select value={selectedMonth} onChange={(e) => onMonthChange(e.target.value)} className="pixel-select flex-1 sm:flex-none sm:w-auto">
        <option value="all">ทั้งหมด</option>
        {months.map((m) => <option key={m} value={m}>{m}</option>)}
      </select>
      <select value={selectedCategory} onChange={(e) => onCategoryChange(e.target.value)} className="pixel-select flex-1 sm:flex-none sm:w-auto">
        <option value="all">{t.all} {t.filter_category}</option>
        {categories.map((c) => <option key={c} value={c}>{t[c as keyof typeof t]}</option>)}
      </select>
    </div>
  );
}

"use client";

import { useLang } from "@/lib/i18n";

interface Props {
  months: string[];
  categories: string[];
  selectedMonth: string;
  selectedCategory: string;
  onMonthChange: (v: string) => void;
  onCategoryChange: (v: string) => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  food: "🍖", transport: "🚌", study: "📚", entertainment: "🎮",
  salary: "💰", gift: "🎁", other: "📦",
};

export default function MonthFilter({ months, categories, selectedMonth, selectedCategory, onMonthChange, onCategoryChange }: Props) {
  const { t } = useLang();

  return (
    <div className="flex gap-3 flex-wrap animate-in" style={{ animationDelay: "0.08s" }}>
      <div className="flex items-center gap-2" style={{ color: "#8b7355" }}>
        <span className="text-base">🔍</span>
        <span className="font-pixel text-sm font-bold">{t.filter_month}:</span>
      </div>
      <select value={selectedMonth} onChange={(e) => onMonthChange(e.target.value)} className="forest-select flex-1 sm:flex-none sm:w-auto">
        <option value="all">🌟 ทั้งหมด</option>
        {months.map((m) => <option key={m} value={m}>{m}</option>)}
      </select>
      <select value={selectedCategory} onChange={(e) => onCategoryChange(e.target.value)} className="forest-select flex-1 sm:flex-none sm:w-auto">
        <option value="all">🏷️ {t.all} {t.filter_category}</option>
        {categories.map((c) => <option key={c} value={c}>{CATEGORY_ICONS[c] || "📦"} {t[c as keyof typeof t]}</option>)}
      </select>
    </div>
  );
}

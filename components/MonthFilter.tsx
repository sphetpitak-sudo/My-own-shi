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

export default function MonthFilter({
  months,
  categories,
  selectedMonth,
  selectedCategory,
  onMonthChange,
  onCategoryChange,
}: Props) {
  const { t } = useLang();

  return (
    <div className="flex gap-2 flex-wrap">
      <select
        value={selectedMonth}
        onChange={(e) => onMonthChange(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
      >
        <option value="all">{t.all} {t.filter_month}</option>
        {months.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>

      <select
        value={selectedCategory}
        onChange={(e) => onCategoryChange(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
      >
        <option value="all">{t.all} {t.filter_category}</option>
        {categories.map((c) => (
          <option key={c} value={c}>
            {t[c as keyof typeof t]}
          </option>
        ))}
      </select>
    </div>
  );
}

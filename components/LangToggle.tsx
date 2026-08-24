"use client";

import { useLang } from "@/lib/i18n";

export default function LangToggle() {
  const { lang, toggle } = useLang();

  return (
    <button
      onClick={toggle}
      className="px-3 py-1.5 text-sm font-medium rounded-full border border-gray-300 hover:bg-gray-100 transition-colors"
    >
      {lang === "th" ? "🇹🇭 TH" : "🇬🇧 EN"}
    </button>
  );
}

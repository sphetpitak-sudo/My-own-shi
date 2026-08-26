"use client";

import { useLang } from "@/lib/i18n";

export default function LangToggle() {
  const { lang, t, toggle } = useLang();
  return (
    <button onClick={toggle} className="btn-icon text-[13px] font-bold" title={lang === "th" ? t.switch_to_english : t.switch_to_thai} aria-label={lang === "th" ? t.switch_to_english : t.switch_to_thai}>
      {lang === "th" ? "TH" : "EN"}
    </button>
  );
}
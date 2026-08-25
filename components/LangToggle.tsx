"use client";

import { useLang } from "@/lib/i18n";

export default function LangToggle() {
  const { lang, toggle } = useLang();
  return (
    <button onClick={toggle} className="btn-icon text-[13px] font-bold" title="Toggle language">
      {lang === "th" ? "TH" : "EN"}
    </button>
  );
}
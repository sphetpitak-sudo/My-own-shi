"use client";

import { useLang } from "@/lib/i18n";

export default function LangToggle() {
  const { lang, toggle } = useLang();
  return (
    <button onClick={toggle} className="btn-icon text-[13px] font-bold" title={lang === "th" ? "Switch to English" : "Switch to Thai"}>
      {lang === "th" ? "TH" : "EN"}
    </button>
  );
}
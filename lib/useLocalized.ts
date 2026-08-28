"use client";

import { useLang } from "@/lib/i18n";

/**
 * Returns the appropriate Thai or English/identifier string based on current language.
 *
 * Convention: feature metadata uses `*Th` for Thai copy and the unprefixed
 * field for English / technical identifier. The dashboard is Thai-first but
 * we still need a consistent helper to pick the right copy.
 */
export function useLocalized() {
  const { lang } = useLang();
  return {
    lang,
    pick: <T,>(th: T, en: T): T => (lang === "th" ? th : en),
    isThai: lang === "th",
  };
}

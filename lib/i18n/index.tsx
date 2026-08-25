"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import th from "./th.json";
import en from "./en.json";

type Lang = "th" | "en";
type Dict = typeof th;

const dictionaries = { th, en };

const LangContext = createContext<{
  lang: Lang;
  t: Dict;
  toggle: () => void;
}>({ lang: "th", t: th, toggle: () => {} });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("th");

  useEffect(() => {
    const saved = localStorage.getItem("lang") as Lang | null;
    if (saved === "th" || saved === "en") {
      setLang(saved);
    } else if (typeof navigator !== "undefined") {
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith("th")) {
        setLang("th");
        localStorage.setItem("lang", "th");
      } else {
        setLang("en");
        localStorage.setItem("lang", "en");
      }
    }
  }, []);

  const toggle = () => {
    const next = lang === "th" ? "en" : "th";
    setLang(next);
    localStorage.setItem("lang", next);
  };

  return (
    <LangContext.Provider value={{ lang, t: dictionaries[lang], toggle }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);

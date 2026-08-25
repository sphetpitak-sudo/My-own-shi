"use client";

import { useTheme } from "@/lib/theme";
import { useLang } from "@/lib/i18n";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const { lang } = useLang();
  return (
    <button onClick={toggle} className="btn-icon" title={theme === "dark" ? (lang === "th" ? "เปลี่ยนเป็นสว่าง" : "Switch to light") : (lang === "th" ? "เปลี่ยนมืด" : "Switch to dark")}>
      {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
    </button>
  );
}
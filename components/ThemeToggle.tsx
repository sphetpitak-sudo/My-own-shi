"use client";

import { useTheme } from "@/lib/theme";
import { useLang } from "@/lib/i18n";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const { t } = useLang();
  return (
    <button onClick={toggle} className="btn-icon" title={t.toggle_dark} aria-label={t.toggle_dark}>
      {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
    </button>
  );
}
"use client";

import { useTheme } from "@/lib/theme";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button onClick={toggle} className="btn-icon" title="Toggle theme">
      {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
    </button>
  );
}
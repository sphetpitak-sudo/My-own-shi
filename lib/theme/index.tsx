"use client";

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";

type Theme = "light" | "dark";

const ThemeContext = createContext<{
  theme: Theme;
  toggle: () => void;
}>({ theme: "light", toggle: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const toggleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") {
      setTheme(saved);
      document.documentElement.classList.toggle("dark", saved === "dark");
    } else {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      setTheme(mq.matches ? "dark" : "light");
      document.documentElement.classList.toggle("dark", mq.matches);
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const toggle = () => {
    const next = theme === "light" ? "dark" : "light";
    document.documentElement.classList.add("transitioning");
    setTheme(next);
    localStorage.setItem("theme", next);
    if (toggleTimeoutRef.current) clearTimeout(toggleTimeoutRef.current);
    toggleTimeoutRef.current = setTimeout(() => document.documentElement.classList.remove("transitioning"), 300);
  };

  useEffect(() => {
    return () => { if (toggleTimeoutRef.current) clearTimeout(toggleTimeoutRef.current); };
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);

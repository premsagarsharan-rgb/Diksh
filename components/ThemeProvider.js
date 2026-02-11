// components/ThemeProvider.js
"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

const ThemeCtx = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("dark");
  const [mounted, setMounted] = useState(false);

  // Load saved theme
  useEffect(() => {
    const saved = localStorage.getItem("sysbyte_theme");
    if (saved === "light" || saved === "dark") {
      setTheme(saved);
    }
    setMounted(true);
  }, []);

  // Apply theme to <html>
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;

    // Remove old classes
    root.classList.remove("theme-light", "theme-dark");

    // Add current
    root.classList.add(theme === "light" ? "theme-light" : "theme-dark");

    // Data attribute (for CSS [data-theme="light"] selectors if needed)
    root.setAttribute("data-theme", theme);

    // Save
    try {
      localStorage.setItem("sysbyte_theme", theme);
    } catch {}
  }, [theme, mounted]);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggle: () => setTheme((t) => (t === "light" ? "dark" : "light")),
      mounted,
    }),
    [theme, mounted]
  );

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useTheme() {
  return useContext(ThemeCtx);
}

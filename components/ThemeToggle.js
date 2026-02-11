// components/ThemeToggle.js
"use client";

import { useTheme } from "@/components/ThemeProvider";

export default function ThemeToggle() {
  const t = useTheme();
  if (!t) return null;

  const isLight = t.theme === "light";

  return (
    <button
      type="button"
      onClick={t.toggle}
      className="w-10 h-10 rounded-full flex items-center justify-center text-lg border transition-all duration-300"
      style={{
        background: isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.06)",
        borderColor: isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.10)",
        color: isLight ? "#b45309" : "#60a5fa",
      }}
      title={isLight ? "Switch to Dark" : "Switch to Light"}
    >
      {isLight ? "☀️" : "🌙"}
    </button>
  );
}

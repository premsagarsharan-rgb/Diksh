// components/dashboard/calander/CalanderHeader.js
"use client";

import { useCT, getModeStyle } from "./calanderTheme";
import { useTheme } from "@/components/ThemeProvider";

export default function CalanderHeader({
  anchor,
  mode,
  onPrevMonth,
  onNextMonth,
  // Mode toggle removed — mode is now fixed per component
  // But we still accept mode to show the badge
}) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const c = useCT(isLight);
  const ms = getModeStyle(mode, c);

  const year = anchor.getFullYear();
  const monthLabel = anchor.toLocaleString("default", { month: "long" });

  return (
    <div
      style={{
        borderRadius: 20,
        border: `1px solid ${c.surfaceBorder}`,
        background: c.surfaceBg,
        padding: "12px 16px",
        marginBottom: 12,
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Month + Year + Mode Badge */}
        <div className="flex items-center gap-3">
          <div style={{ color: c.t1 }} className="text-base sm:text-lg font-bold">
            {monthLabel} {year}
          </div>
          {/* Fixed mode badge (no toggle) */}
          <span
            style={{
              background: ms.bg,
              border: `1px solid ${ms.border}`,
              color: ms.text,
              borderRadius: 999,
              padding: "4px 12px",
              fontSize: 12,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            {ms.icon} {mode === "MEETING" ? "Meeting" : "Diksha"}
          </span>
        </div>

        {/* Navigation Arrows */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPrevMonth}
            style={{
              background: c.navBtnBg,
              border: `1px solid ${c.navBtnBorder}`,
              color: c.navBtnText,
              borderRadius: 14,
              padding: "8px 14px",
              cursor: "pointer",
              transition: "all 0.15s",
              fontSize: 14,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = c.navBtnHover;
              e.currentTarget.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = c.navBtnBg;
              e.currentTarget.style.transform = "";
            }}
            onPointerDown={(e) => (e.currentTarget.style.transform = "scale(0.95)")}
            onPointerUp={(e) => (e.currentTarget.style.transform = "")}
          >
            ◀
          </button>

          {/* Today button */}
          <button
            type="button"
            onClick={() => {
              // Navigate to current month — parent handles via onPrevMonth/onNextMonth pattern
              // This is a convenience: if parent provides onToday, use it
            }}
            style={{
              background: c.dayTodayGlow,
              border: `1px solid ${c.dayTodayBorder}`,
              color: c.dayTodayDot,
              borderRadius: 14,
              padding: "8px 14px",
              cursor: "pointer",
              transition: "all 0.15s",
              fontSize: 12,
              fontWeight: 600,
              display: "none", // Hidden — can be enabled later
            }}
          >
            Today
          </button>

          <button
            type="button"
            onClick={onNextMonth}
            style={{
              background: c.navBtnBg,
              border: `1px solid ${c.navBtnBorder}`,
              color: c.navBtnText,
              borderRadius: 14,
              padding: "8px 14px",
              cursor: "pointer",
              transition: "all 0.15s",
              fontSize: 14,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = c.navBtnHover;
              e.currentTarget.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = c.navBtnBg;
              e.currentTarget.style.transform = "";
            }}
            onPointerDown={(e) => (e.currentTarget.style.transform = "scale(0.95)")}
            onPointerUp={(e) => (e.currentTarget.style.transform = "")}
          >
            ▶
          </button>
        </div>
      </div>
    </div>
  );
}

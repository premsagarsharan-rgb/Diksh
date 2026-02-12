// components/dashboard/calander/CalanderMonthGrid.js
"use client";

import { useCT, getModeStyle } from "./calanderTheme";
import { useTheme } from "@/components/ThemeProvider";

function ymdLocal(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalanderMonthGrid({
  cells,
  month,
  selectedDate,
  todayStr,
  summary,
  mode,
  onDateSelect,
}) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const c = useCT(isLight);
  const ms = getModeStyle(mode, c);

  return (
    <div className="hidden md:block">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
        {WEEKDAYS.map((d, i) => (
          <div
            key={d}
            className="text-center"
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: i === 0 ? c.weekdaySun : c.weekdayText,
            }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {cells.map((d, idx) => {
          if (!d) return <div key={`empty-${idx}`} />;

          const dateStr = ymdLocal(d);
          const isSelected = selectedDate === dateStr;
          const isToday = dateStr === todayStr;
          const isSun = idx % 7 === 0;
          const s = summary[dateStr];
          const hasCards = s && (s.male + s.female) > 0;

          let borderColor = c.dayBorder;
          let bg = c.dayBg;
          let ringStyle = {};

          if (isSelected) {
            borderColor = c.daySelectedBorder;
            bg = c.daySelectedBg;
            ringStyle = { boxShadow: `0 0 0 2px ${c.daySelectedRing}` };
          } else if (isToday) {
            borderColor = c.dayTodayBorder;
            ringStyle = {
              boxShadow: `0 0 0 2px ${c.dayTodayRing}`,
            };
          }

          if (isSun && !isSelected && !isToday) {
            ringStyle = { boxShadow: `inset 0 0 0 1px rgba(239,68,68,0.08)` };
          }

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => onDateSelect(dateStr)}
              className="text-left transition-all duration-150"
              style={{
                minHeight: 84,
                borderRadius: 18,
                border: `1px solid ${borderColor}`,
                background: bg,
                padding: "8px 10px",
                cursor: "pointer",
                ...ringStyle,
              }}
              onMouseEnter={(e) => {
                if (!isSelected) e.currentTarget.style.background = c.dayHover;
              }}
              onMouseLeave={(e) => {
                if (!isSelected) e.currentTarget.style.background = c.dayBg;
              }}
            >
              {/* Date + Today badge */}
              <div className="flex items-center justify-between">
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: isSun ? c.daySunText : c.dayText,
                  }}
                >
                  {d.getDate()}
                </span>
                {isToday && (
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: 999,
                      fontSize: 10,
                      background: c.dayTodayGlow,
                      border: `1px solid ${c.dayTodayBorder}`,
                      color: c.dayTodayDot,
                      fontWeight: 600,
                    }}
                  >
                    Today
                  </span>
                )}
              </div>

              {/* Mode label */}
              <div style={{ fontSize: 10, color: c.t4, marginTop: 2 }}>{mode}</div>

              {/* Counts */}
              {hasCards ? (
                <div className="flex gap-1.5 flex-wrap" style={{ marginTop: 8 }}>
                  <span
                    style={{
                      fontSize: 10,
                      padding: "2px 8px",
                      borderRadius: 999,
                      background: c.maleBg,
                      border: `1px solid ${c.maleBorder}`,
                      color: c.maleText,
                    }}
                  >
                    M {s.male}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      padding: "2px 8px",
                      borderRadius: 999,
                      background: c.femaleBg,
                      border: `1px solid ${c.femaleBorder}`,
                      color: c.femaleText,
                    }}
                  >
                    F {s.female}
                  </span>
                </div>
              ) : (
                <div style={{ marginTop: 8, fontSize: 10, color: c.dayEmptyText }}>—</div>
              )}

              {/* History badge */}
              {s?.history > 0 && (
                <div style={{ marginTop: 4 }}>
                  <span
                    style={{
                      fontSize: 9,
                      padding: "2px 8px",
                      borderRadius: 999,
                      background: c.historyBg,
                      border: `1px solid ${c.historyBorder}`,
                      color: c.historyText,
                    }}
                  >
                    ✅ {s.history} confirmed
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// components/dashboard/calander/CalanderDayStrip.js
"use client";

import { useRef, useEffect } from "react";
import { useCT, getModeStyle } from "./calanderTheme";
import { useTheme } from "@/components/ThemeProvider";

function ymdLocal(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function CalanderDayStrip({
  monthDays,
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
  const scrollRef = useRef(null);

  // Auto-scroll to selected/today on mount
  useEffect(() => {
    if (!scrollRef.current) return;
    const target = selectedDate || todayStr;
    const el = scrollRef.current.querySelector(`[data-date="${target}"]`);
    if (el) {
      el.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
    }
  }, [selectedDate, todayStr]);

  return (
    <div className="block md:hidden">
      <div
        style={{
          borderRadius: 20,
          border: `1px solid ${c.surfaceBorder}`,
          background: c.surfaceBg,
          padding: 12,
          marginBottom: 12,
        }}
      >
        {/* Strip Header */}
        <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
          <span style={{ color: c.t3, fontSize: 11, fontWeight: 500 }}>Select Date</span>
          <span style={{ color: c.t4, fontSize: 10 }}>
            {ms.icon} {mode} • {monthDays[0]?.toLocaleString("default", { month: "short" })}{" "}
            {monthDays[0]?.getFullYear()}
          </span>
        </div>

        {/* Scrollable Strip */}
        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1"
          style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
        >
          {monthDays.map((d) => {
            const dateStr = ymdLocal(d);
            const isSelected = selectedDate === dateStr;
            const isToday = dateStr === todayStr;
            const weekday = d.toLocaleDateString("default", { weekday: "short" });
            const isSun = d.getDay() === 0;
            const s = summary?.[dateStr];
            const hasCards = s && (s.male + s.female) > 0;

            let borderColor = c.dayBorder;
            let bg = c.dayBg;
            let ringStyle = {};

            if (isSelected) {
              borderColor = c.daySelectedBorder;
              bg = c.daySelectedBg;
              ringStyle = {
                boxShadow: `0 0 0 2px ${c.daySelectedRing}`,
              };
            } else if (isToday) {
              borderColor = c.dayTodayBorder;
              ringStyle = {
                boxShadow: `0 0 0 2px ${c.dayTodayRing}, 0 0 30px ${c.dayTodayGlow}`,
              };
            }

            return (
              <button
                key={dateStr}
                data-date={dateStr}
                type="button"
                onClick={() => onDateSelect(dateStr)}
                style={{
                  flexShrink: 0,
                  minWidth: 76,
                  borderRadius: 18,
                  border: `1px solid ${borderColor}`,
                  background: bg,
                  padding: "10px 12px",
                  textAlign: "left",
                  scrollSnapAlign: "start",
                  transition: "all 0.15s ease",
                  cursor: "pointer",
                  ...ringStyle,
                }}
              >
                {/* Weekday + Today dot */}
                <div className="flex items-center justify-between gap-1">
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: isSun ? c.daySunText : c.t2,
                    }}
                  >
                    {weekday}
                  </span>
                  {isToday && (
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: c.dayTodayDot,
                        flexShrink: 0,
                      }}
                    />
                  )}
                </div>

                {/* Date number */}
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    lineHeight: 1.2,
                    marginTop: 2,
                    color: c.t1,
                  }}
                >
                  {d.getDate()}
                </div>

                {/* Card counts */}
                {hasCards ? (
                  <div style={{ marginTop: 6 }}>
                    <div style={{ fontSize: 10, color: c.t2, fontWeight: 500, marginBottom: 3 }}>
                      {s.male + s.female} cards
                    </div>
                    <div className="flex gap-1">
                      <span
                        style={{
                          fontSize: 9,
                          padding: "2px 6px",
                          borderRadius: 999,
                          background: c.maleBg,
                          border: `1px solid ${c.maleBorder}`,
                          color: c.maleText,
                        }}
                      >
                        M{s.male}
                      </span>
                      <span
                        style={{
                          fontSize: 9,
                          padding: "2px 6px",
                          borderRadius: 999,
                          background: c.femaleBg,
                          border: `1px solid ${c.femaleBorder}`,
                          color: c.femaleText,
                        }}
                      >
                        F{s.female}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div style={{ marginTop: 6, fontSize: 10, color: c.dayEmptyText }}>—</div>
                )}

                {/* History badge */}
                {s?.history > 0 && (
                  <div style={{ marginTop: 3 }}>
                    <span
                      style={{
                        fontSize: 9,
                        padding: "2px 6px",
                        borderRadius: 999,
                        background: c.historyBg,
                        border: `1px solid ${c.historyBorder}`,
                        color: c.historyText,
                      }}
                    >
                      ✅{s.history}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

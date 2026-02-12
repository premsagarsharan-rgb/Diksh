// components/dashboard/calander/CalanderMonthGrid.js
"use client";

import { useCT } from "./calanderTheme";
import { useTheme } from "@/components/ThemeProvider";

function ymdLocal(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function usageTier(ratio) {
  if (ratio >= 1) return "FULL";
  if (ratio >= 0.7) return "WARN";
  if (ratio > 0) return "OK";
  return "NONE";
}

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

  const defaultLimit = 20;

  return (
    <div className="hidden md:block">
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

      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {cells.map((d, idx) => {
          if (!d) return <div key={`empty-${idx}`} />;

          const dateStr = ymdLocal(d);
          const isSelected = selectedDate === dateStr;
          const isToday = dateStr === todayStr;
          const isSun = idx % 7 === 0;

          const s = summary?.[dateStr] || null;
          const male = s?.male || 0;
          const female = s?.female || 0;
          const reserved = s?.reserved || 0;
          const cardsIn = male + female;

          const used = mode === "DIKSHA" ? cardsIn + reserved : cardsIn;
          const ratio = used / defaultLimit;
          const tier = mode === "DIKSHA" ? usageTier(ratio) : "NONE";

          const hasCards = cardsIn > 0;
          const hasReserved = mode === "DIKSHA" && reserved > 0;
          const hasAny = used > 0;

          let borderColor = c.dayBorder;
          let bg = c.dayBg;
          let ringStyle = {};

          if (mode === "DIKSHA" && tier !== "NONE" && !isSelected && !isToday) {
            bg = tier === "FULL" ? c.gaugeFullBg : tier === "WARN" ? c.gaugeWarnBg : c.gaugeOkBg;
            borderColor = tier === "FULL" ? c.gaugeFullBorder : tier === "WARN" ? c.gaugeWarnBorder : c.gaugeOkBorder;
          }

          if (isSelected) {
            borderColor = c.daySelectedBorder;
            bg = c.daySelectedBg;
            ringStyle = { boxShadow: `0 0 0 2px ${c.daySelectedRing}` };
          } else if (isToday) {
            borderColor = c.dayTodayBorder;
            ringStyle = { boxShadow: `0 0 0 2px ${c.dayTodayRing}` };
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
                minHeight: 96,
                borderRadius: 18,
                border: `1px solid ${borderColor}`,
                background: bg,
                padding: "8px 10px",
                cursor: "pointer",
                position: "relative",
                overflow: "hidden",
                ...ringStyle,
              }}
            >
              {/* DIKSHA usage bar */}
              {mode === "DIKSHA" && used > 0 && !isSelected && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    height: 3,
                    width: `${Math.min(100, ratio * 100)}%`,
                    background: tier === "FULL" ? c.gaugeFull : tier === "WARN" ? c.gaugeWarn : c.gaugeOk,
                  }}
                />
              )}

              <div className="flex items-center justify-between">
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
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
                      fontWeight: 700,
                    }}
                  >
                    Today
                  </span>
                )}
              </div>

              <div style={{ fontSize: 10, color: c.t4, marginTop: 2 }}>{mode}</div>

              {/* ✅ show reserved even when cardsIn=0 */}
              {hasAny ? (
                <div className="flex gap-1.5 flex-wrap" style={{ marginTop: 8 }}>
                  {hasCards ? (
                    <>
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
                        M {male}
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
                        F {female}
                      </span>
                    </>
                  ) : null}

                  {hasReserved ? (
                    <span
                      style={{
                        fontSize: 10,
                        padding: "2px 8px",
                        borderRadius: 999,
                        background: c.reservedBg,
                        border: `1px solid ${c.reservedBorder}`,
                        color: c.reservedText,
                        fontWeight: 700,
                      }}
                      title="Reserved holds from meeting"
                    >
                      🔒 {reserved}
                    </span>
                  ) : null}

                  {!hasCards && hasReserved ? (
                    <span style={{ fontSize: 9, color: c.t4 }}>Reserved only</span>
                  ) : null}
                </div>
              ) : (
                <div style={{ marginTop: 8, fontSize: 10, color: c.dayEmptyText }}>—</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

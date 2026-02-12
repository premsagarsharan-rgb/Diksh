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

function usageTier(ratio) {
  if (ratio >= 1) return "FULL";
  if (ratio >= 0.7) return "WARN";
  if (ratio > 0) return "OK";
  return "NONE";
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

  const defaultLimit = 20; // NOTE: heatmap ratio currently based on 20. (Can be made exact via API later)

  useEffect(() => {
    if (!scrollRef.current) return;
    const target = selectedDate || todayStr;
    const el = scrollRef.current.querySelector(`[data-date="${target}"]`);
    if (el) el.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
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
        <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
          <span style={{ color: c.t3, fontSize: 11, fontWeight: 500 }}>Select Date</span>
          <span style={{ color: c.t4, fontSize: 10 }}>
            {ms.icon} {mode} • {monthDays[0]?.toLocaleString("default", { month: "short" })}{" "}
            {monthDays[0]?.getFullYear()}
          </span>
        </div>

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

            const s = summary?.[dateStr] || null;
            const male = s?.male || 0;
            const female = s?.female || 0;
            const reserved = s?.reserved || 0; // ✅ now comes from summary API for DIKSHA
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

            // Heat tint for DIKSHA even if only reserved
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
              ringStyle = { boxShadow: `0 0 0 2px ${c.dayTodayRing}, 0 0 30px ${c.dayTodayGlow}` };
            }

            return (
              <button
                key={dateStr}
                data-date={dateStr}
                type="button"
                onClick={() => onDateSelect(dateStr)}
                style={{
                  flexShrink: 0,
                  minWidth: 82,
                  borderRadius: 18,
                  border: `1px solid ${borderColor}`,
                  background: bg,
                  padding: "10px 12px",
                  textAlign: "left",
                  scrollSnapAlign: "start",
                  transition: "all 0.15s ease",
                  cursor: "pointer",
                  position: "relative",
                  overflow: "hidden",
                  ...ringStyle,
                }}
              >
                {/* Tiny usage bar for DIKSHA */}
                {mode === "DIKSHA" && used > 0 && !isSelected && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      height: 3,
                      width: `${Math.min(100, ratio * 100)}%`,
                      background: tier === "FULL" ? c.gaugeFull : tier === "WARN" ? c.gaugeWarn : c.gaugeOk,
                      transition: "width 0.2s ease",
                    }}
                  />
                )}

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

                <div style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.2, marginTop: 2, color: c.t1 }}>
                  {d.getDate()}
                </div>

                {/* ✅ IMPORTANT: show reserved even when cardsIn=0 */}
                {hasAny ? (
                  <div style={{ marginTop: 6 }}>
                    <div style={{ fontSize: 10, color: c.t2, fontWeight: 600, marginBottom: 3 }}>
                      {mode === "DIKSHA"
                        ? `${used} used`
                        : `${cardsIn} cards`}
                    </div>

                    <div className="flex gap-1 flex-wrap">
                      {hasCards ? (
                        <>
                          <span
                            style={{
                              fontSize: 9,
                              padding: "2px 6px",
                              borderRadius: 999,
                              background: c.maleBg,
                              border: `1px solid ${c.maleBorder}`,
                              color: c.maleText,
                              fontWeight: 700,
                            }}
                          >
                            M{male}
                          </span>
                          <span
                            style={{
                              fontSize: 9,
                              padding: "2px 6px",
                              borderRadius: 999,
                              background: c.femaleBg,
                              border: `1px solid ${c.femaleBorder}`,
                              color: c.femaleText,
                              fontWeight: 700,
                            }}
                          >
                            F{female}
                          </span>
                        </>
                      ) : null}

                      {hasReserved ? (
                        <span
                          style={{
                            fontSize: 9,
                            padding: "2px 6px",
                            borderRadius: 999,
                            background: c.reservedBg,
                            border: `1px solid ${c.reservedBorder}`,
                            color: c.reservedText,
                            fontWeight: 800,
                          }}
                          title="Reserved / occupied holds from meeting"
                        >
                          🔒{reserved}
                        </span>
                      ) : null}
                    </div>

                    {!hasCards && hasReserved ? (
                      <div style={{ marginTop: 4, fontSize: 9, color: c.t4 }}>
                        Reserved only
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div style={{ marginTop: 6, fontSize: 10, color: c.dayEmptyText }}>—</div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

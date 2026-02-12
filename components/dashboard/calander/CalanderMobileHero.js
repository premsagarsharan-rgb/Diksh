// components/dashboard/calander/CalanderMobileHero.js
"use client";

import { useCT, getModeStyle, getGaugeTier } from "./calanderTheme";
import { useTheme } from "@/components/ThemeProvider";

export default function CalanderMobileHero({
  container,
  mode,
  selectedDate,
  todayStr,
  counts,
  reservedCounts,
  historyCount,
  loading,
}) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const c = useCT(isLight);
  const ms = getModeStyle(mode, c);

  const isToday = selectedDate === todayStr;
  const isDiksha = mode === "DIKSHA";
  const limit = container?.limit ?? 20;
  const used = isDiksha ? counts.total + reservedCounts.total : counts.total;
  const remaining = isDiksha ? Math.max(0, limit - used) : null;
  const gauge = isDiksha ? getGaugeTier(remaining, c) : null;

  if (loading) {
    return (
      <div
        className="block md:hidden"
        style={{
          borderRadius: 24,
          border: `1px solid ${c.heroBorder}`,
          background: c.heroBg,
          padding: 20,
          marginBottom: 12,
        }}
      >
        <div className="flex items-center justify-center gap-2 py-6" style={{ color: c.t3 }}>
          <div
            className="animate-spin"
            style={{
              width: 18,
              height: 18,
              borderRadius: "50%",
              border: `2px solid ${c.t4}`,
              borderTopColor: c.acc,
            }}
          />
          <span className="text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  if (!container) {
    return (
      <div
        className="block md:hidden"
        style={{
          borderRadius: 24,
          border: `1px solid ${c.heroBorder}`,
          background: c.heroBg,
          padding: 20,
          marginBottom: 12,
          textAlign: "center",
        }}
      >
        <div style={{ color: c.t3, fontSize: 13, padding: "16px 0" }}>
          Pick a date to see container status
        </div>
      </div>
    );
  }

  return (
    <div className="block md:hidden">
      <div
        style={{
          borderRadius: 24,
          border: `1px solid ${c.heroBorder}`,
          background: c.heroBg,
          boxShadow: isToday ? `0 0 40px ${c.heroGlow}` : "none",
          padding: 0,
          marginBottom: 12,
          overflow: "hidden",
        }}
      >
        {/* ─── Top Strip: Date + Mode ─── */}
        <div
          style={{
            padding: "14px 18px 10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            borderBottom: `1px solid ${c.divider}`,
          }}
        >
          <div className="flex items-center gap-2.5">
            {isToday && (
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: c.dayTodayDot,
                  flexShrink: 0,
                  boxShadow: `0 0 8px ${c.dayTodayGlow}`,
                }}
              />
            )}
            <div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: isToday ? c.dayTodayDot : c.heroLabel,
                }}
              >
                {isToday ? "TODAY" : "SELECTED"}
              </div>
              <div style={{ color: c.heroValue, fontWeight: 700, fontSize: 17, marginTop: 1 }}>
                {selectedDate || "—"}
              </div>
            </div>
          </div>

          <span
            style={{
              background: ms.bg,
              border: `1px solid ${ms.border}`,
              color: ms.text,
              borderRadius: 999,
              padding: "4px 12px",
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            {ms.icon} {mode}
          </span>
        </div>

        {/* ─── Gender Counts Row ─── */}
        <div style={{ padding: "12px 18px", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span
            style={{
              background: c.maleBg,
              border: `1px solid ${c.maleBorder}`,
              color: c.maleText,
              borderRadius: 999,
              padding: "4px 12px",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            👨 {counts.male}
          </span>
          <span
            style={{
              background: c.femaleBg,
              border: `1px solid ${c.femaleBorder}`,
              color: c.femaleText,
              borderRadius: 999,
              padding: "4px 12px",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            👩 {counts.female}
          </span>
          {counts.other > 0 && (
            <span
              style={{
                background: c.otherBg,
                border: `1px solid ${c.otherBorder}`,
                color: c.otherText,
                borderRadius: 999,
                padding: "4px 12px",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              Other {counts.other}
            </span>
          )}
          <span
            style={{
              marginLeft: "auto",
              color: c.t1,
              fontWeight: 800,
              fontSize: 20,
            }}
          >
            {counts.total}
          </span>
        </div>

        {/* ─── Diksha: Capacity Gauge ─── */}
        {isDiksha && gauge && (
          <div style={{ padding: "0 18px 14px" }}>
            <div
              style={{
                borderRadius: 16,
                border: `1px solid ${c.panelBorder}`,
                background: c.panelBg,
                padding: 12,
              }}
            >
              <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
                <div className="flex items-center gap-2">
                  <span style={{ color: c.t3, fontSize: 11 }}>Capacity</span>
                  <span style={{ color: c.t1, fontWeight: 700, fontSize: 14 }}>
                    {used}/{limit}
                  </span>
                </div>
                <span
                  style={{
                    background: gauge.bg,
                    border: `1px solid ${gauge.border}`,
                    color: gauge.text,
                    borderRadius: 999,
                    padding: "2px 10px",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {remaining} left
                </span>
              </div>
              <div
                style={{
                  height: 6,
                  borderRadius: 999,
                  background: c.gaugeTrack,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    borderRadius: 999,
                    background: gauge.bar,
                    width: `${Math.min(100, (used / limit) * 100)}%`,
                    transition: "width 0.3s ease",
                  }}
                />
              </div>

              {/* Reserved info */}
              <div className="flex items-center gap-2 flex-wrap" style={{ marginTop: 8 }}>
                <span
                  style={{
                    background: c.reservedBg,
                    border: `1px solid ${c.reservedBorder}`,
                    color: c.reservedText,
                    borderRadius: 999,
                    padding: "2px 10px",
                    fontSize: 10,
                    fontWeight: 600,
                  }}
                >
                  🔒 Reserved {reservedCounts.total}
                </span>
                <span
                  style={{
                    background: c.panelBg,
                    border: `1px solid ${c.panelBorder}`,
                    color: c.t3,
                    borderRadius: 999,
                    padding: "2px 10px",
                    fontSize: 10,
                  }}
                >
                  IN {counts.total}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ─── Meeting: Quick Stats ─── */}
        {!isDiksha && (
          <div style={{ padding: "0 18px 14px" }}>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                style={{
                  background: c.panelBg,
                  border: `1px solid ${c.panelBorder}`,
                  color: c.t2,
                  borderRadius: 999,
                  padding: "3px 10px",
                  fontSize: 11,
                }}
              >
                Total {counts.total} cards
              </span>
              {historyCount > 0 && (
                <span
                  style={{
                    background: c.historyBg,
                    border: `1px solid ${c.historyBorder}`,
                    color: c.historyText,
                    borderRadius: 999,
                    padding: "3px 10px",
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  ✅ {historyCount} confirmed
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

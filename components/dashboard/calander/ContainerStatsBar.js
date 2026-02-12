// components/dashboard/calander/ContainerStatsBar.js
"use client";

import { useCT, getGaugeTier, getModeStyle } from "./calanderTheme";
import { useTheme } from "@/components/ThemeProvider";

export default function ContainerStatsBar({
  container,
  counts,
  reservedCounts,
  historyCount,
  mode,
  variant = "default", // "default" | "compact"
}) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const c = useCT(isLight);
  const ms = getModeStyle(mode, c);

  const isDiksha = mode === "DIKSHA";
  const limit = container?.limit ?? 20;
  const used = isDiksha ? counts.total + reservedCounts.total : counts.total;
  const remaining = isDiksha ? Math.max(0, limit - used) : null;
  const gauge = isDiksha ? getGaugeTier(remaining, c) : null;

  return (
    <div
      style={{
        borderRadius: 18,
        border: `1px solid ${c.panelBorder}`,
        background: c.panelBg,
        padding: variant === "compact" ? 12 : 14,
        marginBottom: 12,
      }}
    >
      {/* Gender Counts */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            style={{
              background: c.maleBg,
              border: `1px solid ${c.maleBorder}`,
              color: c.maleText,
              borderRadius: 999,
              padding: "4px 12px",
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            👨 Male {counts.male}
          </span>
          <span
            style={{
              background: c.femaleBg,
              border: `1px solid ${c.femaleBorder}`,
              color: c.femaleText,
              borderRadius: 999,
              padding: "4px 12px",
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            👩 Female {counts.female}
          </span>
          {counts.other > 0 && (
            <span
              style={{
                background: c.otherBg,
                border: `1px solid ${c.otherBorder}`,
                color: c.otherText,
                borderRadius: 999,
                padding: "4px 12px",
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              Other {counts.other}
            </span>
          )}
          <span
            style={{
              background: c.surfaceBg,
              border: `1px solid ${c.surfaceBorder}`,
              color: c.t2,
              borderRadius: 999,
              padding: "4px 12px",
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            Total {counts.total}
          </span>
        </div>

        {/* History count (Meeting) */}
        {!isDiksha && historyCount > 0 && (
          <span
            style={{
              background: c.historyBg,
              border: `1px solid ${c.historyBorder}`,
              color: c.historyText,
              borderRadius: 999,
              padding: "4px 12px",
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            ✅ {historyCount} confirmed
          </span>
        )}
      </div>

      {/* Diksha capacity section */}
      {isDiksha && gauge && (
        <div style={{ marginTop: 10 }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
            <div className="flex items-center gap-2">
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
                Reserved {reservedCounts.total}
              </span>
              <span style={{ color: c.t3, fontSize: 10 }}>
                Limit {limit}
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
              height: 5,
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
        </div>
      )}
    </div>
  );
}

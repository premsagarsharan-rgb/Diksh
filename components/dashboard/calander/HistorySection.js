// components/dashboard/calander/HistorySection.js
"use client";

import { useCT, getCardStyle } from "./calanderTheme";
import { useTheme } from "@/components/ThemeProvider";

function safeId(x) {
  if (!x) return "";
  if (typeof x === "string") return x;
  if (typeof x === "object" && x.$oid) return String(x.$oid);
  return String(x);
}

export default function HistorySection({ historyRecords, variant = "default" }) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const c = useCT(isLight);

  if (!historyRecords || historyRecords.length === 0) return null;

  return (
    <div
      style={{
        borderRadius: 20,
        border: `1px solid ${c.historyBorder}`,
        background: c.historyBg,
        padding: variant === "compact" ? 12 : 16,
        marginTop: variant === "compact" ? 12 : 16,
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2" style={{ marginBottom: 12 }}>
        <span style={{ fontSize: 18 }}>✅</span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: c.historyText }}>
            Confirmed History
          </div>
          <div style={{ fontSize: 11, color: c.historyMuted }}>
            {historyRecords.length} customer(s) confirmed from this meeting → Diksha
          </div>
        </div>
      </div>

      {/* Cards */}
      <div
        className={variant === "compact" ? "space-y-2" : "grid sm:grid-cols-2 lg:grid-cols-3 gap-2"}
      >
        {historyRecords.map((h, idx) => {
          const snap = h.customerSnapshot || {};
          const gender = snap.gender;
          const cs = getCardStyle(gender, c);
          const confirmedDate = h.confirmedAt
            ? new Date(h.confirmedAt).toLocaleDateString()
            : "—";

          return (
            <div
              key={safeId(h._id) || idx}
              style={{
                borderRadius: 16,
                border: `1px solid ${cs.border}`,
                background: cs.bg,
                padding: 12,
                opacity: 0.82,
              }}
            >
              {/* Status badges */}
              <div className="flex items-center gap-1.5 flex-wrap" style={{ marginBottom: 6 }}>
                <span
                  style={{
                    fontSize: 9,
                    padding: "2px 7px",
                    borderRadius: 999,
                    background: c.confirmedBg,
                    border: `1px solid ${c.confirmedBorder}`,
                    color: c.confirmedText,
                    fontWeight: 600,
                  }}
                >
                  ✅ CONFIRMED
                </span>
                <span
                  style={{
                    fontSize: 9,
                    padding: "2px 7px",
                    borderRadius: 999,
                    background: gender === "MALE" ? c.maleBg : gender === "FEMALE" ? c.femaleBg : c.panelBg,
                    border: `1px solid ${gender === "MALE" ? c.maleBorder : gender === "FEMALE" ? c.femaleBorder : c.panelBorder}`,
                    color: gender === "MALE" ? c.maleText : gender === "FEMALE" ? c.femaleText : c.t3,
                  }}
                >
                  {gender || "?"}
                </span>
              </div>

              {/* Info */}
              <div className="flex items-center gap-2">
                <span
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    fontWeight: 700,
                    flexShrink: 0,
                    background: cs.seq,
                    color: cs.seqText,
                  }}
                >
                  {idx + 1}
                </span>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 13,
                      color: c.t1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {snap.name || "—"}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: c.t3,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {snap.address || "—"}
                  </div>
                </div>
              </div>

              {/* Kind badge */}
              <div className="flex items-center gap-1 flex-wrap" style={{ marginTop: 6, marginLeft: 32 }}>
                <span
                  style={{
                    fontSize: 9,
                    padding: "2px 7px",
                    borderRadius: 999,
                    background: c.kindBg,
                    border: `1px solid ${c.kindBorder}`,
                    color: c.kindText,
                  }}
                >
                  {h.kind || "SINGLE"}
                </span>
                {h.occupiedDate && (
                  <span
                    style={{
                      fontSize: 9,
                      padding: "2px 7px",
                      borderRadius: 999,
                      background: c.dikshaBg,
                      border: `1px solid ${c.dikshaBorder}`,
                      color: c.dikshaText,
                    }}
                  >
                    🔱 Diksha: {h.occupiedDate}
                  </span>
                )}
              </div>

              {/* Footer */}
              <div
                style={{
                  marginTop: 6,
                  marginLeft: 32,
                  fontSize: 10,
                  color: c.t4,
                }}
              >
                {confirmedDate} • {h.confirmedByLabel || "—"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

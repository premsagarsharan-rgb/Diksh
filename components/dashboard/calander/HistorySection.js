// components/dashboard/calander/HistorySection.js
"use client";

import { useMemo } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { useCT } from "./calanderTheme";

function safeId(x) {
  if (!x) return "";
  if (typeof x === "string") return x;
  if (typeof x === "object" && x.$oid) return String(x.$oid);
  return String(x);
}

function formatDateTime(d) {
  try {
    const dt = new Date(d);
    if (!Number.isFinite(dt.getTime())) return "—";
    return dt.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function genderTone(gender, c) {
  if (gender === "MALE") return { bg: c.maleBg, border: c.maleBorder, text: c.maleText, label: "MALE" };
  if (gender === "FEMALE") return { bg: c.femaleBg, border: c.femaleBorder, text: c.femaleText, label: "FEMALE" };
  return { bg: c.kindBg, border: c.kindBorder, text: c.kindText, label: gender || "OTHER" };
}

function statusTone(status, c) {
  const s = String(status || "").toUpperCase();
  if (s.includes("BYPASS")) {
    return {
      bg: c.bypassBadgeBg,
      border: c.bypassBadgeBorder,
      text: c.bypassBadgeText,
      label: "⚡ BYPASS",
    };
  }
  return {
    bg: c.historyBg,
    border: c.historyBorder,
    text: c.historyText,
    label: "✅ CONFIRMED",
  };
}

// 🖨️ Simple client-side print generator for history
function handlePrintHistory(records) {
  const win = window.open("", "_blank");
  if (!win) return alert("Popup blocked. Allow popups to print.");

  const rows = records.map((r, i) => {
    const snap = r.customerSnapshot || {};
    const confirmedAt = r.confirmedAt ? new Date(r.confirmedAt).toLocaleString() : "—";
    const status = String(r.status || "").includes("BYPASS") ? "⚡ BYPASS" : "✅ CONFIRMED";
    return `
      <tr style="border-bottom: 1px solid #ddd;">
        <td style="padding: 8px;">${i + 1}</td>
        <td style="padding: 8px;"><b>${snap.name || "—"}</b><br/><small>${snap.address || "—"}</small></td>
        <td style="padding: 8px;">${snap.gender || "—"}</td>
        <td style="padding: 8px;">${r.kind || "SINGLE"}</td>
        <td style="padding: 8px;">${r.occupiedDate ? `🔱 ${r.occupiedDate}` : "—"}</td>
        <td style="padding: 8px;">${status}</td>
        <td style="padding: 8px; font-size: 11px;">${confirmedAt}<br/>by ${r.confirmedByLabel || "—"}</td>
      </tr>
    `;
  }).join("");

  const html = `
    <html>
      <head>
        <title>Meeting History Print</title>
        <style>
          body { font-family: sans-serif; font-size: 12px; padding: 20px; }
          table { width: 100%; border-collapse: collapse; text-align: left; }
          th { border-bottom: 2px solid #000; padding: 8px; font-weight: bold; }
          h2 { margin-bottom: 4px; }
          .meta { font-size: 11px; color: #666; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <h2>Meeting History Record</h2>
        <div class="meta">Generated: ${new Date().toLocaleString()} • Total Records: ${records.length}</div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Customer</th>
              <th>Gender</th>
              <th>Kind</th>
              <th>Diksha Date</th>
              <th>Status</th>
              <th>Confirmed Info</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
        <script>
          window.onload = () => { window.print(); }
        </script>
      </body>
    </html>
  `;

  win.document.write(html);
  win.document.close();
}

export default function HistorySection({ records = [] }) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const c = useCT(isLight);

  const items = Array.isArray(records) ? records : [];

  const stats = useMemo(() => {
    let confirmed = 0;
    let bypass = 0;
    for (const r of items) {
      const s = String(r?.status || "").toUpperCase();
      if (s.includes("BYPASS")) bypass++;
      else confirmed++;
    }
    return { confirmed, bypass, total: items.length };
  }, [items]);

  if (!items.length) {
    return (
      <div
        style={{
          borderRadius: 18,
          border: `1px solid ${c.panelBorder}`,
          background: c.panelBg,
          padding: 16,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 26, marginBottom: 6 }}>✅</div>
        <div style={{ color: c.t2, fontWeight: 700, fontSize: 14 }}>No History</div>
        <div style={{ color: c.t3, fontSize: 12, marginTop: 4 }}>
          Is meeting date se abhi koi card confirm/bypass nahi hua.
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        borderRadius: 20,
        border: `1px solid ${c.historyBorder}`,
        background: c.historyBg,
        padding: 14,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Premium blueprint grid background (static) */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(to right, rgba(16,185,129,0.12) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(16,185,129,0.12) 1px, transparent 1px)
          `,
          backgroundSize: "18px 18px",
          opacity: isLight ? 0.35 : 0.25,
          pointerEvents: "none",
        }}
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-3" style={{ position: "relative" }}>
        <div>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 18 }}>✅</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: c.historyText }}>
                Meeting History
              </div>
              <div style={{ fontSize: 11, color: c.historyMuted, marginTop: 2 }}>
                Confirm / Bypass cards ka record (future auditing ke liye)
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5" style={{ marginTop: 10 }}>
            <span
              style={{
                fontSize: 11,
                padding: "3px 10px",
                borderRadius: 999,
                background: c.panelBg,
                border: `1px solid ${c.panelBorder}`,
                color: c.t2,
                fontWeight: 700,
              }}
            >
              Total {stats.total}
            </span>
            <span
              style={{
                fontSize: 11,
                padding: "3px 10px",
                borderRadius: 999,
                background: c.historyBg,
                border: `1px solid ${c.historyBorder}`,
                color: c.historyText,
                fontWeight: 700,
              }}
            >
              ✅ Confirmed {stats.confirmed}
            </span>
            {stats.bypass > 0 ? (
              <span
                style={{
                  fontSize: 11,
                  padding: "3px 10px",
                  borderRadius: 999,
                  background: c.bypassBadgeBg,
                  border: `1px solid ${c.bypassBadgeBorder}`,
                  color: c.bypassBadgeText,
                  fontWeight: 800,
                }}
              >
                ⚡ Bypass {stats.bypass}
              </span>
            ) : null}
          </div>
        </div>

        {/* 🖨️ Print Button */}
        <button
          type="button"
          onClick={() => handlePrintHistory(items)}
          style={{
            fontSize: 13,
            fontWeight: 700,
            padding: "8px 14px",
            borderRadius: 14,
            background: c.btnGhostBg,
            border: `1px solid ${c.btnGhostBorder}`,
            color: c.btnGhostText,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = c.btnGhostHover;
            e.currentTarget.style.transform = "scale(1.02)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = c.btnGhostBg;
            e.currentTarget.style.transform = "";
          }}
        >
          <span>🖨</span> Print History
        </button>
      </div>

      {/* Cards */}
      <div
        className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2"
        style={{ marginTop: 12, position: "relative" }}
      >
        {items.map((h, idx) => {
          const snap = h?.customerSnapshot || {};
          const gender = snap?.gender || "OTHER";
          const gt = genderTone(gender, c);
          const st = statusTone(h?.status, c);
          const confirmedAt = h?.confirmedAt || h?.createdAt;
          const confirmedLabel = h?.confirmedByLabel || "—";

          return (
            <div
              key={safeId(h?._id) || `${idx}`}
              style={{
                borderRadius: 18,
                border: `1px solid ${c.panelBorder}`,
                background: c.panelBg,
                padding: 12,
                transition: "transform 0.12s ease, opacity 0.12s ease",
              }}
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 999,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 900,
                      background: c.surfaceBg,
                      border: `1px solid ${c.surfaceBorder}`,
                      color: c.t2,
                      flexShrink: 0,
                    }}
                  >
                    {idx + 1}
                  </span>

                  <div className="min-w-0">
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 800,
                        color: c.t1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {snap?.name || "—"}
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
                      {snap?.address || "—"}
                    </div>
                  </div>
                </div>

                <span
                  style={{
                    fontSize: 10,
                    padding: "2px 10px",
                    borderRadius: 999,
                    background: st.bg,
                    border: `1px solid ${st.border}`,
                    color: st.text,
                    fontWeight: 900,
                    flexShrink: 0,
                  }}
                >
                  {st.label}
                </span>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-1.5" style={{ marginTop: 10 }}>
                <span
                  style={{
                    fontSize: 10,
                    padding: "2px 10px",
                    borderRadius: 999,
                    background: gt.bg,
                    border: `1px solid ${gt.border}`,
                    color: gt.text,
                    fontWeight: 800,
                  }}
                >
                  {gt.label}
                </span>

                <span
                  style={{
                    fontSize: 10,
                    padding: "2px 10px",
                    borderRadius: 999,
                    background: c.kindBg,
                    border: `1px solid ${c.kindBorder}`,
                    color: c.kindText,
                    fontWeight: 800,
                  }}
                >
                  {h?.kind || "SINGLE"}
                </span>

                {h?.roleInPair ? (
                  <span
                    style={{
                      fontSize: 10,
                      padding: "2px 10px",
                      borderRadius: 999,
                      background: c.kindBg,
                      border: `1px solid ${c.kindBorder}`,
                      color: c.kindText,
                      fontWeight: 800,
                    }}
                  >
                    Role {h.roleInPair}
                  </span>
                ) : null}

                {h?.occupiedDate ? (
                  <span
                    style={{
                      fontSize: 10,
                      padding: "2px 10px",
                      borderRadius: 999,
                      background: c.dikshaBg,
                      border: `1px solid ${c.dikshaBorder}`,
                      color: c.dikshaText,
                      fontWeight: 900,
                    }}
                  >
                    🔱 {h.occupiedDate}
                  </span>
                ) : null}

                {snap?.rollNo ? (
                  <span
                    style={{
                      fontSize: 10,
                      padding: "2px 10px",
                      borderRadius: 999,
                      background: c.surfaceBg,
                      border: `1px solid ${c.surfaceBorder}`,
                      color: c.t2,
                      fontWeight: 900,
                    }}
                  >
                    Roll {snap.rollNo}
                  </span>
                ) : null}
              </div>

              {/* Footer */}
              <div style={{ marginTop: 10, borderTop: `1px solid ${c.divider}`, paddingTop: 8 }}>
                <div style={{ fontSize: 10, color: c.t4 }}>
                  Confirmed: <b style={{ color: c.t2 }}>{formatDateTime(confirmedAt)}</b>
                </div>
                <div style={{ fontSize: 10, color: c.t4, marginTop: 2 }}>
                  By: <b style={{ color: c.t2 }}>{confirmedLabel}</b>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

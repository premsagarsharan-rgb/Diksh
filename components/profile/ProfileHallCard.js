// components/profile/ProfileHallCard.js
"use client";

import { getGenderGradient } from "./profileTheme";

export default function ProfileHallCard({ customer, form, source, sequenceNo, c, isLight, onPrint, onOpenPrintModal }) {
  const gender = customer?.gender || "OTHER";
  const headerGrad = getGenderGradient(gender, isLight);
  const rollNo = customer?.rollNo || customer?.roll || sequenceNo;

  const initials = String(customer?.name || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className="rounded-2xl border overflow-hidden transition-all duration-200"
      style={{ background: c.panelBg, borderColor: c.panelBorder }}
    >
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${c.divider}` }}>
        <div className="text-[13px] font-bold" style={{ color: c.t1 }}>🪪 Hall Card</div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onOpenPrintModal}
            className="px-3 py-1.5 rounded-xl text-[11px] font-semibold border transition-all duration-200"
            style={{ background: c.btnGhostBg, borderColor: c.btnGhostBorder, color: c.btnGhostText }}
          >
            🖨️ Print
          </button>
        </div>
      </div>

      {/* Mini card preview */}
      <div className="p-4">
        <div
          className="rounded-2xl overflow-hidden border"
          style={{
            borderColor: c.hallBorder,
            boxShadow: c.cardShadow,
            maxWidth: 340,
            margin: "0 auto",
          }}
        >
          {/* Card header strip */}
          <div
            className="px-4 py-3 flex items-center gap-3"
            style={{ background: headerGrad }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black"
              style={{
                background: isLight ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.35)",
                color: isLight ? "#0f172a" : "#ffffff",
              }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div
                className="text-sm font-bold truncate"
                style={{ color: isLight ? "#0f172a" : "#ffffff" }}
              >
                {customer?.name || "—"}
              </div>
              <div
                className="text-[10px]"
                style={{ color: isLight ? "rgba(15,23,42,0.60)" : "rgba(255,255,255,0.65)" }}
              >
                {customer?.city || "—"} • Age {customer?.age || "—"}
              </div>
            </div>
          </div>

          {/* Card body */}
          <div className="p-4 space-y-2" style={{ background: c.hallBg }}>
            {/* Roll number */}
            <div className="text-center">
              <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color: c.t3 }}>
                Roll Number
              </div>
              <div
                className="text-3xl font-black mt-1 font-mono tracking-wider"
                style={{ color: c.hallAccent }}
              >
                {rollNo || "—"}
              </div>
            </div>

            {/* Sequence */}
            {sequenceNo && (
              <div
                className="text-center rounded-xl py-2 mt-2"
                style={{ background: c.hallStripBg }}
              >
                <div className="text-[9px] font-bold uppercase tracking-wider" style={{ color: c.t3 }}>
                  Sequence
                </div>
                <div className="text-lg font-black" style={{ color: c.hallAccent }}>
                  #{sequenceNo}
                </div>
              </div>
            )}

            {/* Info rows */}
            <div className="space-y-1 mt-3">
              <MiniRow label="Guardian" value={form?.guardianRelation ? `${form.guardianRelation} • ${form.guardianName || "-"}` : "—"} c={c} />
              <MiniRow label="Phone" value={form?.phoneNumber ? `${form.phoneCountryCode || ""} ${form.phoneNumber}` : "—"} c={c} />
              <MiniRow label="ID" value={form?.idValue ? `${(form.idType || "").toUpperCase()} • ${form.idValue}` : "—"} c={c} />
            </div>
          </div>

          {/* Card footer */}
          <div
            className="px-4 py-2 text-center text-[9px] font-semibold uppercase tracking-widest"
            style={{
              background: c.glassBg,
              borderTop: `1px solid ${c.divider}`,
              color: c.t4,
            }}
          >
            ⚡ Sysbyte WebApp
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniRow({ label, value, c }) {
  return (
    <div className="flex items-center justify-between text-[11px]">
      <span style={{ color: c.t3 }}>{label}</span>
      <span className="font-semibold truncate max-w-[60%] text-right" style={{ color: c.t1 }}>{value}</span>
    </div>
  );
}

// components/profile/ProfileActionsPanel.js
"use client";

import { useEffect, useState } from "react";

const MODE_DISPLAY = {
  MEETING: { emoji: "📋", label: "Meeting", desc: "Sitting → Meeting container" },
  DIKSHA: { emoji: "🔱", label: "Diksha", desc: "Pending → Diksha container" },
};

export default function ProfileActionsPanel({
  source, c, busy,
  mode,
  onOpenCalendarPicker,
  forcedMode,
}) {
  const activeMode = forcedMode || mode || "MEETING";
  const modeInfo = MODE_DISPLAY[activeMode] || MODE_DISPLAY.MEETING;

  /* ── Entrance animation ── */
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    setEntered(false);
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      className="rounded-2xl border p-4 will-change-transform"
      style={{
        background: c.panelBg,
        borderColor: c.panelBorder,
        transform: entered ? "translateY(0) scale(1)" : "translateY(8px) scale(0.98)",
        opacity: entered ? 1 : 0,
        transition: "transform 0.4s cubic-bezier(0.22,1,0.36,1), opacity 0.35s ease-out",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">⚡</span>
        <div className="text-[13px] font-bold" style={{ color: c.t1 }}>Actions</div>
      </div>

      {/* Locked Mode Badge */}
      <div
        className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl border"
        style={{
          background: `${c.acc}10`,
          borderColor: `${c.acc}25`,
        }}
      >
        <span className="text-base">{modeInfo.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="text-[12px] font-bold" style={{ color: c.t1 }}>
            {modeInfo.label} Mode
          </div>
          <div className="text-[10px]" style={{ color: c.t3 }}>
            {modeInfo.desc}
          </div>
        </div>
        {forcedMode && (
          <span
            className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
            style={{
              background: c.badgeBg,
              border: `1px solid ${c.badgeBorder}`,
              color: c.t3,
            }}
          >
            Locked
          </span>
        )}
      </div>

      {/* Action card — Opens full Calendar */}
      <ActionCard
        icon="📅"
        title="Approve For Container"
        description={
          source === "PENDING"
            ? "Open Diksha Calendar → Pick date → Assign"
            : "Open Meeting Calendar → Pick date → Assign"
        }
        onClick={() => onOpenCalendarPicker?.()}
        c={c}
      />
    </div>
  );
}

/* ── ActionCard ── */
function ActionCard({ icon, title, description, onClick, c }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl border p-3.5 text-left transition-all duration-200 will-change-transform"
      style={{
        background: hovered ? c.panelHover : c.glassBg,
        borderColor: c.panelBorder,
        transform: hovered ? "scale(1.005)" : "scale(1)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
          style={{ background: c.badgeBg }}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-bold" style={{ color: c.t1 }}>{title}</div>
          <div className="text-[11px] mt-0.5" style={{ color: c.t3 }}>{description}</div>
        </div>
        <span className="text-sm" style={{ color: c.t3 }}>›</span>
      </div>
    </button>
  );
}

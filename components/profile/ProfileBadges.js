// components/profile/ProfileBadges.js
"use client";

import { getStatusConfig } from "./profileTheme";

export function GenderBadge({ gender, c }) {
  const config = {
    MALE: { emoji: "👨", label: "Male", bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.25)", text: c.t1 },
    FEMALE: { emoji: "👩", label: "Female", bg: "rgba(236,72,153,0.12)", border: "rgba(236,72,153,0.25)", text: c.t1 },
    OTHER: { emoji: "⚧", label: "Other", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.25)", text: c.t1 },
  };
  const g = config[gender] || config.OTHER;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
      style={{ background: g.bg, border: `1px solid ${g.border}`, color: g.text }}
    >
      {g.emoji} {g.label}
    </span>
  );
}

export function StatusBadge({ source, cardStatus, c }) {
  const s = getStatusConfig(source, cardStatus, c);
  const label = cardStatus === "QUALIFIED" ? "QUALIFIED" : source;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
      style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.text }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: s.dot, animation: "badgePulse 2s ease-in-out infinite" }}
      />
      {label}
    </span>
  );
}

export function SourceBadge({ source, c }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider"
      style={{ background: c.badgeBg, border: `1px solid ${c.badgeBorder}`, color: c.badgeText }}
    >
      📂 {source}
    </span>
  );
}

export function BoolChip({ label, value, c }) {
  const yes = Boolean(value);
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold"
      style={{
        background: yes ? c.chipYesBg : c.chipNoBg,
        border: `1px solid ${yes ? c.chipYesBorder : c.chipNoBorder}`,
        color: yes ? c.chipYesText : c.chipNoText,
      }}
    >
      {yes ? "✓" : "✗"} {label}
    </span>
  );
}

export function InfoChip({ emoji, label, c }) {
  if (!label || label === "-" || label === "undefined") return null;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium"
      style={{ background: c.chipBg, border: `1px solid ${c.chipBorder}`, color: c.chipText }}
    >
      {emoji} {label}
    </span>
  );
}

export function EligibleBadge({ eligible, c }) {
  if (!eligible) return null;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
      style={{ background: c.statusEligible.bg, border: `1px solid ${c.statusEligible.border}`, color: c.statusEligible.text }}
    >
      🔱 Diksha Eligible
    </span>
  );
}

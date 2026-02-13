// components/profile/ProfileHeader.js
"use client";

import { useEffect, useRef, useState } from "react";
import { getGenderGradient } from "./profileTheme";
import { GenderBadge, StatusBadge, SourceBadge, BoolChip, InfoChip, EligibleBadge } from "./ProfileBadges";

/* ─── GPU-only animation helpers (transform + opacity only → 80-90 FPS) ─── */
const ANIM_STAGGER_BASE = 60; // ms between staggered items

export default function ProfileHeader({ customer, source, c, isLight, isApproveForShift, sequenceNo }) {
  const gender = customer?.gender || "OTHER";
  const headerGrad = getGenderGradient(gender, isLight);

  const rollNo = customer?.rollNo || customer?.roll || sequenceNo;
  const city = customer?.city || "";
  const occupation = customer?.occupation || "";
  const age = customer?.age || "";
  const marital = customer?.maritalStatus || "";
  const approver = customer?.approver || "";
  const dikshaEligible = customer?.dikshaEligible;
  const cardStatus = customer?.cardStatus;
  const vrindavanVisits = customer?.vrindavanVisits;

  const initials = String(customer?.name || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // ── Entrance animation state (GPU-only: transform + opacity) ──
  const [entered, setEntered] = useState(false);
  const [chipsEntered, setChipsEntered] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    setEntered(false);
    setChipsEntered(false);
    // Trigger entrance after mount
    const t1 = requestAnimationFrame(() => setEntered(true));
    timerRef.current = setTimeout(() => setChipsEntered(true), 250);
    return () => {
      cancelAnimationFrame(t1);
      clearTimeout(timerRef.current);
    };
  }, [customer?._id]);

  // ── Collect info chips data ──
  const infoChips = [];
  if (occupation) infoChips.push({ emoji: "💼", label: occupation });
  if (marital) infoChips.push({ emoji: "💍", label: marital });
  if (approver) infoChips.push({ emoji: "🙏", label: approver });
  if (vrindavanVisits) infoChips.push({ emoji: "🛕", label: `${vrindavanVisits}x Vrindavan` });

  const boolChips = [
    { label: "🧅", value: customer?.onionGarlic },
    { label: "🐾", value: customer?.hasPet },
    { label: "👨‍🏫", value: customer?.hadTeacherBefore },
    { label: "🚬", value: customer?.nasha },
  ];
  if (customer?.familyPermission) boolChips.push({ label: "👨‍👩‍👧 Family", value: true });

  // ── Eligible/Qualified glow ──
  const glowColor = cardStatus === "QUALIFIED"
    ? c.headerQualifiedGlow
    : dikshaEligible
    ? c.headerEligibleGlow
    : null;

  return (
    <div
      className="overflow-hidden will-change-transform"
      style={{
        borderRadius: 24,
        transform: entered ? "translateY(0) scale(1)" : "translateY(12px) scale(0.98)",
        opacity: entered ? 1 : 0,
        transition: "transform 0.4s cubic-bezier(0.22,1,0.36,1), opacity 0.35s ease-out",
      }}
    >
      {/* ═══ Gender gradient header strip ═══ */}
      <div
        className="relative px-5 pt-5 pb-4 overflow-hidden"
        style={{ background: headerGrad }}
      >
        {/* Subtle radial overlay (static, no animation — no FPS cost) */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: c.headerOverlay }}
        />

        {/* Optional glow for eligible/qualified */}
        {glowColor && (
          <div
            className="absolute -top-8 -right-8 w-32 h-32 rounded-full pointer-events-none"
            style={{
              background: glowColor,
              filter: "blur(30px)",
              opacity: entered ? 0.8 : 0,
              transition: "opacity 0.6s ease-out",
              willChange: "opacity",
            }}
          />
        )}

        <div className="relative z-[1] flex items-start gap-4">
          {/* ── Avatar ── */}
          <div
            className="shrink-0 will-change-transform"
            style={{
              transform: entered ? "scale(1) rotate(0deg)" : "scale(0.5) rotate(-8deg)",
              opacity: entered ? 1 : 0,
              transition: "transform 0.5s cubic-bezier(0.22,1,0.36,1), opacity 0.4s ease-out",
              transitionDelay: "0.08s",
            }}
          >
            <div
              className="w-14 h-14 max-md:w-12 max-md:h-12 rounded-2xl flex items-center justify-center text-lg max-md:text-base font-black"
              style={{
                background: c.headerAvatarBg,
                color: c.headerAvatarText,
                boxShadow: `0 4px 20px rgba(0,0,0,0.15), 0 0 0 2px ${c.headerAvatarRing}`,
              }}
            >
              {initials}
            </div>
          </div>

          {/* ── Name + meta ── */}
          <div
            className="flex-1 min-w-0 will-change-transform"
            style={{
              transform: entered ? "translateX(0)" : "translateX(16px)",
              opacity: entered ? 1 : 0,
              transition: "transform 0.45s cubic-bezier(0.22,1,0.36,1), opacity 0.35s ease-out",
              transitionDelay: "0.12s",
            }}
          >
            <div
              className="text-xl max-md:text-lg font-black truncate leading-tight"
              style={{ color: c.headerNameColor }}
            >
              {customer?.name || "—"}
            </div>

            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {age && (
                <span
                  className="text-[12px] font-semibold"
                  style={{ color: c.headerMetaColor }}
                >
                  Age {age}
                </span>
              )}
              {city && (
                <span
                  className="text-[12px] flex items-center gap-0.5"
                  style={{ color: c.headerMetaDim }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.7 }}>
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="currentColor" />
                    <circle cx="12" cy="9" r="2.5" fill={isLight ? "#fff" : "#000"} />
                  </svg>
                  {city}
                </span>
              )}
              {rollNo && (
                <span
                  className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-lg"
                  style={{
                    background: c.headerRollBg,
                    color: c.headerRollText,
                  }}
                >
                  #{rollNo}
                </span>
              )}
            </div>

            {/* ── Badges row ── */}
            <div
              className="flex items-center gap-1.5 mt-2.5 flex-wrap will-change-transform"
              style={{
                transform: entered ? "translateY(0)" : "translateY(6px)",
                opacity: entered ? 1 : 0,
                transition: "transform 0.4s cubic-bezier(0.22,1,0.36,1), opacity 0.3s ease-out",
                transitionDelay: "0.2s",
              }}
            >
              <GenderBadge gender={gender} c={c} />
              <StatusBadge source={source} cardStatus={cardStatus} c={c} />
              {isApproveForShift && <SourceBadge source="SHIFT" c={c} />}
              <EligibleBadge eligible={dikshaEligible} c={c} />
            </div>
          </div>
        </div>

        {/* ── Source indicator (top-right) ── */}
        <div
          className="absolute top-3 right-3 will-change-transform"
          style={{
            transform: entered ? "translateX(0) scale(1)" : "translateX(10px) scale(0.8)",
            opacity: entered ? 1 : 0,
            transition: "transform 0.35s cubic-bezier(0.22,1,0.36,1), opacity 0.3s ease-out",
            transitionDelay: "0.25s",
          }}
        >
          <span
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[9px] font-bold uppercase tracking-wider"
            style={{
              background: c.headerSourceBg,
              border: `1px solid ${c.headerSourceBorder}`,
              color: c.headerSourceText,
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
          >
            {source === "TODAY" && "📝 Recent"}
            {source === "SITTING" && "💺 Sitting"}
            {source === "PENDING" && "⏳ Pending"}
            {source === "CALENDAR" && "📅 Calendar"}
          </span>
        </div>
      </div>

      {/* ═══ Quick info chips bar ═══ */}
      <div
        className="px-5 py-3 overflow-hidden"
        style={{
          background: c.headerChipBarBg,
          borderTop: `1px solid ${c.headerChipBarBorder}`,
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <div
          className="flex items-center gap-1.5 flex-wrap"
          style={{
            transform: chipsEntered ? "translateY(0)" : "translateY(8px)",
            opacity: chipsEntered ? 1 : 0,
            transition: "transform 0.4s cubic-bezier(0.22,1,0.36,1), opacity 0.35s ease-out",
          }}
        >
          {infoChips.map((chip, i) => (
            <span
              key={chip.label}
              style={{
                transitionDelay: `${i * ANIM_STAGGER_BASE}ms`,
                transform: chipsEntered ? "translateY(0) scale(1)" : "translateY(4px) scale(0.9)",
                opacity: chipsEntered ? 1 : 0,
                transition: "transform 0.3s cubic-bezier(0.22,1,0.36,1), opacity 0.25s ease-out",
              }}
            >
              <InfoChip emoji={chip.emoji} label={chip.label} c={c} />
            </span>
          ))}

          {boolChips.map((chip, i) => (
            <span
              key={chip.label}
              style={{
                transitionDelay: `${(infoChips.length + i) * ANIM_STAGGER_BASE}ms`,
                transform: chipsEntered ? "translateY(0) scale(1)" : "translateY(4px) scale(0.9)",
                opacity: chipsEntered ? 1 : 0,
                transition: "transform 0.3s cubic-bezier(0.22,1,0.36,1), opacity 0.25s ease-out",
              }}
            >
              <BoolChip label={chip.label} value={chip.value} c={c} />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

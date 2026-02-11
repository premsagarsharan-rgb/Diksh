// components/profile/ProfileHeader.js
"use client";

import { getGenderGradient } from "./profileTheme";
import { GenderBadge, StatusBadge, SourceBadge, BoolChip, InfoChip, EligibleBadge } from "./ProfileBadges";

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

  return (
    <div className="overflow-hidden" style={{ borderRadius: 24 }}>
      {/* Gender gradient header strip */}
      <div
        className="relative px-5 pt-5 pb-4"
        style={{ background: headerGrad }}
      >
        {/* Subtle pattern overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle at 80% 20%, rgba(255,255,255,0.08), transparent 50%)",
          }}
        />

        <div className="relative z-[1] flex items-start gap-4">
          {/* Avatar */}
          <div
            className="shrink-0 w-14 h-14 max-md:w-12 max-md:h-12 rounded-2xl flex items-center justify-center text-lg max-md:text-base font-black shadow-lg"
            style={{
              background: isLight ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.35)",
              color: isLight ? "#0f172a" : "#ffffff",
              backdropFilter: "blur(10px)",
            }}
          >
            {initials}
          </div>

          {/* Name + meta */}
          <div className="flex-1 min-w-0">
            <div
              className="text-xl max-md:text-lg font-black truncate leading-tight"
              style={{ color: isLight ? "#0f172a" : "#ffffff" }}
            >
              {customer?.name || "—"}
            </div>

            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {age && (
                <span
                  className="text-[12px] font-semibold"
                  style={{ color: isLight ? "rgba(15,23,42,0.60)" : "rgba(255,255,255,0.70)" }}
                >
                  Age {age}
                </span>
              )}
              {city && (
                <span
                  className="text-[12px]"
                  style={{ color: isLight ? "rgba(15,23,42,0.45)" : "rgba(255,255,255,0.50)" }}
                >
                  📍 {city}
                </span>
              )}
              {rollNo && (
                <span
                  className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-lg"
                  style={{
                    background: isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.12)",
                    color: isLight ? "#0f172a" : "#ffffff",
                  }}
                >
                  #{rollNo}
                </span>
              )}
            </div>

            {/* Badges row */}
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <GenderBadge gender={gender} c={c} />
              <StatusBadge source={source} cardStatus={cardStatus} c={c} />
              {isApproveForShift && <SourceBadge source="SHIFT" c={c} />}
              <EligibleBadge eligible={dikshaEligible} c={c} />
            </div>
          </div>
        </div>
      </div>

      {/* Quick info chips bar */}
      <div
        className="px-5 py-3 flex items-center gap-1.5 flex-wrap overflow-x-auto"
        style={{
          background: c.glassBg,
          borderTop: `1px solid ${c.divider}`,
        }}
      >
        <InfoChip emoji="💼" label={occupation} c={c} />
        <InfoChip emoji="💍" label={marital} c={c} />
        <InfoChip emoji="🙏" label={approver} c={c} />
        {vrindavanVisits && <InfoChip emoji="🛕" label={`${vrindavanVisits}x Vrindavan`} c={c} />}
        <BoolChip label="🧅" value={customer?.onionGarlic} c={c} />
        <BoolChip label="🐾" value={customer?.hasPet} c={c} />
        <BoolChip label="👨‍🏫" value={customer?.hadTeacherBefore} c={c} />
        <BoolChip label="🚬" value={customer?.nasha} c={c} />
        {customer?.familyPermission && <BoolChip label="👨‍👩‍👧 Family" value={true} c={c} />}
      </div>
    </div>
  );
}

// components/profile/profileTheme.js

export const PT = {
  dark: {
    // Page / Card
    cardBg: "rgba(12,12,28,0.60)",
    cardBorder: "rgba(255,255,255,0.06)",
    cardShadow: "0 0 60px rgba(99,102,241,0.08)",
    panelBg: "rgba(255,255,255,0.04)",
    panelBorder: "rgba(255,255,255,0.06)",
    panelHover: "rgba(255,255,255,0.07)",
    glassBg: "rgba(255,255,255,0.03)",

    // Text
    t1: "#ffffff",
    t2: "rgba(255,255,255,0.62)",
    t3: "rgba(255,255,255,0.38)",
    t4: "rgba(255,255,255,0.22)",

    // Labels
    labelColor: "rgba(255,255,255,0.55)",
    requiredStar: "#f87171",
    sectionLabel: "rgba(255,255,255,0.40)",
    sectionLine: "rgba(255,255,255,0.06)",

    // Inputs
    inputBg: "rgba(255,255,255,0.05)",
    inputBorder: "rgba(255,255,255,0.08)",
    inputBorderFocus: "rgba(99,102,241,0.50)",
    inputText: "#ffffff",
    inputPlaceholder: "rgba(255,255,255,0.30)",
    inputFocusRing: "rgba(99,102,241,0.25)",
    inputDisabledBg: "rgba(255,255,255,0.02)",
    inputDisabledText: "rgba(255,255,255,0.30)",

    // Buttons
    btnSolidBg: "#ffffff",
    btnSolidText: "#000000",
    btnGhostBg: "rgba(255,255,255,0.06)",
    btnGhostBorder: "rgba(255,255,255,0.08)",
    btnGhostHover: "rgba(255,255,255,0.10)",
    btnGhostText: "#ffffff",
    btnDangerBg: "rgba(239,68,68,0.10)",
    btnDangerBorder: "rgba(239,68,68,0.20)",
    btnDangerText: "#f87171",

    // Accent
    acc: "#818cf8",
    acc2: "#a78bfa",
    accG: "linear-gradient(135deg,#6366f1,#818cf8)",

    // Badges
    badgeBg: "rgba(255,255,255,0.06)",
    badgeBorder: "rgba(255,255,255,0.08)",
    badgeText: "rgba(255,255,255,0.70)",

    // Gender header gradients
    genderMale: "linear-gradient(135deg, #1e1b4b, #312e81, #3730a3)",
    genderFemale: "linear-gradient(135deg, #831843, #9d174d, #be185d)",
    genderOther: "linear-gradient(135deg, #064e3b, #065f46, #047857)",

    // Header UIX tokens
    headerGlow: "rgba(99,102,241,0.15)",
    headerOverlay: "radial-gradient(ellipse at 70% 20%, rgba(255,255,255,0.10), transparent 60%)",
    headerAvatarBg: "rgba(0,0,0,0.40)",
    headerAvatarRing: "rgba(255,255,255,0.15)",
    headerAvatarText: "#ffffff",
    headerNameColor: "#ffffff",
    headerMetaColor: "rgba(255,255,255,0.70)",
    headerMetaDim: "rgba(255,255,255,0.50)",
    headerRollBg: "rgba(255,255,255,0.12)",
    headerRollText: "#ffffff",
    headerChipBarBg: "rgba(0,0,0,0.20)",
    headerChipBarBorder: "rgba(255,255,255,0.06)",
    headerSourceBg: "rgba(255,255,255,0.08)",
    headerSourceBorder: "rgba(255,255,255,0.12)",
    headerSourceText: "rgba(255,255,255,0.80)",
    headerEligibleGlow: "rgba(6,182,212,0.30)",
    headerQualifiedGlow: "rgba(168,85,247,0.30)",

    // Status colors
    statusActive: { bg: "rgba(34,197,94,0.12)", border: "rgba(34,197,94,0.25)", text: "#4ade80", dot: "#22c55e" },
    statusPending: { bg: "rgba(251,191,36,0.12)", border: "rgba(251,191,36,0.25)", text: "#fbbf24", dot: "#f59e0b" },
    statusToday: { bg: "rgba(99,102,241,0.12)", border: "rgba(99,102,241,0.25)", text: "#818cf8", dot: "#6366f1" },
    statusEligible: { bg: "rgba(6,182,212,0.12)", border: "rgba(6,182,212,0.25)", text: "#22d3ee", dot: "#06b6d4" },
    statusQualified: { bg: "rgba(168,85,247,0.12)", border: "rgba(168,85,247,0.25)", text: "#c084fc", dot: "#a855f7" },

    // Chips
    chipBg: "rgba(255,255,255,0.05)",
    chipBorder: "rgba(255,255,255,0.08)",
    chipText: "rgba(255,255,255,0.65)",
    chipYesBg: "rgba(34,197,94,0.10)",
    chipYesBorder: "rgba(34,197,94,0.20)",
    chipYesText: "#4ade80",
    chipNoBg: "rgba(239,68,68,0.08)",
    chipNoBorder: "rgba(239,68,68,0.15)",
    chipNoText: "rgba(248,113,113,0.70)",

    // Toggle
    toggleOff: "rgba(255,255,255,0.06)",
    toggleOffBorder: "rgba(255,255,255,0.08)",
    toggleOffText: "rgba(255,255,255,0.70)",
    toggleOffSub: "rgba(255,255,255,0.35)",
    toggleOn: "rgba(99,102,241,0.18)",
    toggleOnBorder: "rgba(99,102,241,0.40)",
    toggleOnText: "#ffffff",
    toggleOnSub: "rgba(99,102,241,0.80)",
    toggleDot: "#818cf8",
    toggleDotOff: "rgba(255,255,255,0.20)",

    // Error
    errorBg: "rgba(239,68,68,0.08)",
    errorBorder: "rgba(239,68,68,0.18)",
    errorText: "#fca5a5",
    errorInline: "#f87171",

    // Review
    reviewBg: "rgba(255,255,255,0.03)",
    reviewBorder: "rgba(255,255,255,0.06)",
    reviewRowAlt: "rgba(255,255,255,0.02)",
    reviewKey: "rgba(255,255,255,0.50)",
    reviewVal: "#ffffff",

    // Done
    doneBg: "rgba(255,255,255,0.03)",
    doneAccent: "#818cf8",

    // Hall card (kept for backward compat, unused now)
    hallBg: "rgba(255,255,255,0.03)",
    hallBorder: "rgba(255,255,255,0.08)",
    hallAccent: "#818cf8",
    hallStripBg: "rgba(99,102,241,0.12)",

    // Misc
    hintColor: "rgba(255,255,255,0.35)",
    loadingDot: "#818cf8",
    divider: "rgba(255,255,255,0.06)",
    avatarBg: "linear-gradient(135deg,#6366f1,#818cf8)",
    avatarText: "#ffffff",

    // Tab
    tabActiveBg: "#ffffff",
    tabActiveText: "#000000",
    tabInactiveBg: "rgba(255,255,255,0.06)",
    tabInactiveText: "rgba(255,255,255,0.50)",
    tabBorder: "rgba(255,255,255,0.08)",

    // SuggestInput pass
    dropBg: "rgba(6,6,15,0.95)",
    dropBorder: "rgba(255,255,255,0.08)",
    dropItemText: "rgba(255,255,255,0.85)",
    dropItemHover: "rgba(255,255,255,0.06)",

    // Calendar picker (kept for backward compat — now unused in profile)
    calBg: "rgba(0,0,0,0.30)",
    calBorder: "rgba(255,255,255,0.10)",
    calDayText: "#ffffff",
    calDaySun: "rgba(252,165,165,0.80)",
    calDayPast: 0.35,
    calSelected: "rgba(59,130,246,0.10)",
    calSelectedRing: "rgba(59,130,246,0.60)",
    calToday: "rgba(52,211,153,0.60)",
    calTodayBorder: "rgba(52,211,153,0.30)",
    calCardMale: "rgba(59,130,246,0.15)",
    calCardMaleBorder: "rgba(96,165,250,0.20)",
    calCardMaleText: "rgba(147,197,253,0.90)",
    calCardFemale: "rgba(236,72,153,0.15)",
    calCardFemaleBorder: "rgba(244,114,182,0.20)",
    calCardFemaleText: "rgba(249,168,212,0.90)",
    calPreviewBg: "rgba(255,255,255,0.05)",
    calPreviewBorder: "rgba(255,255,255,0.10)",
    calReservedBg: "rgba(16,185,129,0.10)",
    calReservedBorder: "rgba(52,211,153,0.20)",
    calReservedText: "rgba(110,231,183,0.90)",
    calGaugeFull: "rgba(239,68,68,0.60)",
    calGaugeOk: "rgba(16,185,129,0.60)",
    calGaugeTrack: "rgba(255,255,255,0.10)",
    calModeBtnActive: "bg-white text-black font-semibold",
    calModeBtnInactive: "text-white/70 hover:bg-white/10",
    calNavBtn: "bg-white/10 hover:bg-white/15 border border-white/10",

    // Smart Input tokens (SecondForm)
    smartInputValid: "rgba(34,197,94,0.15)",
    smartInputValidBorder: "rgba(34,197,94,0.30)",
    smartInputValidIcon: "#4ade80",
    smartInputError: "rgba(239,68,68,0.10)",
    smartInputErrorBorder: "rgba(239,68,68,0.25)",
    smartInputErrorIcon: "#f87171",
    smartInputHintBg: "rgba(99,102,241,0.08)",
    smartInputHintBorder: "rgba(99,102,241,0.15)",
    smartInputHintText: "rgba(165,180,252,0.90)",
    smartDropdownBg: "rgba(10,10,25,0.96)",
    smartDropdownBorder: "rgba(255,255,255,0.10)",
    smartDropdownItemHover: "rgba(99,102,241,0.12)",
    smartDropdownItemActive: "rgba(99,102,241,0.20)",
    smartDropdownItemText: "rgba(255,255,255,0.85)",
    smartDropdownCheck: "#818cf8",
  },

  light: {
    cardBg: "rgba(255,255,255,0.70)",
    cardBorder: "rgba(0,0,0,0.06)",
    cardShadow: "0 4px 40px rgba(0,0,0,0.06)",
    panelBg: "rgba(0,0,0,0.02)",
    panelBorder: "rgba(0,0,0,0.06)",
    panelHover: "rgba(0,0,0,0.04)",
    glassBg: "rgba(0,0,0,0.02)",

    t1: "#0f172a",
    t2: "rgba(15,23,42,0.58)",
    t3: "rgba(15,23,42,0.32)",
    t4: "rgba(15,23,42,0.18)",

    labelColor: "rgba(15,23,42,0.55)",
    requiredStar: "#dc2626",
    sectionLabel: "rgba(15,23,42,0.40)",
    sectionLine: "rgba(0,0,0,0.06)",

    inputBg: "rgba(0,0,0,0.03)",
    inputBorder: "rgba(0,0,0,0.08)",
    inputBorderFocus: "rgba(161,98,7,0.45)",
    inputText: "#0f172a",
    inputPlaceholder: "rgba(15,23,42,0.30)",
    inputFocusRing: "rgba(161,98,7,0.18)",
    inputDisabledBg: "rgba(0,0,0,0.02)",
    inputDisabledText: "rgba(15,23,42,0.30)",

    btnSolidBg: "#0f172a",
    btnSolidText: "#ffffff",
    btnGhostBg: "rgba(0,0,0,0.03)",
    btnGhostBorder: "rgba(0,0,0,0.08)",
    btnGhostHover: "rgba(0,0,0,0.06)",
    btnGhostText: "#0f172a",
    btnDangerBg: "rgba(220,38,38,0.06)",
    btnDangerBorder: "rgba(220,38,38,0.15)",
    btnDangerText: "#dc2626",

    acc: "#a16207",
    acc2: "#ca8a04",
    accG: "linear-gradient(135deg,#a16207,#ca8a04)",

    badgeBg: "rgba(0,0,0,0.04)",
    badgeBorder: "rgba(0,0,0,0.06)",
    badgeText: "rgba(15,23,42,0.60)",

    genderMale: "linear-gradient(135deg, #dbeafe, #bfdbfe, #93c5fd)",
    genderFemale: "linear-gradient(135deg, #fce7f3, #fbcfe8, #f9a8d4)",
    genderOther: "linear-gradient(135deg, #d1fae5, #a7f3d0, #6ee7b7)",

    // Header UIX tokens
    headerGlow: "rgba(161,98,7,0.10)",
    headerOverlay: "radial-gradient(ellipse at 70% 20%, rgba(255,255,255,0.30), transparent 60%)",
    headerAvatarBg: "rgba(255,255,255,0.90)",
    headerAvatarRing: "rgba(0,0,0,0.08)",
    headerAvatarText: "#0f172a",
    headerNameColor: "#0f172a",
    headerMetaColor: "rgba(15,23,42,0.60)",
    headerMetaDim: "rgba(15,23,42,0.45)",
    headerRollBg: "rgba(0,0,0,0.08)",
    headerRollText: "#0f172a",
    headerChipBarBg: "rgba(255,255,255,0.60)",
    headerChipBarBorder: "rgba(0,0,0,0.06)",
    headerSourceBg: "rgba(0,0,0,0.04)",
    headerSourceBorder: "rgba(0,0,0,0.08)",
    headerSourceText: "rgba(15,23,42,0.70)",
    headerEligibleGlow: "rgba(8,145,178,0.15)",
    headerQualifiedGlow: "rgba(126,34,206,0.15)",

    statusActive: { bg: "rgba(22,163,74,0.08)", border: "rgba(22,163,74,0.18)", text: "#15803d", dot: "#16a34a" },
    statusPending: { bg: "rgba(202,138,4,0.08)", border: "rgba(202,138,4,0.18)", text: "#a16207", dot: "#ca8a04" },
    statusToday: { bg: "rgba(79,70,229,0.08)", border: "rgba(79,70,229,0.18)", text: "#4338ca", dot: "#4f46e5" },
    statusEligible: { bg: "rgba(8,145,178,0.08)", border: "rgba(8,145,178,0.18)", text: "#0e7490", dot: "#0891b2" },
    statusQualified: { bg: "rgba(126,34,206,0.08)", border: "rgba(126,34,206,0.18)", text: "#7e22ce", dot: "#9333ea" },

    chipBg: "rgba(0,0,0,0.03)",
    chipBorder: "rgba(0,0,0,0.06)",
    chipText: "rgba(15,23,42,0.60)",
    chipYesBg: "rgba(22,163,74,0.08)",
    chipYesBorder: "rgba(22,163,74,0.15)",
    chipYesText: "#15803d",
    chipNoBg: "rgba(220,38,38,0.05)",
    chipNoBorder: "rgba(220,38,38,0.10)",
    chipNoText: "rgba(220,38,38,0.60)",

    toggleOff: "rgba(0,0,0,0.03)",
    toggleOffBorder: "rgba(0,0,0,0.08)",
    toggleOffText: "rgba(15,23,42,0.70)",
    toggleOffSub: "rgba(15,23,42,0.35)",
    toggleOn: "rgba(161,98,7,0.10)",
    toggleOnBorder: "rgba(161,98,7,0.30)",
    toggleOnText: "#0f172a",
    toggleOnSub: "rgba(161,98,7,0.80)",
    toggleDot: "#a16207",
    toggleDotOff: "rgba(0,0,0,0.15)",

    errorBg: "rgba(220,38,38,0.05)",
    errorBorder: "rgba(220,38,38,0.12)",
    errorText: "#dc2626",
    errorInline: "#dc2626",

    reviewBg: "rgba(0,0,0,0.02)",
    reviewBorder: "rgba(0,0,0,0.06)",
    reviewRowAlt: "rgba(0,0,0,0.02)",
    reviewKey: "rgba(15,23,42,0.50)",
    reviewVal: "#0f172a",

    doneBg: "rgba(0,0,0,0.02)",
    doneAccent: "#a16207",

    hallBg: "rgba(0,0,0,0.02)",
    hallBorder: "rgba(0,0,0,0.06)",
    hallAccent: "#a16207",
    hallStripBg: "rgba(161,98,7,0.08)",

    hintColor: "rgba(15,23,42,0.35)",
    loadingDot: "#a16207",
    divider: "rgba(0,0,0,0.06)",
    avatarBg: "linear-gradient(135deg,#a16207,#ca8a04)",
    avatarText: "#ffffff",

    tabActiveBg: "#0f172a",
    tabActiveText: "#ffffff",
    tabInactiveBg: "rgba(0,0,0,0.03)",
    tabInactiveText: "rgba(15,23,42,0.45)",
    tabBorder: "rgba(0,0,0,0.06)",

    dropBg: "rgba(255,255,255,0.98)",
    dropBorder: "rgba(0,0,0,0.08)",
    dropItemText: "rgba(15,23,42,0.80)",
    dropItemHover: "rgba(0,0,0,0.04)",

    calBg: "rgba(0,0,0,0.02)",
    calBorder: "rgba(0,0,0,0.08)",
    calDayText: "#0f172a",
    calDaySun: "rgba(220,38,38,0.70)",
    calDayPast: 0.35,
    calSelected: "rgba(161,98,7,0.08)",
    calSelectedRing: "rgba(161,98,7,0.45)",
    calToday: "rgba(22,163,74,0.45)",
    calTodayBorder: "rgba(22,163,74,0.25)",
    calCardMale: "rgba(59,130,246,0.08)",
    calCardMaleBorder: "rgba(59,130,246,0.15)",
    calCardMaleText: "#2563eb",
    calCardFemale: "rgba(219,39,119,0.08)",
    calCardFemaleBorder: "rgba(219,39,119,0.15)",
    calCardFemaleText: "#db2777",
    calPreviewBg: "rgba(0,0,0,0.02)",
    calPreviewBorder: "rgba(0,0,0,0.06)",
    calReservedBg: "rgba(16,185,129,0.06)",
    calReservedBorder: "rgba(16,185,129,0.12)",
    calReservedText: "#059669",
    calGaugeFull: "rgba(220,38,38,0.50)",
    calGaugeOk: "rgba(22,163,74,0.50)",
    calGaugeTrack: "rgba(0,0,0,0.06)",
    calModeBtnActive: "bg-slate-900 text-white font-semibold",
    calModeBtnInactive: "text-slate-500 hover:bg-black/5",
    calNavBtn: "bg-black/5 hover:bg-black/8 border border-black/8",

    // Smart Input tokens (SecondForm)
    smartInputValid: "rgba(22,163,74,0.08)",
    smartInputValidBorder: "rgba(22,163,74,0.20)",
    smartInputValidIcon: "#15803d",
    smartInputError: "rgba(220,38,38,0.06)",
    smartInputErrorBorder: "rgba(220,38,38,0.18)",
    smartInputErrorIcon: "#dc2626",
    smartInputHintBg: "rgba(161,98,7,0.06)",
    smartInputHintBorder: "rgba(161,98,7,0.12)",
    smartInputHintText: "rgba(161,98,7,0.80)",
    smartDropdownBg: "rgba(255,255,255,0.98)",
    smartDropdownBorder: "rgba(0,0,0,0.08)",
    smartDropdownItemHover: "rgba(161,98,7,0.06)",
    smartDropdownItemActive: "rgba(161,98,7,0.12)",
    smartDropdownItemText: "rgba(15,23,42,0.80)",
    smartDropdownCheck: "#a16207",
  },
};

// Gender gradient for header only
export function getGenderGradient(gender, isLight) {
  const t = isLight ? PT.light : PT.dark;
  if (gender === "MALE") return t.genderMale;
  if (gender === "FEMALE") return t.genderFemale;
  return t.genderOther;
}

// Status config
export function getStatusConfig(source, cardStatus, c) {
  if (cardStatus === "QUALIFIED") return c.statusQualified;
  if (source === "SITTING") return c.statusActive;
  if (source === "PENDING") return c.statusPending;
  return c.statusToday;
}

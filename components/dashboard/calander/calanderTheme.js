// components/dashboard/calander/calanderTheme.js
// Calendar Theme Tokens — Lock system tokens added
// Dark: indigo accent | Light: amber/slate accent

export const CT = {
  dark: {
    // ─── Surface ───
    surfaceBg: "rgba(12,12,28,0.55)",
    surfaceBorder: "rgba(255,255,255,0.06)",
    surfaceHover: "rgba(255,255,255,0.08)",
    panelBg: "rgba(255,255,255,0.04)",
    panelBorder: "rgba(255,255,255,0.06)",
    panelHover: "rgba(255,255,255,0.07)",
    cardBg: "rgba(0,0,0,0.30)",
    cardBorder: "rgba(255,255,255,0.10)",
    cardHover: "rgba(0,0,0,0.40)",

    // ─── Text ───
    t1: "#ffffff",
    t2: "rgba(255,255,255,0.62)",
    t3: "rgba(255,255,255,0.38)",
    t4: "rgba(255,255,255,0.22)",

    // ─── Accent ───
    acc: "#818cf8",
    acc2: "#a78bfa",
    accBg: "rgba(99,102,241,0.12)",
    accBorder: "rgba(99,102,241,0.25)",

    // ─── Mode Toggle ───
    modeActiveBg: "#ffffff",
    modeActiveText: "#000000",
    modeInactiveBg: "transparent",
    modeInactiveText: "rgba(255,255,255,0.55)",
    modeInactiveHover: "rgba(255,255,255,0.08)",
    modeTrackBg: "rgba(0,0,0,0.30)",
    modeTrackBorder: "rgba(255,255,255,0.08)",

    // ─── Mode Labels ───
    meetingAccent: "#fbbf24",
    meetingBg: "rgba(251,191,36,0.12)",
    meetingBorder: "rgba(251,191,36,0.20)",
    meetingText: "#fcd34d",
    dikshaAccent: "#c084fc",
    dikshaBg: "rgba(192,132,252,0.12)",
    dikshaBorder: "rgba(192,132,252,0.20)",
    dikshaText: "#d8b4fe",

    // ─── Navigation ───
    navBtnBg: "rgba(255,255,255,0.06)",
    navBtnBorder: "rgba(255,255,255,0.08)",
    navBtnHover: "rgba(255,255,255,0.12)",
    navBtnText: "rgba(255,255,255,0.70)",

    // ─── Calendar Grid / Day ───
    dayBg: "rgba(0,0,0,0.30)",
    dayBorder: "rgba(255,255,255,0.08)",
    dayHover: "rgba(0,0,0,0.40)",
    dayText: "#ffffff",
    daySunText: "rgba(252,165,165,0.85)",
    dayPastOpacity: 0.35,
    daySelectedBg: "rgba(99,102,241,0.12)",
    daySelectedRing: "rgba(99,102,241,0.55)",
    daySelectedBorder: "rgba(99,102,241,0.30)",
    dayTodayRing: "rgba(52,211,153,0.55)",
    dayTodayBorder: "rgba(52,211,153,0.30)",
    dayTodayGlow: "rgba(16,185,129,0.12)",
    dayTodayDot: "#34d399",
    dayEmptyText: "rgba(255,255,255,0.22)",
    dayWeekLabel: "rgba(255,255,255,0.50)",

    // ─── Gender Badges ───
    maleBg: "rgba(59,130,246,0.15)",
    maleBorder: "rgba(96,165,250,0.20)",
    maleText: "rgba(147,197,253,0.90)",
    femaleBg: "rgba(236,72,153,0.15)",
    femaleBorder: "rgba(244,114,182,0.20)",
    femaleText: "rgba(249,168,212,0.90)",
    otherBg: "rgba(16,185,129,0.12)",
    otherBorder: "rgba(52,211,153,0.20)",
    otherText: "rgba(110,231,183,0.90)",

    // ─── Gender Card Tints ───
    cardMaleBg: "rgba(59,130,246,0.06)",
    cardMaleBorder: "rgba(96,165,250,0.15)",
    cardMaleHover: "rgba(59,130,246,0.10)",
    cardMaleSeq: "rgba(59,130,246,0.20)",
    cardMaleSeqText: "rgba(147,197,253,0.90)",
    cardFemaleBg: "rgba(236,72,153,0.06)",
    cardFemaleBorder: "rgba(244,114,182,0.15)",
    cardFemaleHover: "rgba(236,72,153,0.10)",
    cardFemaleSeq: "rgba(236,72,153,0.20)",
    cardFemaleSeqText: "rgba(249,168,212,0.90)",
    cardNeutralBg: "rgba(0,0,0,0.30)",
    cardNeutralBorder: "rgba(255,255,255,0.08)",
    cardNeutralHover: "rgba(0,0,0,0.38)",
    cardNeutralSeq: "rgba(255,255,255,0.08)",
    cardNeutralSeqText: "rgba(255,255,255,0.55)",

    // ─── Status Badges ───
    eligibleBg: "rgba(59,130,246,0.12)",
    eligibleBorder: "rgba(96,165,250,0.20)",
    eligibleText: "rgba(147,197,253,0.90)",
    qualifiedBg: "rgba(234,179,8,0.12)",
    qualifiedBorder: "rgba(250,204,21,0.20)",
    qualifiedText: "rgba(253,224,71,0.90)",
    occupyBg: "rgba(16,185,129,0.12)",
    occupyBorder: "rgba(52,211,153,0.20)",
    occupyText: "rgba(110,231,183,0.90)",
    confirmedBg: "rgba(16,185,129,0.12)",
    confirmedBorder: "rgba(52,211,153,0.20)",
    confirmedText: "rgba(110,231,183,0.90)",

    // ─── Capacity Gauge ───
    gaugeTrack: "rgba(255,255,255,0.08)",
    gaugeOk: "rgba(16,185,129,0.60)",
    gaugeWarn: "rgba(245,158,11,0.60)",
    gaugeFull: "rgba(239,68,68,0.60)",
    gaugeOkText: "rgba(110,231,183,0.90)",
    gaugeWarnText: "rgba(252,211,77,0.90)",
    gaugeFullText: "rgba(252,165,165,0.90)",
    gaugeOkBg: "rgba(16,185,129,0.12)",
    gaugeOkBorder: "rgba(52,211,153,0.20)",
    gaugeWarnBg: "rgba(245,158,11,0.12)",
    gaugeWarnBorder: "rgba(251,191,36,0.20)",
    gaugeFullBg: "rgba(239,68,68,0.12)",
    gaugeFullBorder: "rgba(248,113,113,0.20)",

    // ─── Reserved ───
    reservedBg: "rgba(16,185,129,0.10)",
    reservedBorder: "rgba(52,211,153,0.18)",
    reservedText: "rgba(110,231,183,0.85)",

    // ─── History ───
    historyBg: "rgba(16,185,129,0.05)",
    historyBorder: "rgba(52,211,153,0.18)",
    historyAccent: "#34d399",
    historyText: "rgba(110,231,183,0.85)",
    historyMuted: "rgba(110,231,183,0.50)",

    // ─── Hero Card (Mobile) ───
    heroBg: "rgba(255,255,255,0.04)",
    heroBorder: "rgba(255,255,255,0.08)",
    heroGlow: "rgba(99,102,241,0.08)",
    heroLabel: "rgba(255,255,255,0.45)",
    heroValue: "#ffffff",

    // ─── Buttons ───
    btnSolidBg: "#ffffff",
    btnSolidText: "#000000",
    btnSolidHover: "rgba(255,255,255,0.90)",
    btnGhostBg: "rgba(255,255,255,0.06)",
    btnGhostBorder: "rgba(255,255,255,0.08)",
    btnGhostHover: "rgba(255,255,255,0.12)",
    btnGhostText: "rgba(255,255,255,0.80)",
    btnConfirmBg: "rgba(16,185,129,0.15)",
    btnConfirmBorder: "rgba(52,211,153,0.25)",
    btnConfirmText: "#34d399",
    btnConfirmSolidBg: "#10b981",
    btnConfirmSolidText: "#ffffff",
    btnRejectBg: "rgba(239,68,68,0.10)",
    btnRejectBorder: "rgba(248,113,113,0.20)",
    btnRejectText: "#f87171",
    btnDoneBg: "#ffffff",
    btnDoneText: "#000000",

    // ─── Reject Modal ───
    rejectTrashBg: "rgba(239,68,68,0.08)",
    rejectTrashBorder: "rgba(239,68,68,0.18)",
    rejectTrashText: "#f87171",
    rejectTrashIconBg: "rgba(239,68,68,0.15)",
    rejectPendingBg: "rgba(245,158,11,0.08)",
    rejectPendingBorder: "rgba(245,158,11,0.18)",
    rejectPendingText: "#fbbf24",
    rejectPendingIconBg: "rgba(245,158,11,0.15)",
    rejectApproveBg: "rgba(59,130,246,0.08)",
    rejectApproveBorder: "rgba(59,130,246,0.18)",
    rejectApproveText: "#60a5fa",
    rejectApproveIconBg: "rgba(59,130,246,0.15)",

    // ─── Confirm Diksha Modal ───
    confirmInfoBg: "rgba(16,185,129,0.06)",
    confirmInfoBorder: "rgba(52,211,153,0.18)",
    confirmInfoText: "rgba(110,231,183,0.80)",
    confirmInfoArrow: "#34d399",
    confirmDateBg: "rgba(192,132,252,0.08)",
    confirmDateBorder: "rgba(192,132,252,0.18)",
    confirmDateText: "#d8b4fe",
    confirmWarnBg: "rgba(236,72,153,0.08)",
    confirmWarnBorder: "rgba(236,72,153,0.18)",
    confirmWarnText: "rgba(249,168,212,0.80)",

    // ─── Housefull Banner ───
    housefullBg: "rgba(239,68,68,0.10)",
    housefullBorder: "rgba(248,113,113,0.20)",
    housefullText: "#fca5a5",
    housefullAccent: "#f87171",

    // ─── Tabs ───
    tabActiveBg: "#ffffff",
    tabActiveText: "#000000",
    tabInactiveBg: "rgba(255,255,255,0.06)",
    tabInactiveText: "rgba(255,255,255,0.50)",
    tabInactiveHover: "rgba(255,255,255,0.10)",
    tabHistoryActiveBg: "#10b981",
    tabHistoryActiveText: "#ffffff",
    tabHistoryInactiveBg: "rgba(16,185,129,0.10)",
    tabHistoryInactiveText: "rgba(110,231,183,0.75)",

    // ─── Picker (Add Customer) ───
    pickerSelectedCoupleBg: "rgba(232,121,249,0.10)",
    pickerSelectedCoupleBorder: "rgba(232,121,249,0.30)",
    pickerSelectedFamilyBg: "rgba(59,130,246,0.10)",
    pickerSelectedFamilyBorder: "rgba(96,165,250,0.30)",

    // ─── Divider ───
    divider: "rgba(255,255,255,0.06)",

    // ─── Weekday Header ───
    weekdayText: "rgba(255,255,255,0.50)",
    weekdaySun: "rgba(252,165,165,0.80)",

    // ─── Kind Badge ───
    kindBg: "rgba(255,255,255,0.06)",
    kindBorder: "rgba(255,255,255,0.08)",
    kindText: "rgba(255,255,255,0.50)",

    // ─── LOCK System ───
    lockBg: "rgba(239,68,68,0.08)",
    lockBorder: "rgba(248,113,113,0.20)",
    lockText: "#fca5a5",
    lockAccent: "#f87171",
    lockIconBg: "rgba(239,68,68,0.15)",
    lockGlow: "rgba(239,68,68,0.10)",
    lockBadgeBg: "rgba(239,68,68,0.12)",
    lockBadgeBorder: "rgba(248,113,113,0.25)",
    lockBadgeText: "#fca5a5",
    lockDisabledOpacity: 0.45,
    lockOverlay: "rgba(0,0,0,0.30)",
    // Unlock (admin)
    unlockBg: "rgba(16,185,129,0.08)",
    unlockBorder: "rgba(52,211,153,0.20)",
    unlockText: "#34d399",
    unlockBtnBg: "#10b981",
    unlockBtnText: "#ffffff",
    unlockTimerBg: "rgba(245,158,11,0.10)",
    unlockTimerBorder: "rgba(251,191,36,0.20)",
    unlockTimerText: "#fcd34d",
    unlockTimerAccent: "#fbbf24",
    // Duration picker
    durationOptionBg: "rgba(255,255,255,0.04)",
    durationOptionBorder: "rgba(255,255,255,0.08)",
    durationOptionHover: "rgba(255,255,255,0.08)",
    durationOptionText: "rgba(255,255,255,0.70)",
    durationOptionActiveBg: "rgba(16,185,129,0.12)",
    durationOptionActiveBorder: "rgba(52,211,153,0.25)",
    durationOptionActiveText: "#34d399",

    // ─── BYPASS ───
    bypassBg: "rgba(245,158,11,0.08)",
    bypassBorder: "rgba(251,191,36,0.18)",
    bypassText: "#fbbf24",
    bypassBadgeBg: "rgba(245,158,11,0.12)",
    bypassBadgeBorder: "rgba(251,191,36,0.25)",
    bypassBadgeText: "#fcd34d",
    modBg: "rgba(168,85,247,0.08)",
    modBorder: "rgba(192,132,252,0.18)",
    modText: "#c084fc",

    // ─── Day Lock indicator ───
    dayLockedBg: "rgba(239,68,68,0.08)",
    dayLockedBorder: "rgba(248,113,113,0.15)",
    dayLockedDot: "#f87171",
  },

  light: {
    // ─── Surface ───
    surfaceBg: "rgba(255,255,255,0.65)",
    surfaceBorder: "rgba(0,0,0,0.06)",
    surfaceHover: "rgba(0,0,0,0.03)",
    panelBg: "rgba(0,0,0,0.02)",
    panelBorder: "rgba(0,0,0,0.06)",
    panelHover: "rgba(0,0,0,0.04)",
    cardBg: "rgba(0,0,0,0.02)",
    cardBorder: "rgba(0,0,0,0.08)",
    cardHover: "rgba(0,0,0,0.04)",

    // ─── Text ───
    t1: "#0f172a",
    t2: "rgba(15,23,42,0.58)",
    t3: "rgba(15,23,42,0.32)",
    t4: "rgba(15,23,42,0.18)",

    // ─── Accent ───
    acc: "#a16207",
    acc2: "#ca8a04",
    accBg: "rgba(161,98,7,0.08)",
    accBorder: "rgba(161,98,7,0.18)",

    // ─── Mode Toggle ───
    modeActiveBg: "#0f172a",
    modeActiveText: "#ffffff",
    modeInactiveBg: "transparent",
    modeInactiveText: "rgba(15,23,42,0.45)",
    modeInactiveHover: "rgba(0,0,0,0.04)",
    modeTrackBg: "rgba(0,0,0,0.03)",
    modeTrackBorder: "rgba(0,0,0,0.06)",

    // ─── Mode Labels ───
    meetingAccent: "#b45309",
    meetingBg: "rgba(180,83,9,0.08)",
    meetingBorder: "rgba(180,83,9,0.15)",
    meetingText: "#92400e",
    dikshaAccent: "#7e22ce",
    dikshaBg: "rgba(126,34,206,0.06)",
    dikshaBorder: "rgba(126,34,206,0.12)",
    dikshaText: "#6b21a8",

    // ─── Navigation ───
    navBtnBg: "rgba(0,0,0,0.04)",
    navBtnBorder: "rgba(0,0,0,0.06)",
    navBtnHover: "rgba(0,0,0,0.08)",
    navBtnText: "rgba(15,23,42,0.55)",

    // ─── Calendar Grid / Day ───
    dayBg: "rgba(0,0,0,0.02)",
    dayBorder: "rgba(0,0,0,0.06)",
    dayHover: "rgba(0,0,0,0.04)",
    dayText: "#0f172a",
    daySunText: "rgba(220,38,38,0.70)",
    dayPastOpacity: 0.35,
    daySelectedBg: "rgba(161,98,7,0.08)",
    daySelectedRing: "rgba(161,98,7,0.40)",
    daySelectedBorder: "rgba(161,98,7,0.25)",
    dayTodayRing: "rgba(22,163,74,0.40)",
    dayTodayBorder: "rgba(22,163,74,0.25)",
    dayTodayGlow: "rgba(22,163,74,0.08)",
    dayTodayDot: "#16a34a",
    dayEmptyText: "rgba(15,23,42,0.18)",
    dayWeekLabel: "rgba(15,23,42,0.45)",

    // ─── Gender Badges ───
    maleBg: "rgba(59,130,246,0.08)",
    maleBorder: "rgba(59,130,246,0.15)",
    maleText: "#2563eb",
    femaleBg: "rgba(219,39,119,0.08)",
    femaleBorder: "rgba(219,39,119,0.15)",
    femaleText: "#db2777",
    otherBg: "rgba(22,163,74,0.06)",
    otherBorder: "rgba(22,163,74,0.12)",
    otherText: "#15803d",

    // ─── Gender Card Tints ───
    cardMaleBg: "rgba(59,130,246,0.04)",
    cardMaleBorder: "rgba(59,130,246,0.10)",
    cardMaleHover: "rgba(59,130,246,0.07)",
    cardMaleSeq: "rgba(59,130,246,0.10)",
    cardMaleSeqText: "#2563eb",
    cardFemaleBg: "rgba(219,39,119,0.04)",
    cardFemaleBorder: "rgba(219,39,119,0.10)",
    cardFemaleHover: "rgba(219,39,119,0.07)",
    cardFemaleSeq: "rgba(219,39,119,0.10)",
    cardFemaleSeqText: "#db2777",
    cardNeutralBg: "rgba(0,0,0,0.02)",
    cardNeutralBorder: "rgba(0,0,0,0.06)",
    cardNeutralHover: "rgba(0,0,0,0.04)",
    cardNeutralSeq: "rgba(0,0,0,0.05)",
    cardNeutralSeqText: "rgba(15,23,42,0.45)",

    // ─── Status Badges ───
    eligibleBg: "rgba(37,99,235,0.08)",
    eligibleBorder: "rgba(37,99,235,0.15)",
    eligibleText: "#1d4ed8",
    qualifiedBg: "rgba(161,98,7,0.08)",
    qualifiedBorder: "rgba(161,98,7,0.15)",
    qualifiedText: "#92400e",
    occupyBg: "rgba(22,163,74,0.06)",
    occupyBorder: "rgba(22,163,74,0.12)",
    occupyText: "#15803d",
    confirmedBg: "rgba(22,163,74,0.06)",
    confirmedBorder: "rgba(22,163,74,0.12)",
    confirmedText: "#15803d",

    // ─── Capacity Gauge ───
    gaugeTrack: "rgba(0,0,0,0.06)",
    gaugeOk: "rgba(22,163,74,0.50)",
    gaugeWarn: "rgba(202,138,4,0.50)",
    gaugeFull: "rgba(220,38,38,0.50)",
    gaugeOkText: "#15803d",
    gaugeWarnText: "#92400e",
    gaugeFullText: "#991b1b",
    gaugeOkBg: "rgba(22,163,74,0.06)",
    gaugeOkBorder: "rgba(22,163,74,0.12)",
    gaugeWarnBg: "rgba(202,138,4,0.06)",
    gaugeWarnBorder: "rgba(202,138,4,0.12)",
    gaugeFullBg: "rgba(220,38,38,0.06)",
    gaugeFullBorder: "rgba(220,38,38,0.12)",

    // ─── Reserved ───
    reservedBg: "rgba(22,163,74,0.05)",
    reservedBorder: "rgba(22,163,74,0.10)",
    reservedText: "#059669",

    // ─── History ───
    historyBg: "rgba(22,163,74,0.04)",
    historyBorder: "rgba(22,163,74,0.10)",
    historyAccent: "#059669",
    historyText: "#15803d",
    historyMuted: "rgba(22,163,74,0.50)",

    // ─── Hero Card (Mobile) ───
    heroBg: "rgba(0,0,0,0.02)",
    heroBorder: "rgba(0,0,0,0.06)",
    heroGlow: "rgba(161,98,7,0.05)",
    heroLabel: "rgba(15,23,42,0.40)",
    heroValue: "#0f172a",

    // ─── Buttons ───
    btnSolidBg: "#0f172a",
    btnSolidText: "#ffffff",
    btnSolidHover: "rgba(15,23,42,0.85)",
    btnGhostBg: "rgba(0,0,0,0.03)",
    btnGhostBorder: "rgba(0,0,0,0.06)",
    btnGhostHover: "rgba(0,0,0,0.06)",
    btnGhostText: "rgba(15,23,42,0.70)",
    btnConfirmBg: "rgba(22,163,74,0.08)",
    btnConfirmBorder: "rgba(22,163,74,0.15)",
    btnConfirmText: "#15803d",
    btnConfirmSolidBg: "#16a34a",
    btnConfirmSolidText: "#ffffff",
    btnRejectBg: "rgba(220,38,38,0.06)",
    btnRejectBorder: "rgba(220,38,38,0.12)",
    btnRejectText: "#dc2626",
    btnDoneBg: "#0f172a",
    btnDoneText: "#ffffff",

    // ─── Reject Modal ───
    rejectTrashBg: "rgba(220,38,38,0.05)",
    rejectTrashBorder: "rgba(220,38,38,0.12)",
    rejectTrashText: "#dc2626",
    rejectTrashIconBg: "rgba(220,38,38,0.08)",
    rejectPendingBg: "rgba(202,138,4,0.05)",
    rejectPendingBorder: "rgba(202,138,4,0.12)",
    rejectPendingText: "#b45309",
    rejectPendingIconBg: "rgba(202,138,4,0.08)",
    rejectApproveBg: "rgba(37,99,235,0.05)",
    rejectApproveBorder: "rgba(37,99,235,0.12)",
    rejectApproveText: "#1d4ed8",
    rejectApproveIconBg: "rgba(37,99,235,0.08)",

    // ─── Confirm Diksha Modal ───
    confirmInfoBg: "rgba(22,163,74,0.05)",
    confirmInfoBorder: "rgba(22,163,74,0.10)",
    confirmInfoText: "#15803d",
    confirmInfoArrow: "#16a34a",
    confirmDateBg: "rgba(126,34,206,0.05)",
    confirmDateBorder: "rgba(126,34,206,0.10)",
    confirmDateText: "#7e22ce",
    confirmWarnBg: "rgba(219,39,119,0.05)",
    confirmWarnBorder: "rgba(219,39,119,0.10)",
    confirmWarnText: "#be185d",

    // ─── Housefull Banner ───
    housefullBg: "rgba(220,38,38,0.06)",
    housefullBorder: "rgba(220,38,38,0.12)",
    housefullText: "#991b1b",
    housefullAccent: "#dc2626",

    // ─── Tabs ───
    tabActiveBg: "#0f172a",
    tabActiveText: "#ffffff",
    tabInactiveBg: "rgba(0,0,0,0.03)",
    tabInactiveText: "rgba(15,23,42,0.45)",
    tabInactiveHover: "rgba(0,0,0,0.05)",
    tabHistoryActiveBg: "#16a34a",
    tabHistoryActiveText: "#ffffff",
    tabHistoryInactiveBg: "rgba(22,163,74,0.06)",
    tabHistoryInactiveText: "#15803d",

    // ─── Picker (Add Customer) ───
    pickerSelectedCoupleBg: "rgba(192,38,211,0.06)",
    pickerSelectedCoupleBorder: "rgba(192,38,211,0.15)",
    pickerSelectedFamilyBg: "rgba(37,99,235,0.06)",
    pickerSelectedFamilyBorder: "rgba(37,99,235,0.15)",

    // ─── Divider ───
    divider: "rgba(0,0,0,0.06)",

    // ─── Weekday Header ───
    weekdayText: "rgba(15,23,42,0.45)",
    weekdaySun: "rgba(220,38,38,0.65)",

    // ─── Kind Badge ───
    kindBg: "rgba(0,0,0,0.03)",
    kindBorder: "rgba(0,0,0,0.06)",
    kindText: "rgba(15,23,42,0.45)",

    // ─── LOCK System ───
    lockBg: "rgba(220,38,38,0.05)",
    lockBorder: "rgba(220,38,38,0.12)",
    lockText: "#991b1b",
    lockAccent: "#dc2626",
    lockIconBg: "rgba(220,38,38,0.08)",
    lockGlow: "rgba(220,38,38,0.06)",
    lockBadgeBg: "rgba(220,38,38,0.06)",
    lockBadgeBorder: "rgba(220,38,38,0.12)",
    lockBadgeText: "#991b1b",
    lockDisabledOpacity: 0.45,
    lockOverlay: "rgba(0,0,0,0.08)",
    unlockBg: "rgba(22,163,74,0.05)",
    unlockBorder: "rgba(22,163,74,0.12)",
    unlockText: "#15803d",
    unlockBtnBg: "#16a34a",
    unlockBtnText: "#ffffff",
    unlockTimerBg: "rgba(202,138,4,0.06)",
    unlockTimerBorder: "rgba(202,138,4,0.12)",
    unlockTimerText: "#92400e",
    unlockTimerAccent: "#b45309",
    durationOptionBg: "rgba(0,0,0,0.02)",
    durationOptionBorder: "rgba(0,0,0,0.06)",
    durationOptionHover: "rgba(0,0,0,0.04)",
    durationOptionText: "rgba(15,23,42,0.60)",
    durationOptionActiveBg: "rgba(22,163,74,0.06)",
    durationOptionActiveBorder: "rgba(22,163,74,0.15)",
    durationOptionActiveText: "#15803d",

    // ─── BYPASS ───
    bypassBg: "rgba(202,138,4,0.06)",
    bypassBorder: "rgba(202,138,4,0.12)",
    bypassText: "#b45309",
    bypassBadgeBg: "rgba(202,138,4,0.08)",
    bypassBadgeBorder: "rgba(202,138,4,0.15)",
    bypassBadgeText: "#92400e",
    modBg: "rgba(126,34,206,0.05)",
    modBorder: "rgba(126,34,206,0.10)",
    modText: "#7e22ce",

    // ─── Day Lock indicator ───
    dayLockedBg: "rgba(220,38,38,0.05)",
    dayLockedBorder: "rgba(220,38,38,0.10)",
    dayLockedDot: "#dc2626",
  },
};

// ─── Helper: get themed colors ───
export function useCT(isLight) {
  return isLight ? CT.light : CT.dark;
}

// ─── Helper: gender card style ───
export function getCardStyle(gender, c) {
  if (gender === "MALE") return {
    bg: c.cardMaleBg, border: c.cardMaleBorder,
    hover: c.cardMaleHover, seq: c.cardMaleSeq, seqText: c.cardMaleSeqText,
  };
  if (gender === "FEMALE") return {
    bg: c.cardFemaleBg, border: c.cardFemaleBorder,
    hover: c.cardFemaleHover, seq: c.cardFemaleSeq, seqText: c.cardFemaleSeqText,
  };
  return {
    bg: c.cardNeutralBg, border: c.cardNeutralBorder,
    hover: c.cardNeutralHover, seq: c.cardNeutralSeq, seqText: c.cardNeutralSeqText,
  };
}

// ─── Helper: gauge tier ───
export function getGaugeTier(remaining, c) {
  if (remaining <= 0) return {
    bar: c.gaugeFull, text: c.gaugeFullText,
    bg: c.gaugeFullBg, border: c.gaugeFullBorder, label: "FULL",
  };
  if (remaining <= 3) return {
    bar: c.gaugeWarn, text: c.gaugeWarnText,
    bg: c.gaugeWarnBg, border: c.gaugeWarnBorder, label: "LOW",
  };
  return {
    bar: c.gaugeOk, text: c.gaugeOkText,
    bg: c.gaugeOkBg, border: c.gaugeOkBorder, label: "OK",
  };
}

// ─── Helper: mode style ───
export function getModeStyle(currentMode, c) {
  if (currentMode === "MEETING") return {
    accent: c.meetingAccent, bg: c.meetingBg,
    border: c.meetingBorder, text: c.meetingText, icon: "📋",
  };
  return {
    accent: c.dikshaAccent, bg: c.dikshaBg,
    border: c.dikshaBorder, text: c.dikshaText, icon: "🔱",
  };
}

// ─── Helper: lock status ───
export function getLockStatus(container, counts, reservedCounts) {
  if (!container) return { isLocked: false, isFull: false, isUnlocked: false, unlockExpiresAt: null, remaining: null };

  const limit = container.limit ?? 20;
  const mode = container.mode;
  const used = mode === "DIKSHA"
    ? (counts?.total || 0) + (reservedCounts?.total || 0)
    : (counts?.total || 0);
  const remaining = Math.max(0, limit - used);
  const isFull = used >= limit;

  // Check if container is manually unlocked (with expiry)
  const unlockExpiresAt = container.unlockExpiresAt ? new Date(container.unlockExpiresAt) : null;
  const now = new Date();
  const isUnlocked = unlockExpiresAt && unlockExpiresAt > now;

  // Container is locked when full AND not manually unlocked
  const isLocked = isFull && !isUnlocked;

  return { isLocked, isFull, isUnlocked, unlockExpiresAt, remaining, used, limit };
}

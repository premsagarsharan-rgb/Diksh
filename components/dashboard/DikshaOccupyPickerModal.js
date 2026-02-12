// components/dashboard/DikshaOccupyPickerModal.js
"use client";

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import LayerModal from "@/components/LayerModal";
import BufferSpinner from "@/components/BufferSpinner";
import { useTheme } from "@/components/ThemeProvider";
import { useCT, getGaugeTier, getCardStyle } from "./calander/calanderTheme";

/* ═══════ Utility ═══════ */
function pad2(n) { return String(n).padStart(2, "0"); }
function toDateKey(d) { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; }
function startOfMonth(d) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function addMonths(d, delta) { return new Date(d.getFullYear(), d.getMonth() + delta, 1); }
function ymdLocal(d) { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; }

function monthCells(year, month) {
  const first = new Date(year, month, 1);
  const startDay = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function countStats(list) {
  const out = { total: 0, male: 0, female: 0, other: 0, single: 0, couple: 0, family: 0 };
  for (const a of list || []) {
    out.total++;
    const g = a?.customer?.gender;
    if (g === "MALE") out.male++;
    else if (g === "FEMALE") out.female++;
    else out.other++;
    const k = a?.kind || "SINGLE";
    if (k === "COUPLE") out.couple++;
    else if (k === "FAMILY") out.family++;
    else out.single++;
  }
  return out;
}

function labelCustomer(a) {
  const cu = a?.customer || {};
  const name = cu?.name || "—";
  const roll = cu?.rollNo ? ` (${cu.rollNo})` : "";
  const kind = a?.kind ? ` • ${a.kind}${a.roleInPair ? `(${a.roleInPair})` : ""}` : "";
  return `${name}${roll}${kind}`;
}

function safeId(x) {
  if (!x) return "";
  if (typeof x === "string") return x;
  if (typeof x === "object" && x.$oid) return String(x.$oid);
  return String(x);
}

/* ═══════ Heatmap color helper ═══════ */
function getHeatmapStyle(summary, dateKey, limit, c) {
  const s = summary?.[dateKey];
  if (!s || (s.male + s.female) === 0) return { bg: "transparent", indicator: null };
  const total = s.male + s.female;
  const ratio = total / (limit || 20);
  if (ratio >= 0.9) return { bg: c.gaugeFullBg, indicator: c.gaugeFull, level: "full" };
  if (ratio >= 0.6) return { bg: c.gaugeWarnBg, indicator: c.gaugeWarn, level: "warn" };
  return { bg: c.gaugeOkBg, indicator: c.gaugeOk, level: "ok" };
}

/* ═══════ Animation keyframes (injected once) ═══════ */
const ANIM_ID = "diksha-occupy-anims";
function ensureAnimations() {
  if (typeof document === "undefined") return;
  if (document.getElementById(ANIM_ID)) return;
  const style = document.createElement("style");
  style.id = ANIM_ID;
  style.textContent = `
    @keyframes dop-fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes dop-scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
    @keyframes dop-pulseGlow { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
    @keyframes dop-slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes dop-bypassPulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(245,158,11,0); } 50% { box-shadow: 0 0 20px 4px rgba(245,158,11,0.15); } }
    .dop-fadeIn { animation: dop-fadeIn 0.25s ease-out both; }
    .dop-scaleIn { animation: dop-scaleIn 0.2s ease-out both; }
    .dop-slideUp { animation: dop-slideUp 0.3s ease-out both; }
    .dop-stagger-1 { animation-delay: 0.05s; }
    .dop-stagger-2 { animation-delay: 0.1s; }
    .dop-stagger-3 { animation-delay: 0.15s; }
    .dop-stagger-4 { animation-delay: 0.2s; }
  `;
  document.head.appendChild(style);
}

export default function DikshaOccupyPickerModal({
  open,
  onClose,
  onPick,
  title = "Occupy Diksha Date",
  groupSize = 1,
  meetingDate = null,
}) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const c = useCT(isLight);

  useEffect(() => { ensureAnimations(); }, []);

  const today = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => toDateKey(today), [today]);

  const minDate = useMemo(() => {
    const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    if (meetingDate) {
      const [my, mm, md] = String(meetingDate).split("-").map(Number);
      if (my && mm && md) {
        const meetingDay = new Date(my, mm - 1, md);
        return meetingDay > tomorrow ? meetingDay : tomorrow;
      }
    }
    return tomorrow;
  }, [today, meetingDate]);

  const minDateKey = useMemo(() => toDateKey(minDate), [minDate]);

  const [monthCursor, setMonthCursor] = useState(() => startOfMonth(minDate));
  const [selected, setSelected] = useState("");

  const [summary, setSummary] = useState({});
  const [summaryLoading, setSummaryLoading] = useState(false);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewBusy, setPreviewBusy] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  const [mobilePreviewTab, setMobilePreviewTab] = useState("STATS");

  // BYPASS state
  const [bypassConfirmOpen, setBypassConfirmOpen] = useState(false);

  const scrollRef = useRef(null);

  const mcYear = monthCursor.getFullYear();
  const mcMonth = monthCursor.getMonth();

  const cells = useMemo(() => monthCells(mcYear, mcMonth), [mcYear, mcMonth]);
  const daysInMonth = useMemo(() => new Date(mcYear, mcMonth + 1, 0).getDate(), [mcYear, mcMonth]);
  const monthDays = useMemo(
    () => Array.from({ length: daysInMonth }, (_, i) => new Date(mcYear, mcMonth, i + 1)),
    [daysInMonth, mcYear, mcMonth]
  );

  const monthLabel = useMemo(() => {
    return monthCursor.toLocaleString(undefined, { month: "long", year: "numeric" });
  }, [monthCursor]);

  // Default capacity hint for heatmap (before container loaded)
  const defaultLimit = 20;

  // Load DIKSHA summary
  useEffect(() => {
    if (!open) return;
    const ac = new AbortController();
    (async () => {
      setSummaryLoading(true);
      try {
        const from = ymdLocal(new Date(mcYear, mcMonth, 1));
        const to = ymdLocal(new Date(mcYear, mcMonth + 1, 0));
        const res = await fetch(`/api/calander/summary?from=${from}&to=${to}&mode=DIKSHA`, { signal: ac.signal });
        const data = await res.json().catch(() => ({}));
        setSummary(data.map || {});
      } catch (e) {
        if (String(e?.name) === "AbortError") return;
        setSummary({});
      } finally {
        setSummaryLoading(false);
      }
    })();
    return () => ac.abort();
  }, [open, mcYear, mcMonth]);

  // Auto-scroll to minDate on mobile
  useEffect(() => {
    if (!open || !scrollRef.current) return;
    setTimeout(() => {
      const el = scrollRef.current?.querySelector(`[data-date="${minDateKey}"]`);
      if (el) el.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
    }, 100);
  }, [open, minDateKey, mcMonth]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setBypassConfirmOpen(false);
      setSelected("");
      setPreviewOpen(false);
      setPreviewData(null);
    }
  }, [open]);

  const openPreview = useCallback(async (dateKey) => {
    setSelected(dateKey);
    setPreviewBusy(true);
    setPreviewData({ dateKey, container: null, assignments: [], reserved: [], error: null });
    setPreviewOpen(true);
    setMobilePreviewTab("STATS");

    try {
      const cRes = await fetch("/api/calander/container/by-date", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: dateKey, mode: "DIKSHA" }),
      });
      const cData = await cRes.json().catch(() => ({}));
      if (!cRes.ok) {
        setPreviewData({ dateKey, container: null, assignments: [], reserved: [], error: cData.error || "Container load failed" });
        return;
      }
      const containerObj = cData?.container?.value ?? cData?.container;
      const containerId = containerObj?._id;
      if (!containerId) {
        setPreviewData({ dateKey, container: null, assignments: [], reserved: [], error: "Invalid container response" });
        return;
      }
      const cId = safeId(containerId);
      const dRes = await fetch(`/api/calander/container/${cId}?includeReserved=1`);
      const dData = await dRes.json().catch(() => ({}));
      if (!dRes.ok) {
        setPreviewData({ dateKey, container: null, assignments: [], reserved: [], error: dData.error || "Details load failed" });
        return;
      }
      setPreviewData({
        dateKey,
        container: dData.container || containerObj,
        assignments: dData.assignments || [],
        reserved: dData.reserved || [],
        error: null,
      });
    } catch {
      setPreviewData({ dateKey, container: null, assignments: [], reserved: [], error: "Network error" });
    } finally {
      setPreviewBusy(false);
    }
  }, []);

  const assignedStats = useMemo(() => countStats(previewData?.assignments || []), [previewData?.assignments]);
  const reservedStats = useMemo(() => countStats(previewData?.reserved || []), [previewData?.reserved]);

  const limit = previewData?.container?.limit || 20;
  const used = assignedStats.total + reservedStats.total;
  const remaining = limit - used;
  const canOccupy = !previewBusy && !previewData?.error && (used + groupSize <= limit);
  const gauge = getGaugeTier(remaining, c);

  function isDateDisabled(d) {
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const minStart = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
    return dayStart < minStart;
  }

  function handleBypassActivate() {
    setBypassConfirmOpen(true);
  }

  function handleBypassConfirm() {
    setBypassConfirmOpen(false);
    onPick?.("BYPASS");
  }

  return (
    <>
      {/* ═══════ Layer 1: Calendar Picker ═══════ */}
      <LayerModal
        open={open}
        layerName="Occupy"
        title={title}
        sub={
          meetingDate
            ? `Meeting: ${meetingDate} • Occupy: ${meetingDate} se aage (same allowed)`
            : "Diksha date select karo → Preview → Confirm"
        }
        onClose={() => {
          setPreviewOpen(false);
          setPreviewData(null);
          setSelected("");
          setBypassConfirmOpen(false);
          onClose?.();
        }}
        maxWidth="max-w-5xl"
        disableBackdropClose
      >
        {/* Info banner */}
        {meetingDate && (
          <div
            className="dop-fadeIn"
            style={{
              borderRadius: 18,
              border: `1px solid ${c.meetingBorder}`,
              background: c.meetingBg,
              padding: 12,
              marginBottom: 12,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: c.meetingText }}>
              📅 Meeting Date: {meetingDate}
            </div>
            <div style={{ fontSize: 11, color: c.meetingText, opacity: 0.7, marginTop: 4 }}>
              Diksha occupy date: <b>{meetingDate}</b> se aage (same date bhi allowed). Earliest: <b>{minDateKey}</b>
            </div>
          </div>
        )}

        {/* Month Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-3 dop-fadeIn dop-stagger-1" style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: c.t1 }}>{monthLabel}</div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMonthCursor((m) => addMonths(m, -1))}
              style={{
                padding: "8px 14px", borderRadius: 14,
                background: c.navBtnBg, border: `1px solid ${c.navBtnBorder}`,
                color: c.navBtnText, cursor: "pointer", transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = c.navBtnHover; e.currentTarget.style.transform = "scale(1.05)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = c.navBtnBg; e.currentTarget.style.transform = ""; }}
              onPointerDown={(e) => (e.currentTarget.style.transform = "scale(0.95)")}
              onPointerUp={(e) => (e.currentTarget.style.transform = "")}
            >
              ◀
            </button>
            <div
              style={{
                borderRadius: 18, background: c.dikshaBg,
                border: `1px solid ${c.dikshaBorder}`,
                padding: "6px 14px", display: "flex", alignItems: "center", gap: 6,
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 600, color: c.dikshaText }}>🔱 Diksha</span>
              {summaryLoading && (
                <div style={{ display: "flex", alignItems: "center" }}>
                  <BufferSpinner size={14} />
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setMonthCursor((m) => addMonths(m, 1))}
              style={{
                padding: "8px 14px", borderRadius: 14,
                background: c.navBtnBg, border: `1px solid ${c.navBtnBorder}`,
                color: c.navBtnText, cursor: "pointer", transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = c.navBtnHover; e.currentTarget.style.transform = "scale(1.05)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = c.navBtnBg; e.currentTarget.style.transform = ""; }}
              onPointerDown={(e) => (e.currentTarget.style.transform = "scale(0.95)")}
              onPointerUp={(e) => (e.currentTarget.style.transform = "")}
            >
              ▶
            </button>
          </div>
        </div>

        {/* Selected info bar */}
        <div className="flex items-center justify-between dop-fadeIn dop-stagger-2" style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: c.t3 }}>
            Selected: <b style={{ color: c.t1 }}>{selected || "—"}</b> • Group: <b style={{ color: c.t1 }}>{groupSize}</b>
          </div>
          <div className="flex items-center gap-3">
            {meetingDate && (
              <div style={{ fontSize: 12, color: c.t4 }}>Min: <b>{minDateKey}</b></div>
            )}
            {/* Heatmap Legend */}
            <div className="hidden sm:flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span style={{ width: 8, height: 8, borderRadius: 3, background: c.gaugeOk }} />
                <span style={{ fontSize: 9, color: c.t4 }}>Available</span>
              </div>
              <div className="flex items-center gap-1">
                <span style={{ width: 8, height: 8, borderRadius: 3, background: c.gaugeWarn }} />
                <span style={{ fontSize: 9, color: c.t4 }}>Filling</span>
              </div>
              <div className="flex items-center gap-1">
                <span style={{ width: 8, height: 8, borderRadius: 3, background: c.gaugeFull }} />
                <span style={{ fontSize: 9, color: c.t4 }}>Full</span>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════ MOBILE: Day Strip ═══════ */}
        <div className="block md:hidden dop-fadeIn dop-stagger-2">
          <div
            style={{
              borderRadius: 20, border: `1px solid ${c.surfaceBorder}`,
              background: c.surfaceBg, padding: 12,
            }}
          >
            <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: c.t3 }}>Select Date</span>
              <div className="flex items-center gap-2">
                {/* Mobile heatmap legend */}
                <div className="flex items-center gap-1.5">
                  <span style={{ width: 6, height: 6, borderRadius: 2, background: c.gaugeOk }} />
                  <span style={{ width: 6, height: 6, borderRadius: 2, background: c.gaugeWarn }} />
                  <span style={{ width: 6, height: 6, borderRadius: 2, background: c.gaugeFull }} />
                </div>
                <span style={{ fontSize: 10, color: c.t4 }}>
                  🔱 {monthCursor.toLocaleString("default", { month: "short" })} {mcYear}
                </span>
              </div>
            </div>

            <div
              ref={scrollRef}
              className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1"
              style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
            >
              {monthDays.map((d, dayIdx) => {
                const dateKey = toDateKey(d);
                const isSelected = selected === dateKey;
                const isToday = dateKey === todayKey;
                const weekday = d.toLocaleDateString("default", { weekday: "short" });
                const isSun = d.getDay() === 0;
                const disabled = isDateDisabled(d);
                const isMeetingDay = meetingDate && dateKey === meetingDate;
                const s = summary?.[dateKey];
                const hasCards = s && (s.male + s.female) > 0;
                const heatmap = getHeatmapStyle(summary, dateKey, defaultLimit, c);

                let borderColor = c.dayBorder;
                let bg = c.dayBg;
                let ringStyle = {};

                if (isSelected) {
                  borderColor = c.dikshaBorder;
                  bg = c.dikshaBg;
                  ringStyle = { boxShadow: `0 0 0 2px ${c.dikshaAccent}40` };
                } else if (isToday) {
                  borderColor = c.dayTodayBorder;
                  ringStyle = { boxShadow: `0 0 0 2px ${c.dayTodayRing}, 0 0 30px ${c.dayTodayGlow}` };
                } else if (isMeetingDay) {
                  borderColor = c.meetingBorder;
                  bg = c.meetingBg;
                } else if (heatmap.bg !== "transparent") {
                  bg = heatmap.bg;
                }

                return (
                  <button
                    key={dateKey}
                    data-date={dateKey}
                    type="button"
                    disabled={disabled}
                    onClick={() => openPreview(dateKey)}
                    style={{
                      flexShrink: 0, minWidth: 80, borderRadius: 18,
                      border: `1px solid ${borderColor}`, background: bg,
                      padding: "10px 12px", textAlign: "left",
                      scrollSnapAlign: "start", transition: "all 0.15s",
                      cursor: disabled ? "not-allowed" : "pointer",
                      opacity: disabled ? 0.3 : 1,
                      position: "relative", overflow: "hidden",
                      ...ringStyle,
                    }}
                  >
                    {/* Heatmap indicator bar */}
                    {heatmap.indicator && !isSelected && (
                      <div style={{
                        position: "absolute", bottom: 0, left: 0, right: 0, height: 3,
                        background: heatmap.indicator, borderRadius: "0 0 18px 18px",
                        transition: "background 0.3s",
                      }} />
                    )}

                    <div className="flex items-center justify-between gap-1">
                      <span style={{ fontSize: 11, fontWeight: 600, color: isSun ? c.daySunText : c.t2 }}>{weekday}</span>
                      <div className="flex items-center gap-1">
                        {isToday && <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.dayTodayDot, flexShrink: 0 }} />}
                        {isMeetingDay && <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.meetingAccent, flexShrink: 0 }} />}
                      </div>
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.2, marginTop: 2, color: c.t1 }}>{d.getDate()}</div>

                    {/* Quick capacity preview */}
                    {hasCards ? (
                      <div style={{ marginTop: 6 }}>
                        <div className="flex items-center gap-1.5" style={{ marginBottom: 3 }}>
                          <span style={{ fontSize: 10, color: c.t2, fontWeight: 600 }}>{s.male + s.female}</span>
                          {heatmap.level && (
                            <span style={{
                              width: 6, height: 6, borderRadius: "50%",
                              background: heatmap.indicator,
                              flexShrink: 0,
                            }} />
                          )}
                        </div>
                        <div className="flex gap-1">
                          <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 999, background: c.maleBg, border: `1px solid ${c.maleBorder}`, color: c.maleText }}>M{s.male}</span>
                          <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 999, background: c.femaleBg, border: `1px solid ${c.femaleBorder}`, color: c.femaleText }}>F{s.female}</span>
                        </div>
                      </div>
                    ) : (
                      <div style={{ marginTop: 6 }}>
                        <span style={{ fontSize: 10, color: c.dayEmptyText }}>—</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ═══════ DESKTOP: Monthly Grid ═══════ */}
        <div className="hidden md:block dop-fadeIn dop-stagger-2">
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, i) => (
              <div key={d} className="text-center" style={{ fontSize: 11, fontWeight: 500, color: i === 0 ? c.weekdaySun : c.weekdayText }}>{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {cells.map((d, idx) => {
              if (!d) return <div key={`e-${idx}`} />;
              const dateKey = toDateKey(d);
              const inMonth = d.getMonth() === mcMonth;
              const disabled = isDateDisabled(d);
              const isSelected = selected === dateKey;
              const isToday = dateKey === todayKey;
              const isMeetingDay = meetingDate && dateKey === meetingDate;
              const s = summary?.[dateKey];
              const hasCards = s && (s.male + s.female) > 0;
              const isSun = idx % 7 === 0;
              const heatmap = getHeatmapStyle(summary, dateKey, defaultLimit, c);

              let borderColor = c.dayBorder;
              let bg = c.dayBg;
              let ringStyle = {};

              if (isSelected) {
                borderColor = c.dikshaBorder;
                bg = c.dikshaBg;
                ringStyle = { boxShadow: `0 0 0 2px ${c.dikshaAccent}40` };
              } else if (isToday) {
                borderColor = c.dayTodayBorder;
                ringStyle = { boxShadow: `0 0 0 2px ${c.dayTodayRing}` };
              } else if (isMeetingDay) {
                borderColor = c.meetingBorder;
                bg = c.meetingBg;
              } else if (heatmap.bg !== "transparent" && !disabled) {
                bg = heatmap.bg;
              }

              return (
                <button
                  key={dateKey}
                  type="button"
                  disabled={disabled}
                  onClick={() => openPreview(dateKey)}
                  className="text-left"
                  style={{
                    minHeight: 90, borderRadius: 18,
                    border: `1px solid ${borderColor}`, background: bg,
                    padding: "8px 10px",
                    cursor: disabled ? "not-allowed" : "pointer",
                    opacity: disabled ? 0.3 : !inMonth ? 0.4 : 1,
                    position: "relative", overflow: "hidden",
                    transition: "all 0.18s ease",
                    ...ringStyle,
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected && !disabled) {
                      e.currentTarget.style.background = c.dayHover;
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = `0 4px 12px ${c.surfaceBorder}`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected && !disabled) {
                      e.currentTarget.style.background = bg;
                      e.currentTarget.style.transform = "";
                      e.currentTarget.style.boxShadow = ringStyle.boxShadow || "";
                    }
                  }}
                  title={isMeetingDay ? `Meeting date (${meetingDate}) — ✅ selectable` : disabled ? `Before minimum date (${minDateKey})` : `${dateKey} — Click to preview`}
                >
                  {/* Heatmap indicator */}
                  {heatmap.indicator && !isSelected && !disabled && (
                    <div style={{
                      position: "absolute", top: 0, left: 0, right: 0, height: 3,
                      background: heatmap.indicator, borderRadius: "18px 18px 0 0",
                    }} />
                  )}

                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: 13, fontWeight: 600, color: isSun ? c.daySunText : c.dayText }}>{d.getDate()}</span>
                    {isToday ? (
                      <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: 10, background: c.dayTodayGlow, border: `1px solid ${c.dayTodayBorder}`, color: c.dayTodayDot, fontWeight: 600 }}>Today</span>
                    ) : isMeetingDay ? (
                      <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: 10, background: c.meetingBg, border: `1px solid ${c.meetingBorder}`, color: c.meetingText, fontWeight: 600 }}>Meet</span>
                    ) : null}
                  </div>
                  <div style={{ fontSize: 10, color: c.t4, marginTop: 2 }}>DIKSHA</div>

                  {hasCards ? (
                    <>
                      <div className="flex gap-1.5 flex-wrap" style={{ marginTop: 8 }}>
                        <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 999, background: c.maleBg, border: `1px solid ${c.maleBorder}`, color: c.maleText }}>M {s.male}</span>
                        <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 999, background: c.femaleBg, border: `1px solid ${c.femaleBorder}`, color: c.femaleText }}>F {s.female}</span>
                      </div>
                      {/* Quick capacity indicator */}
                      <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
                        <div style={{ flex: 1, height: 3, borderRadius: 999, background: c.gaugeTrack, overflow: "hidden" }}>
                          <div style={{
                            height: "100%", borderRadius: 999,
                            background: heatmap.indicator || c.gaugeOk,
                            width: `${Math.min(100, ((s.male + s.female) / defaultLimit) * 100)}%`,
                            transition: "width 0.3s ease",
                          }} />
                        </div>
                        <span style={{ fontSize: 8, color: c.t4, flexShrink: 0 }}>{s.male + s.female}</span>
                      </div>
                    </>
                  ) : (
                    <div style={{ marginTop: 8, fontSize: 10, color: c.dayEmptyText }}>—</div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ═══════ BYPASS Section ═══════ */}
        <div className="dop-fadeIn dop-stagger-3" style={{ marginTop: 16 }}>
          {/* Separator */}
          <div className="flex items-center gap-3" style={{ marginBottom: 12 }}>
            <div style={{ flex: 1, height: 1, background: c.divider }} />
            <span style={{ fontSize: 11, color: c.t4, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em" }}>OR</span>
            <div style={{ flex: 1, height: 1, background: c.divider }} />
          </div>

          <div
            style={{
              borderRadius: 20,
              border: `1px solid ${c.bypassBorder}`,
              background: c.bypassBg,
              padding: 16,
              position: "relative",
              overflow: "hidden",
              animation: "dop-bypassPulse 3s ease-in-out infinite",
            }}
          >
            {/* Bypass glow accent */}
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 2,
              background: `linear-gradient(90deg, transparent, ${c.bypassText}, transparent)`,
              opacity: 0.5,
            }} />

            <div className="flex items-start gap-3">
              <div
                style={{
                  width: 44, height: 44, borderRadius: 14,
                  background: c.bypassBg,
                  border: `1px solid ${c.bypassBorder}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20, flexShrink: 0,
                }}
              >
                ⚡
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: c.bypassText }}>
                  BYPASS
                </div>
                <div style={{ fontSize: 12, color: c.bypassText, opacity: 0.7, marginTop: 4, lineHeight: 1.5 }}>
                  Diksha date skip karo. Meeting confirm hone ke baad card <b>Pending container</b> me chala jayega instead of Diksha.
                </div>
                <div style={{
                  marginTop: 8, padding: "6px 10px", borderRadius: 12,
                  background: c.panelBg, border: `1px solid ${c.panelBorder}`,
                  fontSize: 11, color: c.t3, lineHeight: 1.4,
                }}>
                  💡 Use when: Kisi specific card ko abhi Diksha date nahi dena chahte — baad me Pending se handle karenge.
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleBypassActivate}
              style={{
                marginTop: 12, width: "100%", padding: "12px 16px",
                borderRadius: 16,
                background: c.bypassText,
                color: isLight ? "#ffffff" : "#000000",
                fontSize: 14, fontWeight: 700,
                border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.02)"; e.currentTarget.style.opacity = "0.9"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.opacity = ""; }}
              onPointerDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
              onPointerUp={(e) => (e.currentTarget.style.transform = "")}
            >
              ⚡ Activate Bypass
            </button>
          </div>
        </div>
      </LayerModal>

      {/* ═══════ Layer 2: Preview Modal ═══════ */}
      <LayerModal
        open={previewOpen}
        layerName="Diksha Preview"
        title="Diksha Container Preview"
        sub={previewData?.dateKey ? `${previewData.dateKey} • 🔱 DIKSHA` : "Loading..."}
        onClose={() => setPreviewOpen(false)}
        maxWidth="max-w-5xl"
        disableBackdropClose
      >
        {previewBusy ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div style={{
              width: 48, height: 48, borderRadius: "50%",
              border: `3px solid ${c.t4}`, borderTopColor: c.dikshaAccent,
              animation: "dop-pulseGlow 1.5s ease-in-out infinite",
            }} className="animate-spin" />
            <span style={{ color: c.t3, fontSize: 14 }}>Loading container...</span>
          </div>
        ) : previewData?.error ? (
          <div className="dop-scaleIn" style={{
            borderRadius: 20, border: `1px solid ${c.housefullBorder}`,
            background: c.housefullBg, padding: 20, textAlign: "center",
          }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>⚠️</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: c.housefullAccent, marginBottom: 4 }}>Something went wrong</div>
            <div style={{ fontSize: 13, color: c.housefullText }}>{previewData.error}</div>
          </div>
        ) : (
          <>
            {/* ─── Capacity Gauge (Animated) ─── */}
            <div className="dop-slideUp" style={{
              borderRadius: 20, border: `1px solid ${c.panelBorder}`,
              background: c.panelBg, padding: 18, marginBottom: 14,
            }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 11, color: c.t3, textTransform: "uppercase", letterSpacing: "0.05em" }}>CAPACITY</div>
                  <div className="flex items-baseline gap-2" style={{ marginTop: 4 }}>
                    <span style={{ fontSize: 28, fontWeight: 800, color: c.t1, lineHeight: 1 }}>{used}</span>
                    <span style={{ fontSize: 16, fontWeight: 500, color: c.t4 }}>/ {limit}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span style={{
                    background: gauge.bg, border: `1px solid ${gauge.border}`,
                    color: gauge.text, borderRadius: 999,
                    padding: "5px 16px", fontSize: 14, fontWeight: 700,
                  }}>
                    {remaining} left
                  </span>
                  <span style={{ fontSize: 10, color: c.t4 }}>{gauge.label}</span>
                </div>
              </div>

              {/* Animated gauge bar */}
              <div style={{ height: 10, borderRadius: 999, background: c.gaugeTrack, overflow: "hidden", position: "relative" }}>
                <div style={{
                  height: "100%", borderRadius: 999,
                  background: gauge.bar,
                  width: `${Math.min(100, (used / limit) * 100)}%`,
                  transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                }} />
                {/* Animated shimmer on gauge */}
                <div style={{
                  position: "absolute", top: 0, left: 0,
                  width: `${Math.min(100, (used / limit) * 100)}%`,
                  height: "100%", borderRadius: 999,
                  background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)",
                  animation: remaining > 0 ? "none" : "dop-pulseGlow 2s ease-in-out infinite",
                }} />
              </div>

              {/* Occupy info */}
              <div className="flex items-center justify-between flex-wrap gap-2" style={{ marginTop: 10 }}>
                <div style={{ fontSize: 12, color: c.t3 }}>
                  Occupy karega: <b style={{ color: c.t1 }}>{groupSize}</b> slot(s)
                </div>
                <span style={{
                  padding: "4px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600,
                  background: canOccupy ? c.gaugeOkBg : c.gaugeFullBg,
                  border: `1px solid ${canOccupy ? c.gaugeOkBorder : c.gaugeFullBorder}`,
                  color: canOccupy ? c.gaugeOkText : c.gaugeFullText,
                }}>
                  {canOccupy ? "✅ Allowed" : "❌ Housefull"}
                </span>
              </div>
            </div>

            {/* ─── Mobile Tabs ─── */}
            <div className="block md:hidden dop-fadeIn dop-stagger-1" style={{ marginBottom: 12 }}>
              <div className="flex gap-1.5">
                {[
                  { key: "STATS", label: "📊 Stats" },
                  { key: "CARDS", label: `📋 Cards (${assignedStats.total})` },
                  { key: "RESERVED", label: `🔒 Reserved (${reservedStats.total})` },
                ].map((tab) => {
                  const active = mobilePreviewTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setMobilePreviewTab(tab.key)}
                      style={{
                        flex: 1, padding: "8px 12px", borderRadius: 14,
                        fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer",
                        background: active ? c.tabActiveBg : c.tabInactiveBg,
                        color: active ? c.tabActiveText : c.tabInactiveText,
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = c.tabInactiveHover; }}
                      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = c.tabInactiveBg; }}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ─── Mobile Tab Content ─── */}
            <div className="block md:hidden">
              <div className="dop-fadeIn">
                {mobilePreviewTab === "STATS" && (
                  <div className="space-y-3">
                    <StatsBox title="IN CONTAINER" stats={assignedStats} tone="normal" c={c} />
                    <StatsBox title="RESERVED (Meeting holds)" stats={reservedStats} tone="green" c={c} />
                  </div>
                )}
                {mobilePreviewTab === "CARDS" && (
                  <CardsList title="Cards in Container" list={previewData?.assignments || []} c={c} emptyIcon="📋" emptyText="No cards assigned yet" />
                )}
                {mobilePreviewTab === "RESERVED" && (
                  <CardsList title="Reserved Holds" list={previewData?.reserved || []} c={c} emptyIcon="🔒" emptyText="No reservations yet" />
                )}
              </div>
            </div>

            {/* ─── Desktop Grid ─── */}
            <div className="hidden md:block dop-fadeIn dop-stagger-1">
              <div className="grid sm:grid-cols-2 gap-3" style={{ marginBottom: 12 }}>
                <StatsBox title="IN CONTAINER" stats={assignedStats} tone="normal" c={c} />
                <StatsBox title="RESERVED (Meeting holds)" stats={reservedStats} tone="green" c={c} />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <CardsList title="Cards in Container" list={previewData?.assignments || []} c={c} emptyIcon="📋" emptyText="No cards assigned yet" />
                <CardsList title="Reserved Holds" list={previewData?.reserved || []} c={c} emptyIcon="🔒" emptyText="No reservations yet" />
              </div>
            </div>
          </>
        )}

        {/* ─── Action Buttons ─── */}
        <div className="flex gap-2 dop-slideUp dop-stagger-3" style={{ marginTop: 16 }}>
          <button
            type="button"
            onClick={() => setPreviewOpen(false)}
            style={{
              flex: 1, padding: "13px 16px", borderRadius: 18,
              background: c.btnGhostBg, color: c.btnGhostText,
              border: `1px solid ${c.btnGhostBorder}`,
              cursor: "pointer", fontSize: 14, fontWeight: 500,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = c.btnGhostHover; e.currentTarget.style.transform = "scale(1.02)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = c.btnGhostBg; e.currentTarget.style.transform = ""; }}
          >
            ← Back
          </button>
          <button
            type="button"
            disabled={!previewData?.dateKey || !canOccupy}
            onClick={() => onPick?.(previewData.dateKey)}
            style={{
              flex: 1, padding: "13px 16px", borderRadius: 18,
              background: canOccupy ? c.btnConfirmSolidBg : c.gaugeFullBg,
              color: canOccupy ? c.btnConfirmSolidText : c.gaugeFullText,
              border: "none",
              cursor: !previewData?.dateKey || !canOccupy ? "not-allowed" : "pointer",
              opacity: !previewData?.dateKey || !canOccupy ? 0.6 : 1,
              fontSize: 14, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              transition: "all 0.15s",
            }}
            onPointerDown={(e) => { if (canOccupy) e.currentTarget.style.transform = "scale(0.98)"; }}
            onPointerUp={(e) => (e.currentTarget.style.transform = "")}
            onPointerLeave={(e) => (e.currentTarget.style.transform = "")}
          >
            {canOccupy ? "✓ Confirm Occupy" : "❌ Housefull"}
          </button>
        </div>
      </LayerModal>

      {/* ═══════ Layer 3: BYPASS Confirmation Modal ═══════ */}
      <LayerModal
        open={bypassConfirmOpen}
        layerName="Bypass Confirm"
        title="⚡ Confirm BYPASS"
        sub="Diksha date skip — card will go to Pending after Meeting confirm"
        onClose={() => setBypassConfirmOpen(false)}
        maxWidth="max-w-md"
        disableBackdropClose
      >
        <div className="dop-scaleIn">
          {/* Warning card */}
          <div style={{
            borderRadius: 20, border: `1px solid ${c.bypassBorder}`,
            background: c.bypassBg, padding: 18, marginBottom: 14,
          }}>
            <div className="flex items-start gap-3">
              <div style={{
                width: 48, height: 48, borderRadius: 16,
                background: c.bypassBg, border: `1px solid ${c.bypassBorder}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 24, flexShrink: 0,
              }}>
                ⚡
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: c.bypassText, marginBottom: 6 }}>
                  BYPASS Mode
                </div>
                <div style={{ fontSize: 13, color: c.t2, lineHeight: 1.6 }}>
                  Is card ko <b>Diksha date nahi milegi</b>. Meeting confirm hone ke baad ye card <b>Pending container</b> me automatically chala jayega.
                </div>
              </div>
            </div>
          </div>

          {/* What will happen */}
          <div style={{
            borderRadius: 18, border: `1px solid ${c.panelBorder}`,
            background: c.panelBg, padding: 16, marginBottom: 14,
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: c.t1, marginBottom: 10 }}>
              Kya hoga:
            </div>
            <div className="space-y-2">
              {[
                { icon: "📋", text: "Card Meeting container me assign hoga (bina Diksha date)" },
                { icon: "✓", text: "Meeting confirm karne pe → card Pending me jayega" },
                { icon: "🔱", text: "Diksha container me koi slot occupy NAHI hoga" },
                { icon: "📌", text: "Card pe 'BYPASS' flag visible hoga" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3" style={{
                  padding: "8px 10px", borderRadius: 12,
                  background: i === 0 ? c.meetingBg : "transparent",
                  border: i === 0 ? `1px solid ${c.meetingBorder}` : "none",
                }}>
                  <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{item.icon}</span>
                  <span style={{ fontSize: 12, color: c.t2, lineHeight: 1.4 }}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setBypassConfirmOpen(false)}
              style={{
                flex: 1, padding: "13px 16px", borderRadius: 18,
                background: c.btnGhostBg, color: c.btnGhostText,
                border: `1px solid ${c.btnGhostBorder}`,
                cursor: "pointer", fontSize: 14, fontWeight: 500,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = c.btnGhostHover; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = c.btnGhostBg; }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleBypassConfirm}
              style={{
                flex: 1, padding: "13px 16px", borderRadius: 18,
                background: c.bypassText,
                color: isLight ? "#ffffff" : "#000000",
                border: "none", cursor: "pointer",
                fontSize: 14, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.02)"; e.currentTarget.style.opacity = "0.9"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.opacity = ""; }}
              onPointerDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
              onPointerUp={(e) => (e.currentTarget.style.transform = "")}
            >
              ⚡ Confirm Bypass
            </button>
          </div>
        </div>
      </LayerModal>
    </>
  );
}

/* ═══════════════════════════════════════════════
   SUB COMPONENTS
   ═══════════════════════════════════════════════ */

function StatsBox({ title, stats, tone, c }) {
  const isGreen = tone === "green";
  const baseBg = isGreen ? c.reservedBg : c.panelBg;
  const baseBorder = isGreen ? c.reservedBorder : c.panelBorder;

  return (
    <div
      className="dop-scaleIn"
      style={{ borderRadius: 18, padding: 16, background: baseBg, border: `1px solid ${baseBorder}` }}
    >
      <div className="flex items-center justify-between">
        <div style={{ fontSize: 12, color: c.t2, fontWeight: 500 }}>{title}</div>
        {isGreen && <span style={{ fontSize: 14 }}>🔒</span>}
      </div>
      <div style={{ fontSize: 30, fontWeight: 800, color: c.t1, marginTop: 6, lineHeight: 1 }}>
        {stats.total}
      </div>

      {/* Gender breakdown with mini bars */}
      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: 10, color: c.t4, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Gender</div>
        <div className="space-y-2">
          {[
            { label: "👨 Male", value: stats.male, bg: c.maleBg, bar: c.maleText, border: c.maleBorder, text: c.maleText },
            { label: "👩 Female", value: stats.female, bg: c.femaleBg, bar: c.femaleText, border: c.femaleBorder, text: c.femaleText },
            ...(stats.other > 0 ? [{ label: "Other", value: stats.other, bg: c.otherBg, bar: c.otherText, border: c.otherBorder, text: c.otherText }] : []),
          ].map((item, i) => (
            <div key={i}>
              <div className="flex items-center justify-between" style={{ marginBottom: 3 }}>
                <span style={{ fontSize: 11, color: item.text, fontWeight: 600 }}>{item.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: c.t1 }}>{item.value}</span>
              </div>
              <div style={{ height: 4, borderRadius: 999, background: c.gaugeTrack, overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 999, background: item.bar,
                  width: stats.total ? `${(item.value / stats.total) * 100}%` : "0%",
                  transition: "width 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
                  opacity: 0.7,
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Kinds */}
      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: 10, color: c.t4, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Kinds</div>
        <div className="flex flex-wrap gap-1.5">
          <span style={{ padding: "4px 10px", borderRadius: 999, fontSize: 11, background: c.kindBg, border: `1px solid ${c.kindBorder}`, color: c.kindText }}>
            Single {stats.single}
          </span>
          <span style={{ padding: "4px 10px", borderRadius: 999, fontSize: 11, background: c.pickerSelectedCoupleBg, border: `1px solid ${c.pickerSelectedCoupleBorder}`, color: c.femaleText }}>
            Couple {stats.couple}
          </span>
          <span style={{ padding: "4px 10px", borderRadius: 999, fontSize: 11, background: c.pickerSelectedFamilyBg, border: `1px solid ${c.pickerSelectedFamilyBorder}`, color: c.maleText }}>
            Family {stats.family}
          </span>
        </div>
      </div>
    </div>
  );
}

function CardsList({ title, list, c, emptyIcon = "📭", emptyText = "Empty" }) {
  return (
    <div style={{ borderRadius: 18, border: `1px solid ${c.panelBorder}`, background: c.panelBg, padding: 16 }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: c.t1 }}>{title}</div>
        <span style={{
          padding: "2px 10px", borderRadius: 999, fontSize: 11,
          background: c.surfaceBg, border: `1px solid ${c.surfaceBorder}`, color: c.t3,
        }}>
          {(list || []).length}
        </span>
      </div>
      <div className="space-y-2 overflow-auto pr-1" style={{ maxHeight: 300 }}>
        {(list || []).length === 0 ? (
          <div className="dop-fadeIn" style={{ textAlign: "center", padding: "24px 0" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>{emptyIcon}</div>
            <div style={{ fontSize: 13, color: c.t3 }}>{emptyText}</div>
          </div>
        ) : (
          list.map((a, i) => {
            const cust = a?.customer || {};
            const gender = cust?.gender;
            const cs = getCardStyle(gender, c);

            return (
              <div
                key={safeId(a?._id) || i}
                className="dop-fadeIn"
                style={{
                  borderRadius: 14, border: `1px solid ${cs.border}`,
                  background: cs.bg, padding: 10,
                  transition: "all 0.15s",
                  animationDelay: `${Math.min(i * 0.03, 0.3)}s`,
                  cursor: "default",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = cs.hover)}
                onMouseLeave={(e) => (e.currentTarget.style.background = cs.bg)}
              >
                <div className="flex items-center gap-2">
                  <span style={{
                    width: 24, height: 24, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, fontWeight: 700, flexShrink: 0,
                    background: cs.seq, color: cs.seqText,
                  }}>
                    {i + 1}
                  </span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{
                      fontWeight: 500, fontSize: 13, color: c.t1,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {labelCustomer(a)}
                    </div>
                    <div className="flex gap-1" style={{ marginTop: 3 }}>
                      <span style={{
                        fontSize: 9, padding: "2px 6px", borderRadius: 999,
                        background: gender === "MALE" ? c.maleBg : gender === "FEMALE" ? c.femaleBg : c.kindBg,
                        border: `1px solid ${gender === "MALE" ? c.maleBorder : gender === "FEMALE" ? c.femaleBorder : c.kindBorder}`,
                        color: gender === "MALE" ? c.maleText : gender === "FEMALE" ? c.femaleText : c.t3,
                      }}>
                        {gender || "?"}
                      </span>
                      <span style={{
                        fontSize: 9, padding: "2px 6px", borderRadius: 999,
                        background: c.kindBg, border: `1px solid ${c.kindBorder}`, color: c.kindText,
                      }}>
                        {a?.kind || "SINGLE"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

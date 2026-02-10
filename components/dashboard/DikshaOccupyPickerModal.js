// components/dashboard/DikshaOccupyPickerModal.js
"use client";

import { useEffect, useMemo, useState } from "react";
import LayerModal from "@/components/LayerModal";
import BufferSpinner from "@/components/BufferSpinner";

function pad2(n) {
  return String(n).padStart(2, "0");
}
function toDateKey(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function addMonths(d, delta) {
  return new Date(d.getFullYear(), d.getMonth() + delta, 1);
}
function ymdLocal(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

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
  const c = a?.customer || {};
  const name = c?.name || "—";
  const roll = c?.rollNo ? ` (${c.rollNo})` : "";
  const kind = a?.kind ? ` • ${a.kind}${a.roleInPair ? `(${a.roleInPair})` : ""}` : "";
  return `${name}${roll}${kind}`;
}

export default function DikshaOccupyPickerModal({
  open,
  onClose,
  onPick,
  title = "Occupy Diksha Date",
  groupSize = 1,
  meetingDate = null,
}) {
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

  // Summary for calendar counts
  const [summary, setSummary] = useState({});
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Preview
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewBusy, setPreviewBusy] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  // Mobile tab
  const [mobilePreviewTab, setMobilePreviewTab] = useState("STATS");

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

  // Load DIKSHA summary for calendar counts
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

  async function openPreview(dateKey) {
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

      const cId = typeof containerId === "object" && containerId.$oid ? containerId.$oid : String(containerId);
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
  }

  const assignedStats = useMemo(() => countStats(previewData?.assignments || []), [previewData?.assignments]);
  const reservedStats = useMemo(() => countStats(previewData?.reserved || []), [previewData?.reserved]);

  const limit = previewData?.container?.limit || 20;
  const used = assignedStats.total + reservedStats.total;
  const remaining = limit - used;
  const canOccupy = !previewBusy && !previewData?.error && (used + groupSize <= limit);

  function isDateDisabled(d) {
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const minStart = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
    return dayStart < minStart;
  }

  return (
    <>
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
          onClose?.();
        }}
        maxWidth="max-w-5xl"
        disableBackdropClose
      >
        {/* Info banner */}
        {meetingDate ? (
          <div className="mb-3 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-3">
            <div className="text-sm font-semibold text-amber-200">📅 Meeting Date: {meetingDate}</div>
            <div className="text-xs text-amber-200/70 mt-1">
              Diksha occupy date: <b>{meetingDate}</b> se aage (same date bhi allowed).
              Earliest: <b>{minDateKey}</b>
            </div>
          </div>
        ) : null}

        {/* Month Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="text-base sm:text-lg font-bold">{monthLabel}</div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMonthCursor((m) => addMonths(m, -1))}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10"
            >
              ◀
            </button>
            <div className="rounded-2xl bg-black/30 border border-white/10 p-1 flex items-center gap-1">
              <span className="px-3 py-2 rounded-xl text-sm bg-purple-500/20 border border-purple-400/20 text-purple-200 font-semibold">
                🔱 Diksha
              </span>
              {summaryLoading ? <BufferSpinner size={14} /> : null}
            </div>
            <button
              type="button"
              onClick={() => setMonthCursor((m) => addMonths(m, 1))}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10"
            >
              ▶
            </button>
          </div>
        </div>

        {/* Selected info */}
        <div className="mb-3 flex items-center justify-between">
          <div className="text-xs text-white/60">
            Selected: <b className="text-white">{selected || "—"}</b> • Group: <b className="text-white">{groupSize}</b>
          </div>
          {meetingDate ? (
            <div className="text-xs text-white/50">
              Min: <b>{minDateKey}</b>
            </div>
          ) : null}
        </div>

        {/* ═══════ MOBILE: Day Strip ═══════ */}
        <div className="block md:hidden">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-white/60">Select Date</div>
              <div className="text-[10px] text-white/40">
                🔱 Diksha Occupy • {monthCursor.toLocaleString("default", { month: "short" })} {mcYear}
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory">
              {monthDays.map((d) => {
                const dateKey = toDateKey(d);
                const isSelected = selected === dateKey;
                const isToday = dateKey === todayKey;
                const weekday = d.toLocaleDateString("default", { weekday: "short" });
                const isSun = d.getDay() === 0;
                const disabled = isDateDisabled(d);
                const isMeetingDay = meetingDate && dateKey === meetingDate;
                const s = summary?.[dateKey];
                const hasCards = s && (s.male + s.female) > 0;

                return (
                  <button
                    key={dateKey}
                    type="button"
                    disabled={disabled}
                    onClick={() => openPreview(dateKey)}
                    className={[
                      "shrink-0 min-w-[76px] rounded-2xl border px-3 py-2.5 text-left snap-start transition-all",
                      "bg-black/30 border-white/10",
                      isSelected ? "ring-2 ring-purple-500/60 bg-purple-500/10 border-purple-400/30" : "",
                      isToday && !isSelected ? "border-emerald-400/30 shadow-[0_0_30px_rgba(16,185,129,0.12)]" : "",
                      isMeetingDay && !isSelected ? "border-amber-400/30 bg-amber-500/5" : "",
                      disabled ? "opacity-30 cursor-not-allowed" : "",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <div className={["text-[11px] font-semibold", isSun ? "text-red-300" : "text-white/80"].join(" ")}>
                        {weekday}
                      </div>
                      {isToday ? <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> : null}
                      {isMeetingDay ? <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> : null}
                    </div>
                    <div className="text-lg font-bold leading-6 mt-0.5">{d.getDate()}</div>

                    {hasCards ? (
                      <div className="mt-1.5 space-y-0.5">
                        <div className="text-[10px] text-white/70 font-medium">{s.male + s.female} cards</div>
                        <div className="flex gap-1">
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/20 text-blue-200">
                            M{s.male}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-pink-500/20 border border-pink-400/20 text-pink-200">
                            F{s.female}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-1.5 text-[10px] text-white/30">—</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ═══════ DESKTOP: Monthly Grid ═══════ */}
        <div className="hidden md:block">
          <div className="grid grid-cols-7 gap-1 sm:gap-2 text-[10px] sm:text-xs mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, i) => (
              <div key={d} className={`${i === 0 ? "text-red-300" : "text-white/70"} text-center`}>{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {cells.map((d, idx) => {
              if (!d) return <div key={idx} />;
              const dateKey = toDateKey(d);
              const inMonth = d.getMonth() === mcMonth;
              const disabled = isDateDisabled(d);
              const isSelected = selected === dateKey;
              const isToday = dateKey === todayKey;
              const isMeetingDay = meetingDate && dateKey === meetingDate;
              const s = summary?.[dateKey];
              const hasCards = s && (s.male + s.female) > 0;

              return (
                <button
                  key={dateKey}
                  type="button"
                  disabled={disabled}
                  onClick={() => openPreview(dateKey)}
                  className={[
                    "min-h-[62px] sm:min-h-[84px] rounded-2xl border p-1.5 sm:p-2 text-left transition",
                    "bg-black/30 border-white/10",
                    !inMonth ? "opacity-40" : "",
                    disabled ? "opacity-30 cursor-not-allowed" : "hover:bg-black/40",
                    isSelected ? "ring-2 ring-purple-500/60 bg-purple-500/10" : "",
                    isToday ? "ring-2 ring-emerald-400/60 border-emerald-400/30" : "",
                    isMeetingDay && !isSelected ? "border-amber-400/40 bg-amber-500/5" : "",
                    idx % 7 === 0 ? "ring-1 ring-red-500/20" : "",
                  ].join(" ")}
                  title={
                    isMeetingDay
                      ? `Meeting date (${meetingDate}) — ✅ selectable`
                      : disabled
                      ? `Before minimum date (${minDateKey})`
                      : dateKey
                  }
                >
                  <div className="flex items-center justify-between">
                    <div className={`text-xs sm:text-sm font-semibold ${idx % 7 === 0 ? "text-red-200" : "text-white"}`}>
                      {d.getDate()}
                    </div>
                    {isToday ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 border border-emerald-400/20 text-emerald-200">
                        Today
                      </span>
                    ) : isMeetingDay ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 border border-amber-400/20 text-amber-200">
                        Meet
                      </span>
                    ) : null}
                  </div>

                  <div className="text-[10px] text-white/50">DIKSHA</div>

                  {hasCards ? (
                    <div className="mt-1.5 sm:mt-2 text-[10px] sm:text-[11px] text-white/80 flex gap-1.5 sm:gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-400/15 text-blue-200">M {s.male}</span>
                      <span className="px-2 py-0.5 rounded-full bg-pink-500/15 border border-pink-400/15 text-pink-200">F {s.female}</span>
                    </div>
                  ) : (
                    <div className="mt-1.5 sm:mt-2 text-[10px] sm:text-[11px] text-white/35">—</div>
                  )}

                  {hasCards ? (
                    <div className="mt-1 text-[9px] text-white/40">{s.male + s.female} cards</div>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      </LayerModal>

      {/* ═══════ Preview Modal — Enhanced ═══════ */}
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
          <div className="flex items-center justify-center py-12 gap-3 text-white/60">
            <BufferSpinner size={20} /> Loading container...
          </div>
        ) : previewData?.error ? (
          <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">
            {previewData.error}
          </div>
        ) : (
          <>
            {/* ✅ Capacity Gauge */}
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4 mb-3">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="text-xs text-white/60">CAPACITY</div>
                  <div className="text-xl font-bold mt-0.5">{used} / {limit}</div>
                </div>
                <div className={`text-sm font-bold px-3 py-1.5 rounded-full border ${
                  remaining <= 0
                    ? "bg-red-500/15 border-red-400/20 text-red-200"
                    : remaining <= 3
                    ? "bg-amber-500/15 border-amber-400/20 text-amber-200"
                    : "bg-emerald-500/15 border-emerald-400/20 text-emerald-200"
                }`}>
                  {remaining} left
                </div>
              </div>
              <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    remaining <= 0 ? "bg-red-500/60" : remaining <= 3 ? "bg-amber-500/60" : "bg-emerald-500/60"
                  }`}
                  style={{ width: `${Math.min(100, (used / limit) * 100)}%` }}
                />
              </div>
              <div className="mt-2 text-xs text-white/50">
                Occupy karega: <b>{groupSize}</b> slot(s) • Allowed: <b>{canOccupy ? "YES ✅" : "NO ❌ (Housefull)"}</b>
              </div>
            </div>

            {/* ✅ Mobile: Tabs */}
            <div className="block md:hidden mb-3">
              <div className="flex gap-1.5">
                <button
                  onClick={() => setMobilePreviewTab("STATS")}
                  className={`flex-1 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    mobilePreviewTab === "STATS" ? "bg-white text-black" : "bg-white/10 text-white/70"
                  }`}
                >
                  📊 Stats
                </button>
                <button
                  onClick={() => setMobilePreviewTab("CARDS")}
                  className={`flex-1 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    mobilePreviewTab === "CARDS" ? "bg-white text-black" : "bg-white/10 text-white/70"
                  }`}
                >
                  📋 Cards ({assignedStats.total})
                </button>
                <button
                  onClick={() => setMobilePreviewTab("RESERVED")}
                  className={`flex-1 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    mobilePreviewTab === "RESERVED" ? "bg-white text-black" : "bg-white/10 text-white/70"
                  }`}
                >
                  🔒 Reserved ({reservedStats.total})
                </button>
              </div>
            </div>

            {/* ✅ Mobile: Tab Content */}
            <div className="block md:hidden">
              {mobilePreviewTab === "STATS" ? (
                <div className="space-y-3">
                  <StatsBox title="IN CONTAINER" stats={assignedStats} tone="normal" />
                  <StatsBox title="RESERVED (Meeting holds)" stats={reservedStats} tone="green" />
                </div>
              ) : mobilePreviewTab === "CARDS" ? (
                <CardsList title="Cards in Container" list={previewData?.assignments || []} />
              ) : (
                <CardsList title="Reserved Holds" list={previewData?.reserved || []} />
              )}
            </div>

            {/* ✅ Desktop: Grid Layout */}
            <div className="hidden md:block">
              <div className="grid sm:grid-cols-2 gap-3 mb-3">
                <StatsBox title="IN CONTAINER" stats={assignedStats} tone="normal" />
                <StatsBox title="RESERVED (Meeting holds)" stats={reservedStats} tone="green" />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <CardsList title="Cards in Container" list={previewData?.assignments || []} />
                <CardsList title="Reserved Holds" list={previewData?.reserved || []} />
              </div>
            </div>
          </>
        )}

        {/* Buttons */}
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setPreviewOpen(false)}
            className="flex-1 px-4 py-3 rounded-2xl bg-white/10 border border-white/10 hover:bg-white/15"
          >
            Back
          </button>
          <button
            type="button"
            disabled={!previewData?.dateKey || !canOccupy}
            onClick={() => onPick?.(previewData.dateKey)}
            className="flex-1 px-4 py-3 rounded-2xl bg-white text-black font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {canOccupy ? "✓ Confirm Occupy" : "❌ Housefull"}
          </button>
        </div>
      </LayerModal>
    </>
  );
}

/* ═══════ Sub Components ═══════ */

function StatsBox({ title, stats, tone }) {
  const base = tone === "green"
    ? "border-emerald-400/20 bg-emerald-500/10"
    : "border-white/10 bg-black/25";

  return (
    <div className={`rounded-2xl border p-4 ${base}`}>
      <div className="text-xs text-white/70 font-medium">{title}</div>
      <div className="text-2xl font-bold mt-1">{stats.total}</div>

      <div className="mt-3 text-xs text-white/70">Gender</div>
      <div className="mt-1 flex flex-wrap gap-1.5 text-[11px]">
        <span className="px-2.5 py-1 rounded-full bg-blue-500/15 border border-blue-400/20 text-blue-200 font-medium">
          👨 M {stats.male}
        </span>
        <span className="px-2.5 py-1 rounded-full bg-pink-500/15 border border-pink-400/20 text-pink-200 font-medium">
          👩 F {stats.female}
        </span>
        {stats.other > 0 ? (
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/20 text-emerald-200 font-medium">
            Other {stats.other}
          </span>
        ) : null}
      </div>

      <div className="mt-3 text-xs text-white/70">Kinds</div>
      <div className="mt-1 flex flex-wrap gap-1.5 text-[11px]">
        <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/10">Single {stats.single}</span>
        <span className="px-2.5 py-1 rounded-full bg-fuchsia-500/15 border border-fuchsia-400/20 text-fuchsia-200">Couple {stats.couple}</span>
        <span className="px-2.5 py-1 rounded-full bg-blue-500/15 border border-blue-400/20 text-blue-200">Family {stats.family}</span>
      </div>
    </div>
  );
}

function CardsList({ title, list }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-2 max-h-[280px] overflow-auto space-y-2 pr-1">
        {(list || []).length === 0 ? (
          <div className="text-white/50 text-sm py-4 text-center">Empty</div>
        ) : (
          list.map((a, i) => {
            const cust = a?.customer || {};
            const isMale = cust?.gender === "MALE";
            const isFemale = cust?.gender === "FEMALE";

            return (
              <div
                key={a?._id || i}
                className={[
                  "rounded-xl border p-2.5 text-sm",
                  isMale
                    ? "border-blue-400/15 bg-blue-500/5"
                    : isFemale
                    ? "border-pink-400/15 bg-pink-500/5"
                    : "border-white/10 bg-white/5",
                ].join(" ")}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                    isMale
                      ? "bg-blue-500/20 text-blue-200"
                      : isFemale
                      ? "bg-pink-500/20 text-pink-200"
                      : "bg-white/10 text-white/70"
                  }`}>
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="font-medium truncate">{labelCustomer(a)}</div>
                    <div className="flex gap-1 mt-0.5">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full border ${
                        isMale ? "bg-blue-500/15 border-blue-400/20 text-blue-200"
                        : isFemale ? "bg-pink-500/15 border-pink-400/20 text-pink-200"
                        : "bg-white/10 border-white/10 text-white/60"
                      }`}>
                        {cust?.gender || "?"}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/10 border border-white/10 text-white/50">
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

// components/dashboard/MonthGridPickerModal.js
"use client";

import { useEffect, useMemo, useState } from "react";
import LayerModal from "@/components/LayerModal";
import BufferSpinner from "@/components/BufferSpinner";

function ymdLocal(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
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

export default function MonthGridPickerModal({
  open,
  onClose,
  initialMode = "DIKSHA",
  initialAnchor = new Date(),
  initialSelectedDateKey = null,
  title = "Pick Date",
  sub = "Select a date",
  disablePast = true,
  onConfirm, // ({ dateKey, mode }) => void
}) {
  const [mode, setMode] = useState(initialMode);
  const [anchor, setAnchor] = useState(() => new Date(initialAnchor));
  const [selectedKey, setSelectedKey] = useState(initialSelectedDateKey);

  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const cells = useMemo(() => monthCells(year, month), [year, month]);
  const todayKey = useMemo(() => ymdLocal(new Date()), []);

  // ✅ NEW: month days for mobile strip
  const daysInThisMonth = useMemo(() => new Date(year, month + 1, 0).getDate(), [year, month]);
  const monthDays = useMemo(
    () => Array.from({ length: daysInThisMonth }, (_, i) => new Date(year, month, i + 1)),
    [daysInThisMonth, year, month]
  );

  // summary loading
  const [summary, setSummary] = useState({});
  const [loadingSummary, setLoadingSummary] = useState(false);

  // ✅ NEW: container preview for selected date
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  useEffect(() => {
    if (!open) return;
    setMode(initialMode);
    setAnchor(new Date(initialAnchor));
    setSelectedKey(initialSelectedDateKey);
    setPreviewData(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const from = ymdLocal(new Date(year, month, 1));
    const to = ymdLocal(new Date(year, month + 1, 0));

    const ac = new AbortController();
    (async () => {
      setLoadingSummary(true);
      try {
        const res = await fetch(`/api/calander/summary?from=${from}&to=${to}&mode=${mode}`, { signal: ac.signal });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setSummary({});
          return;
        }
        setSummary(data.map || {});
      } catch (e) {
        if (String(e?.name) === "AbortError") return;
        setSummary({});
      } finally {
        setLoadingSummary(false);
      }
    })();

    return () => ac.abort();
  }, [open, year, month, mode]);

  // ✅ NEW: Load container preview when date is selected
  useEffect(() => {
    if (!open || !selectedKey) {
      setPreviewData(null);
      return;
    }

    const ac = new AbortController();
    (async () => {
      setPreviewLoading(true);
      setPreviewData(null);
      try {
        // Get or create container
        const cRes = await fetch("/api/calander/container/by-date", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: selectedKey, mode }),
          signal: ac.signal,
        });
        const cData = await cRes.json().catch(() => ({}));
        if (!cRes.ok) {
          setPreviewData({ error: cData.error || "Failed" });
          return;
        }

        const containerObj = cData?.container?.value ?? cData?.container;
        if (!containerObj?._id) {
          setPreviewData({ error: "Invalid container" });
          return;
        }

        const cId = typeof containerObj._id === "object" && containerObj._id.$oid
          ? containerObj._id.$oid
          : String(containerObj._id);

        const dRes = await fetch(`/api/calander/container/${cId}?includeReserved=1`, { signal: ac.signal });
        const dData = await dRes.json().catch(() => ({}));
        if (!dRes.ok) {
          setPreviewData({ error: dData.error || "Details failed" });
          return;
        }

        // Count genders
        const assignments = dData.assignments || [];
        const reserved = dData.reserved || [];
        const container = dData.container || containerObj;

        let inMale = 0, inFemale = 0, inOther = 0;
        for (const a of assignments) {
          const g = a?.customer?.gender;
          if (g === "MALE") inMale++;
          else if (g === "FEMALE") inFemale++;
          else inOther++;
        }

        let resMale = 0, resFemale = 0, resOther = 0;
        for (const a of reserved) {
          const g = a?.customer?.gender;
          if (g === "MALE") resMale++;
          else if (g === "FEMALE") resFemale++;
          else resOther++;
        }

        setPreviewData({
          container,
          inTotal: assignments.length,
          inMale,
          inFemale,
          inOther,
          resTotal: reserved.length,
          resMale,
          resFemale,
          resOther,
          limit: container?.limit || 20,
          error: null,
        });
      } catch (e) {
        if (String(e?.name) === "AbortError") return;
        setPreviewData({ error: "Network error" });
      } finally {
        setPreviewLoading(false);
      }
    })();

    return () => ac.abort();
  }, [open, selectedKey, mode]);

  function isPastDateKey(dateKey) {
    if (!disablePast) return false;
    return dateKey < todayKey;
  }

  // ✅ NEW: Detect mobile
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (!open) return;
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 768px)");
    const apply = () => setIsMobile(!mq.matches);
    apply();
    if (mq.addEventListener) mq.addEventListener("change", apply);
    else mq.addListener(apply);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", apply);
      else mq.removeListener(apply);
    };
  }, [open]);

  return (
    <LayerModal
      open={open}
      layerName="Month Picker"
      title={title}
      sub={sub}
      onClose={onClose}
      maxWidth="max-w-5xl"
      disableBackdropClose
    >
      {/* Header: Month Nav + Mode Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="text-base sm:text-lg font-bold">
          {anchor.toLocaleString("default", { month: "long" })} {year}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAnchor(new Date(year, month - 1, 1))}
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white"
            type="button"
          >
            ◀
          </button>

          <div className="rounded-2xl bg-black/30 border border-white/10 p-1 flex">
            <button
              onClick={() => { setMode("DIKSHA"); setSelectedKey(null); setPreviewData(null); }}
              className={`px-3 sm:px-4 py-2 rounded-xl text-sm ${
                mode === "DIKSHA" ? "bg-white text-black font-semibold" : "text-white/70 hover:bg-white/10"
              }`}
              type="button"
            >
              Diksha
            </button>
            <button
              onClick={() => { setMode("MEETING"); setSelectedKey(null); setPreviewData(null); }}
              className={`px-3 sm:px-4 py-2 rounded-xl text-sm ${
                mode === "MEETING" ? "bg-white text-black font-semibold" : "text-white/70 hover:bg-white/10"
              }`}
              type="button"
            >
              Meeting
            </button>
          </div>

          <button
            onClick={() => setAnchor(new Date(year, month + 1, 1))}
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white"
            type="button"
          >
            ▶
          </button>
        </div>
      </div>

      {/* Selected info bar */}
      <div className="mb-3 flex items-center justify-between">
        <div className="text-xs text-white/60">
          Selected: <b className="text-white">{selectedKey || "—"}</b>
          {selectedKey ? (
            <span className="ml-2 text-white/40">
              ({mode === "MEETING" ? "📋 Meeting" : "🔱 Diksha"})
            </span>
          ) : null}
        </div>
        <div className="text-xs text-white/60 flex items-center gap-2">
          {loadingSummary ? <BufferSpinner size={14} /> : null}
          <span>Summary</span>
        </div>
      </div>

      {/* ✅ MOBILE VIEW: Day Strip */}
      <div className="block md:hidden">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-white/60">Select Date</div>
            <div className="text-[10px] text-white/40">
              {mode === "MEETING" ? "📋 Meeting" : "🔱 Diksha"}
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory">
            {monthDays.map((d) => {
              const dateKey = ymdLocal(d);
              const isSelected = selectedKey === dateKey;
              const isToday = dateKey === todayKey;
              const weekday = d.toLocaleDateString("default", { weekday: "short" });
              const isSun = d.getDay() === 0;
              const past = isPastDateKey(dateKey);
              const s = summary?.[dateKey];
              const hasCards = s && (s.male + s.female) > 0;

              return (
                <button
                  key={dateKey}
                  type="button"
                  disabled={past}
                  onClick={() => setSelectedKey(dateKey)}
                  className={[
                    "shrink-0 min-w-[76px] rounded-2xl border px-3 py-2.5 text-left snap-start transition-all",
                    "bg-black/30 border-white/10",
                    isSelected ? "ring-2 ring-blue-500/60 bg-blue-500/10 border-blue-400/30" : "",
                    isToday && !isSelected ? "border-emerald-400/30 shadow-[0_0_30px_rgba(16,185,129,0.12)]" : "",
                    past ? "opacity-35 cursor-not-allowed" : "",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between gap-1">
                    <div className={["text-[11px] font-semibold", isSun ? "text-red-300" : "text-white/80"].join(" ")}>
                      {weekday}
                    </div>
                    {isToday ? <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> : null}
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

        {/* ✅ Mobile: Container Preview Card */}
        {selectedKey ? (
          <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="text-xs text-white/60">CONTAINER PREVIEW</div>
              {mode === "MEETING" ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/20 text-amber-200">
                  📋 Meeting
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-400/20 text-purple-200">
                  🔱 Diksha
                </span>
              )}
            </div>
            <div className="font-bold text-lg">{selectedKey}</div>

            {previewLoading ? (
              <div className="mt-3 flex items-center gap-2 text-white/50 text-sm">
                <BufferSpinner size={16} /> Loading container info...
              </div>
            ) : previewData?.error ? (
              <div className="mt-3 rounded-xl border border-red-400/20 bg-red-500/10 p-2 text-xs text-red-200">
                {previewData.error}
              </div>
            ) : previewData ? (
              <div className="mt-3 space-y-2">
                {/* Gender stats */}
                <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <div className="text-xs text-white/60 mb-2">In Container</div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-400/20 text-blue-200 font-medium">
                        👨 M {previewData.inMale}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-pink-500/15 border border-pink-400/20 text-pink-200 font-medium">
                        👩 F {previewData.inFemale}
                      </span>
                      {previewData.inOther > 0 ? (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/20 text-emerald-200 font-medium">
                          O {previewData.inOther}
                        </span>
                      ) : null}
                    </div>
                    <div className="text-sm font-bold">{previewData.inTotal}</div>
                  </div>
                </div>

                {/* Reserved (Diksha) */}
                {mode === "DIKSHA" ? (
                  <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3">
                    <div className="text-xs text-emerald-200/70 mb-2">Reserved (Meeting Holds)</div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-400/20 text-blue-200">
                          M {previewData.resMale}
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-pink-500/15 border border-pink-400/20 text-pink-200">
                          F {previewData.resFemale}
                        </span>
                      </div>
                      <div className="text-sm font-bold text-emerald-200">{previewData.resTotal}</div>
                    </div>
                  </div>
                ) : null}

                {/* Capacity */}
                {mode === "DIKSHA" ? (
                  <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs text-white/50">Capacity</div>
                        <div className="text-sm font-bold">
                          {previewData.inTotal + previewData.resTotal} / {previewData.limit}
                        </div>
                      </div>
                      <div className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                        (previewData.inTotal + previewData.resTotal) >= previewData.limit
                          ? "bg-red-500/15 border-red-400/20 text-red-200"
                          : "bg-emerald-500/15 border-emerald-400/20 text-emerald-200"
                      }`}>
                        {Math.max(0, previewData.limit - previewData.inTotal - previewData.resTotal)} left
                      </div>
                    </div>
                    {/* Visual bar */}
                    <div className="mt-2 h-2.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          (previewData.inTotal + previewData.resTotal) >= previewData.limit
                            ? "bg-red-500/60"
                            : "bg-emerald-500/60"
                        }`}
                        style={{ width: `${Math.min(100, ((previewData.inTotal + previewData.resTotal) / previewData.limit) * 100)}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-[11px] text-white/50">
                    Total cards: {previewData.inTotal}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="mt-3 text-center text-white/40 text-sm py-4">
            Select a date from the strip above
          </div>
        )}
      </div>

      {/* ✅ DESKTOP VIEW: Grid (enhanced) */}
      <div className="hidden md:block">
        <div className="grid grid-cols-7 gap-1 sm:gap-2 text-[10px] sm:text-xs mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, i) => (
            <div key={d} className={`${i === 0 ? "text-red-300" : "text-white/70"} text-center`}>
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {cells.map((d, idx) => {
            if (!d) return <div key={idx} />;

            const dateKey = ymdLocal(d);
            const s = summary?.[dateKey];
            const past = isPastDateKey(dateKey);
            const hasCards = s && (s.male + s.female) > 0;

            return (
              <button
                key={dateKey}
                type="button"
                disabled={past}
                onClick={() => setSelectedKey(dateKey)}
                className={[
                  "min-h-[70px] sm:min-h-[90px] rounded-2xl border p-2 text-left transition",
                  "bg-black/30 border-white/10 hover:bg-black/40",
                  selectedKey === dateKey ? "ring-2 ring-blue-500/60" : "",
                  idx % 7 === 0 ? "ring-1 ring-red-500/20" : "",
                  dateKey === todayKey ? "ring-2 ring-emerald-400/60 border-emerald-400/30" : "",
                  past ? "opacity-40 cursor-not-allowed hover:bg-black/30" : "",
                ].join(" ")}
                title={dateKey}
              >
                <div className="flex items-center justify-between">
                  <div className={`text-xs sm:text-sm font-semibold ${idx % 7 === 0 ? "text-red-200" : "text-white"}`}>
                    {d.getDate()}
                  </div>
                  {dateKey === todayKey ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 border border-emerald-400/20 text-emerald-200">
                      Today
                    </span>
                  ) : null}
                </div>

                <div className="text-[10px] text-white/50">{mode}</div>

                {hasCards ? (
                  <div className="mt-2 text-[10px] sm:text-[11px] text-white/80 flex gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-400/15 text-blue-200">M {s.male}</span>
                    <span className="px-2 py-0.5 rounded-full bg-pink-500/15 border border-pink-400/15 text-pink-200">F {s.female}</span>
                  </div>
                ) : (
                  <div className="mt-2 text-[10px] sm:text-[11px] text-white/35">—</div>
                )}

                {/* ✅ NEW: total cards indicator */}
                {hasCards ? (
                  <div className="mt-1 text-[9px] text-white/40">{s.male + s.female} cards</div>
                ) : null}
              </button>
            );
          })}
        </div>

        {/* ✅ Desktop: Container Preview Panel */}
        {selectedKey ? (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-xs text-white/60">CONTAINER PREVIEW</div>
                <div className="font-bold mt-0.5">
                  {selectedKey} • {mode === "MEETING" ? "📋 Meeting" : "🔱 Diksha"}
                </div>
              </div>
              {previewLoading ? <BufferSpinner size={18} /> : null}
            </div>

            {previewData?.error ? (
              <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">
                {previewData.error}
              </div>
            ) : previewData ? (
              <div className="grid sm:grid-cols-3 gap-3">
                {/* In Container */}
                <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <div className="text-xs text-white/60 mb-1">In Container</div>
                  <div className="text-xl font-bold">{previewData.inTotal}</div>
                  <div className="mt-2 flex gap-1.5 flex-wrap">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-400/20 text-blue-200">
                      M {previewData.inMale}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/15 border border-pink-400/20 text-pink-200">
                      F {previewData.inFemale}
                    </span>
                    {previewData.inOther > 0 ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/20 text-emerald-200">
                        O {previewData.inOther}
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Reserved */}
                <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3">
                  <div className="text-xs text-emerald-200/70 mb-1">Reserved</div>
                  <div className="text-xl font-bold text-emerald-200">{previewData.resTotal}</div>
                  <div className="mt-2 flex gap-1.5 flex-wrap">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-400/20 text-blue-200">
                      M {previewData.resMale}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/15 border border-pink-400/20 text-pink-200">
                      F {previewData.resFemale}
                    </span>
                  </div>
                </div>

                {/* Capacity */}
                <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <div className="text-xs text-white/60 mb-1">Capacity</div>
                  <div className="flex items-center justify-between">
                    <div className="text-xl font-bold">
                      {previewData.inTotal + previewData.resTotal}/{previewData.limit}
                    </div>
                    <div className={`text-xs font-bold px-2 py-1 rounded-full border ${
                      (previewData.inTotal + previewData.resTotal) >= previewData.limit
                        ? "bg-red-500/15 border-red-400/20 text-red-200"
                        : "bg-emerald-500/15 border-emerald-400/20 text-emerald-200"
                    }`}>
                      {Math.max(0, previewData.limit - previewData.inTotal - previewData.resTotal)} left
                    </div>
                  </div>
                  <div className="mt-2 h-2.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        (previewData.inTotal + previewData.resTotal) >= previewData.limit
                          ? "bg-red-500/60"
                          : "bg-emerald-500/60"
                      }`}
                      style={{ width: `${Math.min(100, ((previewData.inTotal + previewData.resTotal) / previewData.limit) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : !previewLoading ? (
              <div className="text-white/40 text-sm">Select a date to see preview</div>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* ✅ Bottom Action Buttons */}
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-3 rounded-2xl bg-white/10 border border-white/10 hover:bg-white/15 text-white"
        >
          Cancel
        </button>

        <button
          type="button"
          disabled={!selectedKey}
          onClick={() => onConfirm?.({ dateKey: selectedKey, mode })}
          className="flex-1 px-4 py-3 rounded-2xl bg-white text-black font-semibold disabled:opacity-60"
        >
          Confirm
        </button>
      </div>
    </LayerModal>
  );
}

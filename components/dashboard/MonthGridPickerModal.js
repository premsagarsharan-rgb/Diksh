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

  // summary loading (same endpoint as Calander.js)
  const [summary, setSummary] = useState({});
  const [loadingSummary, setLoadingSummary] = useState(false);

  useEffect(() => {
    if (!open) return;
    setMode(initialMode);
    setAnchor(new Date(initialAnchor));
    setSelectedKey(initialSelectedDateKey);
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

  function isPastDateKey(dateKey) {
    if (!disablePast) return false;
    return dateKey < todayKey;
  }

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
              onClick={() => setMode("DIKSHA")}
              className={`px-3 sm:px-4 py-2 rounded-xl text-sm ${
                mode === "DIKSHA" ? "bg-white text-black font-semibold" : "text-white/70 hover:bg-white/10"
              }`}
              type="button"
            >
              Diksha
            </button>
            <button
              onClick={() => setMode("MEETING")}
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

      <div className="mb-3 flex items-center justify-between">
        <div className="text-xs text-white/60">
          Selected: <b className="text-white">{selectedKey || "—"}</b>
        </div>
        <div className="text-xs text-white/60 flex items-center gap-2">
          {loadingSummary ? <BufferSpinner size={14} /> : null}
          <span>Summary</span>
        </div>
      </div>

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

              {s ? (
                <div className="mt-2 text-[10px] sm:text-[11px] text-white/80 flex gap-1.5 flex-wrap">
                  <span className="px-2 py-0.5 rounded-full bg-white/10 border border-white/10">M {s.male}</span>
                  <span className="px-2 py-0.5 rounded-full bg-white/10 border border-white/10">F {s.female}</span>
                </div>
              ) : (
                <div className="mt-2 text-[10px] sm:text-[11px] text-white/35">—</div>
              )}
            </button>
          );
        })}
      </div>

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

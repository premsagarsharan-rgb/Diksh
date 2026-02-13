// components/profile/CalendarPickerModal.js
"use client";

import { useEffect, useMemo, useState } from "react";
import LayerModal from "@/components/LayerModal";
import { useTheme } from "@/components/ThemeProvider";
import { useCommitGate } from "@/components/CommitGate";
import DikshaOccupyPickerModal from "@/components/dashboard/DikshaOccupyPickerModal";
import CalanderDayStrip from "@/components/dashboard/calander/CalanderDayStrip";
import CalanderMonthGrid from "@/components/dashboard/calander/CalanderMonthGrid";
import CalanderHeader from "@/components/dashboard/calander/CalanderHeader";
import { LoadingSpinner } from "./ProfileSubComponents";

/* ── Utility ── */
function ymdLocal(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function safeId(x) {
  if (!x) return "";
  if (typeof x === "string") return x;
  if (typeof x === "object" && x.$oid) return String(x.$oid);
  return String(x);
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

export default function CalendarPickerModal({
  open, onClose, mode, customerId, customerName, source, onAssigned,
}) {
  const themeApi = useTheme();
  const isLight = themeApi?.theme === "light";

  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => ymdLocal(today), [today]);

  const [anchor, setAnchor] = useState(new Date());
  const year = anchor.getFullYear();
  const month = anchor.getMonth();

  const [summary, setSummary] = useState({});
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  const [assigning, setAssigning] = useState(false);
  const [assignErr, setAssignErr] = useState("");
  const [assignSuccess, setAssignSuccess] = useState(false);

  const [occupyOpen, setOccupyOpen] = useState(false);
  const [occupyContainerId, setOccupyContainerId] = useState(null);

  const [entered, setEntered] = useState(false);

  const { requestCommit, CommitModal } = useCommitGate({
    defaultSuggestions: [
      "Approved for calander container",
      "Assigned customer to container",
      "Meeting reserved (occupy)",
      "⚡ BYPASS — Skip Diksha",
    ],
  });

  // ── Computed ──
  const cells = useMemo(() => monthCells(year, month), [year, month]);

  // ── FIX: monthDays must be Date[] not string[] ──
  const monthDays = useMemo(() => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1));
  }, [year, month]);

  // ── Load Summary ──
  useEffect(() => {
    if (!open) return;
    setEntered(false);
    requestAnimationFrame(() => setEntered(true));
    loadSummary();
    setSelectedDate(null);
    setAssignErr("");
    setAssignSuccess(false);
  }, [open, year, month]);

  async function loadSummary() {
    setSummaryLoading(true);
    try {
      const from = ymdLocal(new Date(year, month, 1));
      const to = ymdLocal(new Date(year, month + 1, 0));
      const res = await fetch(`/api/calander/summary?from=${from}&to=${to}&mode=${mode}`);
      const data = await res.json().catch(() => ({}));
      setSummary(data.map || {});
    } catch { setSummary({}); }
    finally { setSummaryLoading(false); }
  }

  function onDateSelect(dateStr) {
    if (dateStr < todayStr) return;
    setSelectedDate(dateStr);
    setAssignErr("");
    setAssignSuccess(false);
  }

  async function handleMeetingAssign() {
    if (!selectedDate || !customerId) return;
    setAssigning(true);
    setAssignErr("");
    try {
      const cRes = await fetch("/api/calander/container/by-date", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: selectedDate, mode: "MEETING" }),
      });
      const raw = await cRes.json().catch(() => ({}));
      if (!cRes.ok) {
        setAssignErr(raw?.error === "HOUSEFULL" ? "Housefull — limit reached" : raw?.error || "Container failed");
        return;
      }
      const containerObj = raw?.container?.value ?? raw?.container;
      if (!containerObj?._id) { setAssignErr("Invalid container"); return; }
      setOccupyContainerId(safeId(containerObj._id));
      setOccupyOpen(true);
    } catch { setAssignErr("Network error"); }
    finally { setAssigning(false); }
  }

  async function handleOccupyComplete(occupyDate) {
    if (!occupyContainerId || !customerId) return;
    const isBypass = occupyDate === "BYPASS";
    const commitMessage = await requestCommit({
      title: isBypass ? "⚡ BYPASS — Assign without Diksha" : "Meeting Assign + Occupy",
      subtitle: isBypass ? "Card → Pending after confirm" : `Occupy Diksha: ${occupyDate}`,
      preset: isBypass ? "⚡ BYPASS — Skip Diksha" : "Meeting reserved (occupy)",
    }).catch(() => null);
    if (!commitMessage) return;

    setAssigning(true);
    setAssignErr("");
    try {
      const body = {
        customerId: safeId(customerId),
        source,
        note: isBypass ? "BYPASS: Diksha skipped" : "",
        commitMessage,
        bypass: isBypass || undefined,
      };
      if (!isBypass) body.occupyDate = occupyDate;

      const res = await fetch(`/api/calander/container/${occupyContainerId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAssignErr(data?.error === "HOUSEFULL" ? "Housefull" : data?.error || "Assign failed");
        return;
      }
      setOccupyOpen(false);
      setAssignSuccess(true);
      onAssigned?.();
    } catch { setAssignErr("Network error"); }
    finally { setAssigning(false); }
  }

  async function handleDikshaAssign() {
    if (!selectedDate || !customerId) return;
    setAssigning(true);
    setAssignErr("");
    try {
      const commitMessage = await requestCommit({
        title: "Push to Diksha Container",
        subtitle: `Date: ${selectedDate}`,
        preset: "Approved for calander container",
      }).catch(() => null);
      if (!commitMessage) { setAssigning(false); return; }

      const cRes = await fetch("/api/calander/container/by-date", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: selectedDate, mode: "DIKSHA" }),
      });
      const raw = await cRes.json().catch(() => ({}));
      if (!cRes.ok) {
        setAssignErr(raw?.error === "HOUSEFULL" ? "Housefull" : raw?.error || "Container failed");
        return;
      }
      const containerObj = raw?.container?.value ?? raw?.container;
      if (!containerObj?._id) { setAssignErr("Invalid container"); return; }

      const aRes = await fetch(`/api/calander/container/${safeId(containerObj._id)}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: safeId(customerId),
          source,
          note: "",
          commitMessage,
        }),
      });
      const aData = await aRes.json().catch(() => ({}));
      if (!aRes.ok) {
        if (aData?.error === "HOUSEFULL") setAssignErr("Housefull — limit reached");
        else if (aData?.error === "NOT_ELIGIBLE_FOR_DIKSHA") setAssignErr("Not eligible — pehle Meeting confirm karo");
        else setAssignErr(aData?.error || "Assign failed");
        return;
      }
      setAssignSuccess(true);
      onAssigned?.();
    } catch { setAssignErr("Network error"); }
    finally { setAssigning(false); }
  }

  function handleAssign() {
    if (mode === "MEETING") handleMeetingAssign();
    else handleDikshaAssign();
  }

  if (!open) return null;

  const t1 = isLight ? "#0f172a" : "#ffffff";
  const t2 = isLight ? "rgba(15,23,42,0.6)" : "rgba(255,255,255,0.6)";
  const t3 = isLight ? "rgba(15,23,42,0.4)" : "rgba(255,255,255,0.4)";
  const panelBg = isLight ? "rgba(0,0,0,0.02)" : "rgba(255,255,255,0.04)";
  const panelBorder = isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)";
  const btnBg = isLight ? "#0f172a" : "#ffffff";
  const btnText = isLight ? "#ffffff" : "#000000";
  const accColor = mode === "MEETING"
    ? (isLight ? "#2563eb" : "#60a5fa")
    : (isLight ? "#9333ea" : "#c084fc");
  const accBg = mode === "MEETING"
    ? (isLight ? "rgba(37,99,235,0.08)" : "rgba(96,165,250,0.12)")
    : (isLight ? "rgba(147,51,234,0.08)" : "rgba(192,132,252,0.12)");
  const accBorder = mode === "MEETING"
    ? (isLight ? "rgba(37,99,235,0.18)" : "rgba(96,165,250,0.25)")
    : (isLight ? "rgba(147,51,234,0.18)" : "rgba(192,132,252,0.25)");
  const errBg = isLight ? "rgba(220,38,38,0.06)" : "rgba(239,68,68,0.10)";
  const errBorder = isLight ? "rgba(220,38,38,0.15)" : "rgba(239,68,68,0.20)";
  const errText = isLight ? "#dc2626" : "#fca5a5";
  const successBg = isLight ? "rgba(22,163,74,0.08)" : "rgba(34,197,94,0.12)";
  const successBorder = isLight ? "rgba(22,163,74,0.18)" : "rgba(34,197,94,0.25)";
  const successText = isLight ? "#15803d" : "#4ade80";

  const selInfo = selectedDate ? summary[selectedDate] : null;
  const selReserved = selInfo?.reserved || 0;

  return (
    <>
      <LayerModal
        open={open}
        layerName="Calendar Picker"
        title={mode === "MEETING" ? "📋 Pick Meeting Date" : "🔱 Pick Diksha Date"}
        sub={customerName ? `Assigning: ${customerName}` : "Select date to assign"}
        onClose={onClose}
        maxWidth="max-w-5xl"
      >
        <div
          className="will-change-transform"
          style={{
            transform: entered ? "translateY(0)" : "translateY(8px)",
            opacity: entered ? 1 : 0,
            transition: "transform 0.4s cubic-bezier(0.22,1,0.36,1), opacity 0.35s ease-out",
          }}
        >
          {/* Customer Badge */}
          <div
            className="flex items-center gap-3 mb-4 px-4 py-3 rounded-2xl border"
            style={{ background: accBg, borderColor: accBorder }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black shrink-0"
              style={{ background: btnBg, color: btnText }}
            >
              {String(customerName || "?")[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-bold truncate" style={{ color: t1 }}>
                {customerName || "Customer"}
              </div>
              <div className="text-[11px]" style={{ color: t2 }}>
                {source === "SITTING" ? "💺 Sitting → Meeting" : "⏳ Pending → Diksha"}
              </div>
            </div>
            <div
              className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0"
              style={{ background: accBg, border: `1px solid ${accBorder}`, color: accColor }}
            >
              {mode}
            </div>
          </div>

          {/* Calendar Header */}
          <CalanderHeader
            anchor={anchor}
            mode={mode}
            onPrevMonth={() => setAnchor(new Date(year, month - 1, 1))}
            onNextMonth={() => setAnchor(new Date(year, month + 1, 1))}
          />

          {/* Loading */}
          {summaryLoading && (
            <div className="flex items-center justify-center py-8 gap-2">
              <LoadingSpinner c={{ loadingDot: accColor }} size={22} />
              <span className="text-[13px] font-medium" style={{ color: t3 }}>Loading calendar...</span>
            </div>
          )}

          {/* Day Strip */}
          {!summaryLoading && (
            <CalanderDayStrip
              monthDays={monthDays}
              selectedDate={selectedDate}
              todayStr={todayStr}
              summary={summary}
              mode={mode}
              onDateSelect={onDateSelect}
            />
          )}

          {/* Month Grid */}
          {!summaryLoading && (
            <CalanderMonthGrid
              cells={cells}
              month={month}
              selectedDate={selectedDate}
              todayStr={todayStr}
              summary={summary}
              mode={mode}
              onDateSelect={onDateSelect}
            />
          )}

          {/* Selected Date → Assign Panel */}
          {selectedDate && !assignSuccess && (
            <div
              className="mt-4 rounded-2xl border p-4"
              style={{
                background: panelBg, borderColor: accBorder,
                opacity: 0, animation: "profileFadeUp 0.3s ease-out forwards",
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[16px]">{mode === "MEETING" ? "📋" : "🔱"}</span>
                  <span className="text-[14px] font-black" style={{ color: accColor }}>{selectedDate}</span>
                </div>
                <div className="text-[11px] font-semibold flex items-center gap-2" style={{ color: t3 }}>
                  {selInfo ? (
                    <>
                      <span>👨 {selInfo.male || 0}</span>
                      <span>👩 {selInfo.female || 0}</span>
                      {selReserved > 0 && <span style={{ color: accColor }}>🔒 {selReserved}</span>}
                    </>
                  ) : "No data yet"}
                </div>
              </div>

              <div
                className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl"
                style={{ background: isLight ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.06)" }}
              >
                <span className="text-[12px]" style={{ color: t3 }}>Assigning:</span>
                <span className="text-[12px] font-bold" style={{ color: t1 }}>{customerName}</span>
              </div>

              {assignErr && (
                <div className="mb-3 rounded-xl border px-3 py-2.5 text-[12px] font-medium flex items-center gap-2"
                  style={{ background: errBg, borderColor: errBorder, color: errText }}
                >
                  ⚠️ {assignErr}
                </div>
              )}

              <button type="button" disabled={assigning} onClick={handleAssign}
                className="w-full px-4 py-3.5 rounded-2xl text-[13px] font-bold transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.97]"
                style={{ background: btnBg, color: btnText }}
              >
                {assigning
                  ? <><LoadingSpinner c={{ loadingDot: btnText }} size={16} /> Processing...</>
                  : mode === "MEETING"
                  ? <>📋 Assign to Meeting → Next: Occupy Date</>
                  : <>🔱 Assign to Diksha Container</>
                }
              </button>

              {mode === "MEETING" && (
                <div className="text-[10px] mt-2 text-center" style={{ color: t3 }}>
                  Diksha occupy date picker will open after this step
                </div>
              )}
            </div>
          )}

          {/* Success */}
          {assignSuccess && (
            <div
              className="mt-4 rounded-2xl border p-6 text-center"
              style={{
                background: successBg, borderColor: successBorder,
                opacity: 0, animation: "profileFadeUp 0.3s ease-out forwards",
              }}
            >
              <div className="text-3xl mb-2">✅</div>
              <div className="text-[15px] font-black" style={{ color: successText }}>
                Assigned Successfully!
              </div>
              <div className="text-[12px] mt-1" style={{ color: t2 }}>
                {customerName} → {selectedDate} ({mode})
              </div>
              <button type="button" onClick={onClose}
                className="mt-4 px-6 py-2.5 rounded-2xl text-[12px] font-bold transition-all duration-200 active:scale-[0.97]"
                style={{ background: btnBg, color: btnText }}
              >
                Close ✓
              </button>
            </div>
          )}
        </div>
      </LayerModal>

      {/* Occupy Picker (Meeting only) */}
      <DikshaOccupyPickerModal
        open={occupyOpen}
        onClose={() => setOccupyOpen(false)}
        meetingDate={selectedDate}
        groupSize={1}
        onPick={(occupyDate) => {
          setOccupyOpen(false);
          handleOccupyComplete(occupyDate);
        }}
      />

      {CommitModal}
    </>
  );
}

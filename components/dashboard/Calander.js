// components/dashboard/Calander.js
"use client";
import { useEffect, useMemo, useState } from "react";
import LayerModal from "@/components/LayerModal";
import { useCommitGate } from "@/components/CommitGate";
import CustomerProfileModal from "@/components/CustomerProfileModal";
import DikshaOccupyPickerModal from "@/components/dashboard/DikshaOccupyPickerModal";
import BufferSpinner from "@/components/BufferSpinner";
import { openForm2PrintAllPreview } from "@/lib/printForm2Client";
import { openContainerListPrintPreview } from "@/lib/printListClient";

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

function safeId(x) {
  if (!x) return "";
  if (typeof x === "string") return x;
  if (typeof x === "object" && x.$oid) return String(x.$oid);
  return String(x);
}

function countGenders(list) {
  let male = 0,
    female = 0,
    other = 0;
  for (const a of list || []) {
    const g = a?.customer?.gender;
    if (g === "MALE") male++;
    else if (g === "FEMALE") female++;
    else other++;
  }
  return { male, female, other, total: male + female + other };
}

export default function Calander({ role }) {
  const [calOpen, setCalOpen] = useState(false);
  const [mode, setMode] = useState("MEETING");
  const [anchor, setAnchor] = useState(new Date());

  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const cells = useMemo(() => monthCells(year, month), [year, month]);
  const daysInThisMonth = useMemo(() => new Date(year, month + 1, 0).getDate(), [year, month]);
  const monthDays = useMemo(
    () => Array.from({ length: daysInThisMonth }, (_, i) => new Date(year, month, i + 1)),
    [daysInThisMonth, year, month]
  );

  const [selectedDate, setSelectedDate] = useState(null);
  const [summary, setSummary] = useState({});
  const todayStr = useMemo(() => ymdLocal(new Date()), []);

  const [containerOpen, setContainerOpen] = useState(false);
  const [container, setContainer] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [reserved, setReserved] = useState([]);
  const [historyRecords, setHistoryRecords] = useState([]);
  const [showList, setShowList] = useState(true);
  const [housefull, setHousefull] = useState(false);
  const [containerLoading, setContainerLoading] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [sittingActive, setSittingActive] = useState([]);
  const [pickMode, setPickMode] = useState("SINGLE");
  const [selectedIds, setSelectedIds] = useState([]);
  const [pushing, setPushing] = useState(false);

  const [confirmSingleOpen, setConfirmSingleOpen] = useState(false);
  const [confirmFamilyOpen, setConfirmFamilyOpen] = useState(false);
  const [singleTargetId, setSingleTargetId] = useState(null);

  const [profileOpen, setProfileOpen] = useState(false);
  const [profileCustomer, setProfileCustomer] = useState(null);
  const [profileSeqNo, setProfileSeqNo] = useState(null);
  const [profileCtx, setProfileCtx] = useState(null);

  const [occupyOpen, setOccupyOpen] = useState(false);
  const [occupyCtx, setOccupyCtx] = useState(null);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectTargetSeq, setRejectTargetSeq] = useState(null);

  // Confirm modal
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmModalTarget, setConfirmModalTarget] = useState(null);

  // warnings modal
  const [warnOpen, setWarnOpen] = useState(false);
  const [warnTitle, setWarnTitle] = useState("Warning");
  const [warnMsg, setWarnMsg] = useState("");
  function showWarn(title, msg) {
    setWarnTitle(String(title || "Warning"));
    setWarnMsg(String(msg || ""));
    setWarnOpen(true);
  }

  const { requestCommit, CommitModal } = useCommitGate({
    defaultSuggestions: [
      "Assigned customer to container",
      "Couple assigned",
      "Family assigned",
      "Out from container",
      "Meeting reserved (occupy)",
      "Meeting confirm → Diksha",
      "Meeting reject → Pending",
      "Meeting reject → Trash",
      "Meeting reject → ApproveFor",
      "Diksha Done (Qualified)",
    ],
  });

  function handleApiError(data, fallback = "Failed") {
    if (!data?.error) return showWarn("Error", fallback);
    if (data.error === "HOUSEFULL") { setHousefull(true); return; }
    if (data.error === "NOT_ELIGIBLE_FOR_DIKSHA") return showWarn("Not Eligible for Diksha", "Pehle Meeting container me push karke Confirm karo (ya Reject->Pending flow se eligible banao), phir Diksha me allow hoga.");
    if (data.error === "OCCUPY_REQUIRED") return showWarn("Occupy Required", "Meeting push ke liye Occupy (Diksha date) required hai.");
    if (data.error === "LOCKED_QUALIFIED") return showWarn("Locked", "Ye card QUALIFIED (Done) ho chuka hai. Ab move/out/shift allowed nahi hai.");
    if (data.error === "OCCUPY_MUST_BE_AFTER_MEETING") return showWarn("Invalid Occupy Date", data.message || "Occupy (Diksha) date must be AFTER the meeting date.");
    return showWarn("Error", data.error || fallback);
  }

  async function loadSummary() {
    try {
      const from = ymdLocal(new Date(year, month, 1));
      const to = ymdLocal(new Date(year, month + 1, 0));
      const res = await fetch(`/api/calander/summary?from=${from}&to=${to}&mode=${mode}`);
      const data = await res.json().catch(() => ({}));
      setSummary(data.map || {});
    } catch (e) {
      console.error("loadSummary failed", e);
      setSummary({});
    }
  }

  useEffect(() => {
    loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month, mode]);

  function isDesktopNow() {
    if (typeof window === "undefined") return true;
    return window.matchMedia("(min-width: 768px)").matches;
  }

  async function openContainerForDate(dateStr, opts = {}) {
    const shouldOpenLayer = typeof opts.openLayer === "boolean" ? opts.openLayer : isDesktopNow();
    setHousefull(false);
    setSelectedDate(dateStr);
    setContainerLoading(true);

    try {
      const cRes = await fetch("/api/calander/container/by-date", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: dateStr, mode }),
      });
      const raw = await cRes.json().catch(() => ({}));
      if (!cRes.ok) return handleApiError(raw, "Container failed");

      const containerObj = raw?.container?.value ?? raw?.container;
      if (!containerObj?._id) return showWarn("Error", "Invalid container response");

      const id = safeId(containerObj._id);
      const dRes = await fetch(`/api/calander/container/${id}?includeReserved=1&includeHistory=1`);
      const dData = await dRes.json().catch(() => ({}));
      if (!dRes.ok) return handleApiError(dData, "Load failed");

      setContainer(dData.container);
      setAssignments(dData.assignments || []);
      setReserved(dData.reserved || []);
      setHistoryRecords(dData.history || []);
      setShowList(true);
      setContainerOpen(shouldOpenLayer);
    } finally {
      setContainerLoading(false);
    }
  }

  async function refreshContainer() {
    if (!container?._id) return;
    const id = safeId(container._id);
    if (!id) return;

    const dRes = await fetch(`/api/calander/container/${id}?includeReserved=1&includeHistory=1`);
    const dData = await dRes.json().catch(() => ({}));
    if (!dRes.ok) return;
    setContainer(dData.container);
    setAssignments(dData.assignments || []);
    setReserved(dData.reserved || []);
    setHistoryRecords(dData.history || []);
  }

  async function openAddCustomerLayer() {
    setHousefull(false);
    setPickMode("SINGLE");
    setSelectedIds([]);
    setSingleTargetId(null);
    setConfirmSingleOpen(false);
    setConfirmFamilyOpen(false);
    setAddOpen(true);

    const sitRes = await fetch("/api/customers/sitting");
    const sitData = await sitRes.json().catch(() => ({}));
    if (!sitRes.ok) return handleApiError(sitData, "Failed to load sitting customers");
    setSittingActive((sitData.items || []).filter((c) => c.status === "ACTIVE"));
  }

  function initiateSingleAssign(customerId) {
    setSingleTargetId(customerId);
    setConfirmSingleOpen(true);
  }

  async function confirmSinglePush({ occupyDate } = {}) {
    if (!container?._id || !singleTargetId) return;

    if (container.mode === "MEETING" && !occupyDate) {
      setOccupyCtx({ type: "SINGLE", customerId: singleTargetId, groupSize: 1 });
      setOccupyOpen(true);
      return;
    }

    const commitMessage = await requestCommit({
      title: container.mode === "MEETING" ? "Meeting Assign + Occupy" : "Assign Single",
      subtitle: container.mode === "MEETING" ? `Occupy Diksha: ${occupyDate}` : "Customer will be added to container.",
      preset: container.mode === "MEETING" ? "Meeting reserved (occupy)" : "Assigned customer to container",
    }).catch(() => null);
    if (!commitMessage) return;

    const cId = safeId(container._id);
    if (!cId) return;

    setPushing(true);
    try {
      const res = await fetch(`/api/calander/container/${cId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: singleTargetId,
          source: "SITTING",
          note: "",
          commitMessage,
          occupyDate: container.mode === "MEETING" ? occupyDate : undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) return handleApiError(data, "Assign failed");

      await refreshContainer();
      await loadSummary();
      setConfirmSingleOpen(false);
      setAddOpen(false);
    } finally {
      setPushing(false);
    }
  }

  function initiateFamilyAssign() {
    if (selectedIds.length < 2) return showWarn("Select Customers", "Select minimum 2 customers");
    setConfirmFamilyOpen(true);
  }

  async function confirmFamilyPush({ occupyDate } = {}) {
    if (!container?._id) return;

    const ids = selectedIds.map(safeId).filter(Boolean);
    if (ids.length < 2) return showWarn("Select Customers", "Select minimum 2 customers");

    if (container.mode === "MEETING" && !occupyDate) {
      setOccupyCtx({ type: "FAMILY", customerIds: ids, groupSize: ids.length });
      setOccupyOpen(true);
      return;
    }

    const isCouple = ids.length === 2;
    const commitMessage = await requestCommit({
      title: container.mode === "MEETING" ? "Meeting Group + Occupy" : isCouple ? "Assign Couple" : "Assign Family",
      subtitle: container.mode === "MEETING" ? `Occupy Diksha: ${occupyDate}` : "Group will be added to container.",
      preset: container.mode === "MEETING" ? "Meeting reserved (occupy)" : isCouple ? "Couple assigned" : "Family assigned",
    }).catch(() => null);
    if (!commitMessage) return;

    const cId = safeId(container._id);
    if (!cId) return;

    setPushing(true);
    try {
      const res = await fetch(`/api/calander/container/${cId}/assign-couple`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerIds: ids,
          note: "",
          commitMessage,
          occupyDate: container.mode === "MEETING" ? occupyDate : undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) return handleApiError(data, "Family assign failed");

      await refreshContainer();
      await loadSummary();
      setConfirmFamilyOpen(false);
      setAddOpen(false);
    } finally {
      setPushing(false);
    }
  }

  function openConfirmModal(assignment) {
    setConfirmModalTarget(assignment);
    setConfirmModalOpen(true);
  }

  async function confirmMeetingCard(assignment) {
    const cId = safeId(container?._id);
    const aId = safeId(assignment?._id);
    if (!cId || !aId) return;

    const commitMessage = await requestCommit({
      title: "Confirm → Move to Diksha",
      subtitle: `Occupied: ${assignment.occupiedDate || "-"}`,
      preset: "Meeting confirm → Diksha",
    }).catch(() => null);
    if (!commitMessage) return;

    setPushing(true);
    try {
      const res = await fetch(`/api/calander/container/${cId}/assignments/${aId}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commitMessage }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return handleApiError(data, "Confirm failed");
      setConfirmModalOpen(false);
      setConfirmModalTarget(null);
      await refreshContainer();
      await loadSummary();
    } finally {
      setPushing(false);
    }
  }

  async function rejectToTrash(assignment) {
    const cId = safeId(container?._id);
    const aId = safeId(assignment?._id);
    if (!cId || !aId) return;

    const commitMessage = await requestCommit({
      title: "Reject → Trash",
      subtitle: "Customer card will be marked as REJECTED and moved to Trash.",
      preset: "Meeting reject → Trash",
    }).catch(() => null);
    if (!commitMessage) return;

    setPushing(true);
    try {
      const res = await fetch(`/api/calander/container/${cId}/assignments/${aId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commitMessage, rejectAction: "TRASH" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return handleApiError(data, "Trash failed");

      setRejectOpen(false);
      setRejectTarget(null);
      setRejectTargetSeq(null);
      await refreshContainer();
      await loadSummary();
    } finally {
      setPushing(false);
    }
  }

  async function rejectToPending(assignment) {
    const cId = safeId(container?._id);
    const aId = safeId(assignment?._id);
    if (!cId || !aId) return;

    const commitMessage = await requestCommit({
      title: "Reject → Push to Pending",
      subtitle: "Customer will be moved to Pending database.",
      preset: "Meeting reject → Pending",
    }).catch(() => null);
    if (!commitMessage) return;

    setPushing(true);
    try {
      const res = await fetch(`/api/calander/container/${cId}/assignments/${aId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commitMessage, rejectAction: "PUSH_PENDING" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return handleApiError(data, "Reject failed");

      setRejectOpen(false);
      setRejectTarget(null);
      setRejectTargetSeq(null);
      await refreshContainer();
      await loadSummary();
    } finally {
      setPushing(false);
    }
  }

  async function outAssignment(assignmentIdRaw) {
    const cId = safeId(container?._id);
    const aId = safeId(assignmentIdRaw);
    if (!cId || !aId) return;

    const commitMessage = await requestCommit({
      title: "Out",
      subtitle: "If this is a couple/family, all members will go OUT.",
      preset: "Out from container",
    }).catch(() => null);
    if (!commitMessage) return;

    const res = await fetch(`/api/calander/container/${cId}/assignments/${aId}/out`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commitMessage }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return handleApiError(data, "Out failed");

    await refreshContainer();
    await loadSummary();
  }

  async function doneAssignment(assignment) {
    const cId = safeId(container?._id);
    const aId = safeId(assignment?._id);
    if (!cId || !aId) return;

    const commitMessage = await requestCommit({
      title: "Done (Qualified)",
      subtitle: "Card will be locked (cannot move/out).",
      preset: "Diksha Done (Qualified)",
    }).catch(() => null);
    if (!commitMessage) return;

    setPushing(true);
    try {
      const res = await fetch(`/api/calander/container/${cId}/assignments/${aId}/done`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commitMessage }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return handleApiError(data, "Done failed");

      await refreshContainer();
      await loadSummary();
    } finally {
      setPushing(false);
    }
  }

  async function increaseLimit() {
    if (role !== "ADMIN") return showWarn("Not allowed", "Only admin can increase limit");
    const cId = safeId(container?._id);
    if (!cId) return;

    const next = prompt("New limit?", String(container.limit || 20));
    if (!next) return;
    const limit = parseInt(next, 10);
    if (!Number.isFinite(limit) || limit < 1) return showWarn("Invalid", "Invalid limit");

    const res = await fetch(`/api/calander/container/${cId}/limit`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ limit }),
    });
    if (!res.ok) return showWarn("Failed", "Limit update failed");
    await refreshContainer();
    await loadSummary();
  }

  function openProfile(customerObj, seqNo = null) {
    if (!customerObj?._id) return;
    setProfileCtx(null);
    setProfileCustomer(customerObj);
    setProfileSeqNo(seqNo);
    setProfileOpen(true);
  }

  async function openPrintAllForContainer() {
    if (!container?._id) return showWarn("Error", "Container not ready");
    if (!assignments || assignments.length === 0) return showWarn("Error", "No customers in container");
    const title = `${container.date} / ${container.mode}`;
    const items = (assignments || []).map((a, idx) => ({
      customer: a.customer || {},
      form: a.customer || {},
      sequenceNo: idx + 1,
    }));
    await openForm2PrintAllPreview({ title, items, source: "SITTING" });
  }

  async function openPrintListForContainer() {
    if (!container?._id) return showWarn("Error", "Container not ready");
    const total = (assignments?.length || 0) + (reserved?.length || 0);
    if (total === 0) return showWarn("Error", "No customers in container");

    const title = `${container.date} / ${container.mode} • List`;
    await openContainerListPrintPreview({ title, container, assignments, reserved });
  }

  const counts = countGenders(assignments);
  const reservedCounts = countGenders(reserved);

  const targetSingle = useMemo(() => {
    return singleTargetId ? sittingActive.find((c) => safeId(c._id) === singleTargetId) : null;
  }, [singleTargetId, sittingActive]);

  // Mobile helper: auto open date strip
  useEffect(() => {
    if (!calOpen) return;
    if (typeof window === "undefined") return;
    const mobile = !window.matchMedia("(min-width: 768px)").matches;
    if (!mobile) return;
    const sameMonthAsToday = todayStr.slice(0, 7) === ymdLocal(anchor).slice(0, 7);
    const fallback = ymdLocal(new Date(year, month, 1));
    const autoDate = selectedDate || (sameMonthAsToday ? todayStr : fallback);
    openContainerForDate(autoDate, { openLayer: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calOpen, year, month, mode]);

  const mobileContainerReady = !!container && (selectedDate ? container?.date === selectedDate : true);

  const [mobileContainerTab, setMobileContainerTab] = useState("LIST");

  return (
    <div>
      <button
        onClick={() => {
          setAnchor(new Date());
          setMode("MEETING");
          setCalOpen(true);
        }}
        className="px-4 py-2 rounded-2xl bg-white/10 border border-white/10 text-white hover:bg-white/15 transition"
        type="button"
      >
        Open Calander
      </button>

      {/* Warning modal */}
      <LayerModal open={warnOpen} layerName="Warning" title={warnTitle} sub="" onClose={() => setWarnOpen(false)} maxWidth="max-w-md">
        <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
          <div className="text-sm text-white/80 whitespace-pre-wrap">{warnMsg}</div>
          <div className="mt-4">
            <button onClick={() => setWarnOpen(false)} className="w-full px-4 py-3 rounded-2xl bg-white text-black font-semibold">OK</button>
          </div>
        </div>
      </LayerModal>

      {/* Layer 1: Calendar */}
      <LayerModal
        open={calOpen}
        layerName="Calander"
        title="Calander"
        sub="Desktop: Monthly Grid • Mobile: Day Strip"
        onClose={() => {
          setCalOpen(false);
          setContainerOpen(false);
          setAddOpen(false);
          setConfirmSingleOpen(false);
          setConfirmFamilyOpen(false);
        }}
        maxWidth="max-w-5xl"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="text-base sm:text-lg font-bold">
            {anchor.toLocaleString("default", { month: "long" })} {year}
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setAnchor(new Date(year, month - 1, 1))} className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15">◀</button>

            <div className="rounded-2xl bg-black/30 border border-white/10 p-1 flex">
              <button onClick={() => setMode("DIKSHA")} className={`px-3 sm:px-4 py-2 rounded-xl text-sm ${mode === "DIKSHA" ? "bg-white text-black font-semibold" : "text-white/70 hover:bg-white/10"}`}>Diksha</button>
              <button onClick={() => setMode("MEETING")} className={`px-3 sm:px-4 py-2 rounded-xl text-sm ${mode === "MEETING" ? "bg-white text-black font-semibold" : "text-white/70 hover:bg-white/10"}`}>Meeting</button>
            </div>

            <button onClick={() => setAnchor(new Date(year, month + 1, 1))} className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15">▶</button>
          </div>
        </div>

        {/* ═══════ Mobile Day Strip ═══════ */}
        <div className="block md:hidden">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-white/60">Select Date</div>
              <div className="text-[10px] text-white/40">
                {mode === "MEETING" ? "📋 Meeting" : "🔱 Diksha"} • {anchor.toLocaleString("default", { month: "short" })} {year}
              </div>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory">
              {monthDays.map((d) => {
                const dateStr = ymdLocal(d);
                const isSelected = selectedDate === dateStr;
                const isToday = dateStr === todayStr;
                const weekday = d.toLocaleDateString("default", { weekday: "short" });
                const isSun = d.getDay() === 0;
                const s = summary?.[dateStr];
                const hasCards = s && (s.male + s.female) > 0;

                return (
                  <button
                    key={dateStr}
                    onClick={() => openContainerForDate(dateStr, { openLayer: false })}
                    className={[
                      "shrink-0 min-w-[76px] rounded-2xl border px-3 py-2.5 text-left snap-start transition-all",
                      "bg-black/30 border-white/10",
                      isSelected ? "ring-2 ring-blue-500/60 bg-blue-500/10 border-blue-400/30" : "",
                      isToday && !isSelected ? "border-emerald-400/30 shadow-[0_0_30px_rgba(16,185,129,0.12)]" : "",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <div className={["text-[11px] font-semibold", isSun ? "text-red-300" : "text-white/80"].join(" ")}>{weekday}</div>
                      {isToday ? <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> : null}
                    </div>
                    <div className="text-lg font-bold leading-6 mt-0.5">{d.getDate()}</div>

                    {hasCards ? (
                      <div className="mt-1.5 space-y-0.5">
                        <div className="text-[10px] text-white/70 font-medium">{s.male + s.female} cards</div>
                        <div className="flex gap-1">
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/20 text-blue-200">M{s.male}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-pink-500/20 border border-pink-400/20 text-pink-200">F{s.female}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-1.5 text-[10px] text-white/30">—</div>
                    )}

                    {s?.history > 0 ? (
                      <div className="mt-0.5">
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/20 text-emerald-200">✅{s.history}</span>
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mobile Container Section */}
          <div className="mt-3">
            {housefull && (
              <div className="mb-3 rounded-2xl border border-red-400/20 bg-red-500/10 p-3">
                <div className="text-sm font-semibold text-red-200">🚫 Housefull</div>
                <div className="text-xs text-red-200/80 mt-1">Limit reached. Admin can increase limit.</div>
              </div>
            )}

            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              {/* Container Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-white/60">CONTAINER</div>
                    {mobileContainerReady && container?.mode === "MEETING" ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/20 text-amber-200">📋 Meeting</span>
                    ) : mobileContainerReady && container?.mode === "DIKSHA" ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-400/20 text-purple-200">🔱 Diksha</span>
                    ) : null}
                  </div>
                  <div className="mt-1 font-bold truncate text-lg">
                    {mobileContainerReady ? container.date : selectedDate ? selectedDate : mode}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {role === "ADMIN" && (
                    <button onClick={increaseLimit} disabled={!mobileContainerReady || pushing} className="w-10 h-10 rounded-xl bg-white text-black font-bold text-sm disabled:opacity-40 flex items-center justify-center active:scale-95 transition">
                      {pushing ? <BufferSpinner size={16} /> : "+"}
                    </button>
                  )}
                  <button onClick={openPrintAllForContainer} disabled={!mobileContainerReady || pushing} className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 disabled:opacity-40 flex items-center justify-center active:scale-95 transition" title="Print all">🖨</button>
                  <button onClick={openAddCustomerLayer} disabled={!mobileContainerReady || pushing} className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 disabled:opacity-40 flex items-center justify-center active:scale-95 transition" title="Add">＋</button>
                  <button onClick={openPrintListForContainer} disabled={!mobileContainerReady || pushing} className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 disabled:opacity-40 flex items-center justify-center active:scale-95 transition" title="Print list">📄</button>
                </div>
              </div>

              {/* Gender Stats Bar (Mobile) */}
              {mobileContainerReady ? (
                <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] px-2.5 py-1 rounded-full bg-blue-500/15 border border-blue-400/20 text-blue-200 font-medium">👨 Male {counts.male}</span>
                      <span className="text-[11px] px-2.5 py-1 rounded-full bg-pink-500/15 border border-pink-400/20 text-pink-200 font-medium">👩 Female {counts.female}</span>
                      {counts.other > 0 ? (
                        <span className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/20 text-emerald-200 font-medium">Other {counts.other}</span>
                      ) : null}
                    </div>
                    <div className="text-sm font-bold text-white">{counts.total}</div>
                  </div>

                  {container?.mode === "DIKSHA" ? (
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/20 text-emerald-200">Reserved {reservedCounts.total}</span>
                      <span className="text-[11px] px-2.5 py-1 rounded-full bg-white/10 border border-white/10 text-white/70">Limit {container.limit ?? 20}</span>
                      <span className={`text-[11px] px-2.5 py-1 rounded-full border font-medium ${(counts.total + reservedCounts.total) >= (container.limit ?? 20) ? "bg-red-500/15 border-red-400/20 text-red-200" : "bg-emerald-500/15 border-emerald-400/20 text-emerald-200"}`}>
                        Remaining {Math.max(0, (container.limit ?? 20) - counts.total - reservedCounts.total)}
                      </span>
                    </div>
                  ) : (
                    <div className="mt-2 text-[11px] text-white/50">Total cards: {counts.total}</div>
                  )}
                </div>
              ) : null}

              {/* Mobile Container Tabs */}
              {mobileContainerReady ? (
                <div className="mt-3 flex gap-1.5">
                  <button onClick={() => setMobileContainerTab("LIST")} className={`flex-1 px-3 py-2 rounded-xl text-xs font-semibold transition ${mobileContainerTab === "LIST" ? "bg-white text-black" : "bg-white/10 text-white/70 hover:bg-white/15"}`}>
                    📋 List ({counts.total})
                  </button>
                  <button onClick={() => setMobileContainerTab("STATS")} className={`flex-1 px-3 py-2 rounded-xl text-xs font-semibold transition ${mobileContainerTab === "STATS" ? "bg-white text-black" : "bg-white/10 text-white/70 hover:bg-white/15"}`}>
                    📊 Stats
                  </button>
                  {container?.mode === "MEETING" && historyRecords.length > 0 ? (
                    <button onClick={() => setMobileContainerTab("HISTORY")} className={`flex-1 px-3 py-2 rounded-xl text-xs font-semibold transition ${mobileContainerTab === "HISTORY" ? "bg-emerald-500 text-white" : "bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20"}`}>
                      ✅ History ({historyRecords.length})
                    </button>
                  ) : null}
                  <button onClick={() => setShowList((v) => !v)} disabled={!mobileContainerReady || pushing} className="px-3 py-2 rounded-xl bg-white/10 text-white/70 text-xs disabled:opacity-40">
                    {showList ? "👁" : "👁‍🗨"}
                  </button>
                </div>
              ) : null}

              {/* Stats Tab Content (Mobile) */}
              {mobileContainerReady && mobileContainerTab === "STATS" ? (
                <div className="mt-3 space-y-3">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                    <div className="text-xs text-white/60 font-medium mb-2">Gender Breakdown</div>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-[11px] mb-1"><span className="text-blue-200">👨 Male</span><span className="text-white font-semibold">{counts.male}</span></div>
                        <div className="h-2 rounded-full bg-white/10 overflow-hidden"><div className="h-full rounded-full bg-blue-500/60 transition-all" style={{ width: counts.total ? `${(counts.male / counts.total) * 100}%` : "0%" }} /></div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[11px] mb-1"><span className="text-pink-200">👩 Female</span><span className="text-white font-semibold">{counts.female}</span></div>
                        <div className="h-2 rounded-full bg-white/10 overflow-hidden"><div className="h-full rounded-full bg-pink-500/60 transition-all" style={{ width: counts.total ? `${(counts.female / counts.total) * 100}%` : "0%" }} /></div>
                      </div>
                      {counts.other > 0 ? (
                        <div>
                          <div className="flex justify-between text-[11px] mb-1"><span className="text-emerald-200">Other</span><span className="text-white font-semibold">{counts.other}</span></div>
                          <div className="h-2 rounded-full bg-white/10 overflow-hidden"><div className="h-full rounded-full bg-emerald-500/60 transition-all" style={{ width: counts.total ? `${(counts.other / counts.total) * 100}%` : "0%" }} /></div>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {container?.mode === "DIKSHA" ? (
                    <>
                      <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-3">
                        <div className="text-xs text-emerald-200/70 font-medium mb-2">Reserved / Occupied (Meeting holds)</div>
                        <div className="flex items-center gap-3">
                          <div className="text-2xl font-bold text-emerald-200">{reservedCounts.total}</div>
                          <div className="flex gap-1.5 flex-wrap">
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-400/20 text-blue-200">M {reservedCounts.male}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/15 border border-pink-400/20 text-pink-200">F {reservedCounts.female}</span>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                        <div className="text-xs text-white/60 font-medium mb-2">Capacity</div>
                        <div className="flex items-center justify-between">
                          <div><div className="text-xs text-white/50">Used</div><div className="text-lg font-bold">{counts.total + reservedCounts.total} / {container.limit ?? 20}</div></div>
                          <div className={`text-sm font-bold px-3 py-1.5 rounded-full border ${(counts.total + reservedCounts.total) >= (container.limit ?? 20) ? "bg-red-500/15 border-red-400/20 text-red-200" : "bg-emerald-500/15 border-emerald-400/20 text-emerald-200"}`}>
                            {Math.max(0, (container.limit ?? 20) - counts.total - reservedCounts.total)} left
                          </div>
                        </div>
                        <div className="mt-2 h-3 rounded-full bg-white/10 overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${(counts.total + reservedCounts.total) >= (container.limit ?? 20) ? "bg-red-500/60" : "bg-emerald-500/60"}`} style={{ width: `${Math.min(100, ((counts.total + reservedCounts.total) / (container.limit ?? 20)) * 100)}%` }} />
                        </div>
                      </div>
                    </>
                  ) : null}
                </div>
              ) : null}

              {/* History Tab Content (Mobile) */}
              {mobileContainerReady && mobileContainerTab === "HISTORY" && container?.mode === "MEETING" ? (
                <div className="mt-3">
                  <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/5 p-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">✅</span>
                      <div>
                        <div className="text-sm font-semibold text-emerald-200">Confirmed History</div>
                        <div className="text-[11px] text-emerald-200/70">{historyRecords.length} customer(s) confirmed from this meeting → Diksha</div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {historyRecords.map((h, idx) => {
                      const snap = h.customerSnapshot || {};
                      const isMale = snap.gender === "MALE";
                      const isFemale = snap.gender === "FEMALE";
                      const confirmedDate = h.confirmedAt ? new Date(h.confirmedAt).toLocaleDateString() : "—";
                      return (
                        <div key={safeId(h._id) || idx} className={["rounded-2xl border p-3.5 opacity-80", isMale ? "border-blue-400/15 bg-blue-500/5" : isFemale ? "border-pink-400/15 bg-pink-500/5" : "border-white/10 bg-black/30"].join(" ")}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isMale ? "bg-blue-500/20 text-blue-200" : isFemale ? "bg-pink-500/20 text-pink-200" : "bg-white/10 text-white/70"}`}>{idx + 1}</span>
                                <div className="min-w-0">
                                  <div className="font-semibold truncate text-sm">{snap.name || "—"}</div>
                                  <div className="text-[11px] text-white/50 truncate">{snap.address || "—"}</div>
                                </div>
                              </div>
                              <div className="mt-2 flex flex-wrap gap-1 ml-8">
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/20 text-emerald-200 font-semibold">✅ CONFIRMED</span>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded-full border ${isMale ? "bg-blue-500/15 border-blue-400/20 text-blue-200" : isFemale ? "bg-pink-500/15 border-pink-400/20 text-pink-200" : "bg-white/10 border-white/10 text-white/60"}`}>{snap.gender || "?"}</span>
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/10 border border-white/10 text-white/50">{h.kind || "SINGLE"}</span>
                                {h.occupiedDate ? (<span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/15 border border-purple-400/20 text-purple-200">🔱 Diksha: {h.occupiedDate}</span>) : null}
                              </div>
                              <div className="mt-1.5 ml-8 text-[10px] text-white/40">Confirmed: {confirmedDate} • by {h.confirmedByLabel || "—"}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {/* List Tab Content (Mobile) */}
              {mobileContainerReady && mobileContainerTab === "LIST" && showList && assignments.length > 0 ? (
                <div className="mt-3 space-y-2">
                  {assignments.map((a, idx) => {
                    const seq = idx + 1;
                    const cust = a.customer;
                    const isMeeting = container?.mode === "MEETING";
                    const qualified = a?.cardStatus === "QUALIFIED";
                    const isMale = cust?.gender === "MALE";
                    const isFemale = cust?.gender === "FEMALE";

                    return (
                      <div key={safeId(a._id)} onClick={() => openProfile(cust, seq)} className={["rounded-2xl border p-3.5 flex items-start justify-between gap-3 cursor-pointer active:scale-[0.99] transition-all", isMale ? "border-blue-400/15 bg-blue-500/5 hover:bg-blue-500/10" : isFemale ? "border-pink-400/15 bg-pink-500/5 hover:bg-pink-500/10" : "border-white/10 bg-black/30 hover:bg-black/35"].join(" ")}>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isMale ? "bg-blue-500/20 text-blue-200" : isFemale ? "bg-pink-500/20 text-pink-200" : "bg-white/10 text-white/70"}`}>{seq}</span>
                            <div className="min-w-0">
                              <div className="font-semibold truncate text-sm">{cust?.name}</div>
                              <div className="text-[11px] text-white/50 truncate">{cust?.address || "-"}</div>
                            </div>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1 ml-8">
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full border ${isMale ? "bg-blue-500/15 border-blue-400/20 text-blue-200" : isFemale ? "bg-pink-500/15 border-pink-400/20 text-pink-200" : "bg-white/10 border-white/10 text-white/60"}`}>{cust?.gender || "?"}</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/10 border border-white/10 text-white/50">{a.kind || "SINGLE"}</span>
                            {isMeeting && a?.occupiedDate ? (<span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/20 text-emerald-200">🔱 {a.occupiedDate}</span>) : null}
                            {cust?.dikshaEligible === true || cust?.status === "ELIGIBLE" ? (<span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/15 border border-blue-400/20 text-blue-200">✅ ELIGIBLE</span>) : null}
                            {qualified ? (<span className="text-[9px] px-1.5 py-0.5 rounded-full bg-yellow-500/15 border border-yellow-400/20 text-yellow-200">👑 QUALIFIED</span>) : null}
                          </div>
                        </div>

                        {isMeeting ? (
                          <div className="flex flex-col gap-1.5 shrink-0">
                            <button disabled={pushing} onClick={(e) => { e.stopPropagation(); openConfirmModal(a); }} className="px-3 py-1.5 rounded-xl bg-white text-black text-[11px] font-semibold disabled:opacity-60 active:scale-95 transition">✓ Confirm</button>
                            <button disabled={pushing} onClick={(e) => { e.stopPropagation(); setRejectTarget(a); setRejectTargetSeq(seq); setRejectOpen(true); }} className="px-3 py-1.5 rounded-xl bg-white/10 text-[11px] border border-white/10 disabled:opacity-60 active:scale-95 transition">✗ Reject</button>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1.5 shrink-0">
                            <button disabled={pushing || qualified} onClick={(e) => { e.stopPropagation(); outAssignment(a._id); }} className="px-3 py-1.5 rounded-xl bg-white/10 text-[11px] border border-white/10 disabled:opacity-60 active:scale-95 transition">Out</button>
                            {container?.mode === "DIKSHA" ? (
                              <button disabled={pushing || qualified} onClick={(e) => { e.stopPropagation(); doneAssignment(a); }} className="px-3 py-1.5 rounded-xl bg-white text-black text-[11px] font-semibold disabled:opacity-60 active:scale-95 transition">✓ Done</button>
                            ) : null}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : mobileContainerReady && mobileContainerTab === "LIST" ? (
                <div className="mt-3 text-white/60 text-sm text-center py-6">
                  {!showList ? "List hidden. Tap 👁 to show." : "No customers in this container."}
                </div>
              ) : !mobileContainerReady ? (
                <div className="mt-3 text-white/50 text-sm text-center py-6">
                  {containerLoading ? (<div className="flex items-center justify-center gap-2"><BufferSpinner size={16} /> Loading...</div>) : "Pick a date from above."}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* ═══════ Desktop Grid View ═══════ */}
        <div className="hidden md:block">
          <div className="grid grid-cols-7 gap-1 sm:gap-2 text-[10px] sm:text-xs mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, i) => (
              <div key={d} className={`${i === 0 ? "text-red-300" : "text-white/70"} text-center`}>{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {cells.map((d, idx) => {
              if (!d) return <div key={idx} />;
              const dateStr = ymdLocal(d);
              const s = summary[dateStr];

              return (
                <button key={dateStr} onClick={() => openContainerForDate(dateStr, { openLayer: true })}
                  className={["min-h-[62px] sm:min-h-[84px] rounded-2xl border p-1.5 sm:p-2 text-left transition", "bg-black/30 border-white/10 hover:bg-black/40", selectedDate === dateStr ? "ring-2 ring-blue-500/60" : "", idx % 7 === 0 ? "ring-1 ring-red-500/20" : "", dateStr === todayStr ? "ring-2 ring-emerald-400/60 border-emerald-400/30" : ""].join(" ")}>
                  <div className="flex items-center justify-between">
                    <div className={`text-xs sm:text-sm font-semibold ${idx % 7 === 0 ? "text-red-200" : "text-white"}`}>{d.getDate()}</div>
                    {dateStr === todayStr ? (<span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 border border-emerald-400/20 text-emerald-200">Today</span>) : null}
                  </div>
                  <div className="text-[10px] text-white/50">{mode}</div>
                  {s ? (
                    <div className="mt-1.5 sm:mt-2 text-[10px] sm:text-[11px] text-white/80 flex gap-1.5 sm:gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-400/15 text-blue-200">M {s.male}</span>
                      <span className="px-2 py-0.5 rounded-full bg-pink-500/15 border border-pink-400/15 text-pink-200">F {s.female}</span>
                    </div>
                  ) : (
                    <div className="mt-1.5 sm:mt-2 text-[10px] sm:text-[11px] text-white/35">—</div>
                  )}
                  {s?.history > 0 ? (
                    <div className="mt-1 text-[9px] text-emerald-200">
                      <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/20">✅ {s.history} confirmed</span>
                    </div>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      </LayerModal>

      {/* Layer 2: Container (Desktop Modal) */}
      <LayerModal
        open={containerOpen && !!container}
        layerName="Container"
        title={container ? `${container.date} / ${container.mode}` : "Container"}
        sub={container?.mode === "DIKSHA" ? `IN ${counts.total} • Reserved ${reservedCounts.total} • Limit ${container.limit || 20}` : `Total ${counts.total}${historyRecords.length > 0 ? ` • ✅ ${historyRecords.length} confirmed` : ""}`}
        onClose={() => {
          setContainerOpen(false);
          setAddOpen(false);
          setConfirmSingleOpen(false);
          setConfirmFamilyOpen(false);
          setRejectOpen(false);
          setRejectTarget(null);
          setContainer(null);
          setAssignments([]);
          setReserved([]);
          setHistoryRecords([]);
        }}
        maxWidth="max-w-5xl"
      >
        {housefull ? (
          <div className="mb-3 rounded-2xl border border-red-400/20 bg-red-500/10 p-3">
            <div className="text-sm font-semibold text-red-200">Housefull</div>
            <div className="text-xs text-red-200/80 mt-1">Limit reached.</div>
          </div>
        ) : null}

        {/* Desktop gender stats */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-blue-500/15 border border-blue-400/20 text-blue-200 font-medium">👨 Male {counts.male}</span>
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-pink-500/15 border border-pink-400/20 text-pink-200 font-medium">👩 Female {counts.female}</span>
            {counts.other > 0 ? (<span className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/20 text-emerald-200 font-medium">Other {counts.other}</span>) : null}
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-white/10 border border-white/10 text-white/70 font-medium">Total {counts.total}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {role === "ADMIN" ? (<button onClick={increaseLimit} disabled={pushing} className="w-11 h-11 shrink-0 rounded-2xl bg-white text-black font-bold disabled:opacity-60" title="Increase limit">{pushing ? <BufferSpinner size={18} /> : "+"}</button>) : null}
            <button onClick={openPrintAllForContainer} disabled={pushing} className="w-11 h-11 shrink-0 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 disabled:opacity-60" title="Print all">{pushing ? <BufferSpinner size={18} /> : "🖨"}</button>
            <button onClick={() => setShowList((v) => !v)} disabled={pushing} className="w-11 h-11 shrink-0 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 disabled:opacity-60" title="Toggle list">☰</button>
            <button onClick={openAddCustomerLayer} disabled={pushing} className="w-11 h-11 shrink-0 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 disabled:opacity-60" title="Add customer">{pushing ? <BufferSpinner size={18} /> : "＋"}</button>
            <button onClick={openPrintListForContainer} disabled={pushing} className="w-11 h-11 shrink-0 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 disabled:opacity-60" title="Print list">📄</button>
          </div>
        </div>

        {!showList ? (
          <div className="text-white/60">List hidden.</div>
        ) : assignments.length === 0 ? (
          <div className="text-white/60">No customers.</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {assignments.map((a, idx) => {
              const seq = idx + 1;
              const cust = a.customer;
              const isMeeting = container?.mode === "MEETING";
              const qualified = a?.cardStatus === "QUALIFIED";

              return (
                <div key={safeId(a._id)} onClick={() => openProfile(cust, seq)} className="rounded-2xl border border-white/10 bg-black/30 p-3 flex items-start justify-between gap-2 cursor-pointer hover:bg-black/35">
                  <div className="min-w-0">
                    <div className="text-xs text-white/60">#{seq} • {a.kind || "SINGLE"}</div>
                    <div className="font-semibold truncate">{cust?.name}</div>
                    <div className="text-xs text-white/60 truncate">{cust?.address || "-"}</div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {isMeeting && a?.occupiedDate ? (<span className="inline-flex px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/15 border border-emerald-400/20 text-emerald-200">Occupied: {a.occupiedDate}</span>) : null}
                      {cust?.dikshaEligible === true || cust?.status === "ELIGIBLE" ? (<span className="inline-flex px-2 py-0.5 rounded-full text-[10px] bg-blue-500/15 border border-blue-400/20 text-blue-200">ELIGIBLE</span>) : null}
                      {qualified ? (<span className="inline-flex px-2 py-0.5 rounded-full text-[10px] bg-yellow-500/15 border border-yellow-400/20 text-yellow-200">👑 QUALIFIED</span>) : null}
                    </div>
                  </div>

                  {isMeeting ? (
                    <div className="flex flex-col gap-2 shrink-0">
                      <button disabled={pushing} onClick={(e) => { e.stopPropagation(); openConfirmModal(a); }} className="px-3 py-1 rounded-xl bg-white text-black text-xs font-semibold disabled:opacity-60">Confirm</button>
                      <button disabled={pushing} onClick={(e) => { e.stopPropagation(); setRejectTarget(a); setRejectTargetSeq(seq); setRejectOpen(true); }} className="px-3 py-1 rounded-xl bg-white/10 hover:bg-white/15 text-xs disabled:opacity-60">Reject</button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 shrink-0">
                      <button disabled={pushing || qualified} onClick={(e) => { e.stopPropagation(); outAssignment(a._id); }} className="px-3 py-1 rounded-xl bg-white/10 hover:bg-white/15 text-xs shrink-0 disabled:opacity-60">Out</button>
                      {container?.mode === "DIKSHA" ? (<button disabled={pushing || qualified} onClick={(e) => { e.stopPropagation(); doneAssignment(a); }} className="px-3 py-1 rounded-xl bg-white text-black text-xs font-semibold disabled:opacity-60">Done</button>) : null}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* History Section (Desktop) */}
        {container?.mode === "MEETING" && historyRecords.length > 0 ? (
          <div className="mt-4">
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/5 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">✅</span>
                  <div>
                    <div className="text-sm font-semibold text-emerald-200">Confirmed History</div>
                    <div className="text-[11px] text-emerald-200/70">{historyRecords.length} confirmed • moved to Diksha</div>
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {historyRecords.map((h, idx) => {
                  const snap = h.customerSnapshot || {};
                  const isMale = snap.gender === "MALE";
                  const isFemale = snap.gender === "FEMALE";
                  const confirmedDate = h.confirmedAt ? new Date(h.confirmedAt).toLocaleDateString() : "—";

                  return (
                    <div key={safeId(h._id) || idx} className={["rounded-2xl border p-3 opacity-75", isMale ? "border-blue-400/15 bg-blue-500/5" : isFemale ? "border-pink-400/15 bg-pink-500/5" : "border-white/10 bg-black/30"].join(" ")}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/20 text-emerald-200 font-semibold">✅ CONFIRMED</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full border ${isMale ? "bg-blue-500/15 border-blue-400/20 text-blue-200" : isFemale ? "bg-pink-500/15 border-pink-400/20 text-pink-200" : "bg-white/10 border-white/10 text-white/60"}`}>{snap.gender || "?"}</span>
                      </div>
                      <div className="text-xs text-white/60">#{idx + 1} • {h.kind || "SINGLE"}</div>
                      <div className="font-semibold truncate">{snap.name || "—"}</div>
                      <div className="text-xs text-white/60 truncate">{snap.address || "—"}</div>
                      {h.occupiedDate ? (<div className="mt-1.5"><span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-400/20 text-purple-200">🔱 Diksha: {h.occupiedDate}</span></div>) : null}
                      <div className="mt-1.5 text-[10px] text-white/40">{confirmedDate} • {h.confirmedByLabel || "—"}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}
      </LayerModal>

      {/* Reject Options Dialog */}
      <LayerModal open={rejectOpen} layerName="Reject" title="Reject Options" sub="Choose what to do with this customer" onClose={() => { setRejectOpen(false); setRejectTarget(null); setRejectTargetSeq(null); }} maxWidth="max-w-md" disableBackdropClose>
        <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-lg shrink-0">{rejectTarget?.customer?.gender === "FEMALE" ? "👩" : "👤"}</div>
              <div className="min-w-0">
                <div className="font-semibold text-white truncate">{rejectTarget?.customer?.name || "—"}</div>
                <div className="text-xs text-white/60 truncate">{rejectTarget?.customer?.address || "—"}{rejectTargetSeq ? ` • #${rejectTargetSeq}` : ""}</div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button disabled={pushing} onClick={() => rejectTarget && rejectToTrash(rejectTarget)} className="w-full rounded-2xl border border-red-400/20 bg-red-500/10 hover:bg-red-500/20 p-4 text-left transition group disabled:opacity-60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-400/20 flex items-center justify-center text-lg shrink-0 group-hover:scale-110 transition-transform">🗑️</div>
                <div><div className="font-semibold text-red-200">Trash</div><div className="text-xs text-red-200/60 mt-0.5">Card will be marked as REJECTED and moved to Trash</div></div>
              </div>
            </button>

            <button disabled={pushing} onClick={() => rejectTarget && rejectToPending(rejectTarget)} className="w-full rounded-2xl border border-amber-400/20 bg-amber-500/10 hover:bg-amber-500/20 p-4 text-left transition group disabled:opacity-60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/20 flex items-center justify-center text-lg shrink-0 group-hover:scale-110 transition-transform">📋</div>
                <div><div className="font-semibold text-amber-200">Push to Pending</div><div className="text-xs text-amber-200/60 mt-0.5">Move to Pending DB with ELIGIBLE status for future Diksha</div></div>
              </div>
            </button>

            <button disabled={pushing} onClick={() => {
              if (!rejectTarget?.customer?._id) return;
              setRejectOpen(false);
              setProfileCtx({ containerId: safeId(container?._id), assignmentId: safeId(rejectTarget._id), initialApproveStep: "pickDate" });
              setProfileCustomer(rejectTarget.customer);
              setProfileSeqNo(rejectTargetSeq || null);
              setProfileOpen(true);
            }} className="w-full rounded-2xl border border-blue-400/20 bg-blue-500/10 hover:bg-blue-500/20 p-4 text-left transition group disabled:opacity-60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/20 flex items-center justify-center text-lg shrink-0 group-hover:scale-110 transition-transform">🔄</div>
                <div><div className="font-semibold text-blue-200">Approve For (Shift)</div><div className="text-xs text-blue-200/60 mt-0.5">Shift customer to a different container/date</div></div>
              </div>
            </button>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5">
            <button onClick={() => { setRejectOpen(false); setRejectTarget(null); setRejectTargetSeq(null); }} className="w-full px-4 py-3 rounded-2xl bg-white/10 border border-white/10 hover:bg-white/15 text-white/80 text-sm transition">Cancel</button>
          </div>
        </div>
      </LayerModal>

      {/* Add customer layer */}
      <LayerModal open={addOpen} layerName="Add Customer" title="Add Customer" sub="Sitting ACTIVE" onClose={() => { setAddOpen(false); setConfirmSingleOpen(false); setConfirmFamilyOpen(false); }} maxWidth="max-w-4xl">
        <div className="flex gap-2 mb-3 items-center flex-wrap">
          <button onClick={() => { setPickMode("SINGLE"); setSelectedIds([]); }} className={`px-4 py-2 rounded-2xl text-sm ${pickMode === "SINGLE" ? "bg-white text-black font-semibold" : "bg-white/10 hover:bg-white/15"}`}>Single</button>
          <button onClick={() => { setPickMode("FAMILY"); setSelectedIds([]); }} className={`px-4 py-2 rounded-2xl text-sm ${pickMode === "FAMILY" ? "bg-white text-black font-semibold" : "bg-white/10 hover:bg-white/15"}`}>Family (2+)</button>
          {pickMode === "FAMILY" ? (<button onClick={initiateFamilyAssign} disabled={selectedIds.length < 2} className="ml-auto px-4 py-2 rounded-2xl bg-white text-black font-semibold disabled:opacity-60">Next</button>) : null}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[65vh] overflow-y-auto pr-1">
          {sittingActive.map((c) => {
            const id = safeId(c._id);
            const selected = selectedIds.includes(id);
            const familySelectedCls = pickMode === "FAMILY" && selected ? (selectedIds.length === 2 ? "border-fuchsia-400/40 bg-fuchsia-500/10" : "border-blue-400/40 bg-blue-500/10") : "";
            return (
              <div key={id} className={["rounded-2xl border p-3 border-white/10 bg-black/30", familySelectedCls].join(" ")}>
                <div className="font-semibold truncate">{c.name}</div>
                <div className="text-xs text-white/60 truncate">{c.address || "-"}</div>
                <div className="mt-3 flex justify-end gap-2">
                  {pickMode === "SINGLE" ? (
                    <button disabled={pushing} onClick={() => initiateSingleAssign(id)} className="px-3 py-2 rounded-xl bg-white text-black font-semibold text-xs disabled:opacity-60">Next</button>
                  ) : (
                    <button onClick={() => setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))} className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs">{selected ? "Selected" : "Select"}</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </LayerModal>

      {/* Confirm single */}
      <LayerModal open={confirmSingleOpen} layerName="Confirm Single" title="Confirm Single" sub="Review details → Push" onClose={() => setConfirmSingleOpen(false)} maxWidth="max-w-2xl">
        <div className="rounded-3xl border border-white/10 bg-black/30 p-4">
          {targetSingle ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="text-xs text-white/60">CUSTOMER</div>
              <div className="font-semibold mt-1">{targetSingle.name}</div>
              <div className="text-xs text-white/70 mt-1">{targetSingle.address || "-"}</div>
              <div className="text-[11px] text-white/60 mt-1">Gender: {targetSingle.gender}</div>
            </div>
          ) : (<div className="text-white/60">No customer selected.</div>)}
          <div className="mt-4 flex gap-2">
            <button onClick={() => setConfirmSingleOpen(false)} className="flex-1 px-4 py-3 rounded-2xl bg-white/10 border border-white/10 hover:bg-white/15">Back</button>
            <button onClick={() => confirmSinglePush()} disabled={pushing || !targetSingle} className="flex-1 px-4 py-3 rounded-2xl bg-white text-black font-semibold disabled:opacity-60 flex items-center justify-center gap-2">
              {pushing ? <BufferSpinner size={18} /> : null}{pushing ? "Pushing..." : "Push Single"}
            </button>
          </div>
        </div>
      </LayerModal>

      {/* Confirm family */}
      <LayerModal open={confirmFamilyOpen} layerName="Confirm Family" title={selectedIds.length === 2 ? "Confirm Couple" : "Confirm Family"} sub="Review selected customers → Push" onClose={() => setConfirmFamilyOpen(false)} maxWidth="max-w-4xl">
        <div className="mt-4 flex gap-2">
          <button onClick={() => setConfirmFamilyOpen(false)} className="flex-1 px-4 py-3 rounded-2xl bg-white/10 border border-white/10 hover:bg-white/15">Back</button>
          <button onClick={() => confirmFamilyPush()} disabled={pushing || selectedIds.length < 2} className="flex-1 px-4 py-3 rounded-2xl bg-white text-black font-semibold disabled:opacity-60 flex items-center justify-center gap-2">
            {pushing ? <BufferSpinner size={18} /> : null}{pushing ? "Pushing..." : selectedIds.length === 2 ? "Push Couple" : "Push Family"}
          </button>
        </div>
      </LayerModal>

      {/* Ultra UIX Confirm Modal */}
      <LayerModal open={confirmModalOpen} layerName="Confirm to Diksha" title="Confirm → Diksha" sub="Review before confirming" onClose={() => { setConfirmModalOpen(false); setConfirmModalTarget(null); }} maxWidth="max-w-md" disableBackdropClose>
        {confirmModalTarget ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl shrink-0 ${confirmModalTarget.customer?.gender === "MALE" ? "bg-blue-500/20 text-blue-200" : confirmModalTarget.customer?.gender === "FEMALE" ? "bg-pink-500/20 text-pink-200" : "bg-white/10 text-white/70"}`}>
                  {confirmModalTarget.customer?.gender === "FEMALE" ? "👩" : "👨"}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-lg truncate">{confirmModalTarget.customer?.name || "—"}</div>
                  <div className="text-xs text-white/60 truncate">{confirmModalTarget.customer?.address || "—"}</div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/8 p-4">
              <div className="text-sm font-semibold text-emerald-200 mb-2">What will happen:</div>
              <div className="space-y-1.5 text-xs text-emerald-200/80">
                <div className="flex items-start gap-2"><span className="text-emerald-300 mt-0.5">→</span><span>Card will move to <b>Diksha container ({confirmModalTarget.occupiedDate || "—"})</b></span></div>
                <div className="flex items-start gap-2"><span className="text-emerald-300 mt-0.5">→</span><span>Customer marked as <b>Diksha Eligible</b></span></div>
                <div className="flex items-start gap-2"><span className="text-emerald-300 mt-0.5">→</span><span><b>WhatsApp confirmation</b> will be sent</span></div>
                <div className="flex items-start gap-2"><span className="text-emerald-300 mt-0.5">→</span><span>A <b>history record</b> will remain in this meeting date</span></div>
              </div>
            </div>

            <div className="rounded-2xl border border-purple-400/20 bg-purple-500/8 p-3">
              <div className="flex items-center justify-between">
                <div className="text-xs text-purple-200/70">Diksha Date</div>
                <div className="font-bold text-purple-200">{confirmModalTarget.occupiedDate || "—"}</div>
              </div>
            </div>

            {confirmModalTarget.kind && confirmModalTarget.kind !== "SINGLE" ? (
              <div className="rounded-2xl border border-fuchsia-400/20 bg-fuchsia-500/8 p-3">
                <div className="text-xs text-fuchsia-200/70">⚠️ This is a <b>{confirmModalTarget.kind}</b> — all members will be confirmed together</div>
              </div>
            ) : null}

            <div className="flex gap-2 pt-2">
              <button onClick={() => { setConfirmModalOpen(false); setConfirmModalTarget(null); }} disabled={pushing} className="flex-1 px-4 py-3 rounded-2xl bg-white/10 border border-white/10 hover:bg-white/15 text-white disabled:opacity-60">Cancel</button>
              <button onClick={() => confirmMeetingCard(confirmModalTarget)} disabled={pushing} className="flex-1 px-4 py-3 rounded-2xl bg-emerald-500 text-white font-semibold disabled:opacity-60 flex items-center justify-center gap-2 active:scale-[0.98] transition">
                {pushing ? <BufferSpinner size={18} /> : null}{pushing ? "Confirming..." : "✓ Confirm & Send"}
              </button>
            </div>
          </div>
        ) : null}
      </LayerModal>

      <CustomerProfileModal
        open={profileOpen}
        onClose={() => { setProfileOpen(false); setProfileCustomer(null); setProfileCtx(null); setProfileSeqNo(null); }}
        customer={profileCustomer}
        source="SITTING"
        sequenceNo={profileSeqNo}
        initialApproveStep={profileCtx?.initialApproveStep || null}
        contextContainerId={profileCtx?.containerId || null}
        contextAssignmentId={profileCtx?.assignmentId || null}
        onChanged={async () => { await refreshContainer(); await loadSummary(); }}
      />

      <DikshaOccupyPickerModal
        open={occupyOpen}
        groupSize={occupyCtx?.groupSize || 1}
        meetingDate={container?.mode === "MEETING" ? container?.date : null}
        onClose={() => { setOccupyOpen(false); setOccupyCtx(null); }}
        onPick={async (dateKey) => {
          const ctx = occupyCtx;
          setOccupyOpen(false);
          setOccupyCtx(null);
          if (!ctx) return;
          if (ctx.type === "SINGLE") await confirmSinglePush({ occupyDate: dateKey });
          else await confirmFamilyPush({ occupyDate: dateKey });
        }}
      />

      {CommitModal}
    </div>
  );
}

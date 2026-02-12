// components/dashboard/MeetingCalander.js
"use client";

import { useEffect, useMemo, useState } from "react";
import LayerModal from "@/components/LayerModal";
import { useCommitGate } from "@/components/CommitGate";
import CustomerProfileModal from "@/components/CustomerProfileModal";
import DikshaOccupyPickerModal from "@/components/dashboard/DikshaOccupyPickerModal";
import BufferSpinner from "@/components/BufferSpinner";
import { openForm2PrintAllPreview } from "@/lib/printForm2Client";
import { openContainerListPrintPreview } from "@/lib/printListClient";
import { useTheme } from "@/components/ThemeProvider";
import { useCT, getModeStyle, getLockStatus } from "./calander/calanderTheme";

import CalanderHeader from "./calander/CalanderHeader";
import CalanderMobileHero from "./calander/CalanderMobileHero";
import CalanderDayStrip from "./calander/CalanderDayStrip";
import CalanderMonthGrid from "./calander/CalanderMonthGrid";
import ContainerPanel from "./calander/ContainerPanel";
import AddCustomerSheet from "./calander/AddCustomerSheet";
import RejectOptionsSheet from "./calander/RejectOptionsSheet";
import ConfirmDikshaSheet from "./calander/ConfirmDikshaSheet";

const MODE = "MEETING";

/* ── Utility ── */
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
  let male = 0, female = 0, other = 0;
  for (const a of list || []) {
    const g = a?.customer?.gender;
    if (g === "MALE") male++;
    else if (g === "FEMALE") female++;
    else other++;
  }
  return { male, female, other, total: male + female + other };
}

export default function MeetingCalander({ role }) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const c = useCT(isLight);
  const ms = getModeStyle(MODE, c);

  /* ── Calendar Nav ── */
  const [calOpen, setCalOpen] = useState(false);
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

  /* ── Container ── */
  const [containerOpen, setContainerOpen] = useState(false);
  const [container, setContainer] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [reserved, setReserved] = useState([]);
  const [historyRecords, setHistoryRecords] = useState([]);
  const [showList, setShowList] = useState(true);
  const [housefull, setHousefull] = useState(false);
  const [containerLoading, setContainerLoading] = useState(false);

  /* ── Add Customer ── */
  const [addOpen, setAddOpen] = useState(false);
  const [sittingActive, setSittingActive] = useState([]);
  const [pickMode, setPickMode] = useState("SINGLE");
  const [selectedIds, setSelectedIds] = useState([]);
  const [pushing, setPushing] = useState(false);

  /* ── Single/Family Confirm ── */
  const [confirmSingleOpen, setConfirmSingleOpen] = useState(false);
  const [confirmFamilyOpen, setConfirmFamilyOpen] = useState(false);
  const [singleTargetId, setSingleTargetId] = useState(null);

  /* ── Profile ── */
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileCustomer, setProfileCustomer] = useState(null);
  const [profileSeqNo, setProfileSeqNo] = useState(null);
  const [profileCtx, setProfileCtx] = useState(null);

  /* ── Occupy Picker ── */
  const [occupyOpen, setOccupyOpen] = useState(false);
  const [occupyCtx, setOccupyCtx] = useState(null);

  /* ── Reject ── */
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectTargetSeq, setRejectTargetSeq] = useState(null);

  /* ── Confirm Diksha ── */
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmModalTarget, setConfirmModalTarget] = useState(null);

  /* ── Warning ── */
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
      "⚡ BYPASS — Skip Diksha, send to Pending after confirm",
    ],
  });

  /* ── Error Handler ── */
  function handleApiError(data, fallback = "Failed") {
    if (!data?.error) return showWarn("Error", fallback);
    if (data.error === "HOUSEFULL") { setHousefull(true); return; }
    if (data.error === "NOT_ELIGIBLE_FOR_DIKSHA") return showWarn("Not Eligible", "Pehle Meeting me Confirm karo ya Reject→Pending flow se eligible banao.");
    if (data.error === "OCCUPY_REQUIRED") return showWarn("Occupy Required", "Meeting push ke liye Occupy (Diksha date) required hai.");
    if (data.error === "LOCKED_QUALIFIED") return showWarn("Locked", "Card QUALIFIED ho chuka hai.");
    if (data.error === "OCCUPY_MUST_BE_AFTER_MEETING") return showWarn("Invalid Occupy Date", data.message || "Occupy date must be AFTER meeting date.");
    return showWarn("Error", data.error || fallback);
  }

  /* ── Summary ── */
  async function loadSummary() {
    try {
      const from = ymdLocal(new Date(year, month, 1));
      const to = ymdLocal(new Date(year, month + 1, 0));
      const res = await fetch(`/api/calander/summary?from=${from}&to=${to}&mode=${MODE}`);
      const data = await res.json().catch(() => ({}));
      setSummary(data.map || {});
    } catch (e) {
      console.error("loadSummary failed", e);
      setSummary({});
    }
  }

  useEffect(() => { loadSummary(); }, [year, month]);

  function isDesktopNow() {
    if (typeof window === "undefined") return true;
    return window.matchMedia("(min-width: 768px)").matches;
  }

  /* ── Container Load ── */
  async function openContainerForDate(dateStr, opts = {}) {
    const shouldOpenLayer = typeof opts.openLayer === "boolean" ? opts.openLayer : isDesktopNow();
    setHousefull(false);
    setSelectedDate(dateStr);
    setContainerLoading(true);
    try {
      const cRes = await fetch("/api/calander/container/by-date", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: dateStr, mode: MODE }),
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

  /* ── Add Customer ── */
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

  /* ── confirmSinglePush — BYPASS AWARE ── */
  async function confirmSinglePush({ occupyDate } = {}) {
    if (!container?._id || !singleTargetId) return;

    const isBypass = occupyDate === "BYPASS";

    if (!occupyDate) {
      setOccupyCtx({ type: "SINGLE", customerId: singleTargetId, groupSize: 1 });
      setOccupyOpen(true);
      return;
    }

    const commitMessage = await requestCommit({
      title: isBypass ? "⚡ BYPASS — Assign without Diksha" : "Meeting Assign + Occupy",
      subtitle: isBypass ? "Card → Pending after confirm. No Diksha slot." : `Occupy Diksha: ${occupyDate}`,
      preset: isBypass ? "⚡ BYPASS — Skip Diksha, send to Pending after confirm" : "Meeting reserved (occupy)",
    }).catch(() => null);
    if (!commitMessage) return;

    const cId = safeId(container._id);
    if (!cId) return;

    setPushing(true);
    try {
      const body = {
        customerId: singleTargetId,
        source: "SITTING",
        note: isBypass ? "BYPASS: Diksha skipped" : "",
        commitMessage,
        bypass: isBypass || undefined,
      };
      // BYPASS fix: don't send occupyDate when bypass
      if (!isBypass) body.occupyDate = occupyDate;

      const res = await fetch(`/api/calander/container/${cId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
    if (selectedIds.length < 2) return showWarn("Select Customers", "Minimum 2 required");
    setConfirmFamilyOpen(true);
  }

  /* ── confirmFamilyPush — BYPASS AWARE ── */
  async function confirmFamilyPush({ occupyDate } = {}) {
    if (!container?._id) return;
    const ids = selectedIds.map(safeId).filter(Boolean);
    if (ids.length < 2) return showWarn("Select Customers", "Minimum 2 required");

    const isBypass = occupyDate === "BYPASS";

    if (!occupyDate) {
      setOccupyCtx({ type: "FAMILY", customerIds: ids, groupSize: ids.length });
      setOccupyOpen(true);
      return;
    }

    const isCouple = ids.length === 2;
    const commitMessage = await requestCommit({
      title: isBypass ? `⚡ BYPASS — ${isCouple ? "Couple" : "Family"} without Diksha` : "Meeting Group + Occupy",
      subtitle: isBypass ? "Group → Pending after confirm." : `Occupy Diksha: ${occupyDate}`,
      preset: isBypass ? "⚡ BYPASS — Skip Diksha, send to Pending after confirm" : "Meeting reserved (occupy)",
    }).catch(() => null);
    if (!commitMessage) return;

    const cId = safeId(container._id);
    if (!cId) return;

    setPushing(true);
    try {
      const body = {
        customerIds: ids,
        note: isBypass ? "BYPASS: Diksha skipped" : "",
        commitMessage,
        bypass: isBypass || undefined,
      };
      if (!isBypass) body.occupyDate = occupyDate;

      const res = await fetch(`/api/calander/container/${cId}/assign-couple`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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

  /* ── Confirm Meeting → Diksha ── */
  function openConfirmModal(assignment) {
    setConfirmModalTarget(assignment);
    setConfirmModalOpen(true);
  }

  async function confirmMeetingCard(assignment) {
    const cId = safeId(container?._id);
    const aId = safeId(assignment?._id);
    if (!cId || !aId) return;

    const isBypass = assignment?.bypass === true || assignment?.occupiedDate === "BYPASS";

    const commitMessage = await requestCommit({
      title: isBypass ? "⚡ BYPASS Confirm → Pending" : "Confirm → Move to Diksha",
      subtitle: isBypass ? "Card → Pending (BYPASS)" : `Occupied: ${assignment.occupiedDate || "—"}`,
      preset: isBypass ? "⚡ BYPASS — Skip Diksha, send to Pending after confirm" : "Meeting confirm → Diksha",
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

  /* ── Reject ── */
  async function rejectToTrash(assignment) {
    const cId = safeId(container?._id);
    const aId = safeId(assignment?._id);
    if (!cId || !aId) return;
    const commitMessage = await requestCommit({ title: "Reject → Trash", preset: "Meeting reject → Trash" }).catch(() => null);
    if (!commitMessage) return;
    setPushing(true);
    try {
      const res = await fetch(`/api/calander/container/${cId}/assignments/${aId}/reject`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commitMessage, rejectAction: "TRASH" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return handleApiError(data, "Trash failed");
      setRejectOpen(false); setRejectTarget(null); setRejectTargetSeq(null);
      await refreshContainer(); await loadSummary();
    } finally { setPushing(false); }
  }

  async function rejectToPending(assignment) {
    const cId = safeId(container?._id);
    const aId = safeId(assignment?._id);
    if (!cId || !aId) return;
    const commitMessage = await requestCommit({ title: "Reject → Pending", preset: "Meeting reject → Pending" }).catch(() => null);
    if (!commitMessage) return;
    setPushing(true);
    try {
      const res = await fetch(`/api/calander/container/${cId}/assignments/${aId}/reject`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commitMessage, rejectAction: "PUSH_PENDING" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return handleApiError(data, "Reject failed");
      setRejectOpen(false); setRejectTarget(null); setRejectTargetSeq(null);
      await refreshContainer(); await loadSummary();
    } finally { setPushing(false); }
  }

  function handleApproveFor(assignment, seq) {
    if (!assignment?.customer?._id) return;
    setRejectOpen(false);
    setProfileCtx({ containerId: safeId(container?._id), assignmentId: safeId(assignment._id), initialApproveStep: "pickDate" });
    setProfileCustomer(assignment.customer);
    setProfileSeqNo(seq || null);
    setProfileOpen(true);
  }

  /* ── Out ── */
  async function outAssignment(assignmentIdRaw) {
    const cId = safeId(container?._id);
    const aId = safeId(assignmentIdRaw);
    if (!cId || !aId) return;
    const commitMessage = await requestCommit({ title: "Out", preset: "Out from container" }).catch(() => null);
    if (!commitMessage) return;
    const res = await fetch(`/api/calander/container/${cId}/assignments/${aId}/out`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commitMessage }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return handleApiError(data, "Out failed");
    await refreshContainer(); await loadSummary();
  }

  /* ── Admin Limit ── */
  async function increaseLimit() {
    if (role !== "ADMIN") return showWarn("Not allowed", "Only Admin can increase limit.");
    const cId = safeId(container?._id);
    if (!cId) return;
    const next = prompt("New limit?", String(container.limit || 20));
    if (!next) return;
    const limit = parseInt(next, 10);
    if (!Number.isFinite(limit) || limit < 1) return showWarn("Invalid", "Invalid limit");
    const res = await fetch(`/api/calander/container/${cId}/limit`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ limit }),
    });
    if (!res.ok) return showWarn("Failed", "Limit update failed");
    await refreshContainer(); await loadSummary();
  }

  /* ── Unlock Container ── */
  async function unlockContainer(minutes) {
    const cId = safeId(container?._id);
    if (!cId) return;
    const res = await fetch(`/api/calander/container/${cId}/unlock`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ minutes }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return showWarn("Unlock Failed", data.error || "Could not unlock container");
    }
    await refreshContainer();
  }

  /* ── Profile ── */
  function openProfile(customerObj, seqNo = null) {
    if (!customerObj?._id) return;
    setProfileCtx(null);
    setProfileCustomer(customerObj);
    setProfileSeqNo(seqNo);
    setProfileOpen(true);
  }

  /* ── Print ── */
  async function openPrintAllForContainer() {
    if (!container?._id) return showWarn("Error", "Container not ready");
    if (!assignments?.length) return showWarn("Error", "No customers");
    const title = `${container.date} / MEETING`;
    const items = assignments.map((a, idx) => ({ customer: a.customer || {}, form: a.customer || {}, sequenceNo: idx + 1 }));
    await openForm2PrintAllPreview({ title, items, source: "SITTING" });
  }

  async function openPrintListForContainer() {
    if (!container?._id) return showWarn("Error", "Container not ready");
    if (!(assignments?.length || reserved?.length)) return showWarn("Error", "No customers");
    await openContainerListPrintPreview({ title: `${container.date} / MEETING • List`, container, assignments, reserved });
  }

  /* ── Derived ── */
  const counts = countGenders(assignments);
  const reservedCounts = countGenders(reserved);
  const targetSingle = useMemo(() => {
    return singleTargetId ? sittingActive.find((c) => safeId(c._id) === singleTargetId) : null;
  }, [singleTargetId, sittingActive]);

  /* ── Mobile auto-open ── */
  useEffect(() => {
    if (!calOpen) return;
    if (typeof window === "undefined") return;
    const mobile = !window.matchMedia("(min-width: 768px)").matches;
    if (!mobile) return;
    const sameMonth = todayStr.slice(0, 7) === ymdLocal(anchor).slice(0, 7);
    const autoDate = selectedDate || (sameMonth ? todayStr : ymdLocal(new Date(year, month, 1)));
    openContainerForDate(autoDate, { openLayer: false });
  }, [calOpen, year, month]);

  /* ══════════════════════════════════════
     RENDER
     ══════════════════════════════════════ */
  return (
    <div>
      {/* ── Entry Button ── */}
      <button
        onClick={() => { setAnchor(new Date()); setCalOpen(true); }}
        type="button"
        style={{
          padding: "12px 22px", borderRadius: 20,
          background: ms.bg, border: `1px solid ${ms.border}`,
          color: ms.text, fontSize: 14, fontWeight: 600,
          cursor: "pointer", transition: "all 0.15s",
          display: "flex", alignItems: "center", gap: 8,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.03)"; e.currentTarget.style.opacity = "0.9"; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.opacity = ""; }}
        onPointerDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
        onPointerUp={(e) => (e.currentTarget.style.transform = "")}
      >
        📋 Meeting Calendar
      </button>

      {/* Warning */}
      <LayerModal open={warnOpen} layerName="Warning" title={warnTitle} sub="" onClose={() => setWarnOpen(false)} maxWidth="max-w-md">
        <div style={{ borderRadius: 18, border: `1px solid ${c.surfaceBorder}`, background: c.surfaceBg, padding: 16 }}>
          <div style={{ fontSize: 13, color: c.t2, whiteSpace: "pre-wrap" }}>{warnMsg}</div>
          <div style={{ marginTop: 16 }}>
            <button type="button" onClick={() => setWarnOpen(false)} style={{ width: "100%", padding: "12px 16px", borderRadius: 18, background: c.btnSolidBg, color: c.btnSolidText, fontWeight: 600, border: "none", cursor: "pointer" }}>OK</button>
          </div>
        </div>
      </LayerModal>

      {/* Layer 1: Calendar */}
      <LayerModal
        open={calOpen} layerName="Meeting" title="📋 Meeting Calendar"
        sub="Desktop: Monthly Grid • Mobile: Day Strip"
        onClose={() => { setCalOpen(false); setContainerOpen(false); setAddOpen(false); setConfirmSingleOpen(false); setConfirmFamilyOpen(false); }}
        maxWidth="max-w-5xl"
      >
        <CalanderHeader anchor={anchor} mode={MODE} onPrevMonth={() => setAnchor(new Date(year, month - 1, 1))} onNextMonth={() => setAnchor(new Date(year, month + 1, 1))} />

        <CalanderMobileHero container={container} mode={MODE} selectedDate={selectedDate} todayStr={todayStr} counts={counts} reservedCounts={reservedCounts} historyCount={historyRecords?.length || 0} loading={containerLoading} />

        <CalanderDayStrip monthDays={monthDays} selectedDate={selectedDate} todayStr={todayStr} summary={summary} mode={MODE} onDateSelect={(d) => openContainerForDate(d, { openLayer: false })} />

        <div className="block md:hidden">
          <ContainerPanel
            container={container} assignments={assignments} reserved={reserved} historyRecords={historyRecords}
            counts={counts} reservedCounts={reservedCounts} mode={MODE} role={role} pushing={pushing}
            housefull={housefull} containerLoading={containerLoading} selectedDate={selectedDate}
            showList={showList} onToggleList={() => setShowList((v) => !v)}
            onOpenAdd={openAddCustomerLayer} onIncreaseLimit={increaseLimit}
            onUnlockContainer={unlockContainer}
            onPrintAll={openPrintAllForContainer} onPrintList={openPrintListForContainer}
            onOpenProfile={openProfile} onConfirm={openConfirmModal}
            onReject={(a, seq) => { setRejectTarget(a); setRejectTargetSeq(seq); setRejectOpen(true); }}
            onOut={outAssignment} onDone={null} onShowWarn={showWarn} variant="inline"
          />
        </div>

        <CalanderMonthGrid cells={cells} month={month} selectedDate={selectedDate} todayStr={todayStr} summary={summary} mode={MODE} onDateSelect={(d) => openContainerForDate(d, { openLayer: true })} />
      </LayerModal>

      {/* Layer 2: Container Desktop */}
      <LayerModal
        open={containerOpen && !!container} layerName="Container"
        title={container ? `${container.date} / MEETING` : "Container"}
        sub={`Total ${counts.total}${historyRecords.length > 0 ? ` • ✅ ${historyRecords.length} confirmed` : ""}`}
        onClose={() => { setContainerOpen(false); setAddOpen(false); setConfirmSingleOpen(false); setConfirmFamilyOpen(false); setRejectOpen(false); setRejectTarget(null); setContainer(null); setAssignments([]); setReserved([]); setHistoryRecords([]); }}
        maxWidth="max-w-5xl"
      >
        <ContainerPanel
          container={container} assignments={assignments} reserved={reserved} historyRecords={historyRecords}
          counts={counts} reservedCounts={reservedCounts} mode={MODE} role={role} pushing={pushing}
          housefull={housefull} containerLoading={containerLoading} selectedDate={selectedDate}
          showList={showList} onToggleList={() => setShowList((v) => !v)}
          onOpenAdd={openAddCustomerLayer} onIncreaseLimit={increaseLimit}
          onUnlockContainer={unlockContainer}
          onPrintAll={openPrintAllForContainer} onPrintList={openPrintListForContainer}
          onOpenProfile={openProfile} onConfirm={openConfirmModal}
          onReject={(a, seq) => { setRejectTarget(a); setRejectTargetSeq(seq); setRejectOpen(true); }}
          onOut={outAssignment} onDone={null} onShowWarn={showWarn} variant="default"
        />
      </LayerModal>

      {/* Reject */}
      <RejectOptionsSheet open={rejectOpen} onClose={() => { setRejectOpen(false); setRejectTarget(null); setRejectTargetSeq(null); }} rejectTarget={rejectTarget} rejectTargetSeq={rejectTargetSeq} pushing={pushing} onTrash={rejectToTrash} onPending={rejectToPending} onApproveFor={handleApproveFor} />

      {/* Add Customer */}
      <AddCustomerSheet open={addOpen} onClose={() => { setAddOpen(false); setConfirmSingleOpen(false); setConfirmFamilyOpen(false); }} sittingActive={sittingActive} pickMode={pickMode} onPickModeChange={(m) => { setPickMode(m); setSelectedIds([]); }} selectedIds={selectedIds} onToggleSelect={(id) => setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])} pushing={pushing} onInitiateSingle={initiateSingleAssign} onInitiateFamily={initiateFamilyAssign} />

      {/* Confirm Single */}
      <LayerModal open={confirmSingleOpen} layerName="Confirm Single" title="Confirm Single" sub="Review → Push" onClose={() => setConfirmSingleOpen(false)} maxWidth="max-w-2xl">
        <div style={{ borderRadius: 22, border: `1px solid ${c.surfaceBorder}`, background: c.surfaceBg, padding: 16 }}>
          {targetSingle ? (
            <div style={{ borderRadius: 18, border: `1px solid ${c.panelBorder}`, background: c.panelBg, padding: 14 }}>
              <div style={{ fontSize: 11, color: c.t3, textTransform: "uppercase" }}>Customer</div>
              <div style={{ fontWeight: 600, marginTop: 4, color: c.t1 }}>{targetSingle.name}</div>
              <div style={{ fontSize: 12, color: c.t2, marginTop: 4 }}>{targetSingle.address || "—"}</div>
              <div style={{ fontSize: 11, color: c.t3, marginTop: 4 }}>Gender: {targetSingle.gender}</div>
            </div>
          ) : (<div style={{ color: c.t3 }}>No customer selected.</div>)}
          <div className="flex gap-2" style={{ marginTop: 16 }}>
            <button type="button" onClick={() => setConfirmSingleOpen(false)} style={{ flex: 1, padding: "12px 16px", borderRadius: 18, background: c.btnGhostBg, color: c.btnGhostText, border: `1px solid ${c.btnGhostBorder}`, cursor: "pointer" }}>Back</button>
            <button type="button" onClick={() => confirmSinglePush()} disabled={pushing || !targetSingle} style={{ flex: 1, padding: "12px 16px", borderRadius: 18, background: c.btnSolidBg, color: c.btnSolidText, fontWeight: 600, border: "none", cursor: pushing || !targetSingle ? "not-allowed" : "pointer", opacity: pushing || !targetSingle ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              {pushing ? <BufferSpinner size={16} /> : null}{pushing ? "Pushing..." : "Push Single"}
            </button>
          </div>
        </div>
      </LayerModal>

      {/* Confirm Family */}
      <LayerModal open={confirmFamilyOpen} layerName="Confirm Family" title={selectedIds.length === 2 ? "Confirm Couple" : "Confirm Family"} sub="Review → Push" onClose={() => setConfirmFamilyOpen(false)} maxWidth="max-w-4xl">
        <div className="flex gap-2" style={{ marginTop: 16 }}>
          <button type="button" onClick={() => setConfirmFamilyOpen(false)} style={{ flex: 1, padding: "12px 16px", borderRadius: 18, background: c.btnGhostBg, color: c.btnGhostText, border: `1px solid ${c.btnGhostBorder}`, cursor: "pointer" }}>Back</button>
          <button type="button" onClick={() => confirmFamilyPush()} disabled={pushing || selectedIds.length < 2} style={{ flex: 1, padding: "12px 16px", borderRadius: 18, background: c.btnSolidBg, color: c.btnSolidText, fontWeight: 600, border: "none", cursor: pushing || selectedIds.length < 2 ? "not-allowed" : "pointer", opacity: pushing || selectedIds.length < 2 ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {pushing ? <BufferSpinner size={16} /> : null}{pushing ? "Pushing..." : selectedIds.length === 2 ? "Push Couple" : "Push Family"}
          </button>
        </div>
      </LayerModal>

      {/* Confirm Diksha */}
      <ConfirmDikshaSheet open={confirmModalOpen} onClose={() => { setConfirmModalOpen(false); setConfirmModalTarget(null); }} target={confirmModalTarget} pushing={pushing} onConfirm={confirmMeetingCard} />

      {/* Profile */}
      <CustomerProfileModal open={profileOpen} onClose={() => { setProfileOpen(false); setProfileCustomer(null); setProfileCtx(null); setProfileSeqNo(null); }} customer={profileCustomer} source="SITTING" sequenceNo={profileSeqNo} initialApproveStep={profileCtx?.initialApproveStep || null} contextContainerId={profileCtx?.containerId || null} contextAssignmentId={profileCtx?.assignmentId || null} onChanged={async () => { await refreshContainer(); await loadSummary(); }} />

      {/* Occupy Picker */}
      <DikshaOccupyPickerModal open={occupyOpen} groupSize={occupyCtx?.groupSize || 1} meetingDate={container?.date || null} onClose={() => { setOccupyOpen(false); setOccupyCtx(null); }} onPick={async (dateKey) => { const ctx = occupyCtx; setOccupyOpen(false); setOccupyCtx(null); if (!ctx) return; if (ctx.type === "SINGLE") await confirmSinglePush({ occupyDate: dateKey }); else await confirmFamilyPush({ occupyDate: dateKey }); }} />

      {CommitModal}
    </div>
  );
}

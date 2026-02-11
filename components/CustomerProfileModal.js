// components/CustomerProfileModal.js
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import LayerModal from "@/components/LayerModal";
import { useCommitGate } from "@/components/CommitGate";
import { useTheme } from "@/components/ThemeProvider";
import { openForm2PrintPreview } from "@/lib/printForm2Client";
import CustomerHistoryModal from "@/components/CustomerHistoryModal";
import DikshaOccupyPickerModal from "@/components/dashboard/DikshaOccupyPickerModal";

import { PT } from "@/components/profile/profileTheme";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileInfoPanel from "@/components/profile/ProfileInfoPanel";
import ProfileActionsPanel from "@/components/profile/ProfileActionsPanel";
import ProfileHallCard from "@/components/profile/ProfileHallCard";
import ProfileSecondForm from "@/components/profile/ProfileSecondForm";
import ProfileDoneModal from "@/components/profile/ProfileDoneModal";
import { ReviewLine, ErrorBanner, LoadingSpinner, TabBar } from "@/components/profile/ProfileSubComponents";

/* ═══════════════════════════════════════════════
   HELPERS (kept from original)
   ═══════════════════════════════════════════════ */

function safeId(x) {
  if (!x) return "";
  if (typeof x === "string") return x;
  if (typeof x === "object" && x.$oid) return String(x.$oid);
  return String(x);
}

function sourceApiBase(source) {
  if (source === "TODAY") return "/api/customers/today";
  if (source === "PENDING") return "/api/customers/pending";
  if (source === "SITTING") return "/api/customers/sitting";
  return "/api/customers/today";
}

function uniqStrings(arr) {
  const out = [], seen = new Set();
  for (const x of arr || []) {
    const s = String(x || "").trim();
    if (!s) continue;
    const k = s.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(s);
  }
  return out;
}

function mergeFull(prev, full) {
  const out = { ...(prev || {}) };
  for (const [k, v] of Object.entries(full || {})) {
    const pv = out[k];
    if (pv === "" || pv === null || pv === undefined) out[k] = v;
    if (typeof v === "boolean" && (pv === undefined || pv === null)) out[k] = v;
  }
  return out;
}

function pad2(n) { return String(n).padStart(2, "0"); }
function ymdLocal(d) { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; }
function fromDateKey(key) {
  const [y, m, d] = String(key || "").split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
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

/* ═══════════════════════════════════════════════
   CACHE (shared pattern)
   ═══════════════════════════════════════════════ */

const INDIA_STATES_FALLBACK = ["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Delhi","Jammu and Kashmir","Ladakh","Puducherry","Chandigarh","Dadra and Nagar Haveli and Daman and Diu","Andaman and Nicobar Islands","Lakshadweep"];
const STATES_BACKUP = {"United States":["Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming"],Canada:["Alberta","British Columbia","Manitoba","New Brunswick","Newfoundland and Labrador","Northwest Territories","Nova Scotia","Nunavut","Ontario","Prince Edward Island","Quebec","Saskatchewan","Yukon"],Australia:["Australian Capital Territory","New South Wales","Northern Territory","Queensland","South Australia","Tasmania","Victoria","Western Australia"],"United Kingdom":["England","Scotland","Wales","Northern Ireland"]};
const COUNTRIES_FALLBACK = ["India","United States","United Kingdom","Canada","Australia","Germany","France","Japan","China","Nepal","Bangladesh","Sri Lanka"].map((n) => ({ name: n, flag: "", code: n }));

const _cache = { countries: null, states: {}, cities: {} };

async function loadCountries() {
  if (_cache.countries) return _cache.countries;
  try { const s = sessionStorage.getItem("sb_countries"); if (s) { const p = JSON.parse(s); if (p?.length > 10) { _cache.countries = p; return p; } } } catch {}
  try {
    const res = await fetch("https://restcountries.com/v3.1/all");
    const data = await res.json().catch(() => []);
    const list = (data || []).map((c) => ({ name: c?.name?.common, flag: c?.flag || "", code: c?.cca2 || c?.name?.common })).filter((x) => x.name).sort((a, b) => a.name.localeCompare(b.name));
    if (list.length) { _cache.countries = list; try { sessionStorage.setItem("sb_countries", JSON.stringify(list)); } catch {} return list; }
  } catch {}
  _cache.countries = COUNTRIES_FALLBACK; return COUNTRIES_FALLBACK;
}

async function loadStates(country) {
  if (!country) return [];
  const ck = country.toLowerCase();
  if (_cache.states[ck]) return _cache.states[ck];
  try {
    const res = await fetch("https://countriesnow.space/api/v0.1/countries/states", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ country }) });
    const data = await res.json().catch(() => ({}));
    const states = uniqStrings((data?.data?.states || []).map((s) => s?.name).filter(Boolean));
    if (states.length) { _cache.states[ck] = states; return states; }
  } catch {}
  if (country === "India") { _cache.states[ck] = INDIA_STATES_FALLBACK; return INDIA_STATES_FALLBACK; }
  return STATES_BACKUP[country] || [];
}

async function loadCities(country, state) {
  if (!country || !state || state === "__OTHER__") return [];
  const ck = `${country}__${state}`.toLowerCase();
  if (_cache.cities[ck]) return _cache.cities[ck];
  try {
    const res = await fetch("https://countriesnow.space/api/v0.1/countries/state/cities", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ country, state }) });
    const data = await res.json().catch(() => ({}));
    const cities = uniqStrings(data?.data || []).sort((a, b) => a.localeCompare(b));
    if (cities.length) { _cache.cities[ck] = cities; return cities; }
  } catch {}
  return [];
}

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */

export default function CustomerProfileModal({
  open, onClose, customer, source, onChanged,
  initialApproveStep, initialEditMode,
  contextContainerId = null, contextAssignmentId = null,
  sequenceNo = null,
}) {
  const themeApi = useTheme();
  const isLight = themeApi?.theme === "light";
  const c = isLight ? PT.light : PT.dark;

  // ── State ──
  const [hmmOpen, setHmmOpen] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState(null);
  const [confirmEditOpen, setConfirmEditOpen] = useState(false);
  const [err, setErr] = useState("");

  const [approveStep, setApproveStep] = useState(null);
  const [mode, setMode] = useState("DIKSHA");
  const [pickedDate, setPickedDate] = useState(null);
  const [note, setNote] = useState("");

  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [datePickerAnchor, setDatePickerAnchor] = useState(() => new Date());
  const [datePickerSelected, setDatePickerSelected] = useState(null);
  const [datePickerSummary, setDatePickerSummary] = useState({});
  const [datePickerSummaryLoading, setDatePickerSummaryLoading] = useState(false);
  const [datePickerPreview, setDatePickerPreview] = useState(null);
  const [datePickerPreviewLoading, setDatePickerPreviewLoading] = useState(false);

  const [reg2Open, setReg2Open] = useState(false);
  const [reg2Err, setReg2Err] = useState("");
  const [reg2, setReg2] = useState(null);
  const [doneOpen, setDoneOpen] = useState(false);
  const [doneMsg, setDoneMsg] = useState("Done");

  const [countries, setCountries] = useState([]);
  const [countriesLoading, setCountriesLoading] = useState(false);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [stateLoading, setStateLoading] = useState(false);
  const [cityLoading, setCityLoading] = useState(false);

  const [fullLoadBusy, setFullLoadBusy] = useState(false);
  const [fullLoadErr, setFullLoadErr] = useState("");
  const fullLoadedRef = useRef(false);

  const [isDesktop, setIsDesktop] = useState(true);
  const [mobileTab, setMobileTab] = useState("INFO");

  const [occupyOpen, setOccupyOpen] = useState(false);
  const occupyNextRef = useRef(null);

  const isApproveForShift = Boolean(source === "SITTING" && contextContainerId && contextAssignmentId);
  const showActions = source === "PENDING" || source === "SITTING";

  const { requestCommit, CommitModal } = useCommitGate({
    defaultSuggestions: [
      "Created profile", "Corrected customer data", "Approved for calander container",
      "Meeting reject → ApproveFor", "Moved to pending", "Restored from pending",
      "Updated profile details", "Finalized after edit (Recent → Sitting)", "Customer shifted",
    ],
  });

  // ── Calendar computeds ──
  const dpYear = datePickerAnchor.getFullYear();
  const dpMonth = datePickerAnchor.getMonth();
  const dpCells = useMemo(() => monthCells(dpYear, dpMonth), [dpYear, dpMonth]);
  const dpMonthDays = useMemo(() => {
    const dim = new Date(dpYear, dpMonth + 1, 0).getDate();
    return Array.from({ length: dim }, (_, i) => new Date(dpYear, dpMonth, i + 1));
  }, [dpYear, dpMonth]);
  const dpTodayKey = useMemo(() => ymdLocal(new Date()), []);

  // ── Form computeds ──
  const stateFinal = useMemo(() => {
    if (!form) return "";
    return form.state === "__OTHER__" ? String(form.stateOther || "").trim() : String(form.state || "").trim();
  }, [form?.state, form?.stateOther]);

  const cityFinal = useMemo(() => {
    if (!form) return "";
    return form.city === "__OTHER__" ? String(form.cityOther || "").trim() : String(form.city || "").trim();
  }, [form?.city, form?.cityOther]);

  const computedAddress = useMemo(() => {
    const co = String(form?.country || "India").trim();
    return [cityFinal, stateFinal, co].filter(Boolean).join(", ");
  }, [form?.country, stateFinal, cityFinal]);

  const canFinalizeEdit = useMemo(() => {
    return Boolean(String(form?.name || "").trim() && String(form?.age || "").trim() && String(form?.address || "").trim());
  }, [form?.name, form?.age, form?.address]);

  // ── Effects ──
  useEffect(() => {
    if (!open || typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 1024px)");
    const apply = () => setIsDesktop(mq.matches);
    apply();
    mq.addEventListener?.("change", apply) || mq.addListener?.(apply);
    return () => { mq.removeEventListener?.("change", apply) || mq.removeListener?.(apply); };
  }, [open]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setCountriesLoading(true);
      try { const list = await loadCountries(); if (alive) setCountries(list); }
      catch { if (alive) setCountries(COUNTRIES_FALLBACK); }
      finally { if (alive) setCountriesLoading(false); }
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!open || !customer) return;
    setErr(""); setConfirmEditOpen(false); setPrintOpen(false); setDoneOpen(false);
    setFullLoadBusy(false); setFullLoadErr(""); fullLoadedRef.current = false;
    setForm({
      name: customer?.name || "", age: customer?.age || "", address: customer?.address || "",
      occupation: customer?.occupation || "", maritalStatus: customer?.maritalStatus || "",
      followYears: customer?.followYears || "", clubVisitsBefore: customer?.clubVisitsBefore || "",
      monthYear: customer?.monthYear || "",
      onionGarlic: customer?.onionGarlic, hasPet: customer?.hasPet,
      hadTeacherBefore: customer?.hadTeacherBefore, familyPermission: customer?.familyPermission,
      nasha: customer?.nasha, gender: customer?.gender || "OTHER",
      country: customer?.country || "India", state: customer?.state || "", stateOther: "",
      city: customer?.city || "", cityOther: "", pincode: customer?.pincode || "",
      guardianRelation: customer?.guardianRelation || "", guardianName: customer?.guardianName || "",
      phoneCountryCode: customer?.phoneCountryCode || "+91", phoneNumber: customer?.phoneNumber || "",
      whatsappCountryCode: customer?.whatsappCountryCode || "+91", whatsappNumber: customer?.whatsappNumber || "",
      idType: customer?.idType || "aadhaar", idValue: customer?.idValue || "", idTypeName: customer?.idTypeName || "",
      familyMemberName: customer?.familyMemberName || "", familyMemberRelation: customer?.familyMemberRelation || "",
      familyMemberRelationOther: customer?.familyMemberRelationOther || "", familyMemberMobile: customer?.familyMemberMobile || "",
      note: customer?.note || "", approver: customer?.approver || "", remarks: customer?.remarks || "",
      familyPermissionRelation: customer?.familyPermissionRelation || "", familyPermissionOther: customer?.familyPermissionOther || "",
      dikshaYear: customer?.dikshaYear || "", vrindavanVisits: customer?.vrindavanVisits || "",
      firstDikshaYear: customer?.firstDikshaYear || "",
    });
    setEditMode(Boolean(initialEditMode));
    setPickedDate(null); setNote(""); setDatePickerOpen(false); setDatePickerSelected(null);
    setDatePickerAnchor(new Date()); setReg2Open(false); setReg2Err(""); setReg2(null);
    if ((source === "PENDING" || source === "SITTING") && initialApproveStep) setApproveStep(initialApproveStep);
    else setApproveStep(null);
    setMobileTab("INFO"); setOccupyOpen(false); occupyNextRef.current = null;
  }, [open, customer, source, initialApproveStep, initialEditMode]);

  useEffect(() => {
    if (!open || !customer?._id || !editMode || fullLoadedRef.current) return;
    let alive = true;
    (async () => {
      setFullLoadBusy(true); setFullLoadErr("");
      try {
        const res = await fetch(`${sourceApiBase(source)}/${safeId(customer._id)}`, { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!alive) return;
        if (!res.ok) { setFullLoadErr(data.error || "Load failed"); return; }
        const full = data?.customer;
        if (!full) { setFullLoadErr("Invalid response"); return; }
        setForm((prev) => mergeFull(prev, full));
        fullLoadedRef.current = true;
      } catch { if (alive) setFullLoadErr("Network error"); }
      finally { if (alive) setFullLoadBusy(false); }
    })();
    return () => { alive = false; };
  }, [open, editMode, source, customer?._id]);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!open || !form) return;
      const country = String(form.country || "").trim();
      if (!country) { setStates([]); return; }
      setStateLoading(true);
      try { const st = await loadStates(country); if (alive) setStates(uniqStrings(st)); }
      finally { if (alive) setStateLoading(false); }
    })();
    return () => { alive = false; };
  }, [open, form?.country]);

  useEffect(() => {
    if (!open || !form || !form.state || form.state === "__OTHER__" || !states.length) return;
    if (states.includes(form.state)) return;
    setForm((p) => ({ ...p, state: "__OTHER__", stateOther: p.stateOther || p.state, city: "__OTHER__", cityOther: p.cityOther || p.city || "" }));
  }, [open, states]);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!open || !form) return;
      const country = String(form.country || "").trim();
      const st = String(form.state || "").trim();
      if (!country || !st || st === "__OTHER__") { setCities([]); return; }
      setCityLoading(true);
      try { const list = await loadCities(country, st); if (alive) setCities(uniqStrings(list)); }
      finally { if (alive) setCityLoading(false); }
    })();
    return () => { alive = false; };
  }, [open, form?.country, form?.state]);

  useEffect(() => {
    if (!open || !form || !form.city || form.city === "__OTHER__" || !cities.length) return;
    if (cities.includes(form.city)) return;
    setForm((p) => ({ ...p, city: "__OTHER__", cityOther: p.cityOther || p.city }));
  }, [open, cities]);

  // Calendar date picker effects (kept as-is)
  useEffect(() => {
    if (!datePickerOpen) return;
    const from = ymdLocal(new Date(dpYear, dpMonth, 1));
    const to = ymdLocal(new Date(dpYear, dpMonth + 1, 0));
    const ac = new AbortController();
    (async () => {
      setDatePickerSummaryLoading(true);
      try { const res = await fetch(`/api/calander/summary?from=${from}&to=${to}&mode=${mode}`, { signal: ac.signal }); const data = await res.json().catch(() => ({})); setDatePickerSummary(data.map || {}); }
      catch (e) { if (e?.name !== "AbortError") setDatePickerSummary({}); }
      finally { setDatePickerSummaryLoading(false); }
    })();
    return () => ac.abort();
  }, [datePickerOpen, datePickerAnchor, mode]);

  useEffect(() => {
    if (!datePickerOpen || !datePickerSelected) { setDatePickerPreview(null); return; }
    const ac = new AbortController();
    (async () => {
      setDatePickerPreviewLoading(true); setDatePickerPreview(null);
      try {
        const cRes = await fetch("/api/calander/container/by-date", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date: datePickerSelected, mode }), signal: ac.signal });
        const cData = await cRes.json().catch(() => ({}));
        if (!cRes.ok) { setDatePickerPreview({ error: cData.error || "Failed" }); return; }
        const containerObj = cData?.container?.value ?? cData?.container;
        if (!containerObj?._id) { setDatePickerPreview({ error: "Invalid container" }); return; }
        const cId = typeof containerObj._id === "object" && containerObj._id.$oid ? containerObj._id.$oid : String(containerObj._id);
        const dRes = await fetch(`/api/calander/container/${cId}?includeReserved=1`, { signal: ac.signal });
        const dData = await dRes.json().catch(() => ({}));
        if (!dRes.ok) { setDatePickerPreview({ error: dData.error || "Failed" }); return; }
        const assignments = dData.assignments || [];
        const reserved = dData.reserved || [];
        const container = dData.container || containerObj;
        let inM = 0, inF = 0, inO = 0;
        for (const a of assignments) { const g = a?.customer?.gender; if (g === "MALE") inM++; else if (g === "FEMALE") inF++; else inO++; }
        let resM = 0, resF = 0, resO = 0;
        for (const a of reserved) { const g = a?.customer?.gender; if (g === "MALE") resM++; else if (g === "FEMALE") resF++; else resO++; }
        setDatePickerPreview({ container, inTotal: assignments.length, inMale: inM, inFemale: inF, inOther: inO, resTotal: reserved.length, resMale: resM, resFemale: resF, resOther: resO, limit: container?.limit || 20, error: null });
      } catch (e) { if (e?.name !== "AbortError") setDatePickerPreview({ error: "Network error" }); }
      finally { setDatePickerPreviewLoading(false); }
    })();
    return () => ac.abort();
  }, [datePickerOpen, datePickerSelected, mode]);

  // ── EARLY RETURN ──
  if (!open || !customer || !form) return null;

  // ── Actions ──
  function buildUpdates() {
    const updates = { ...form, country: String(form.country || "India").trim() || "India", state: stateFinal, city: cityFinal, address: String(form.address || "").trim() || computedAddress, onionGarlic: !!form.onionGarlic, hasPet: !!form.hasPet, hadTeacherBefore: !!form.hadTeacherBefore, familyPermission: !!form.familyPermission, nasha: !!form.nasha, familyMemberRelationOther: form.familyMemberRelation === "other" ? String(form.familyMemberRelationOther || "").trim() : "" };
    delete updates.stateOther; delete updates.cityOther;
    return updates;
  }

  async function saveEdits() {
    setErr("");
    const commitMessage = await requestCommit({ title: "Save Changes", subtitle: `Update in ${source}`, preset: "Updated profile details" }).catch(() => null);
    if (!commitMessage) return;
    setBusy(true);
    try {
      const res = await fetch(`${sourceApiBase(source)}/${safeId(customer._id)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...buildUpdates(), commitMessage }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setErr(data.error || "Save failed"); return; }
      setDoneMsg("Saved successfully"); setDoneOpen(true); onChanged?.();
    } catch { setErr("Network error"); }
    finally { setBusy(false); }
  }

  function openSecondForm() {
    if (source !== "TODAY") return alert("Only for Recent");
    setErr("");
    if (!canFinalizeEdit) { setErr("Name, Age, Address required"); return; }
    setReg2({ guardianRelation: form.guardianRelation || "", guardianName: form.guardianName || "", pinCode: form.pincode || "", phoneCountryCode: form.phoneCountryCode || "+91", phoneNumber: form.phoneNumber || "", whatsappCountryCode: form.whatsappCountryCode || "+91", whatsappNumber: form.whatsappNumber || "", idType: form.idType || "aadhaar", idValue: form.idValue || "", idTypeName: form.idTypeName || "", familyMemberName: form.familyMemberName || "", familyMemberRelation: form.familyMemberRelation || "", familyMemberRelationOther: form.familyMemberRelationOther || "", familyMemberMobile: form.familyMemberMobile || "", address2: form.address || "" });
    setReg2Err(""); setReg2Open(true);
  }

  function validateSecondForm(x) {
    if (!String(x?.guardianRelation || "").trim()) return "Guardian relation required";
    if (!String(x?.guardianName || "").trim()) return "Guardian name required";
    if (!/^\d{6}$/.test(String(x?.pinCode || "").trim())) return "PIN must be 6 digits";
    if (!String(x?.phoneCountryCode || "").trim()) return "Phone code required";
    if (String(x?.phoneNumber || "").replace(/\D/g, "").length < 8) return "Phone too short";
    if (!String(x?.idType || "").trim()) return "ID type required";
    if (!String(x?.idValue || "").trim()) return "ID number required";
    if (!String(x?.address2 || "").trim()) return "Address required";
    if (x?.idType === "other" && !String(x?.idTypeName || "").trim()) return "Other ID name required";
    if (!String(x?.familyMemberName || "").trim()) return "Family name required";
    if (!String(x?.familyMemberRelation || "").trim()) return "Family relation required";
    if (x?.familyMemberRelation === "other" && !String(x?.familyMemberRelationOther || "").trim()) return "Other relation required";
    if (!String(x?.familyMemberMobile || "").trim()) return "Family mobile required";
    return null;
  }

  function continueAfterSecondForm() {
    const msg = validateSecondForm(reg2);
    if (msg) { setReg2Err(msg); return; }
    setForm((prev) => ({ ...prev, guardianRelation: reg2.guardianRelation, guardianName: reg2.guardianName, pincode: String(reg2.pinCode || "").trim(), phoneCountryCode: reg2.phoneCountryCode, phoneNumber: String(reg2.phoneNumber || "").replace(/\D/g, ""), whatsappCountryCode: reg2.whatsappCountryCode, whatsappNumber: String(reg2.whatsappNumber || "").replace(/\D/g, ""), idType: reg2.idType, idValue: reg2.idValue, idTypeName: reg2.idTypeName, familyMemberName: reg2.familyMemberName, familyMemberRelation: reg2.familyMemberRelation, familyMemberRelationOther: reg2.familyMemberRelation === "other" ? reg2.familyMemberRelationOther : "", familyMemberMobile: reg2.familyMemberMobile, address: reg2.address2 }));
    setReg2Open(false); setConfirmEditOpen(true);
  }

  async function confirmEditAndFinalize() {
    if (source !== "TODAY") return;
    setErr("");
    if (!canFinalizeEdit) { setErr("Name, Age, Address required"); return; }
    const commitMessage = await requestCommit({ title: "Finalize to Sitting", subtitle: "Move from Recent → Sitting (ACTIVE)", preset: "Finalized after edit" }).catch(() => null);
    if (!commitMessage) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/customers/today/${safeId(customer._id)}/finalize`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ updates: buildUpdates(), commitMessage }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setErr(data.error || "Failed"); return; }
      setConfirmEditOpen(false); setEditMode(false);
      setDoneMsg("Finalized → Sitting"); setDoneOpen(true);
    } catch { setErr("Network error"); }
    finally { setBusy(false); }
  }

  function requestOccupyThen(nextFn) { occupyNextRef.current = nextFn; setOccupyOpen(true); }

  async function approveToContainer(occupyDate = null) {
    if (!pickedDate) return alert("Select date");
    if (mode === "MEETING" && !occupyDate) { requestOccupyThen(async (dk) => { await approveToContainer(dk); }); return; }
    const commitMessage = await requestCommit({ title: isApproveForShift ? "Approve Shift" : "Push to Container", subtitle: isApproveForShift ? "Shift to container" : "Assign to container", preset: isApproveForShift ? "Meeting reject → ApproveFor" : "Approved for calander container" }).catch(() => null);
    if (!commitMessage) return;
    setBusy(true);
    try {
      if (isApproveForShift) {
        const res = await fetch(`/api/calander/container/${contextContainerId}/assignments/${contextAssignmentId}/approve-for`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ toDate: pickedDate, toMode: mode, occupyDate: mode === "MEETING" ? occupyDate : undefined, note, commitMessage }) });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) { handleApproveError(data); return; }
        onChanged?.(); onClose(); return;
      }
      const cRes = await fetch("/api/calander/container/by-date", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date: pickedDate, mode }) });
      const cData = await cRes.json().catch(() => ({}));
      if (!cRes.ok) return alert(cData.error || "Container failed");
      const containerObj = cData?.container?.value ?? cData?.container;
      if (!containerObj?._id) return alert("Invalid container");
      const aRes = await fetch(`/api/calander/container/${safeId(containerObj._id)}/assign`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ customerId: safeId(customer._id), source, note, commitMessage, occupyDate: mode === "MEETING" ? occupyDate : undefined }) });
      const aData = await aRes.json().catch(() => ({}));
      if (!aRes.ok) { handleApproveError(aData); return; }
      onChanged?.(); onClose();
    } finally { setBusy(false); }
  }

  function handleApproveError(data) {
    const e = data.error;
    if (e === "HOUSEFULL") alert("Housefull: limit reached");
    else if (e === "OCCUPY_REQUIRED") alert("Meeting push ke liye Occupy (Diksha date) required.");
    else if (e === "NOT_ELIGIBLE_FOR_DIKSHA") alert("NOT ELIGIBLE: Pehle Meeting me confirm ke baad.");
    else if (e === "OCCUPY_MUST_BE_AFTER_MEETING") alert(data.message || "Occupy date must be same or after meeting.");
    else alert(e || "Failed");
  }

  function openCalendarDatePicker() {
    const base = pickedDate ? fromDateKey(pickedDate) : new Date();
    setDatePickerAnchor(base || new Date());
    setDatePickerSelected(pickedDate || null);
    setDatePickerSummary({}); setDatePickerPreview(null);
    setDatePickerOpen(true);
  }

  function confirmPickedDate(dk) {
    if (!dk) return;
    setPickedDate(dk); setDatePickerOpen(false); setApproveStep("note");
  }

  async function openPrintPage() {
    try { await openForm2PrintPreview({ customer, form, source, sequenceNo }); }
    catch { alert("Print failed"); }
  }

  // ── Mobile tabs config ──
  const mobileTabs = showActions
    ? [
        { key: "INFO", label: "Info", icon: "👤" },
        { key: "ACTIONS", label: "Actions", icon: "⚡" },
        { key: "CARD", label: "Card", icon: "🪪" },
      ]
    : [
        { key: "INFO", label: "Info", icon: "👤" },
        { key: "CARD", label: "Card", icon: "🪪" },
      ];

  // ═══════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════

  return (
    <>
      <LayerModal
        open={open}
        layerName="Customer Profile"
        title={customer.name}
        sub={`Source: ${source}${isApproveForShift ? " • Shift" : ""}`}
        onClose={onClose}
        maxWidth="max-w-5xl"
      >
        {/* Profile Header */}
        <div style={{ animation: "fadeSlide 0.3s ease-out" }}>
          <ProfileHeader
            customer={customer}
            source={source}
            c={c}
            isLight={isLight}
            isApproveForShift={isApproveForShift}
            sequenceNo={sequenceNo}
          />
        </div>

        {/* Quick actions bar */}
        <div
          className="flex items-center gap-2 mt-3 mb-4 flex-wrap"
          style={{ animation: "fadeSlide 0.35s ease-out" }}
        >
          <button type="button" onClick={() => setPrintOpen(true)}
            className="px-3 py-1.5 rounded-xl text-[11px] font-semibold border transition-all duration-200"
            style={{ background: c.btnGhostBg, borderColor: c.btnGhostBorder, color: c.btnGhostText }}
          >🖨️ Print</button>
          <button type="button" onClick={() => setHmmOpen(true)}
            className="px-3 py-1.5 rounded-xl text-[11px] font-semibold border transition-all duration-200"
            style={{ background: c.btnGhostBg, borderColor: c.btnGhostBorder, color: c.btnGhostText }}
          >📜 History</button>
        </div>

        {/* Desktop layout */}
        {isDesktop ? (
          <div className="grid lg:grid-cols-3 gap-4" style={{ animation: "fadeSlide 0.4s ease-out" }}>
            <div className={showActions ? "lg:col-span-2" : "lg:col-span-2"}>
              <ProfileInfoPanel
                customer={customer} form={form} setForm={setForm}
                editMode={editMode} setEditMode={setEditMode}
                source={source} c={c} busy={busy} err={err}
                onSave={saveEdits} onFinalize={openSecondForm}
                fullLoadBusy={fullLoadBusy} fullLoadErr={fullLoadErr}
                countries={countries} countriesLoading={countriesLoading}
                states={states} stateLoading={stateLoading}
                cities={cities} cityLoading={cityLoading}
                stateFinal={stateFinal} cityFinal={cityFinal}
                computedAddress={computedAddress}
                canFinalizeEdit={canFinalizeEdit}
                fullLoadedRef={fullLoadedRef}
              />
            </div>
            <div className="space-y-4">
              {showActions && (
                <ProfileActionsPanel
                  source={source} c={c} busy={busy}
                  approveStep={approveStep} setApproveStep={setApproveStep}
                  mode={mode} setMode={setMode}
                  pickedDate={pickedDate} setPickedDate={setPickedDate}
                  note={note} setNote={setNote}
                  isApproveForShift={isApproveForShift}
                  onApprove={approveToContainer}
                  onOpenDatePicker={openCalendarDatePicker}
                />
              )}
              <ProfileHallCard
                customer={customer} form={form} source={source}
                sequenceNo={sequenceNo} c={c} isLight={isLight}
                onPrint={openPrintPage}
                onOpenPrintModal={() => setPrintOpen(true)}
              />
            </div>
          </div>
        ) : (
          /* Mobile layout */
          <div style={{ animation: "fadeSlide 0.4s ease-out" }}>
            <div className="mb-3">
              <TabBar tabs={mobileTabs} active={mobileTab} onChange={setMobileTab} c={c} />
            </div>
            <div>
              {mobileTab === "INFO" && (
                <ProfileInfoPanel
                  customer={customer} form={form} setForm={setForm}
                  editMode={editMode} setEditMode={setEditMode}
                  source={source} c={c} busy={busy} err={err}
                  onSave={saveEdits} onFinalize={openSecondForm}
                  fullLoadBusy={fullLoadBusy} fullLoadErr={fullLoadErr}
                  countries={countries} countriesLoading={countriesLoading}
                  states={states} stateLoading={stateLoading}
                  cities={cities} cityLoading={cityLoading}
                  stateFinal={stateFinal} cityFinal={cityFinal}
                  computedAddress={computedAddress}
                  canFinalizeEdit={canFinalizeEdit}
                  fullLoadedRef={fullLoadedRef}
                />
              )}
              {mobileTab === "ACTIONS" && showActions && (
                <ProfileActionsPanel
                  source={source} c={c} busy={busy}
                  approveStep={approveStep} setApproveStep={setApproveStep}
                  mode={mode} setMode={setMode}
                  pickedDate={pickedDate} setPickedDate={setPickedDate}
                  note={note} setNote={setNote}
                  isApproveForShift={isApproveForShift}
                  onApprove={approveToContainer}
                  onOpenDatePicker={openCalendarDatePicker}
                />
              )}
              {mobileTab === "CARD" && (
                <ProfileHallCard
                  customer={customer} form={form} source={source}
                  sequenceNo={sequenceNo} c={c} isLight={isLight}
                  onPrint={openPrintPage}
                  onOpenPrintModal={() => setPrintOpen(true)}
                />
              )}
            </div>
          </div>
        )}
      </LayerModal>

      {/* ═══ Calendar Date Picker ═══ */}
      <LayerModal open={datePickerOpen} layerName="Calendar Picker" title={`Select Date (${mode})`} sub="Tap date → Preview → Confirm" onClose={() => setDatePickerOpen(false)} maxWidth="max-w-5xl" disableBackdropClose>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="text-base sm:text-lg font-bold" style={{ color: c.t1 }}>{datePickerAnchor.toLocaleString("default", { month: "long" })} {dpYear}</div>
          <div className="flex items-center gap-2">
            <button onClick={() => setDatePickerAnchor(new Date(dpYear, dpMonth - 1, 1))} className={`px-3 py-2 rounded-xl ${c.calNavBtn}`} type="button">◀</button>
            <div className="rounded-2xl border p-1 flex" style={{ borderColor: c.panelBorder, background: c.glassBg }}>
              <button onClick={() => { setMode("DIKSHA"); setDatePickerSelected(null); setDatePickerPreview(null); }} className={`px-3 sm:px-4 py-2 rounded-xl text-sm ${mode === "DIKSHA" ? c.calModeBtnActive : c.calModeBtnInactive}`} type="button">Diksha</button>
              <button onClick={() => { setMode("MEETING"); setDatePickerSelected(null); setDatePickerPreview(null); }} className={`px-3 sm:px-4 py-2 rounded-xl text-sm ${mode === "MEETING" ? c.calModeBtnActive : c.calModeBtnInactive}`} type="button">Meeting</button>
            </div>
            <button onClick={() => setDatePickerAnchor(new Date(dpYear, dpMonth + 1, 1))} className={`px-3 py-2 rounded-xl ${c.calNavBtn}`} type="button">▶</button>
          </div>
        </div>

        <div className="mb-3 flex items-center justify-between">
          <div className="text-xs" style={{ color: c.t3 }}>Selected: <b style={{ color: c.t1 }}>{datePickerSelected || "—"}</b></div>
          <div className="text-xs flex items-center gap-2" style={{ color: c.t3 }}>
            {datePickerSummaryLoading ? <LoadingSpinner c={c} size={14} /> : null}
            <span>{mode === "MEETING" ? "📋 Meeting" : "🔱 Diksha"}</span>
          </div>
        </div>

        {/* Mobile day strip */}
        <div className="block md:hidden">
          <div className="rounded-2xl border p-3" style={{ background: c.calBg, borderColor: c.calBorder }}>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory">
              {dpMonthDays.map((d) => {
                const dk = ymdLocal(d); const sel = datePickerSelected === dk; const today = dk === dpTodayKey;
                const wd = d.toLocaleDateString("default", { weekday: "short" }); const sun = d.getDay() === 0;
                const past = dk < dpTodayKey; const s = datePickerSummary?.[dk]; const has = s && (s.male + s.female) > 0;
                return (
                  <button key={dk} type="button" disabled={past} onClick={() => setDatePickerSelected(dk)}
                    className="shrink-0 min-w-[76px] rounded-2xl border px-3 py-2.5 text-left snap-start transition-all"
                    style={{
                      background: sel ? c.calSelected : c.calBg, borderColor: sel ? c.acc : today ? c.calTodayBorder : c.calBorder,
                      opacity: past ? c.calDayPast : 1, boxShadow: sel ? `0 0 0 2px ${c.calSelectedRing}` : "none",
                    }}>
                    <div className="flex items-center justify-between gap-1">
                      <div className="text-[11px] font-semibold" style={{ color: sun ? c.calDaySun : c.t2 }}>{wd}</div>
                      {today && <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.calToday }} />}
                    </div>
                    <div className="text-lg font-bold leading-6 mt-0.5" style={{ color: c.calDayText }}>{d.getDate()}</div>
                    {has ? (
                      <div className="mt-1.5 space-y-0.5">
                        <div className="text-[10px] font-medium" style={{ color: c.t3 }}>{s.male + s.female} cards</div>
                        <div className="flex gap-1">
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full border" style={{ background: c.calCardMale, borderColor: c.calCardMaleBorder, color: c.calCardMaleText }}>M{s.male}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full border" style={{ background: c.calCardFemale, borderColor: c.calCardFemaleBorder, color: c.calCardFemaleText }}>F{s.female}</span>
                        </div>
                      </div>
                    ) : <div className="mt-1.5 text-[10px]" style={{ color: c.t4 }}>—</div>}
                  </button>
                );
              })}
            </div>
          </div>
          {datePickerSelected ? <DatePreviewCard preview={datePickerPreview} loading={datePickerPreviewLoading} date={datePickerSelected} mode={mode} c={c} /> : <div className="mt-3 text-center text-sm py-4" style={{ color: c.t3 }}>Select a date</div>}
        </div>

        {/* Desktop grid */}
        <div className="hidden md:block">
          <div className="grid grid-cols-7 gap-1 sm:gap-2 text-[10px] sm:text-xs mb-2">
            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d, i) => <div key={d} className="text-center" style={{ color: i === 0 ? c.calDaySun : c.t3 }}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {dpCells.map((d, idx) => {
              if (!d) return <div key={idx} />;
              const dk = ymdLocal(d); const s = datePickerSummary?.[dk]; const past = dk < dpTodayKey;
              const has = s && (s.male + s.female) > 0; const sel = datePickerSelected === dk; const today = dk === dpTodayKey;
              return (
                <button key={dk} type="button" disabled={past} onClick={() => setDatePickerSelected(dk)}
                  className="min-h-[70px] sm:min-h-[90px] rounded-2xl border p-2 text-left transition"
                  style={{
                    background: sel ? c.calSelected : c.calBg, borderColor: sel ? c.acc : today ? c.calTodayBorder : c.calBorder,
                    opacity: past ? c.calDayPast : 1, boxShadow: sel ? `0 0 0 2px ${c.calSelectedRing}` : "none",
                  }}>
                  <div className="flex items-center justify-between">
                    <div className="text-xs sm:text-sm font-semibold" style={{ color: idx % 7 === 0 ? c.calDaySun : c.calDayText }}>{d.getDate()}</div>
                    {today && <span className="px-2 py-0.5 rounded-full text-[10px] border" style={{ background: c.calReservedBg, borderColor: c.calTodayBorder, color: c.calReservedText }}>Today</span>}
                  </div>
                  <div className="text-[10px]" style={{ color: c.t4 }}>{mode}</div>
                  {has ? (
                    <div className="mt-2 text-[10px] sm:text-[11px] flex gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded-full border" style={{ background: c.calCardMale, borderColor: c.calCardMaleBorder, color: c.calCardMaleText }}>M {s.male}</span>
                      <span className="px-2 py-0.5 rounded-full border" style={{ background: c.calCardFemale, borderColor: c.calCardFemaleBorder, color: c.calCardFemaleText }}>F {s.female}</span>
                    </div>
                  ) : <div className="mt-2 text-[10px] sm:text-[11px]" style={{ color: c.t4 }}>—</div>}
                  {has && <div className="mt-1 text-[9px]" style={{ color: c.t4 }}>{s.male + s.female} cards</div>}
                </button>
              );
            })}
          </div>
          {datePickerSelected && <DatePreviewCard preview={datePickerPreview} loading={datePickerPreviewLoading} date={datePickerSelected} mode={mode} c={c} />}
        </div>

        <div className="mt-4 flex gap-2">
          <button type="button" onClick={() => setDatePickerOpen(false)} className="flex-1 px-4 py-3 rounded-2xl text-[13px] font-semibold border transition-all duration-200" style={{ background: c.btnGhostBg, borderColor: c.btnGhostBorder, color: c.btnGhostText }}>Cancel</button>
          <button type="button" disabled={!datePickerSelected} onClick={() => confirmPickedDate(datePickerSelected)} className="flex-1 px-4 py-3 rounded-2xl text-[13px] font-bold transition-all duration-200 disabled:opacity-50" style={{ background: c.btnSolidBg, color: c.btnSolidText }}>Confirm</button>
        </div>
      </LayerModal>

      {/* Occupy Picker */}
      <DikshaOccupyPickerModal open={occupyOpen} groupSize={1} meetingDate={pickedDate || null}
        onClose={() => { setOccupyOpen(false); occupyNextRef.current = null; }}
        onPick={async (dk) => { const fn = occupyNextRef.current; occupyNextRef.current = null; setOccupyOpen(false); if (fn) await fn(dk); }}
      />

      {/* Second Form */}
      <ProfileSecondForm open={reg2Open} onClose={() => setReg2Open(false)} reg2={reg2} setReg2={setReg2} reg2Err={reg2Err} setReg2Err={setReg2Err} onContinue={continueAfterSecondForm} c={c} busy={busy} />

      {/* Confirm Edit */}
      <LayerModal open={confirmEditOpen} layerName="Confirm" title="Confirm Changes" sub="Review → Finalize" onClose={() => setConfirmEditOpen(false)} maxWidth="max-w-2xl" disableBackdropClose>
        <ErrorBanner message={err} c={c} />
        <div className="rounded-3xl border overflow-hidden" style={{ background: c.reviewBg, borderColor: c.reviewBorder }}>
          {[["Name", form?.name], ["Age", form?.age], ["Address", form?.address], ["PIN", form?.pincode],
            ["Country/State/City", `${form?.country || "-"} / ${stateFinal || "-"} / ${cityFinal || "-"}`],
            ["Guardian", `${form?.guardianRelation || "-"} • ${form?.guardianName || "-"}`],
            ["Phone", `${form?.phoneCountryCode || ""} ${form?.phoneNumber || ""}`],
            ["WhatsApp", `${form?.whatsappCountryCode || ""} ${form?.whatsappNumber || ""}`],
            ["Family", `${form?.familyMemberName || "-"} • ${form?.familyMemberRelation === "other" ? form?.familyMemberRelationOther || "-" : form?.familyMemberRelation || "-"} • ${form?.familyMemberMobile || "-"}`],
          ].map(([k, v], i) => <ReviewLine key={k} k={k} v={v} c={c} alt={i % 2 === 1} />)}
        </div>
        <div className="mt-4 flex gap-2">
          <button type="button" disabled={busy} onClick={() => { setConfirmEditOpen(false); openSecondForm(); }}
            className="flex-1 px-4 py-3 rounded-2xl text-[13px] font-semibold border transition-all duration-200"
            style={{ background: c.btnGhostBg, borderColor: c.btnGhostBorder, color: c.btnGhostText }}
          >← Back</button>
          <button type="button" disabled={busy || !canFinalizeEdit} onClick={confirmEditAndFinalize}
            className="flex-1 px-4 py-3 rounded-2xl text-[13px] font-bold transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: c.btnSolidBg, color: c.btnSolidText }}
          >
            {busy ? <LoadingSpinner c={{ loadingDot: c.btnSolidText }} size={16} /> : null}
            {busy ? "Processing..." : "🚀 Finalize → Sitting"}
          </button>
        </div>
      </LayerModal>

      {/* Print */}
      <LayerModal open={printOpen} layerName="Print" title="Print Preview" sub="Form2 Template" onClose={() => setPrintOpen(false)} maxWidth="max-w-2xl">
        <div className="rounded-3xl border p-4" style={{ background: c.panelBg, borderColor: c.panelBorder }}>
          <div className="text-[13px] font-bold" style={{ color: c.t1 }}>🖨️ Template Print</div>
          <div className="text-[11px] mt-1" style={{ color: c.hintColor }}>Guardian/Gender/Marital/ID/Family auto-fill.{sequenceNo ? <> Card: <b>#{sequenceNo}</b></> : null}</div>
        </div>
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={() => setPrintOpen(false)} className="flex-1 px-4 py-3 rounded-2xl text-[13px] font-semibold border" style={{ background: c.btnGhostBg, borderColor: c.btnGhostBorder, color: c.btnGhostText }}>Close</button>
          <button type="button" onClick={openPrintPage} className="flex-1 px-4 py-3 rounded-2xl text-[13px] font-bold" style={{ background: c.btnSolidBg, color: c.btnSolidText }}>Open Print Preview</button>
        </div>
      </LayerModal>

      {/* Done */}
      <ProfileDoneModal open={doneOpen} onClose={() => { setDoneOpen(false); onChanged?.(); onClose(); }} message={doneMsg} c={c} />

      {/* History */}
      <CustomerHistoryModal open={hmmOpen} onClose={() => setHmmOpen(false)} customerId={safeId(customer._id)} />

      {CommitModal}

      {/* Animations */}
      <style jsx global>{`
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes badgePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.4); }
        }
      `}</style>
    </>
  );
}

/* ═══════════════════════════════════════════════
   Date Preview Card (used in calendar picker)
   ═══════════════════════════════════════════════ */

function DatePreviewCard({ preview, loading, date, mode, c }) {
  return (
    <div className="mt-3 rounded-2xl border p-4" style={{ background: c.calPreviewBg, borderColor: c.calPreviewBorder }}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: c.t3 }}>Container Preview</div>
          <div className="font-bold mt-0.5" style={{ color: c.t1 }}>{date} • {mode === "MEETING" ? "📋" : "🔱"} {mode}</div>
        </div>
        {loading && <LoadingSpinner c={c} size={18} />}
      </div>
      {preview?.error ? (
        <div className="rounded-xl border p-2 text-xs" style={{ background: c.errorBg, borderColor: c.errorBorder, color: c.errorText }}>{preview.error}</div>
      ) : preview ? (
        <div className="grid sm:grid-cols-3 gap-3">
          <PreviewStat label="In Container" value={preview.inTotal} male={preview.inMale} female={preview.inFemale} c={c} />
          {mode === "DIKSHA" && <PreviewStat label="Reserved" value={preview.resTotal} male={preview.resMale} female={preview.resFemale} c={c} reserved />}
          <div className="rounded-xl border p-3" style={{ background: c.calBg, borderColor: c.calBorder }}>
            <div className="text-[10px] font-semibold" style={{ color: c.t3 }}>Capacity</div>
            <div className="flex items-center justify-between mt-1">
              <div className="text-lg font-bold" style={{ color: c.t1 }}>{(mode === "DIKSHA" ? preview.inTotal + preview.resTotal : preview.inTotal)}/{preview.limit}</div>
              <div className="text-[11px] font-bold px-2 py-1 rounded-full border"
                style={{
                  background: (mode === "DIKSHA" ? preview.inTotal + preview.resTotal : preview.inTotal) >= preview.limit ? c.errorBg : c.calReservedBg,
                  borderColor: (mode === "DIKSHA" ? preview.inTotal + preview.resTotal : preview.inTotal) >= preview.limit ? c.errorBorder : c.calReservedBorder,
                  color: (mode === "DIKSHA" ? preview.inTotal + preview.resTotal : preview.inTotal) >= preview.limit ? c.errorText : c.calReservedText,
                }}
              >
                {Math.max(0, preview.limit - (mode === "DIKSHA" ? preview.inTotal + preview.resTotal : preview.inTotal))} left
              </div>
            </div>
            <div className="mt-2 h-2.5 rounded-full overflow-hidden" style={{ background: c.calGaugeTrack }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, ((mode === "DIKSHA" ? preview.inTotal + preview.resTotal : preview.inTotal) / preview.limit) * 100)}%`,
                  background: (mode === "DIKSHA" ? preview.inTotal + preview.resTotal : preview.inTotal) >= preview.limit ? c.calGaugeFull : c.calGaugeOk,
                }}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PreviewStat({ label, value, male, female, c, reserved }) {
  return (
    <div className="rounded-xl border p-3" style={{ background: reserved ? c.calReservedBg : c.calBg, borderColor: reserved ? c.calReservedBorder : c.calBorder }}>
      <div className="text-[10px] font-semibold" style={{ color: reserved ? c.calReservedText : c.t3 }}>{label}</div>
      <div className="text-xl font-bold mt-1" style={{ color: reserved ? c.calReservedText : c.t1 }}>{value}</div>
      <div className="mt-2 flex gap-1.5">
        <span className="text-[10px] px-2 py-0.5 rounded-full border" style={{ background: c.calCardMale, borderColor: c.calCardMaleBorder, color: c.calCardMaleText }}>M {male}</span>
        <span className="text-[10px] px-2 py-0.5 rounded-full border" style={{ background: c.calCardFemale, borderColor: c.calCardFemaleBorder, color: c.calCardFemaleText }}>F {female}</span>
      </div>
    </div>
  );
}

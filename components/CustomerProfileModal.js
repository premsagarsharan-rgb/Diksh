"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import LayerModal from "@/components/LayerModal";
import SuggestInput from "@/components/SuggestInput";
import CustomerHistoryModal from "@/components/CustomerHistoryModal";
import { useCommitGate } from "@/components/CommitGate";
import { openForm2PrintPreview } from "@/lib/printForm2Client";
import BufferSpinner from "@/components/BufferSpinner";
import DikshaOccupyPickerModal from "@/components/dashboard/DikshaOccupyPickerModal";
import { parsePhoneNumberFromString } from "libphonenumber-js/min";

const noteSuggestions = [
  "Bring ID proof",
  "Arrive 10 minutes early",
  "First time visitor",
  "VIP",
  "Needs follow-up",
  "Confirmed by family",
];

const INDIA_STATES_FALLBACK = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana",
  "Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur",
  "Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Delhi","Jammu and Kashmir","Ladakh",
  "Puducherry","Chandigarh","Dadra and Nagar Haveli and Daman and Diu","Andaman and Nicobar Islands","Lakshadweep",
];

const STATES_BACKUP = {
  "United States": ["Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming"],
  Canada: ["Alberta","British Columbia","Manitoba","New Brunswick","Newfoundland and Labrador","Northwest Territories","Nova Scotia","Nunavut","Ontario","Prince Edward Island","Quebec","Saskatchewan","Yukon"],
  Australia: ["Australian Capital Territory","New South Wales","Northern Territory","Queensland","South Australia","Tasmania","Victoria","Western Australia"],
  "United Kingdom": ["England","Scotland","Wales","Northern Ireland"],
};

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
  const out = [];
  const seen = new Set();
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

async function fetchIndiaStates() {
  try {
    const res = await fetch("https://countriesnow.space/api/v0.1/countries/states", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country: "India" }),
    });
    const data = await res.json().catch(() => ({}));
    const states = (data?.data?.states || []).map((s) => s.name).filter(Boolean);
    if (states.length) return uniqStrings(states);
  } catch {}
  return INDIA_STATES_FALLBACK;
}

async function fetchIndiaCities(state) {
  try {
    const res = await fetch("https://countriesnow.space/api/v0.1/countries/state/cities", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country: "India", state }),
    });
    const data = await res.json().catch(() => ({}));
    return uniqStrings(data?.data || []);
  } catch { return []; }
}

async function loadCountriesREST() {
  const res = await fetch("https://restcountries.com/v3.1/all");
  const data = await res.json().catch(() => []);
  return (data || [])
    .map((c) => ({ name: c?.name?.common, flag: c?.flag || "", code: c?.cca2 || c?.cca3 || c?.name?.common }))
    .filter((x) => x.name)
    .sort((a, b) => String(a.name).localeCompare(String(b.name)));
}

async function fetchStatesByCountry(country) {
  if (!country) return [];
  if (country === "India") return await fetchIndiaStates();
  try {
    const res = await fetch("https://countriesnow.space/api/v0.1/countries/states", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country }),
    });
    const data = await res.json().catch(() => ({}));
    const states = uniqStrings((data?.data?.states || []).map((s) => s?.name).filter(Boolean));
    if (states.length) return states;
  } catch {}
  return STATES_BACKUP[country] || [];
}

async function fetchCitiesByCountryState(country, state) {
  if (!country || !state || state === "__OTHER__") return [];
  if (country === "India") return await fetchIndiaCities(state);
  try {
    const res = await fetch("https://countriesnow.space/api/v0.1/countries/state/cities", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country, state }),
    });
    const data = await res.json().catch(() => ({}));
    return uniqStrings(data?.data || []).sort((a, b) => a.localeCompare(b));
  } catch { return []; }
}

function pad2(n) { return String(n).padStart(2, "0"); }
function toDateKey(d) { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; }
function fromDateKey(key) {
  const [y, m, d] = String(key || "").split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}
function startOfMonth(d) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function addMonths(d, delta) { return new Date(d.getFullYear(), d.getMonth() + delta, 1); }
function ymdLocal(d) { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; }

function mergeFull(prev, full) {
  const out = { ...(prev || {}) };
  for (const [k, v] of Object.entries(full || {})) {
    const pv = out[k];
    if (pv === "" || pv === null || pv === undefined) out[k] = v;
    if (typeof v === "boolean" && (pv === undefined || pv === null)) out[k] = v;
  }
  return out;
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

export default function CustomerProfileModal({
  open, onClose, customer, source, onChanged,
  initialApproveStep, initialEditMode,
  contextContainerId = null, contextAssignmentId = null,
  sequenceNo = null,
}) {
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

  // Calendar-style date picker states
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [datePickerAnchor, setDatePickerAnchor] = useState(() => new Date());
  const [datePickerSelected, setDatePickerSelected] = useState(null);
  const [datePickerSummary, setDatePickerSummary] = useState({});
  const [datePickerSummaryLoading, setDatePickerSummaryLoading] = useState(false);
  const [datePickerPreview, setDatePickerPreview] = useState(null);
  const [datePickerPreviewLoading, setDatePickerPreviewLoading] = useState(false);

  const [showDateOpen, setShowDateOpen] = useState(false);
  const [showDateBusy, setShowDateBusy] = useState(false);
  const [showDateInfo, setShowDateInfo] = useState(null);

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

  const isApproveForShift = Boolean(source === "SITTING" && contextContainerId && contextAssignmentId);
  const showActions = source === "PENDING" || source === "SITTING";

  const [occupyOpen, setOccupyOpen] = useState(false);
  const occupyNextRef = useRef(null);

  const { requestCommit, CommitModal } = useCommitGate({
    defaultSuggestions: [
      "Created profile","Corrected customer data","Approved for calander container",
      "Meeting reject → ApproveFor","Moved to pending","Restored from pending",
      "Updated profile details","Finalized after edit (Recent → Sitting)","Customer shifted",
    ],
  });

  // ✅ ALL useMemo/computed BEFORE any early return
  const dpYear = datePickerAnchor.getFullYear();
  const dpMonth = datePickerAnchor.getMonth();
  const dpCells = useMemo(() => monthCells(dpYear, dpMonth), [dpYear, dpMonth]);
  const dpMonthDays = useMemo(() => {
    const dim = new Date(dpYear, dpMonth + 1, 0).getDate();
    return Array.from({ length: dim }, (_, i) => new Date(dpYear, dpMonth, i + 1));
  }, [dpYear, dpMonth]);
  const dpTodayKey = useMemo(() => ymdLocal(new Date()), []);

  const genderTheme = useMemo(() => {
    if (customer?.gender === "MALE") return "from-zinc-950 via-black to-zinc-900 text-white";
    if (customer?.gender === "FEMALE") return "from-pink-700 via-fuchsia-700 to-pink-600 text-white";
    return "from-emerald-200 via-green-200 to-lime-200 text-black";
  }, [customer?.gender]);

  const canFinalizeEdit = useMemo(() => {
    return Boolean(String(form?.name || "").trim() && String(form?.age || "").trim() && String(form?.address || "").trim());
  }, [form?.name, form?.age, form?.address]);

  const stateFinal = useMemo(() => {
    if (!form) return "";
    return form.state === "__OTHER__" ? String(form.stateOther || "").trim() : String(form.state || "").trim();
  }, [form?.state, form?.stateOther]);

  const cityFinal = useMemo(() => {
    if (!form) return "";
    return form.city === "__OTHER__" ? String(form.cityOther || "").trim() : String(form.city || "").trim();
  }, [form?.city, form?.cityOther]);

  const computedAddress = useMemo(() => {
    const c = String(form?.country || "India").trim() || "India";
    const s = String(stateFinal || "").trim();
    const ct = String(cityFinal || "").trim();
    return [ct, s, c].filter(Boolean).join(", ");
  }, [form?.country, stateFinal, cityFinal]);

  // ALL useEffects BEFORE early return
  useEffect(() => {
    if (!open) return;
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 1024px)");
    const apply = () => setIsDesktop(mq.matches);
    apply();
    if (mq.addEventListener) mq.addEventListener("change", apply);
    else mq.addListener(apply);
    return () => { if (mq.removeEventListener) mq.removeEventListener("change", apply); else mq.removeListener(apply); };
  }, [open]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setCountriesLoading(true);
      try {
        const list = await loadCountriesREST();
        if (!alive) return;
        setCountries(list);
      } catch {
        if (!alive) return;
        setCountries(["India","United States","United Kingdom","Canada","Australia","Germany","France","Japan","China"].map((n) => ({ name: n, flag: "", code: n })));
      } finally { if (alive) setCountriesLoading(false); }
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
    setPickedDate(null); setNote("");
    setDatePickerOpen(false); setDatePickerSelected(null); setDatePickerAnchor(new Date());
    setDatePickerSummary({}); setDatePickerPreview(null);
    setShowDateOpen(false); setShowDateInfo(null);
    setReg2Open(false); setReg2Err(""); setReg2(null);

    if ((source === "PENDING" || source === "SITTING") && initialApproveStep) setApproveStep(initialApproveStep);
    else setApproveStep(null);

    setMobileTab("INFO"); setOccupyOpen(false); occupyNextRef.current = null;
  }, [open, customer, source, initialApproveStep, initialEditMode]);

  useEffect(() => {
    if (!open || !customer?._id || !editMode) return;
    if (fullLoadedRef.current) return;
    let alive = true;
    (async () => {
      setFullLoadBusy(true); setFullLoadErr("");
      try {
        const id = safeId(customer._id);
        const base = sourceApiBase(source);
        const res = await fetch(`${base}/${id}`, { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!alive) return;
        if (!res.ok) { setFullLoadErr(data.error || "Full profile load failed"); return; }
        const full = data?.customer || null;
        if (!full) { setFullLoadErr("Invalid customer response"); return; }
        setForm((prev) => mergeFull(prev, full));
        fullLoadedRef.current = true;
      } catch { if (!alive) return; setFullLoadErr("Network error while loading full profile"); }
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
      try { const st = await fetchStatesByCountry(country); if (!alive) return; setStates(uniqStrings(st)); }
      finally { if (alive) setStateLoading(false); }
    })();
    return () => { alive = false; };
  }, [open, form?.country]);

  useEffect(() => {
    if (!open || !form || !form.state || form.state === "__OTHER__" || !states.length) return;
    if (states.includes(form.state)) return;
    setForm((prev) => ({ ...prev, state: "__OTHER__", stateOther: prev.stateOther || prev.state, city: "__OTHER__", cityOther: prev.cityOther || prev.city || "" }));
  }, [open, states]);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!open || !form) return;
      const country = String(form.country || "").trim();
      const st = String(form.state || "").trim();
      if (!country || !st) { setCities([]); return; }
      if (st === "__OTHER__") { setCities([]); setCityLoading(false); return; }
      setCityLoading(true);
      try { const list = await fetchCitiesByCountryState(country, st); if (!alive) return; setCities(uniqStrings(list)); }
      finally { if (alive) setCityLoading(false); }
    })();
    return () => { alive = false; };
  }, [open, form?.country, form?.state]);

  useEffect(() => {
    if (!open || !form || !form.city || form.city === "__OTHER__" || !cities.length) return;
    if (cities.includes(form.city)) return;
    setForm((prev) => ({ ...prev, city: "__OTHER__", cityOther: prev.cityOther || prev.city }));
  }, [open, cities]);

  // Load summary for date picker calendar
  useEffect(() => {
    if (!datePickerOpen) return;
    const y = datePickerAnchor.getFullYear();
    const m = datePickerAnchor.getMonth();
    const from = ymdLocal(new Date(y, m, 1));
    const to = ymdLocal(new Date(y, m + 1, 0));
    const ac = new AbortController();
    (async () => {
      setDatePickerSummaryLoading(true);
      try {
        const res = await fetch(`/api/calander/summary?from=${from}&to=${to}&mode=${mode}`, { signal: ac.signal });
        const data = await res.json().catch(() => ({}));
        setDatePickerSummary(data.map || {});
      } catch (e) {
        if (String(e?.name) === "AbortError") return;
        setDatePickerSummary({});
      } finally { setDatePickerSummaryLoading(false); }
    })();
    return () => ac.abort();
  }, [datePickerOpen, datePickerAnchor, mode]);

  // Load container preview when date selected in picker
  useEffect(() => {
    if (!datePickerOpen || !datePickerSelected) { setDatePickerPreview(null); return; }
    const ac = new AbortController();
    (async () => {
      setDatePickerPreviewLoading(true); setDatePickerPreview(null);
      try {
        const cRes = await fetch("/api/calander/container/by-date", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: datePickerSelected, mode }), signal: ac.signal,
        });
        const cData = await cRes.json().catch(() => ({}));
        if (!cRes.ok) { setDatePickerPreview({ error: cData.error || "Failed" }); return; }
        const containerObj = cData?.container?.value ?? cData?.container;
        if (!containerObj?._id) { setDatePickerPreview({ error: "Invalid container" }); return; }
        const cId = typeof containerObj._id === "object" && containerObj._id.$oid ? containerObj._id.$oid : String(containerObj._id);
        const dRes = await fetch(`/api/calander/container/${cId}?includeReserved=1`, { signal: ac.signal });
        const dData = await dRes.json().catch(() => ({}));
        if (!dRes.ok) { setDatePickerPreview({ error: dData.error || "Details failed" }); return; }
        const assignments = dData.assignments || [];
        const reserved = dData.reserved || [];
        const container = dData.container || containerObj;
        let inM = 0, inF = 0, inO = 0;
        for (const a of assignments) { const g = a?.customer?.gender; if (g === "MALE") inM++; else if (g === "FEMALE") inF++; else inO++; }
        let resM = 0, resF = 0, resO = 0;
        for (const a of reserved) { const g = a?.customer?.gender; if (g === "MALE") resM++; else if (g === "FEMALE") resF++; else resO++; }
        setDatePickerPreview({
          container, inTotal: assignments.length, inMale: inM, inFemale: inF, inOther: inO,
          resTotal: reserved.length, resMale: resM, resFemale: resF, resOther: resO,
          limit: container?.limit || 20, error: null,
        });
      } catch (e) {
        if (String(e?.name) === "AbortError") return;
        setDatePickerPreview({ error: "Network error" });
      } finally { setDatePickerPreviewLoading(false); }
    })();
    return () => ac.abort();
  }, [datePickerOpen, datePickerSelected, mode]);

  // ✅ EARLY RETURN — after ALL hooks
  if (!open || !customer || !form) return null;

  const isDarkText = customer.gender === "OTHER";
  const panelBg = isDarkText ? "border-black/10 bg-white/65" : "border-white/10 bg-black/30";
  const btnPrimary = isDarkText ? "bg-black text-white" : "bg-white text-black";
  const btnGhost = isDarkText ? "bg-black/10 hover:bg-black/20" : "bg-white/10 hover:bg-white/20";
  const hint = isDarkText ? "text-black/60" : "text-white/60";

  async function openPrintPage() {
    try { await openForm2PrintPreview({ customer, form, source, sequenceNo }); }
    catch { alert("Print failed"); }
  }

  function openSecondFormBeforeFinalize() {
    if (source !== "TODAY") return alert("Finalize allowed only for Recent (Today DB)");
    setErr("");
    if (!canFinalizeEdit) { setErr("Name, Age, Address required"); return; }
    setReg2({
      guardianRelation: form.guardianRelation || "", guardianName: form.guardianName || "",
      pinCode: form.pincode || "",
      phoneCountryCode: form.phoneCountryCode || "+91", phoneNumber: form.phoneNumber || "",
      whatsappCountryCode: form.whatsappCountryCode || "+91", whatsappNumber: form.whatsappNumber || "",
      idType: form.idType || "aadhaar", idValue: form.idValue || "", idTypeName: form.idTypeName || "",
      familyMemberName: form.familyMemberName || "", familyMemberRelation: form.familyMemberRelation || "",
      familyMemberRelationOther: form.familyMemberRelationOther || "", familyMemberMobile: form.familyMemberMobile || "",
      address2: form.address || "",
    });
    setReg2Err(""); setReg2Open(true);
  }

  function validateSecondForm(x) {
    const rel = String(x?.guardianRelation || "").trim();
    const gname = String(x?.guardianName || "").trim();
    const pin = String(x?.pinCode || "").trim();
    const phCode = String(x?.phoneCountryCode || "").trim();
    const phNum = String(x?.phoneNumber || "").replace(/\D/g, "");
    const idType = String(x?.idType || "").trim();
    const idValue = String(x?.idValue || "").trim();
    const addr = String(x?.address2 || "").trim();
    const fmName = String(x?.familyMemberName || "").trim();
    const fmRel = String(x?.familyMemberRelation || "").trim();
    const fmRelOther = String(x?.familyMemberRelationOther || "").trim();
    const fmMob = String(x?.familyMemberMobile || "").trim();

    if (!rel) return "Guardian relation required";
    if (!gname) return "Guardian name required";
    if (!/^\d{6}$/.test(pin)) return "PIN Code must be 6 digits";
    if (!phCode) return "Phone country code required";
    if (phNum.length < 8) return "Phone number too short";
    if (!idType) return "ID Type required";
    if (!idValue) return "ID Number required";
    if (!addr) return "Address required";
    if (idType === "other" && !String(x?.idTypeName || "").trim()) return "Other ID Type name required";
    if (!fmName) return "Family Member Name required";
    if (!fmRel) return "Family Member Relation required";
    if (fmRel === "other" && !fmRelOther) return "Other Relation required";
    if (!fmMob) return "Family Member Mobile required";
    return null;
  }

  function onPhoneTyping(vRaw) {
    const raw = String(vRaw || "");
    setReg2((p) => ({ ...(p || {}), phoneNumber: raw }));
    const parsed = parsePhoneNumberFromString(raw);
    if (parsed && parsed.isValid()) {
      setReg2((p) => ({ ...(p || {}), phoneCountryCode: `+${parsed.countryCallingCode}`, phoneNumber: String(parsed.nationalNumber || "") }));
    }
  }

  function continueAfterSecondForm() {
    const msg = validateSecondForm(reg2);
    if (msg) { setReg2Err(msg); return; }
    const pin = String(reg2.pinCode || "").trim();
    const phNumClean = String(reg2.phoneNumber || "").replace(/\D/g, "");
    const whNumClean = String(reg2.whatsappNumber || "").replace(/\D/g, "");
    setForm((prev) => ({
      ...prev, guardianRelation: reg2.guardianRelation, guardianName: reg2.guardianName, pincode: pin,
      phoneCountryCode: reg2.phoneCountryCode, phoneNumber: phNumClean,
      whatsappCountryCode: reg2.whatsappCountryCode, whatsappNumber: whNumClean,
      idType: reg2.idType, idValue: reg2.idValue, idTypeName: reg2.idTypeName,
      familyMemberName: reg2.familyMemberName, familyMemberRelation: reg2.familyMemberRelation,
      familyMemberRelationOther: reg2.familyMemberRelation === "other" ? reg2.familyMemberRelationOther : "",
      familyMemberMobile: reg2.familyMemberMobile, address: reg2.address2,
    }));
    setReg2Open(false); setConfirmEditOpen(true);
  }

  function buildUpdates() {
    const updates = {
      ...form,
      country: String(form.country || "India").trim() || "India",
      state: stateFinal, city: cityFinal,
      address: String(form.address || "").trim() || computedAddress,
      onionGarlic: !!form.onionGarlic, hasPet: !!form.hasPet,
      hadTeacherBefore: !!form.hadTeacherBefore, familyPermission: !!form.familyPermission,
      nasha: !!form.nasha,
      familyMemberRelationOther: String(form.familyMemberRelation || "") === "other" ? String(form.familyMemberRelationOther || "").trim() : "",
    };
    delete updates.stateOther; delete updates.cityOther;
    return updates;
  }

  async function saveEdits() {
    setErr("");
    const commitMessage = await requestCommit({ title: "Save Profile Changes", subtitle: `Update customer in ${source} database`, preset: "Updated profile details" }).catch(() => null);
    if (!commitMessage) return;
    const updates = buildUpdates();
    setBusy(true);
    try {
      const base = sourceApiBase(source);
      const res = await fetch(`${base}/${safeId(customer._id)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...updates, commitMessage }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setErr(data.error || "Save failed"); return; }
      setDoneMsg("Saved successfully"); setDoneOpen(true); onChanged?.();
    } catch { setErr("Network error"); }
    finally { setBusy(false); }
  }

  async function confirmEditAndFinalize() {
    if (source !== "TODAY") return;
    setErr("");
    if (!canFinalizeEdit) { setErr("Name, Age, Address required"); return; }
    const commitMessage = await requestCommit({ title: "Finalize to Sitting", subtitle: "This will move customer from Recent (Today DB) → Sitting (ACTIVE).", preset: "Finalized after edit (Recent → Sitting)" }).catch(() => null);
    if (!commitMessage) return;
    const updates = buildUpdates();
    setBusy(true);
    try {
      const res = await fetch(`/api/customers/today/${safeId(customer._id)}/finalize`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ updates, commitMessage }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setErr(data.error || "Finalize failed"); return; }
      setConfirmEditOpen(false); setEditMode(false);
      setDoneMsg("Done: Finalized & moved to Sitting"); setDoneOpen(true);
    } catch { setErr("Network error"); }
    finally { setBusy(false); }
  }

  function requestOccupyThen(nextFn) {
    occupyNextRef.current = nextFn;
    setOccupyOpen(true);
  }

  async function approveToContainer(occupyDate = null) {
    if (!pickedDate) return alert("Select date");
    if (mode === "MEETING" && !occupyDate) {
      requestOccupyThen(async (dateKey) => { await approveToContainer(dateKey); });
      return;
    }
    const commitMessage = await requestCommit({
      title: isApproveForShift ? "Approve For (Shift)" : "Push to Container",
      subtitle: isApproveForShift ? "Meeting card will be shifted to selected container." : "Customer will be assigned to selected container.",
      preset: isApproveForShift ? "Meeting reject → ApproveFor" : "Approved for calander container",
    }).catch(() => null);
    if (!commitMessage) return;
    setBusy(true);
    try {
      if (isApproveForShift) {
        const res = await fetch(`/api/calander/container/${contextContainerId}/assignments/${contextAssignmentId}/approve-for`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ toDate: pickedDate, toMode: mode, occupyDate: mode === "MEETING" ? occupyDate : undefined, note, commitMessage }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (data.error === "HOUSEFULL") return alert("Housefull: limit reached");
          if (data.error === "OCCUPY_REQUIRED") return alert("Meeting push ke liye Occupy (Diksha date) required hai.");
          if (data.error === "NOT_ELIGIBLE_FOR_DIKSHA") return alert("NOT ELIGIBLE: Pehle Meeting me confirm ke baad hi Diksha.");
          if (data.error === "OCCUPY_MUST_BE_AFTER_MEETING") return alert(data.message || "Occupy date must be same or after meeting date.");
          return alert(data.error || "ApproveFor shift failed");
        }
        onChanged?.(); onClose(); return;
      }
      const cRes = await fetch("/api/calander/container/by-date", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date: pickedDate, mode }) });
      const cData = await cRes.json().catch(() => ({}));
      if (!cRes.ok) return alert(cData.error || "Container failed");
      const containerObj = cData?.container?.value ?? cData?.container;
      if (!containerObj?._id) return alert("Invalid container response");
      const aRes = await fetch(`/api/calander/container/${safeId(containerObj._id)}/assign`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: safeId(customer._id), source, note, commitMessage, occupyDate: mode === "MEETING" ? occupyDate : undefined }),
      });
      const aData = await aRes.json().catch(() => ({}));
      if (!aRes.ok) {
        if (aData.error === "HOUSEFULL") return alert("Housefull: limit reached");
        if (aData.error === "OCCUPY_REQUIRED") return alert("Meeting push ke liye Occupy (Diksha date) required hai.");
        if (aData.error === "NOT_ELIGIBLE_FOR_DIKSHA") return alert("NOT ELIGIBLE: Pehle Meeting me confirm ke baad hi Diksha.");
        if (aData.error === "OCCUPY_MUST_BE_AFTER_MEETING") return alert(aData.message || "Occupy date must be same or after meeting date.");
        return alert(aData.error || "Assign failed");
      }
      onChanged?.(); onClose();
    } finally { setBusy(false); }
  }

  function openCalendarDatePicker() {
    const now = new Date();
    const base = pickedDate ? fromDateKey(pickedDate) : now;
    setDatePickerAnchor(base || now);
    setDatePickerSelected(pickedDate || null);
    setDatePickerSummary({});
    setDatePickerPreview(null);
    setDatePickerOpen(true);
  }

  function confirmPickedDate(dateKey) {
    if (!dateKey) return;
    setPickedDate(dateKey);
    setDatePickerOpen(false);
    setApproveStep("note");
  }

  const headerRight = (
    <div className="flex items-center gap-2">
      <button type="button" onClick={() => setPrintOpen(true)} className={`px-3 py-1 rounded-full text-xs ${btnGhost}`}>Print</button>
      <button type="button" onClick={() => setHmmOpen(true)} className={`px-3 py-1 rounded-full text-xs ${btnGhost}`}>HMM</button>
    </div>
  );

  const infoPanel = (
    <div className={`rounded-2xl border p-4 ${panelBg}`}>
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">Info</div>
        <button type="button" onClick={() => { setErr(""); setConfirmEditOpen(false); setEditMode((v) => !v); fullLoadedRef.current = false; }} className={`px-3 py-1 rounded-full text-xs ${btnGhost}`}>
          {editMode ? "Close Edit" : "Edit"}
        </button>
      </div>
      {fullLoadBusy ? <div className={`text-xs mt-2 ${hint}`}>Loading full profile...</div> : null}
      {fullLoadErr ? <div className="text-xs mt-2 text-red-200">{fullLoadErr}</div> : null}
      {err ? <div className="mt-3 rounded-2xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">{err}</div> : null}

      {!editMode ? (
        <div className="mt-3 space-y-2 text-sm">
          <Row k="Address" v={customer.address} isDark={isDarkText} />
          <Row k="Follow Years" v={customer.followYears} isDark={isDarkText} />
          <Row k="Club Visits" v={customer.clubVisitsBefore} isDark={isDarkText} />
          <Row k="Month/Year" v={customer.monthYear} isDark={isDarkText} />
        </div>
      ) : (
        <div className="mt-3 space-y-5">
          <div>
            <div className="text-sm font-semibold">Step 1 (Basic)</div>
            <div className={`text-xs ${hint}`}>Full editable profile (any source)</div>
            <div className="mt-3 grid sm:grid-cols-2 gap-3">
              <FieldX label="Name" required value={form.name} onChange={(v) => setForm({ ...form, name: v })} isDark={isDarkText} />
              <FieldX label="Age" required value={form.age} onChange={(v) => setForm({ ...form, age: v })} isDark={isDarkText} />
              <FieldX label="Address" required value={form.address} onChange={(v) => setForm({ ...form, address: v })} isDark={isDarkText} />
              <FieldX label="Pincode" value={form.pincode} onChange={(v) => setForm({ ...form, pincode: v })} isDark={isDarkText} />
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold">Step 2 (Additional)</div>
            <div className={`text-xs ${hint}`}>Country/State/City (manual supported)</div>
            <div className="mt-3 grid sm:grid-cols-2 gap-3">
              <div>
                <div className={`text-xs mb-1 ${isDarkText ? "text-black/70" : "text-white/70"}`}>Gender</div>
                <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none ${isDarkText ? "bg-white border-black/10 text-black" : "bg-white/5 border-white/10 text-white"}`}>
                  <option value="MALE">MALE</option><option value="FEMALE">FEMALE</option><option value="OTHER">OTHER</option>
                </select>
              </div>
              <FieldX label="Follow Years" value={form.followYears} onChange={(v) => setForm({ ...form, followYears: v })} isDark={isDarkText} />
              <FieldX label="Club Visits Before" value={form.clubVisitsBefore} onChange={(v) => setForm({ ...form, clubVisitsBefore: v })} isDark={isDarkText} />
              <FieldX label="Month/Year" value={form.monthYear} onChange={(v) => setForm({ ...form, monthYear: v })} isDark={isDarkText} />

              <div className="sm:col-span-2">
                <div className={`text-xs mb-1 ${isDarkText ? "text-black/70" : "text-white/70"}`}>Country *</div>
                <select value={form.country} onChange={(e) => { const c = e.target.value; setForm((prev) => ({ ...prev, country: c, state: "", stateOther: "", city: "", cityOther: "" })); }} className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none ${isDarkText ? "bg-white border-black/10 text-black" : "bg-white/5 border-white/10 text-white"}`}>
                  {countriesLoading ? <option value="">Loading countries...</option> : <option value="">Select Country...</option>}
                  {!countriesLoading ? (<><option value="India">India (Default)</option><option disabled>──────────────────────</option>{countries.filter((x) => x.name !== "India").map((c) => (<option key={c.code} value={c.name}>{c.flag ? `${c.flag} ` : ""}{c.name}</option>))}</>) : null}
                </select>
              </div>

              <div>
                <div className={`text-xs mb-1 ${isDarkText ? "text-black/70" : "text-white/70"}`}>State *</div>
                <select value={form.state} onChange={(e) => { const v = e.target.value; if (v === "__OTHER__") { setForm((prev) => ({ ...prev, state: "__OTHER__", stateOther: prev.stateOther || "", city: "__OTHER__", cityOther: "" })); return; } setForm((prev) => ({ ...prev, state: v, stateOther: "", city: "", cityOther: "" })); }} disabled={!form.country || stateLoading} className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none ${isDarkText ? "bg-white border-black/10 text-black" : "bg-white/5 border-white/10 text-white"}`}>
                  <option value="">{!form.country ? "Select country first..." : stateLoading ? "Loading states..." : "Select..."}</option>
                  {states.map((s, idx) => (<option key={`${s}_${idx}`} value={s}>{s}</option>))}
                  <option value="__OTHER__">Enter State Manually</option>
                </select>
                {form.state === "__OTHER__" ? (<input value={form.stateOther} onChange={(e) => setForm((prev) => ({ ...prev, stateOther: e.target.value }))} placeholder="Type state name..." className={`mt-2 w-full rounded-2xl border px-4 py-3 text-sm outline-none ${isDarkText ? "bg-white border-black/10 text-black" : "bg-white/5 border-white/10 text-white"}`} />) : null}
              </div>

              <div>
                <div className={`text-xs mb-1 ${isDarkText ? "text-black/70" : "text-white/70"}`}>City *</div>
                <select value={form.city} onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value, cityOther: "" }))} disabled={!form.state || form.state === "__OTHER__" || cityLoading} className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none ${isDarkText ? "bg-white border-black/10 text-black" : "bg-white/5 border-white/10 text-white"}`}>
                  <option value="">{!form.state ? "Select..." : form.state === "__OTHER__" ? "Manual state selected" : cityLoading ? "Loading cities..." : "Select..."}</option>
                  {cities.map((c, idx) => (<option key={`${c}_${idx}`} value={c}>{c}</option>))}
                  <option value="__OTHER__">Other</option>
                </select>
                {form.state === "__OTHER__" ? (<input value={form.cityOther} onChange={(e) => setForm((prev) => ({ ...prev, city: "__OTHER__", cityOther: e.target.value }))} placeholder="Type city name..." className={`mt-2 w-full rounded-2xl border px-4 py-3 text-sm outline-none ${isDarkText ? "bg-white border-black/10 text-black" : "bg-white/5 border-white/10 text-white"}`} />) : form.city === "__OTHER__" ? (<input value={form.cityOther} onChange={(e) => setForm((prev) => ({ ...prev, cityOther: e.target.value }))} placeholder="Type city name..." className={`mt-2 w-full rounded-2xl border px-4 py-3 text-sm outline-none ${isDarkText ? "bg-white border-black/10 text-black" : "bg-white/5 border-white/10 text-white"}`} />) : null}
              </div>
            </div>

            <div className="mt-4 grid sm:grid-cols-2 gap-2">
              <ToggleBtn label="Onion/Garlic" value={!!form.onionGarlic} onToggle={() => setForm({ ...form, onionGarlic: !form.onionGarlic })} btnGhost={btnGhost} hint={hint} />
              <ToggleBtn label="Has Pet" value={!!form.hasPet} onToggle={() => setForm({ ...form, hasPet: !form.hasPet })} btnGhost={btnGhost} hint={hint} />
              <ToggleBtn label="Teacher Before" value={!!form.hadTeacherBefore} onToggle={() => setForm({ ...form, hadTeacherBefore: !form.hadTeacherBefore })} btnGhost={btnGhost} hint={hint} />
              <ToggleBtn label="Family Permission" value={!!form.familyPermission} onToggle={() => setForm({ ...form, familyPermission: !form.familyPermission })} btnGhost={btnGhost} hint={hint} />
              <ToggleBtn label="Nasha" value={!!form.nasha} onToggle={() => setForm({ ...form, nasha: !form.nasha })} btnGhost={btnGhost} hint={hint} />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <button type="button" disabled={busy} onClick={saveEdits} className={`flex-1 px-4 py-3 rounded-2xl font-semibold ${btnPrimary} disabled:opacity-60 flex items-center justify-center gap-2`}>
              {busy ? <BufferSpinner size={18} /> : null}{busy ? "Processing..." : "Save Changes"}
            </button>
            {source === "TODAY" ? (<button type="button" disabled={busy} onClick={openSecondFormBeforeFinalize} className={`flex-1 px-4 py-3 rounded-2xl font-semibold ${btnPrimary} disabled:opacity-60`}>Finalize & Move to Sitting</button>) : null}
          </div>
        </div>
      )}
    </div>
  );

  const actionsPanel = (
    <div className={`rounded-2xl border p-4 ${panelBg}`}>
      <div className="text-sm font-semibold">Actions</div>
      <div className="mt-4 grid sm:grid-cols-2 gap-2">
        {(source === "PENDING" || source === "SITTING") ? (
          <>
            <button disabled={busy} onClick={() => setApproveStep("pickDate")} className={`px-4 py-2 rounded-xl font-semibold ${btnPrimary} disabled:opacity-60`}>Approve‑For</button>
            <div className={`px-4 py-2 rounded-xl text-sm ${btnGhost} ${hint}`}>
              {source === "SITTING" ? (isApproveForShift ? "Shift meeting card to container" : "Assign to container") : "Pending customer will be assigned to selected container"}
            </div>
          </>
        ) : null}
      </div>

      {showActions && approveStep ? (
        <div className={`mt-4 rounded-2xl border p-3 ${panelBg}`}>
          {approveStep === "pickDate" && (
            <div>
              <div className="text-sm font-semibold">Pick Calander Date</div>
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={() => { setMode("DIKSHA"); setPickedDate(null); setNote(""); }} className={`flex-1 px-3 py-2 rounded-xl text-sm ${mode === "DIKSHA" ? `${btnPrimary} font-semibold` : btnGhost}`}>Diksha</button>
                <button type="button" onClick={() => { setMode("MEETING"); setPickedDate(null); setNote(""); }} className={`flex-1 px-3 py-2 rounded-xl text-sm ${mode === "MEETING" ? `${btnPrimary} font-semibold` : btnGhost}`}>Meeting</button>
              </div>

              <button type="button" onClick={openCalendarDatePicker} className={`mt-3 w-full rounded-2xl border px-4 py-3 text-sm text-left ${isDarkText ? "bg-white border-black/10 text-black" : "bg-white/5 border-white/10 text-white"}`}>
                <div className="text-xs opacity-70">Selected Date</div>
                <div className="font-semibold">{pickedDate || "Tap to open Calendar"}</div>
              </button>

              <div className={`mt-2 text-xs ${hint}`}>Calendar style picker → <b>Confirm</b></div>
            </div>
          )}

          {approveStep === "note" && (
            <div>
              <div className="text-sm font-semibold">Note (optional)</div>
              <div className="mt-3">
                <SuggestInput dark={!isDarkText} allowScroll value={note} onChange={setNote} suggestions={noteSuggestions} placeholder="Note (optional)..." />
              </div>
              <button disabled={busy} onClick={() => approveToContainer()} className={`mt-3 w-full px-4 py-2 rounded-2xl font-semibold ${btnPrimary} disabled:opacity-60 flex items-center justify-center gap-2`}>
                {busy ? <BufferSpinner size={18} /> : null}{isApproveForShift ? "Approve For (Shift Now)" : "Push to Container"}
              </button>
              <button type="button" disabled={busy} onClick={() => setApproveStep("pickDate")} className={`mt-2 w-full px-4 py-2 rounded-2xl ${btnGhost} disabled:opacity-60`}>Change Date</button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );

  const mobileTabs = !isDesktop && showActions ? (
    <div className="mb-3 flex gap-2">
      <button type="button" onClick={() => setMobileTab("INFO")} className={["flex-1 px-4 py-2 rounded-2xl text-sm font-semibold border", isDarkText ? "border-black/10" : "border-white/10", mobileTab === "INFO" ? btnPrimary : btnGhost].join(" ")}>Info</button>
      <button type="button" onClick={() => setMobileTab("ACTIONS")} className={["flex-1 px-4 py-2 rounded-2xl text-sm font-semibold border", isDarkText ? "border-black/10" : "border-white/10", mobileTab === "ACTIONS" ? btnPrimary : btnGhost].join(" ")}>Actions</button>
    </div>
  ) : null;

  return (
    <>
      <LayerModal open={open} layerName="Customer Profile" title={customer.name} sub={`Source: ${source}${isApproveForShift ? " • ApproveFor Shift" : ""}`} onClose={onClose} maxWidth="max-w-5xl">
        <div className={`w-full rounded-2xl border border-white/10 bg-gradient-to-br ${genderTheme} shadow-[0_0_60px_rgba(59,130,246,0.16)] overflow-hidden`}>
          <div className="p-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className={`text-xs ${hint}`}>Customer Profile</div>
              <div className="text-xl font-bold truncate">{customer.name}</div>
              <div className={`text-xs ${hint}`}>Source: {source}</div>
            </div>
            {headerRight}
          </div>
          <div className="p-4 pt-0">
            {mobileTabs}
            {isDesktop ? (showActions ? (<div className="grid lg:grid-cols-2 gap-4">{infoPanel}{actionsPanel}</div>) : (<div>{infoPanel}</div>)) : (<div className="space-y-4">{showActions ? (mobileTab === "INFO" ? infoPanel : actionsPanel) : infoPanel}</div>)}
          </div>
        </div>
      </LayerModal>

      {/* Calendar-style Date Picker Modal */}
      <LayerModal open={datePickerOpen} layerName="Calendar Picker" title={`Select Date (${mode})`} sub="Calendar style • Tap date → Preview → Confirm" onClose={() => setDatePickerOpen(false)} maxWidth="max-w-5xl" disableBackdropClose>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="text-base sm:text-lg font-bold">
            {datePickerAnchor.toLocaleString("default", { month: "long" })} {dpYear}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setDatePickerAnchor(new Date(dpYear, dpMonth - 1, 1))} className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10" type="button">◀</button>
            <div className="rounded-2xl bg-black/30 border border-white/10 p-1 flex">
              <button onClick={() => { setMode("DIKSHA"); setDatePickerSelected(null); setDatePickerPreview(null); }} className={`px-3 sm:px-4 py-2 rounded-xl text-sm ${mode === "DIKSHA" ? "bg-white text-black font-semibold" : "text-white/70 hover:bg-white/10"}`} type="button">Diksha</button>
              <button onClick={() => { setMode("MEETING"); setDatePickerSelected(null); setDatePickerPreview(null); }} className={`px-3 sm:px-4 py-2 rounded-xl text-sm ${mode === "MEETING" ? "bg-white text-black font-semibold" : "text-white/70 hover:bg-white/10"}`} type="button">Meeting</button>
            </div>
            <button onClick={() => setDatePickerAnchor(new Date(dpYear, dpMonth + 1, 1))} className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10" type="button">▶</button>
          </div>
        </div>

        <div className="mb-3 flex items-center justify-between">
          <div className="text-xs text-white/60">Selected: <b className="text-white">{datePickerSelected || "—"}</b></div>
          <div className="text-xs text-white/60 flex items-center gap-2">
            {datePickerSummaryLoading ? <BufferSpinner size={14} /> : null}
            <span>{mode === "MEETING" ? "📋 Meeting" : "🔱 Diksha"}</span>
          </div>
        </div>

        {/* Mobile: Day Strip */}
        <div className="block md:hidden">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory">
              {dpMonthDays.map((d) => {
                const dateKey = ymdLocal(d);
                const isSelected = datePickerSelected === dateKey;
                const isToday = dateKey === dpTodayKey;
                const weekday = d.toLocaleDateString("default", { weekday: "short" });
                const isSun = d.getDay() === 0;
                const past = dateKey < dpTodayKey;
                const s = datePickerSummary?.[dateKey];
                const hasCards = s && (s.male + s.female) > 0;
                return (
                  <button key={dateKey} type="button" disabled={past} onClick={() => setDatePickerSelected(dateKey)}
                    className={["shrink-0 min-w-[76px] rounded-2xl border px-3 py-2.5 text-left snap-start transition-all", "bg-black/30 border-white/10",
                      isSelected ? "ring-2 ring-blue-500/60 bg-blue-500/10 border-blue-400/30" : "",
                      isToday && !isSelected ? "border-emerald-400/30" : "",
                      past ? "opacity-35 cursor-not-allowed" : "",
                    ].join(" ")}>
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
                    ) : (<div className="mt-1.5 text-[10px] text-white/30">—</div>)}
                  </button>
                );
              })}
            </div>
          </div>

          {datePickerSelected ? (
            <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="font-bold text-lg">{datePickerSelected}</div>
              {datePickerPreviewLoading ? (<div className="mt-3 flex items-center gap-2 text-white/50 text-sm"><BufferSpinner size={16} /> Loading...</div>)
              : datePickerPreview?.error ? (<div className="mt-3 rounded-xl border border-red-400/20 bg-red-500/10 p-2 text-xs text-red-200">{datePickerPreview.error}</div>)
              : datePickerPreview ? (
                <div className="mt-3 space-y-2">
                  <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <div className="text-xs text-white/60 mb-2">In Container</div>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1.5 flex-wrap">
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-400/20 text-blue-200 font-medium">👨 M {datePickerPreview.inMale}</span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-pink-500/15 border border-pink-400/20 text-pink-200 font-medium">👩 F {datePickerPreview.inFemale}</span>
                      </div>
                      <div className="text-sm font-bold">{datePickerPreview.inTotal}</div>
                    </div>
                  </div>
                  {mode === "DIKSHA" ? (
                    <>
                      <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3">
                        <div className="text-xs text-emerald-200/70 mb-1">Reserved</div>
                        <div className="flex items-center justify-between">
                          <div className="flex gap-1.5"><span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-400/20 text-blue-200">M {datePickerPreview.resMale}</span><span className="text-[11px] px-2 py-0.5 rounded-full bg-pink-500/15 border border-pink-400/20 text-pink-200">F {datePickerPreview.resFemale}</span></div>
                          <div className="text-sm font-bold text-emerald-200">{datePickerPreview.resTotal}</div>
                        </div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-bold">{datePickerPreview.inTotal + datePickerPreview.resTotal}/{datePickerPreview.limit}</div>
                          <div className={`text-xs font-bold px-2 py-1 rounded-full border ${(datePickerPreview.inTotal + datePickerPreview.resTotal) >= datePickerPreview.limit ? "bg-red-500/15 border-red-400/20 text-red-200" : "bg-emerald-500/15 border-emerald-400/20 text-emerald-200"}`}>
                            {Math.max(0, datePickerPreview.limit - datePickerPreview.inTotal - datePickerPreview.resTotal)} left
                          </div>
                        </div>
                        <div className="mt-2 h-2.5 rounded-full bg-white/10 overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${(datePickerPreview.inTotal + datePickerPreview.resTotal) >= datePickerPreview.limit ? "bg-red-500/60" : "bg-emerald-500/60"}`} style={{ width: `${Math.min(100, ((datePickerPreview.inTotal + datePickerPreview.resTotal) / datePickerPreview.limit) * 100)}%` }} />
                        </div>
                      </div>
                    </>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : (<div className="mt-3 text-center text-white/40 text-sm py-4">Select a date</div>)}
        </div>

        {/* Desktop: Grid */}
        <div className="hidden md:block">
          <div className="grid grid-cols-7 gap-1 sm:gap-2 text-[10px] sm:text-xs mb-2">
            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d, i) => (<div key={d} className={`${i === 0 ? "text-red-300" : "text-white/70"} text-center`}>{d}</div>))}
          </div>
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {dpCells.map((d, idx) => {
              if (!d) return <div key={idx} />;
              const dateKey = ymdLocal(d);
              const s = datePickerSummary?.[dateKey];
              const past = dateKey < dpTodayKey;
              const hasCards = s && (s.male + s.female) > 0;
              return (
                <button key={dateKey} type="button" disabled={past} onClick={() => setDatePickerSelected(dateKey)}
                  className={["min-h-[70px] sm:min-h-[90px] rounded-2xl border p-2 text-left transition", "bg-black/30 border-white/10 hover:bg-black/40",
                    datePickerSelected === dateKey ? "ring-2 ring-blue-500/60" : "",
                    idx % 7 === 0 ? "ring-1 ring-red-500/20" : "",
                    dateKey === dpTodayKey ? "ring-2 ring-emerald-400/60 border-emerald-400/30" : "",
                    past ? "opacity-40 cursor-not-allowed hover:bg-black/30" : "",
                  ].join(" ")}>
                  <div className="flex items-center justify-between">
                    <div className={`text-xs sm:text-sm font-semibold ${idx % 7 === 0 ? "text-red-200" : "text-white"}`}>{d.getDate()}</div>
                    {dateKey === dpTodayKey ? (<span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 border border-emerald-400/20 text-emerald-200">Today</span>) : null}
                  </div>
                  <div className="text-[10px] text-white/50">{mode}</div>
                  {hasCards ? (
                    <div className="mt-2 text-[10px] sm:text-[11px] text-white/80 flex gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-400/15 text-blue-200">M {s.male}</span>
                      <span className="px-2 py-0.5 rounded-full bg-pink-500/15 border border-pink-400/15 text-pink-200">F {s.female}</span>
                    </div>
                  ) : (<div className="mt-2 text-[10px] sm:text-[11px] text-white/35">—</div>)}
                  {hasCards ? <div className="mt-1 text-[9px] text-white/40">{s.male + s.female} cards</div> : null}
                </button>
              );
            })}
          </div>

          {datePickerSelected ? (
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between mb-3">
                <div><div className="text-xs text-white/60">CONTAINER PREVIEW</div><div className="font-bold mt-0.5">{datePickerSelected} • {mode === "MEETING" ? "📋 Meeting" : "🔱 Diksha"}</div></div>
                {datePickerPreviewLoading ? <BufferSpinner size={18} /> : null}
              </div>
              {datePickerPreview?.error ? (<div className="rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">{datePickerPreview.error}</div>)
              : datePickerPreview ? (
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <div className="text-xs text-white/60 mb-1">In Container</div>
                    <div className="text-xl font-bold">{datePickerPreview.inTotal}</div>
                    <div className="mt-2 flex gap-1.5 flex-wrap">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-400/20 text-blue-200">M {datePickerPreview.inMale}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/15 border border-pink-400/20 text-pink-200">F {datePickerPreview.inFemale}</span>
                    </div>
                  </div>
                  <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3">
                    <div className="text-xs text-emerald-200/70 mb-1">Reserved</div>
                    <div className="text-xl font-bold text-emerald-200">{datePickerPreview.resTotal}</div>
                    <div className="mt-2 flex gap-1.5"><span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-400/20 text-blue-200">M {datePickerPreview.resMale}</span><span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/15 border border-pink-400/20 text-pink-200">F {datePickerPreview.resFemale}</span></div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <div className="text-xs text-white/60 mb-1">Capacity</div>
                    <div className="flex items-center justify-between"><div className="text-xl font-bold">{datePickerPreview.inTotal + datePickerPreview.resTotal}/{datePickerPreview.limit}</div>
                      <div className={`text-xs font-bold px-2 py-1 rounded-full border ${(datePickerPreview.inTotal + datePickerPreview.resTotal) >= datePickerPreview.limit ? "bg-red-500/15 border-red-400/20 text-red-200" : "bg-emerald-500/15 border-emerald-400/20 text-emerald-200"}`}>{Math.max(0, datePickerPreview.limit - datePickerPreview.inTotal - datePickerPreview.resTotal)} left</div>
                    </div>
                    <div className="mt-2 h-2.5 rounded-full bg-white/10 overflow-hidden"><div className={`h-full rounded-full transition-all ${(datePickerPreview.inTotal + datePickerPreview.resTotal) >= datePickerPreview.limit ? "bg-red-500/60" : "bg-emerald-500/60"}`} style={{ width: `${Math.min(100, ((datePickerPreview.inTotal + datePickerPreview.resTotal) / datePickerPreview.limit) * 100)}%` }} /></div>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="mt-4 flex gap-2">
          <button type="button" onClick={() => setDatePickerOpen(false)} className="flex-1 px-4 py-3 rounded-2xl bg-white/10 border border-white/10 hover:bg-white/15 text-white">Cancel</button>
          <button type="button" disabled={!datePickerSelected} onClick={() => confirmPickedDate(datePickerSelected)} className="flex-1 px-4 py-3 rounded-2xl bg-white text-black font-semibold disabled:opacity-60">Confirm</button>
        </div>
      </LayerModal>

      {/* Occupy Picker */}
      <DikshaOccupyPickerModal open={occupyOpen} groupSize={1} meetingDate={pickedDate || null}
        onClose={() => { setOccupyOpen(false); occupyNextRef.current = null; }}
        onPick={async (dateKey) => { const fn = occupyNextRef.current; occupyNextRef.current = null; setOccupyOpen(false); if (!fn) return; await fn(dateKey); }}
      />

      {/* Second Form Modal */}
      <LayerModal open={reg2Open} layerName="Second Form" title="Extra Details" sub="Finalize se pehle yeh details required hain" onClose={() => setReg2Open(false)} maxWidth="max-w-4xl" disableBackdropClose>
        {reg2Err ? (<div className="mb-3 rounded-2xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">{reg2Err}</div>) : null}
        <div className={`rounded-3xl border p-4 ${panelBg}`}>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2"><div className="text-sm font-semibold">Guardian</div><div className={`text-xs ${hint}`}>Relation select → name fill</div></div>
            <div>
              <div className={`text-xs mb-1 ${isDarkText ? "text-black/70" : "text-white/70"}`}>Relation *</div>
              <select value={reg2?.guardianRelation || ""} onChange={(e) => setReg2((p) => ({ ...(p || {}), guardianRelation: e.target.value }))} className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none ${isDarkText ? "bg-white border-black/10 text-black" : "bg-white/5 border-white/10 text-white"}`}>
                <option value="">Select...</option><option value="father">Father</option><option value="mother">Mother</option><option value="husband">Husband</option>
              </select>
            </div>
            <FieldX label="Guardian Name *" value={reg2?.guardianName || ""} onChange={(v) => setReg2((p) => ({ ...(p || {}), guardianName: v }))} isDark={isDarkText} />
            <FieldX label="PIN Code (6 digits) *" value={reg2?.pinCode || ""} onChange={(v) => setReg2((p) => ({ ...(p || {}), pinCode: String(v || "").replace(/\D/g, "").slice(0, 6) }))} isDark={isDarkText} />
            <div className="sm:col-span-2 mt-2"><div className="text-sm font-semibold">Phone / WhatsApp / ID</div><div className={`text-xs ${hint}`}>Is section me same values print template me jayengi</div></div>
            <FieldX label="Phone Country Code *" value={reg2?.phoneCountryCode || ""} onChange={(v) => setReg2((p) => ({ ...(p || {}), phoneCountryCode: v }))} isDark={isDarkText} />
            <FieldX label="Phone Number *" value={reg2?.phoneNumber || ""} onChange={onPhoneTyping} isDark={isDarkText} />
            <FieldX label="WhatsApp Country Code" value={reg2?.whatsappCountryCode || ""} onChange={(v) => setReg2((p) => ({ ...(p || {}), whatsappCountryCode: v }))} isDark={isDarkText} />
            <FieldX label="WhatsApp Number" value={reg2?.whatsappNumber || ""} onChange={(v) => setReg2((p) => ({ ...(p || {}), whatsappNumber: v }))} isDark={isDarkText} />
            <div className="sm:col-span-2 mt-1 flex flex-wrap gap-2">
              {["aadhaar","passport","other"].map((t) => (<button key={t} type="button" onClick={() => setReg2((p) => ({ ...(p || {}), idType: t, idValue: "", idTypeName: t === "other" ? p?.idTypeName || "" : "" }))} className={`px-3 py-2 rounded-xl text-xs font-semibold border ${isDarkText ? "border-black/10" : "border-white/10"} ${reg2?.idType === t ? btnPrimary : btnGhost}`}>{t.toUpperCase()}</button>))}
            </div>
            {reg2?.idType === "other" ? (<><FieldX label="Other ID Type Name *" value={reg2?.idTypeName || ""} onChange={(v) => setReg2((p) => ({ ...(p || {}), idTypeName: v }))} isDark={isDarkText} /><FieldX label="Other ID Number *" value={reg2?.idValue || ""} onChange={(v) => setReg2((p) => ({ ...(p || {}), idValue: v }))} isDark={isDarkText} /></>) : (<div className="sm:col-span-2"><FieldX label={reg2?.idType === "passport" ? "Passport Number *" : "Aadhaar Number *"} value={reg2?.idValue || ""} onChange={(v) => setReg2((p) => ({ ...(p || {}), idValue: v }))} isDark={isDarkText} /></div>)}
            <div className="sm:col-span-2 mt-2"><div className="text-sm font-semibold">Family Member Details *</div></div>
            <FieldX label="Family Member Name *" value={reg2?.familyMemberName || ""} onChange={(v) => setReg2((p) => ({ ...(p || {}), familyMemberName: v }))} isDark={isDarkText} />
            <SelectX label="Family Member Relation *" value={reg2?.familyMemberRelation || ""} onChange={(v) => setReg2((p) => ({ ...(p || {}), familyMemberRelation: v, familyMemberRelationOther: v === "other" ? (p?.familyMemberRelationOther || "") : "" }))} options={["mother","father","parents","other"]} isDark={isDarkText} />
            {reg2?.familyMemberRelation === "other" ? (<FieldX label="Other Relation *" value={reg2?.familyMemberRelationOther || ""} onChange={(v) => setReg2((p) => ({ ...(p || {}), familyMemberRelationOther: v }))} isDark={isDarkText} placeholder="Type relation..." />) : null}
            <FieldX label="Family Member Mobile *" value={reg2?.familyMemberMobile || ""} onChange={(v) => setReg2((p) => ({ ...(p || {}), familyMemberMobile: v }))} isDark={isDarkText} />
            <div className="sm:col-span-2 mt-2">
              <div className="text-sm font-semibold">Address *</div>
              <textarea value={reg2?.address2 || ""} onChange={(e) => setReg2((p) => ({ ...(p || {}), address2: e.target.value }))} className={`mt-2 w-full rounded-2xl border px-4 py-3 text-sm outline-none min-h-[110px] ${isDarkText ? "bg-white border-black/10 text-black" : "bg-white/5 border-white/10 text-white"}`} placeholder="Enter complete address..." />
            </div>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={() => setReg2Open(false)} className={`flex-1 px-4 py-3 rounded-2xl ${btnGhost}`}>Cancel</button>
          <button type="button" onClick={continueAfterSecondForm} className={`flex-1 px-4 py-3 rounded-2xl font-semibold ${btnPrimary}`}>Continue</button>
        </div>
      </LayerModal>

      {/* Confirm Edit Modal */}
      <LayerModal open={confirmEditOpen} layerName="Confirm Edit" title="Confirm Changes" sub="Commit required • Recent → Sitting finalize" onClose={() => setConfirmEditOpen(false)} maxWidth="max-w-2xl" disableBackdropClose>
        {err ? (<div className="mb-3 rounded-2xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">{err}</div>) : null}
        <div className={`rounded-3xl border p-4 ${panelBg}`}>
          <div className="text-sm font-semibold">Review</div>
          <div className="mt-3 space-y-2 text-sm">
            <Row k="Name" v={form?.name} isDark={isDarkText} /><Row k="Age" v={form?.age} isDark={isDarkText} /><Row k="Address" v={form?.address} isDark={isDarkText} />
            <Row k="PIN" v={form?.pincode} isDark={isDarkText} /><Row k="Country/State/City" v={`${form?.country || "-"} / ${stateFinal || "-"} / ${cityFinal || "-"}`} isDark={isDarkText} />
            <Row k="Guardian" v={`${form?.guardianRelation || "-"} • ${form?.guardianName || "-"}`} isDark={isDarkText} />
            <Row k="Phone" v={`${form?.phoneCountryCode || ""} ${form?.phoneNumber || ""}`} isDark={isDarkText} />
            <Row k="WhatsApp" v={`${form?.whatsappCountryCode || ""} ${form?.whatsappNumber || ""}`} isDark={isDarkText} />
            <Row k="Family Member" v={form?.familyMemberRelation === "other" ? `${form?.familyMemberName || "-"} • ${form?.familyMemberRelationOther || "-"} • ${form?.familyMemberMobile || "-"}` : `${form?.familyMemberName || "-"} • ${form?.familyMemberRelation || "-"} • ${form?.familyMemberMobile || "-"}`} isDark={isDarkText} />
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button type="button" disabled={busy} onClick={() => { setConfirmEditOpen(false); openSecondFormBeforeFinalize(); }} className={`flex-1 px-4 py-3 rounded-2xl ${btnGhost} disabled:opacity-60`}>Back (Edit Extra Details)</button>
          <button type="button" disabled={busy || !canFinalizeEdit} onClick={confirmEditAndFinalize} className={`flex-1 px-4 py-3 rounded-2xl font-semibold ${btnPrimary} disabled:opacity-60 flex items-center justify-center gap-2`}>
            {busy ? <BufferSpinner size={18} /> : null}{busy ? "Processing..." : "Finalize & Move to Sitting"}
          </button>
        </div>
      </LayerModal>

      {/* Print Modal */}
      <LayerModal open={printOpen} layerName="Print" title="Print (Form2 Template)" sub="Uses public/print/form2.html" onClose={() => setPrintOpen(false)} maxWidth="max-w-2xl">
        <div className={`rounded-3xl border p-4 ${panelBg}`}>
          <div className="text-sm font-semibold">Template Print</div>
          <div className={`mt-1 text-xs ${hint}`}>Guardian/Gender/Marital/ID/Family details automatically fill honge.{sequenceNo ? (<> Card No: <b>#{sequenceNo}</b></>) : null}</div>
        </div>
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={() => setPrintOpen(false)} className={`flex-1 px-4 py-3 rounded-2xl ${btnGhost}`}>Close</button>
          <button type="button" onClick={openPrintPage} className={`flex-1 px-4 py-3 rounded-2xl font-semibold ${btnPrimary}`}>Open Print Preview</button>
        </div>
      </LayerModal>

      {/* Done Modal */}
      <LayerModal open={doneOpen} layerName="Done" title="Done" sub="Operation completed" onClose={() => { setDoneOpen(false); onChanged?.(); onClose(); }} maxWidth="max-w-md" disableBackdropClose>
        <div className={`rounded-2xl border p-5 ${panelBg} text-center`}>
          <div className="text-xl font-bold">{doneMsg || "Done"}</div>
          <div className={`text-sm mt-2 ${hint}`}>Close to continue.</div>
          <button type="button" onClick={() => { setDoneOpen(false); onChanged?.(); onClose(); }} className={`mt-4 px-5 py-3 rounded-2xl font-semibold ${btnPrimary}`}>Close</button>
        </div>
      </LayerModal>

      <CustomerHistoryModal open={hmmOpen} onClose={() => setHmmOpen(false)} customerId={safeId(customer._id)} />
      {CommitModal}
    </>
  );
}

function Row({ k, v, isDark }) {
  return (<div className="flex items-start justify-between gap-3"><div className={isDark ? "text-black/70" : "text-white/70"}>{k}</div><div className={`text-right break-words max-w-[60%] ${isDark ? "text-black" : "text-white"}`}>{v || "-"}</div></div>);
}

function FieldX({ label, value, onChange, required = false, placeholder = "", type = "text", isDark }) {
  const cls = isDark ? "bg-white border-black/10 text-black focus:ring-black/20" : "bg-white/5 border-white/10 text-white focus:ring-blue-500/40";
  return (<div><div className={`text-xs mb-1 ${isDark ? "text-black/70" : "text-white/70"}`}>{label} {required ? "*" : ""}</div><input value={value} type={type} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:ring-2 ${cls}`} /></div>);
}

function SelectX({ label, value, onChange, options, required = false, isDark }) {
  const cls = isDark ? "bg-white border-black/10 text-black" : "bg-white/5 border-white/10 text-white";
  return (<div><div className={`text-xs mb-1 ${isDark ? "text-black/70" : "text-white/70"}`}>{label} {required ? "*" : ""}</div><select value={value} onChange={(e) => onChange(e.target.value)} className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none ${cls}`}><option value="">Select...</option>{(options || []).map((x, idx) => (<option key={`${x}_${idx}`} value={x}>{x}</option>))}</select></div>);
}

function ToggleBtn({ label, value, onToggle, btnGhost, hint }) {
  return (<button type="button" onClick={onToggle} className={`px-3 py-2 rounded-xl text-left ${btnGhost}`}><div className="text-sm font-semibold">{label}</div><div className={`text-xs ${hint}`}>{value ? "YES" : "NO"}</div></button>);
}

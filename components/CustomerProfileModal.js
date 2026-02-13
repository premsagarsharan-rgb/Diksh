// components/CustomerProfileModal.js
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import LayerModal from "@/components/LayerModal";
import { useCommitGate } from "@/components/CommitGate";
import { useTheme } from "@/components/ThemeProvider";
import { openForm2PrintPreview } from "@/lib/printForm2Client";
import CustomerHistoryModal from "@/components/CustomerHistoryModal";

import { PT } from "@/components/profile/profileTheme";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileInfoPanel from "@/components/profile/ProfileInfoPanel";
import ProfileActionsPanel from "@/components/profile/ProfileActionsPanel";
import ProfileSecondForm from "@/components/profile/ProfileSecondForm";
import ProfileDoneModal from "@/components/profile/ProfileDoneModal";
import CalendarPickerModal from "@/components/profile/CalendarPickerModal";
import { ReviewLine, ErrorBanner, LoadingSpinner, TabBar } from "@/components/profile/ProfileSubComponents";

/* ═══════════════════════════════════════════════
   HELPERS
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

/* ═══════════════════════════════════════════════
   LOCATION CACHE
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
   ROUTE-WISE CONFIG
   ═══════════════════════════════════════════════ */

function getRouteConfig(source, isCalendarContext) {
  if (isCalendarContext) {
    return { showActions: false, approveMode: null, showHallCard: false, showFinalize: false };
  }
  switch (source) {
    case "TODAY":
      return { showActions: false, approveMode: null, showHallCard: false, showFinalize: true };
    case "SITTING":
      return { showActions: true, approveMode: "MEETING", showHallCard: false, showFinalize: false };
    case "PENDING":
      return { showActions: true, approveMode: "DIKSHA", showHallCard: false, showFinalize: false };
    default:
      return { showActions: false, approveMode: null, showHallCard: false, showFinalize: false };
  }
}

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */

export default function CustomerProfileModal({
  open, onClose, customer, source, onChanged,
  initialApproveStep, initialEditMode,
  contextContainerId = null, contextAssignmentId = null,
  sequenceNo = null,
  role = "USER",
}) {
  const themeApi = useTheme();
  const isLight = themeApi?.theme === "light";
  const c = isLight ? PT.light : PT.dark;

  const isCalendarContext = Boolean(contextContainerId && contextAssignmentId);
  const routeConfig = useMemo(
    () => getRouteConfig(source, isCalendarContext),
    [source, isCalendarContext]
  );

  const [hmmOpen, setHmmOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState(null);
  const [confirmEditOpen, setConfirmEditOpen] = useState(false);
  const [err, setErr] = useState("");

  const [reg2Open, setReg2Open] = useState(false);
  const [reg2Err, setReg2Err] = useState("");
  const [reg2, setReg2] = useState(null);
  const [doneOpen, setDoneOpen] = useState(false);
  const [doneMsg, setDoneMsg] = useState("Done");

  const [calendarOpen, setCalendarOpen] = useState(false);

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

  const { requestCommit, CommitModal } = useCommitGate({
    defaultSuggestions: [
      "Created profile", "Corrected customer data", "Approved for calander container",
      "Meeting reject → ApproveFor", "Moved to pending", "Restored from pending",
      "Updated profile details", "Finalized after edit (Recent → Sitting)", "Customer shifted",
    ],
  });

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

  const mobileTabs = useMemo(() => {
    const tabs = [{ key: "INFO", label: "Info", icon: "👤" }];
    if (routeConfig.showActions) tabs.push({ key: "ACTIONS", label: "Actions", icon: "⚡" });
    return tabs;
  }, [routeConfig.showActions]);

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
    setErr(""); setConfirmEditOpen(false); setDoneOpen(false);
    setFullLoadBusy(false); setFullLoadErr(""); fullLoadedRef.current = false;
    setCalendarOpen(false);
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
    setReg2Open(false); setReg2Err(""); setReg2(null);
    setMobileTab("INFO");
  }, [open, customer, source, initialEditMode]);

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

  // ── EARLY RETURN — AFTER ALL HOOKS ──
  if (!open || !customer || !form) return null;

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
    if (source !== "TODAY") return;
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

  return (
    <>
      <LayerModal
        open={open}
        layerName="Customer Profile"
        title={customer.name}
        sub={`Source: ${source}`}
        onClose={onClose}
        maxWidth="max-w-4xl"
      >
        <ProfileHeader
          customer={customer} source={source} c={c}
          isLight={isLight} isApproveForShift={false} sequenceNo={sequenceNo}
        />

        <div
          className="flex items-center gap-2 mt-3 mb-4 flex-wrap"
          style={{ opacity: 0, animation: "profileFadeUp 0.35s ease-out 0.15s forwards" }}
        >
          <button type="button" onClick={() => setHmmOpen(true)}
            className="px-3 py-1.5 rounded-xl text-[11px] font-semibold border transition-all duration-200"
            style={{ background: c.btnGhostBg, borderColor: c.btnGhostBorder, color: c.btnGhostText }}
          >📜 History</button>
        </div>

        {isDesktop ? (
          <div
            className={`grid gap-4 ${routeConfig.showActions ? "lg:grid-cols-3" : "lg:grid-cols-1"}`}
            style={{ opacity: 0, animation: "profileFadeUp 0.4s ease-out 0.2s forwards" }}
          >
            <div className={routeConfig.showActions ? "lg:col-span-2" : ""}>
              <ProfileInfoPanel
                customer={customer} form={form} setForm={setForm}
                editMode={editMode} setEditMode={setEditMode}
                source={source} c={c} busy={busy} err={err}
                onSave={saveEdits}
                onFinalize={routeConfig.showFinalize ? openSecondForm : undefined}
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
            {routeConfig.showActions && (
              <div>
                <ProfileActionsPanel
                  source={source} c={c} busy={busy}
                  mode={routeConfig.approveMode}
                  forcedMode={routeConfig.approveMode}
                  onOpenCalendarPicker={() => setCalendarOpen(true)}
                />
              </div>
            )}
          </div>
        ) : (
          <div style={{ opacity: 0, animation: "profileFadeUp 0.4s ease-out 0.2s forwards" }}>
            {mobileTabs.length > 1 && (
              <div className="mb-3">
                <TabBar tabs={mobileTabs} active={mobileTab} onChange={setMobileTab} c={c} />
              </div>
            )}
            <div>
              {mobileTab === "INFO" && (
                <ProfileInfoPanel
                  customer={customer} form={form} setForm={setForm}
                  editMode={editMode} setEditMode={setEditMode}
                  source={source} c={c} busy={busy} err={err}
                  onSave={saveEdits}
                  onFinalize={routeConfig.showFinalize ? openSecondForm : undefined}
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
              {mobileTab === "ACTIONS" && routeConfig.showActions && (
                <ProfileActionsPanel
                  source={source} c={c} busy={busy}
                  mode={routeConfig.approveMode}
                  forcedMode={routeConfig.approveMode}
                  onOpenCalendarPicker={() => setCalendarOpen(true)}
                />
              )}
            </div>
          </div>
        )}
      </LayerModal>

      {/* Calendar Picker — auto assigns THIS customer */}
      <CalendarPickerModal
        open={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        mode={routeConfig.approveMode}
        customerId={safeId(customer._id)}
        customerName={customer?.name}
        source={source}
        onAssigned={() => {
          setCalendarOpen(false);
          setDoneMsg("Assigned to Container ✓");
          setDoneOpen(true);
          onChanged?.();
        }}
      />

      <ProfileSecondForm open={reg2Open} onClose={() => setReg2Open(false)} reg2={reg2} setReg2={setReg2} reg2Err={reg2Err} setReg2Err={setReg2Err} onContinue={continueAfterSecondForm} c={c} busy={busy} />

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

      <ProfileDoneModal open={doneOpen} onClose={() => { setDoneOpen(false); onChanged?.(); onClose(); }} message={doneMsg} c={c} />

      <CustomerHistoryModal open={hmmOpen} onClose={() => setHmmOpen(false)} customerId={safeId(customer._id)} />

      {CommitModal}

      <style jsx global>{`
        @keyframes profileFadeUp {
          from { opacity: 0; transform: translateY(10px); }
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

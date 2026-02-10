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

/*
  CustomerProfileModal (FINAL with Occupy patch)

  Actions logic:
  - Actions only for PENDING + SITTING
  - TODAY/Recent => no actions section

  Occupy patch:
  - Approve-For flow:
    - If pushing to MEETING => Occupy modal will open and occupyDate will be sent
    - If pushing to DIKSHA => direct push attempt; backend may block NOT_ELIGIBLE_FOR_DIKSHA
*/

const noteSuggestions = [
  "Bring ID proof",
  "Arrive 10 minutes early",
  "First time visitor",
  "VIP",
  "Needs follow-up",
  "Confirmed by family",
];

/* -------------------------
   AddCustomer-style Country/State/City
-------------------------- */
const INDIA_STATES_FALLBACK = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Puducherry",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Andaman and Nicobar Islands",
  "Lakshadweep",
];

const STATES_BACKUP = {
  "United States": [
    "Alabama",
    "Alaska",
    "Arizona",
    "Arkansas",
    "California",
    "Colorado",
    "Connecticut",
    "Delaware",
    "Florida",
    "Georgia",
    "Hawaii",
    "Idaho",
    "Illinois",
    "Indiana",
    "Iowa",
    "Kansas",
    "Kentucky",
    "Louisiana",
    "Maine",
    "Maryland",
    "Massachusetts",
    "Michigan",
    "Minnesota",
    "Mississippi",
    "Missouri",
    "Montana",
    "Nebraska",
    "Nevada",
    "New Hampshire",
    "New Jersey",
    "New Mexico",
    "New York",
    "North Carolina",
    "North Dakota",
    "Ohio",
    "Oklahoma",
    "Oregon",
    "Pennsylvania",
    "Rhode Island",
    "South Carolina",
    "South Dakota",
    "Tennessee",
    "Texas",
    "Utah",
    "Vermont",
    "Virginia",
    "Washington",
    "West Virginia",
    "Wisconsin",
    "Wyoming",
  ],
  Canada: [
    "Alberta",
    "British Columbia",
    "Manitoba",
    "New Brunswick",
    "Newfoundland and Labrador",
    "Northwest Territories",
    "Nova Scotia",
    "Nunavut",
    "Ontario",
    "Prince Edward Island",
    "Quebec",
    "Saskatchewan",
    "Yukon",
  ],
  Australia: [
    "Australian Capital Territory",
    "New South Wales",
    "Northern Territory",
    "Queensland",
    "South Australia",
    "Tasmania",
    "Victoria",
    "Western Australia",
  ],
  "United Kingdom": ["England", "Scotland", "Wales", "Northern Ireland"],
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
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country: "India", state }),
    });
    const data = await res.json().catch(() => ({}));
    return uniqStrings(data?.data || []);
  } catch {
    return [];
  }
}

async function loadCountriesREST() {
  const res = await fetch("https://restcountries.com/v3.1/all");
  const data = await res.json().catch(() => []);
  return (data || [])
    .map((c) => ({
      name: c?.name?.common,
      flag: c?.flag || "",
      code: c?.cca2 || c?.cca3 || c?.name?.common,
    }))
    .filter((x) => x.name)
    .sort((a, b) => String(a.name).localeCompare(String(b.name)));
}

async function fetchStatesByCountry(country) {
  if (!country) return [];
  if (country === "India") return await fetchIndiaStates();

  try {
    const res = await fetch("https://countriesnow.space/api/v0.1/countries/states", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country, state }),
    });
    const data = await res.json().catch(() => ({}));
    return uniqStrings(data?.data || []).sort((a, b) => a.localeCompare(b));
  } catch {
    return [];
  }
}

/* -------------------------
   Calendar Helpers
-------------------------- */
function pad2(n) {
  return String(n).padStart(2, "0");
}
function toDateKey(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function fromDateKey(key) {
  const [y, m, d] = String(key || "").split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}
function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function addMonths(d, delta) {
  return new Date(d.getFullYear(), d.getMonth() + delta, 1);
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

export default function CustomerProfileModal({
  open,
  onClose,
  customer,
  source,
  onChanged,
  initialApproveStep,
  initialEditMode,
  contextContainerId = null,
  contextAssignmentId = null,
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

  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [datePickerMonth, setDatePickerMonth] = useState(() => startOfMonth(new Date()));
  const [datePickerSelected, setDatePickerSelected] = useState(null);

  const [showDateOpen, setShowDateOpen] = useState(false);
  const [showDateBusy, setShowDateBusy] = useState(false);
  const [showDateInfo, setShowDateInfo] = useState(null);

  // Second form modal
  const [reg2Open, setReg2Open] = useState(false);
  const [reg2Err, setReg2Err] = useState("");
  const [reg2, setReg2] = useState(null);

  // Done modal
  const [doneOpen, setDoneOpen] = useState(false);
  const [doneMsg, setDoneMsg] = useState("Done");

  // Country dropdown
  const [countries, setCountries] = useState([]);
  const [countriesLoading, setCountriesLoading] = useState(false);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [stateLoading, setStateLoading] = useState(false);
  const [cityLoading, setCityLoading] = useState(false);

  // Full load
  const [fullLoadBusy, setFullLoadBusy] = useState(false);
  const [fullLoadErr, setFullLoadErr] = useState("");
  const fullLoadedRef = useRef(false);

  // Responsive UI
  const [isDesktop, setIsDesktop] = useState(true);
  const [mobileTab, setMobileTab] = useState("INFO"); // INFO | ACTIONS

  const isApproveForShift = Boolean(source === "SITTING" && contextContainerId && contextAssignmentId);

  // Actions only for PENDING + SITTING
  const showActions = source === "PENDING" || source === "SITTING";

  // ✅ Occupy modal support for MEETING push
  const [occupyOpen, setOccupyOpen] = useState(false);
  const occupyNextRef = useRef(null); // (dateKey)=>Promise<void>

  const { requestCommit, CommitModal } = useCommitGate({
    defaultSuggestions: [
      "Created profile",
      "Corrected customer data",
      "Approved for calander container",
      "Meeting reject → ApproveFor",
      "Moved to pending",
      "Restored from pending",
      "Updated profile details",
      "Finalized after edit (Recent → Sitting)",
      "Customer shifted",
    ],
  });

  useEffect(() => {
    if (!open) return;
    if (typeof window === "undefined") return;

    const mq = window.matchMedia("(min-width: 1024px)");
    const apply = () => setIsDesktop(mq.matches);
    apply();

    if (mq.addEventListener) mq.addEventListener("change", apply);
    else mq.addListener(apply);

    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", apply);
      else mq.removeListener(apply);
    };
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
        setCountries(
          ["India", "United States", "United Kingdom", "Canada", "Australia", "Germany", "France", "Japan", "China"].map((n) => ({
            name: n,
            flag: "",
            code: n,
          }))
        );
      } finally {
        if (alive) setCountriesLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // init form
  useEffect(() => {
    if (!open || !customer) return;

    setErr("");
    setConfirmEditOpen(false);
    setPrintOpen(false);
    setDoneOpen(false);

    setFullLoadBusy(false);
    setFullLoadErr("");
    fullLoadedRef.current = false;

    setForm({
      name: customer?.name || "",
      age: customer?.age || "",
      address: customer?.address || "",
      occupation: customer?.occupation || "",
      maritalStatus: customer?.maritalStatus || "",

      followYears: customer?.followYears || "",
      clubVisitsBefore: customer?.clubVisitsBefore || "",
      monthYear: customer?.monthYear || "",

      onionGarlic: customer?.onionGarlic,
      hasPet: customer?.hasPet,
      hadTeacherBefore: customer?.hadTeacherBefore,
      familyPermission: customer?.familyPermission,
      nasha: customer?.nasha,

      gender: customer?.gender || "OTHER",

      country: customer?.country || "India",
      state: customer?.state || "",
      stateOther: "",
      city: customer?.city || "",
      cityOther: "",
      pincode: customer?.pincode || "",

      guardianRelation: customer?.guardianRelation || "",
      guardianName: customer?.guardianName || "",

      phoneCountryCode: customer?.phoneCountryCode || "+91",
      phoneNumber: customer?.phoneNumber || "",

      whatsappCountryCode: customer?.whatsappCountryCode || "+91",
      whatsappNumber: customer?.whatsappNumber || "",

      idType: customer?.idType || "aadhaar",
      idValue: customer?.idValue || "",
      idTypeName: customer?.idTypeName || "",

      familyMemberName: customer?.familyMemberName || "",
      familyMemberRelation: customer?.familyMemberRelation || "",
      familyMemberRelationOther: customer?.familyMemberRelationOther || "",
      familyMemberMobile: customer?.familyMemberMobile || "",

      // safe extras
      note: customer?.note || "",
      approver: customer?.approver || "",
      remarks: customer?.remarks || "",
      familyPermissionRelation: customer?.familyPermissionRelation || "",
      familyPermissionOther: customer?.familyPermissionOther || "",
      dikshaYear: customer?.dikshaYear || "",
      vrindavanVisits: customer?.vrindavanVisits || "",
      firstDikshaYear: customer?.firstDikshaYear || "",
    });

    setEditMode(Boolean(initialEditMode));

    setPickedDate(null);
    setNote("");

    setDatePickerOpen(false);
    setDatePickerSelected(null);
    setDatePickerMonth(startOfMonth(new Date()));

    setShowDateOpen(false);
    setShowDateInfo(null);

    setReg2Open(false);
    setReg2Err("");
    setReg2(null);

    if ((source === "PENDING" || source === "SITTING") && initialApproveStep) setApproveStep(initialApproveStep);
    else setApproveStep(null);

    setMobileTab("INFO");

    setOccupyOpen(false);
    occupyNextRef.current = null;
  }, [open, customer, source, initialApproveStep, initialEditMode]);

  // full load (ANY source) when editMode opens
  useEffect(() => {
    if (!open) return;
    if (!customer?._id) return;
    if (!editMode) return;
    if (fullLoadedRef.current) return;

    let alive = true;
    (async () => {
      setFullLoadBusy(true);
      setFullLoadErr("");
      try {
        const id = safeId(customer._id);
        const base = sourceApiBase(source);
        const res = await fetch(`${base}/${id}`, { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!alive) return;

        if (!res.ok) {
          setFullLoadErr(data.error || "Full profile load failed");
          return;
        }

        const full = data?.customer || null;
        if (!full) {
          setFullLoadErr("Invalid customer response");
          return;
        }

        setForm((prev) => mergeFull(prev, full));
        fullLoadedRef.current = true;
      } catch {
        if (!alive) return;
        setFullLoadErr("Network error while loading full profile");
      } finally {
        if (alive) setFullLoadBusy(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [open, editMode, source, customer?._id]);

  // load states
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!open || !form) return;
      const country = String(form.country || "").trim();
      if (!country) {
        setStates([]);
        return;
      }
      setStateLoading(true);
      try {
        const st = await fetchStatesByCountry(country);
        if (!alive) return;
        setStates(uniqStrings(st));
      } finally {
        if (alive) setStateLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [open, form?.country]); // eslint-disable-line react-hooks/exhaustive-deps

  // state not found => manual
  useEffect(() => {
    if (!open || !form) return;
    if (!form.state) return;
    if (form.state === "__OTHER__") return;
    if (!states.length) return;
    if (states.includes(form.state)) return;

    setForm((prev) => ({
      ...prev,
      state: "__OTHER__",
      stateOther: prev.stateOther || prev.state,
      city: "__OTHER__",
      cityOther: prev.cityOther || prev.city || "",
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, states]);

  // load cities
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!open || !form) return;

      const country = String(form.country || "").trim();
      const st = String(form.state || "").trim();

      if (!country || !st) {
        setCities([]);
        return;
      }

      if (st === "__OTHER__") {
        setCities([]);
        setCityLoading(false);
        return;
      }

      setCityLoading(true);
      try {
        const list = await fetchCitiesByCountryState(country, st);
        if (!alive) return;
        setCities(uniqStrings(list));
      } finally {
        if (alive) setCityLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [open, form?.country, form?.state]); // eslint-disable-line react-hooks/exhaustive-deps

  // city not found => manual
  useEffect(() => {
    if (!open || !form) return;
    if (!form.city) return;
    if (form.city === "__OTHER__") return;
    if (!cities.length) return;
    if (cities.includes(form.city)) return;

    setForm((prev) => ({
      ...prev,
      city: "__OTHER__",
      cityOther: prev.cityOther || prev.city,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, cities]);

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

  if (!open || !customer || !form) return null;

  const isDarkText = customer.gender === "OTHER";
  const panelBg = isDarkText ? "border-black/10 bg-white/65" : "border-white/10 bg-black/30";
  const btnPrimary = isDarkText ? "bg-black text-white" : "bg-white text-black";
  const btnGhost = isDarkText ? "bg-black/10 hover:bg-black/20" : "bg-white/10 hover:bg-white/20";
  const hint = isDarkText ? "text-black/60" : "text-white/60";

  async function openPrintPage() {
    try {
      await openForm2PrintPreview({ customer, form, source, sequenceNo });
    } catch {
      alert("Print failed");
    }
  }

  function openSecondFormBeforeFinalize() {
    if (source !== "TODAY") return alert("Finalize allowed only for Recent (Today DB)");
    setErr("");
    if (!canFinalizeEdit) {
      setErr("Name, Age, Address required");
      return;
    }

    setReg2({
      guardianRelation: form.guardianRelation || "",
      guardianName: form.guardianName || "",
      pinCode: form.pincode || "",

      phoneCountryCode: form.phoneCountryCode || "+91",
      phoneNumber: form.phoneNumber || "",

      whatsappCountryCode: form.whatsappCountryCode || "+91",
      whatsappNumber: form.whatsappNumber || "",

      idType: form.idType || "aadhaar",
      idValue: form.idValue || "",
      idTypeName: form.idTypeName || "",

      familyMemberName: form.familyMemberName || "",
      familyMemberRelation: form.familyMemberRelation || "",
      familyMemberRelationOther: form.familyMemberRelationOther || "",
      familyMemberMobile: form.familyMemberMobile || "",

      address2: form.address || "",
    });

    setReg2Err("");
    setReg2Open(true);
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
      setReg2((p) => ({
        ...(p || {}),
        phoneCountryCode: `+${parsed.countryCallingCode}`,
        phoneNumber: String(parsed.nationalNumber || ""),
      }));
    }
  }

  function continueAfterSecondForm() {
    const msg = validateSecondForm(reg2);
    if (msg) {
      setReg2Err(msg);
      return;
    }

    const pin = String(reg2.pinCode || "").trim();
    const phNumClean = String(reg2.phoneNumber || "").replace(/\D/g, "");
    const whNumClean = String(reg2.whatsappNumber || "").replace(/\D/g, "");

    setForm((prev) => ({
      ...prev,
      guardianRelation: reg2.guardianRelation,
      guardianName: reg2.guardianName,
      pincode: pin,

      phoneCountryCode: reg2.phoneCountryCode,
      phoneNumber: phNumClean,

      whatsappCountryCode: reg2.whatsappCountryCode,
      whatsappNumber: whNumClean,

      idType: reg2.idType,
      idValue: reg2.idValue,
      idTypeName: reg2.idTypeName,

      familyMemberName: reg2.familyMemberName,
      familyMemberRelation: reg2.familyMemberRelation,
      familyMemberRelationOther: reg2.familyMemberRelation === "other" ? reg2.familyMemberRelationOther : "",
      familyMemberMobile: reg2.familyMemberMobile,

      address: reg2.address2,
    }));

    setReg2Open(false);
    setConfirmEditOpen(true);
  }

  async function saveEdits() {
    setErr("");
    const commitMessage = await requestCommit({
      title: "Save Profile Changes",
      subtitle: `Update customer in ${source} database`,
      preset: "Updated profile details",
    }).catch(() => null);
    if (!commitMessage) return;

    const updates = {
      ...form,
      country: String(form.country || "India").trim() || "India",
      state: stateFinal,
      city: cityFinal,
      address: String(form.address || "").trim() || computedAddress,

      onionGarlic: !!form.onionGarlic,
      hasPet: !!form.hasPet,
      hadTeacherBefore: !!form.hadTeacherBefore,
      familyPermission: !!form.familyPermission,
      nasha: !!form.nasha,

      familyMemberRelationOther:
        String(form.familyMemberRelation || "") === "other" ? String(form.familyMemberRelationOther || "").trim() : "",
    };

    delete updates.stateOther;
    delete updates.cityOther;

    setBusy(true);
    try {
      const base = sourceApiBase(source);
      const res = await fetch(`${base}/${safeId(customer._id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...updates, commitMessage }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.error || "Save failed");
        return;
      }
      setDoneMsg("Saved successfully");
      setDoneOpen(true);
      onChanged?.();
    } catch {
      setErr("Network error");
    } finally {
      setBusy(false);
    }
  }

  async function confirmEditAndFinalize() {
    if (source !== "TODAY") return;

    setErr("");
    if (!canFinalizeEdit) {
      setErr("Name, Age, Address required");
      return;
    }

    const commitMessage = await requestCommit({
      title: "Finalize to Sitting",
      subtitle: "This will move customer from Recent (Today DB) → Sitting (ACTIVE).",
      preset: "Finalized after edit (Recent → Sitting)",
    }).catch(() => null);

    if (!commitMessage) return;

    const updates = {
      ...form,
      country: String(form.country || "India").trim() || "India",
      state: stateFinal,
      city: cityFinal,
      address: String(form.address || "").trim() || computedAddress,

      onionGarlic: !!form.onionGarlic,
      hasPet: !!form.hasPet,
      hadTeacherBefore: !!form.hadTeacherBefore,
      familyPermission: !!form.familyPermission,
      nasha: !!form.nasha,

      familyMemberRelationOther:
        String(form.familyMemberRelation || "") === "other" ? String(form.familyMemberRelationOther || "").trim() : "",
    };

    delete updates.stateOther;
    delete updates.cityOther;

    setBusy(true);
    try {
      const res = await fetch(`/api/customers/today/${safeId(customer._id)}/finalize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates, commitMessage }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.error || "Finalize failed");
        return;
      }

      setConfirmEditOpen(false);
      setEditMode(false);

      setDoneMsg("Done: Finalized & moved to Sitting");
      setDoneOpen(true);
    } catch {
      setErr("Network error");
    } finally {
      setBusy(false);
    }
  }

  function requestOccupyThen(nextFn) {
    occupyNextRef.current = nextFn;
    setOccupyOpen(true);
  }

  async function approveToContainer(occupyDate = null) {
    if (!pickedDate) return alert("Select date");

    // ✅ If pushing to MEETING, occupyDate must be chosen (same flow as calendar)
    if (mode === "MEETING" && !occupyDate) {
      requestOccupyThen(async (dateKey) => {
        await approveToContainer(dateKey);
      });
      return;
    }

    const commitMessage = await requestCommit({
      title: isApproveForShift ? "Approve For (Shift)" : "Push to Container",
      subtitle: isApproveForShift
        ? "Meeting card will be shifted to selected container."
        : "Customer will be assigned to selected container.",
      preset: isApproveForShift ? "Meeting reject → ApproveFor" : "Approved for calander container",
    }).catch(() => null);

    if (!commitMessage) return;

    setBusy(true);
    try {
      if (isApproveForShift) {
        const res = await fetch(
          `/api/calander/container/${contextContainerId}/assignments/${contextAssignmentId}/approve-for`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              toDate: pickedDate,
              toMode: mode,
              occupyDate: mode === "MEETING" ? occupyDate : undefined,
              note,
              commitMessage,
            }),
          }
        );

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (data.error === "HOUSEFULL") return alert("Housefull: limit reached");
          if (data.error === "OCCUPY_REQUIRED") return alert("Meeting push ke liye Occupy (Diksha date) required hai.");
          if (data.error === "NOT_ELIGIBLE_FOR_DIKSHA") return alert("NOT ELIGIBLE: Pehle Meeting me confirm ke baad hi Diksha.");
          return alert(data.error || "ApproveFor shift failed");
        }

        onChanged?.();
        onClose();
        return;
      }

      // normal push from PENDING/SITTING to container
      const cRes = await fetch("/api/calander/container/by-date", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: pickedDate, mode }),
      });
      const cData = await cRes.json().catch(() => ({}));
      if (!cRes.ok) return alert(cData.error || "Container failed");

      const containerObj = cData?.container?.value ?? cData?.container;
      if (!containerObj?._id) return alert("Invalid container response");

      const aRes = await fetch(`/api/calander/container/${safeId(containerObj._id)}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: safeId(customer._id),
          source,
          note,
          commitMessage,
          occupyDate: mode === "MEETING" ? occupyDate : undefined,
        }),
      });

      const aData = await aRes.json().catch(() => ({}));
      if (!aRes.ok) {
        if (aData.error === "HOUSEFULL") return alert("Housefull: limit reached");
        if (aData.error === "OCCUPY_REQUIRED") return alert("Meeting push ke liye Occupy (Diksha date) required hai.");
        if (aData.error === "NOT_ELIGIBLE_FOR_DIKSHA") return alert("NOT ELIGIBLE: Pehle Meeting me confirm ke baad hi Diksha.");
        return alert(aData.error || "Assign failed");
      }

      onChanged?.();
      onClose();
    } finally {
      setBusy(false);
    }
  }

  function openCustomDatePicker() {
    const now = new Date();
    const base = pickedDate ? fromDateKey(pickedDate) : now;
    setDatePickerMonth(startOfMonth(base || now));
    setDatePickerSelected(pickedDate || null);
    setDatePickerOpen(true);
  }

  async function showDateContainerPreview(dateKey) {
    if (!dateKey) return;

    setShowDateBusy(true);
    setShowDateInfo({ dateKey, mode, container: null, assignments: [], reserved: [], error: null });
    setShowDateOpen(true);

    try {
      const cRes = await fetch("/api/calander/container/by-date", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: dateKey, mode }),
      });
      const cData = await cRes.json().catch(() => ({}));
      if (!cRes.ok) {
        setShowDateInfo({ dateKey, mode, container: null, assignments: [], reserved: [], error: cData.error || "Failed" });
        return;
      }

      const containerObj = cData?.container?.value ?? cData?.container ?? null;
      if (!containerObj?._id) {
        setShowDateInfo({ dateKey, mode, container: null, assignments: [], reserved: [], error: "Invalid container" });
        return;
      }

      const dRes = await fetch(`/api/calander/container/${safeId(containerObj._id)}?includeReserved=1`);
      const dData = await dRes.json().catch(() => ({}));
      if (!dRes.ok) {
        setShowDateInfo({ dateKey, mode, container: null, assignments: [], reserved: [], error: dData.error || "Details failed" });
        return;
      }

      setShowDateInfo({
        dateKey,
        mode,
        container: dData.container || containerObj,
        assignments: dData.assignments || [],
        reserved: dData.reserved || [],
        error: null,
      });
    } catch {
      setShowDateInfo({ dateKey, mode, container: null, assignments: [], reserved: [], error: "Network error" });
    } finally {
      setShowDateBusy(false);
    }
  }

  function confirmPickedDate(dateKey) {
    if (!dateKey) return;
    setPickedDate(dateKey);
    setDatePickerOpen(false);
    setApproveStep("note");
  }

  const headerRight = (
    <div className="flex items-center gap-2">
      <button type="button" onClick={() => setPrintOpen(true)} className={`px-3 py-1 rounded-full text-xs ${btnGhost}`}>
        Print
      </button>
      <button type="button" onClick={() => setHmmOpen(true)} className={`px-3 py-1 rounded-full text-xs ${btnGhost}`}>
        HMM
      </button>
    </div>
  );

  const infoPanel = (
    <div className={`rounded-2xl border p-4 ${panelBg}`}>
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">Info</div>

        <button
          type="button"
          onClick={() => {
            setErr("");
            setConfirmEditOpen(false);
            setEditMode((v) => !v);
            fullLoadedRef.current = false;
          }}
          className={`px-3 py-1 rounded-full text-xs ${btnGhost}`}
        >
          {editMode ? "Close Edit" : "Edit"}
        </button>
      </div>

      {fullLoadBusy ? <div className={`text-xs mt-2 ${hint}`}>Loading full profile...</div> : null}
      {fullLoadErr ? <div className="text-xs mt-2 text-red-200">{fullLoadErr}</div> : null}

      {err ? (
        <div className="mt-3 rounded-2xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">
          {err}
        </div>
      ) : null}

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
                <select
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none ${
                    isDarkText ? "bg-white border-black/10 text-black" : "bg-white/5 border-white/10 text-white"
                  }`}
                >
                  <option value="MALE">MALE</option>
                  <option value="FEMALE">FEMALE</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>

              <FieldX label="Follow Years" value={form.followYears} onChange={(v) => setForm({ ...form, followYears: v })} isDark={isDarkText} />
              <FieldX label="Club Visits Before" value={form.clubVisitsBefore} onChange={(v) => setForm({ ...form, clubVisitsBefore: v })} isDark={isDarkText} />
              <FieldX label="Month/Year" value={form.monthYear} onChange={(v) => setForm({ ...form, monthYear: v })} isDark={isDarkText} />

              {/* Country */}
              <div className="sm:col-span-2">
                <div className={`text-xs mb-1 ${isDarkText ? "text-black/70" : "text-white/70"}`}>Country *</div>
                <select
                  value={form.country}
                  onChange={(e) => {
                    const c = e.target.value;
                    setForm((prev) => ({ ...prev, country: c, state: "", stateOther: "", city: "", cityOther: "" }));
                  }}
                  className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none ${
                    isDarkText ? "bg-white border-black/10 text-black" : "bg-white/5 border-white/10 text-white"
                  }`}
                >
                  {countriesLoading ? <option value="">Loading countries...</option> : <option value="">Select Country...</option>}
                  {!countriesLoading ? (
                    <>
                      <option value="India">India (Default)</option>
                      <option disabled>──────────────────────</option>
                      {countries
                        .filter((x) => x.name !== "India")
                        .map((c) => (
                          <option key={c.code} value={c.name}>
                            {c.flag ? `${c.flag} ` : ""}
                            {c.name}
                          </option>
                        ))}
                    </>
                  ) : null}
                </select>
              </div>

              {/* State */}
              <div>
                <div className={`text-xs mb-1 ${isDarkText ? "text-black/70" : "text-white/70"}`}>State *</div>
                <select
                  value={form.state}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "__OTHER__") {
                      setForm((prev) => ({ ...prev, state: "__OTHER__", stateOther: prev.stateOther || "", city: "__OTHER__", cityOther: "" }));
                      return;
                    }
                    setForm((prev) => ({ ...prev, state: v, stateOther: "", city: "", cityOther: "" }));
                  }}
                  disabled={!form.country || stateLoading}
                  className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none ${
                    isDarkText ? "bg-white border-black/10 text-black" : "bg-white/5 border-white/10 text-white"
                  }`}
                >
                  <option value="">{!form.country ? "Select country first..." : stateLoading ? "Loading states..." : "Select..."}</option>
                  {states.map((s, idx) => (
                    <option key={`${s}_${idx}`} value={s}>
                      {s}
                    </option>
                  ))}
                  <option value="__OTHER__">Enter State Manually</option>
                </select>

                {form.state === "__OTHER__" ? (
                  <input
                    value={form.stateOther}
                    onChange={(e) => setForm((prev) => ({ ...prev, stateOther: e.target.value }))}
                    placeholder="Type state name..."
                    className={`mt-2 w-full rounded-2xl border px-4 py-3 text-sm outline-none ${
                      isDarkText ? "bg-white border-black/10 text-black" : "bg-white/5 border-white/10 text-white"
                    }`}
                  />
                ) : null}
              </div>

              {/* City */}
              <div>
                <div className={`text-xs mb-1 ${isDarkText ? "text-black/70" : "text-white/70"}`}>City *</div>
                <select
                  value={form.city}
                  onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value, cityOther: "" }))}
                  disabled={!form.state || form.state === "__OTHER__" || cityLoading}
                  className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none ${
                    isDarkText ? "bg-white border-black/10 text-black" : "bg-white/5 border-white/10 text-white"
                  }`}
                >
                  <option value="">
                    {!form.state ? "Select..." : form.state === "__OTHER__" ? "Manual state selected" : cityLoading ? "Loading cities..." : "Select..."}
                  </option>
                  {cities.map((c, idx) => (
                    <option key={`${c}_${idx}`} value={c}>
                      {c}
                    </option>
                  ))}
                  <option value="__OTHER__">Other</option>
                </select>

                {form.state === "__OTHER__" ? (
                  <input
                    value={form.cityOther}
                    onChange={(e) => setForm((prev) => ({ ...prev, city: "__OTHER__", cityOther: e.target.value }))}
                    placeholder="Type city name..."
                    className={`mt-2 w-full rounded-2xl border px-4 py-3 text-sm outline-none ${
                      isDarkText ? "bg-white border-black/10 text-black" : "bg-white/5 border-white/10 text-white"
                    }`}
                  />
                ) : form.city === "__OTHER__" ? (
                  <input
                    value={form.cityOther}
                    onChange={(e) => setForm((prev) => ({ ...prev, cityOther: e.target.value }))}
                    placeholder="Type city name..."
                    className={`mt-2 w-full rounded-2xl border px-4 py-3 text-sm outline-none ${
                      isDarkText ? "bg-white border-black/10 text-black" : "bg-white/5 border-white/10 text-white"
                    }`}
                  />
                ) : null}
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
            <button
              type="button"
              disabled={busy}
              onClick={saveEdits}
              className={`flex-1 px-4 py-3 rounded-2xl font-semibold ${btnPrimary} disabled:opacity-60 flex items-center justify-center gap-2`}
            >
              {busy ? <BufferSpinner size={18} /> : null}
              {busy ? "Processing..." : "Save Changes"}
            </button>

            {source === "TODAY" ? (
              <button
                type="button"
                disabled={busy}
                onClick={openSecondFormBeforeFinalize}
                className={`flex-1 px-4 py-3 rounded-2xl font-semibold ${btnPrimary} disabled:opacity-60`}
              >
                Finalize & Move to Sitting
              </button>
            ) : null}
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
            <button
              disabled={busy}
              onClick={() => setApproveStep("pickDate")}
              className={`px-4 py-2 rounded-xl font-semibold ${btnPrimary} disabled:opacity-60`}
            >
              Approve‑For
            </button>

            <div className={`px-4 py-2 rounded-xl text-sm ${btnGhost} ${hint}`}>
              {source === "SITTING"
                ? (isApproveForShift ? "Shift meeting card to container" : "Assign to container")
                : "Pending customer will be assigned to selected container"}
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
                <button
                  type="button"
                  onClick={() => {
                    setMode("DIKSHA");
                    setPickedDate(null);
                    setNote("");
                  }}
                  className={`flex-1 px-3 py-2 rounded-xl text-sm ${mode === "DIKSHA" ? `${btnPrimary} font-semibold` : btnGhost}`}
                >
                  Diksha
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("MEETING");
                    setPickedDate(null);
                    setNote("");
                  }}
                  className={`flex-1 px-3 py-2 rounded-xl text-sm ${mode === "MEETING" ? `${btnPrimary} font-semibold` : btnGhost}`}
                >
                  Meeting
                </button>
              </div>

              <button
                type="button"
                onClick={openCustomDatePicker}
                className={`mt-3 w-full rounded-2xl border px-4 py-3 text-sm text-left ${
                  isDarkText ? "bg-white border-black/10 text-black" : "bg-white/5 border-white/10 text-white"
                }`}
              >
                <div className="text-xs opacity-70">Selected Date</div>
                <div className="font-semibold">{pickedDate || "Tap to select date"}</div>
              </button>

              <div className={`mt-2 text-xs ${hint}`}>Date pe click karo → <b>Confirm</b> / <b>Show Date</b></div>
            </div>
          )}

          {approveStep === "note" && (
            <div>
              <div className="text-sm font-semibold">Note (optional)</div>
              <div className="mt-3">
                <SuggestInput dark={!isDarkText} allowScroll value={note} onChange={setNote} suggestions={noteSuggestions} placeholder="Note (optional)..." />
              </div>

              <button
                disabled={busy}
                onClick={() => approveToContainer()}
                className={`mt-3 w-full px-4 py-2 rounded-2xl font-semibold ${btnPrimary} disabled:opacity-60 flex items-center justify-center gap-2`}
              >
                {busy ? <BufferSpinner size={18} /> : null}
                {isApproveForShift ? "Approve For (Shift Now)" : "Push to Container"}
              </button>

              <button type="button" disabled={busy} onClick={() => setApproveStep("pickDate")} className={`mt-2 w-full px-4 py-2 rounded-2xl ${btnGhost} disabled:opacity-60`}>
                Change Date
              </button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );

  const mobileTabs = !isDesktop && showActions ? (
    <div className="mb-3 flex gap-2">
      <button
        type="button"
        onClick={() => setMobileTab("INFO")}
        className={[
          "flex-1 px-4 py-2 rounded-2xl text-sm font-semibold border",
          isDarkText ? "border-black/10" : "border-white/10",
          mobileTab === "INFO" ? btnPrimary : btnGhost,
        ].join(" ")}
      >
        Info
      </button>
      <button
        type="button"
        onClick={() => setMobileTab("ACTIONS")}
        className={[
          "flex-1 px-4 py-2 rounded-2xl text-sm font-semibold border",
          isDarkText ? "border-black/10" : "border-white/10",
          mobileTab === "ACTIONS" ? btnPrimary : btnGhost,
        ].join(" ")}
      >
        Actions
      </button>
    </div>
  ) : null;

  return (
    <>
      <LayerModal
        open={open}
        layerName="Customer Profile"
        title={customer.name}
        sub={`Source: ${source}${isApproveForShift ? " • ApproveFor Shift" : ""}`}
        onClose={onClose}
        maxWidth="max-w-5xl"
      >
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

            {isDesktop ? (
              showActions ? (
                <div className="grid lg:grid-cols-2 gap-4">
                  {infoPanel}
                  {actionsPanel}
                </div>
              ) : (
                <div>{infoPanel}</div>
              )
            ) : (
              <div className="space-y-4">
                {showActions ? (mobileTab === "INFO" ? infoPanel : actionsPanel) : infoPanel}
              </div>
            )}
          </div>
        </div>
      </LayerModal>

      {/* Occupy Picker (used when pushing to MEETING) */}
      <DikshaOccupyPickerModal
        open={occupyOpen}
        groupSize={1}
        onClose={() => {
          setOccupyOpen(false);
          occupyNextRef.current = null;
        }}
        onPick={async (dateKey) => {
          const fn = occupyNextRef.current;
          occupyNextRef.current = null;
          setOccupyOpen(false);
          if (!fn) return;
          await fn(dateKey);
        }}
      />

      {/* Second Form Modal */}
      <LayerModal
        open={reg2Open}
        layerName="Second Form"
        title="Extra Details"
        sub="Finalize se pehle yeh details required hain"
        onClose={() => setReg2Open(false)}
        maxWidth="max-w-4xl"
        disableBackdropClose
      >
        {reg2Err ? (
          <div className="mb-3 rounded-2xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">{reg2Err}</div>
        ) : null}

        <div className={`rounded-3xl border p-4 ${panelBg}`}>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <div className="text-sm font-semibold">Guardian</div>
              <div className={`text-xs ${hint}`}>Relation select → name fill</div>
            </div>

            <div>
              <div className={`text-xs mb-1 ${isDarkText ? "text-black/70" : "text-white/70"}`}>Relation *</div>
              <select
                value={reg2?.guardianRelation || ""}
                onChange={(e) => setReg2((p) => ({ ...(p || {}), guardianRelation: e.target.value }))}
                className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none ${
                  isDarkText ? "bg-white border-black/10 text-black" : "bg-white/5 border-white/10 text-white"
                }`}
              >
                <option value="">Select...</option>
                <option value="father">Father</option>
                <option value="mother">Mother</option>
                <option value="husband">Husband</option>
              </select>
            </div>

            <FieldX label="Guardian Name *" value={reg2?.guardianName || ""} onChange={(v) => setReg2((p) => ({ ...(p || {}), guardianName: v }))} isDark={isDarkText} />

            <FieldX
              label="PIN Code (6 digits) *"
              value={reg2?.pinCode || ""}
              onChange={(v) => setReg2((p) => ({ ...(p || {}), pinCode: String(v || "").replace(/\D/g, "").slice(0, 6) }))}
              isDark={isDarkText}
            />

            <div className="sm:col-span-2 mt-2">
              <div className="text-sm font-semibold">Phone / WhatsApp / ID</div>
              <div className={`text-xs ${hint}`}>Is section me same values print template me jayengi</div>
            </div>

            <FieldX label="Phone Country Code *" value={reg2?.phoneCountryCode || ""} onChange={(v) => setReg2((p) => ({ ...(p || {}), phoneCountryCode: v }))} isDark={isDarkText} />
            <FieldX label="Phone Number *" value={reg2?.phoneNumber || ""} onChange={onPhoneTyping} isDark={isDarkText} />

            <FieldX label="WhatsApp Country Code" value={reg2?.whatsappCountryCode || ""} onChange={(v) => setReg2((p) => ({ ...(p || {}), whatsappCountryCode: v }))} isDark={isDarkText} />
            <FieldX label="WhatsApp Number" value={reg2?.whatsappNumber || ""} onChange={(v) => setReg2((p) => ({ ...(p || {}), whatsappNumber: v }))} isDark={isDarkText} />

            <div className="sm:col-span-2 mt-1 flex flex-wrap gap-2">
              {["aadhaar", "passport", "other"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setReg2((p) => ({ ...(p || {}), idType: t, idValue: "", idTypeName: t === "other" ? p?.idTypeName || "" : "" }))}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border ${
                    isDarkText ? "border-black/10" : "border-white/10"
                  } ${reg2?.idType === t ? btnPrimary : btnGhost}`}
                >
                  {t.toUpperCase()}
                </button>
              ))}
            </div>

            {reg2?.idType === "other" ? (
              <>
                <FieldX label="Other ID Type Name *" value={reg2?.idTypeName || ""} onChange={(v) => setReg2((p) => ({ ...(p || {}), idTypeName: v }))} isDark={isDarkText} />
                <FieldX label="Other ID Number *" value={reg2?.idValue || ""} onChange={(v) => setReg2((p) => ({ ...(p || {}), idValue: v }))} isDark={isDarkText} />
              </>
            ) : (
              <div className="sm:col-span-2">
                <FieldX
                  label={reg2?.idType === "passport" ? "Passport Number *" : "Aadhaar Number *"}
                  value={reg2?.idValue || ""}
                  onChange={(v) => setReg2((p) => ({ ...(p || {}), idValue: v }))}
                  isDark={isDarkText}
                />
              </div>
            )}

            <div className="sm:col-span-2 mt-2">
              <div className="text-sm font-semibold">Family Member Details *</div>
            </div>

            <FieldX label="Family Member Name *" value={reg2?.familyMemberName || ""} onChange={(v) => setReg2((p) => ({ ...(p || {}), familyMemberName: v }))} isDark={isDarkText} />

            <SelectX
              label="Family Member Relation *"
              value={reg2?.familyMemberRelation || ""}
              onChange={(v) =>
                setReg2((p) => ({
                  ...(p || {}),
                  familyMemberRelation: v,
                  familyMemberRelationOther: v === "other" ? (p?.familyMemberRelationOther || "") : "",
                }))
              }
              options={["mother", "father", "parents", "other"]}
              isDark={isDarkText}
            />

            {reg2?.familyMemberRelation === "other" ? (
              <FieldX
                label="Other Relation *"
                value={reg2?.familyMemberRelationOther || ""}
                onChange={(v) => setReg2((p) => ({ ...(p || {}), familyMemberRelationOther: v }))}
                isDark={isDarkText}
                placeholder="Type relation..."
              />
            ) : null}

            <FieldX
              label="Family Member Mobile *"
              value={reg2?.familyMemberMobile || ""}
              onChange={(v) => setReg2((p) => ({ ...(p || {}), familyMemberMobile: v }))}
              isDark={isDarkText}
            />

            <div className="sm:col-span-2 mt-2">
              <div className="text-sm font-semibold">Address *</div>
              <textarea
                value={reg2?.address2 || ""}
                onChange={(e) => setReg2((p) => ({ ...(p || {}), address2: e.target.value }))}
                className={`mt-2 w-full rounded-2xl border px-4 py-3 text-sm outline-none min-h-[110px] ${
                  isDarkText ? "bg-white border-black/10 text-black" : "bg-white/5 border-white/10 text-white"
                }`}
                placeholder="Enter complete address..."
              />
            </div>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button type="button" onClick={() => setReg2Open(false)} className={`flex-1 px-4 py-3 rounded-2xl ${btnGhost}`}>
            Cancel
          </button>
          <button type="button" onClick={continueAfterSecondForm} className={`flex-1 px-4 py-3 rounded-2xl font-semibold ${btnPrimary}`}>
            Continue
          </button>
        </div>
      </LayerModal>

      {/* Confirm Edit Modal */}
      <LayerModal
        open={confirmEditOpen}
        layerName="Confirm Edit"
        title="Confirm Changes"
        sub="Commit required • Recent → Sitting finalize"
        onClose={() => setConfirmEditOpen(false)}
        maxWidth="max-w-2xl"
        disableBackdropClose
      >
        {err ? (
          <div className="mb-3 rounded-2xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">{err}</div>
        ) : null}

        <div className={`rounded-3xl border p-4 ${panelBg}`}>
          <div className="text-sm font-semibold">Review</div>
          <div className="mt-3 space-y-2 text-sm">
            <Row k="Name" v={form?.name} isDark={isDarkText} />
            <Row k="Age" v={form?.age} isDark={isDarkText} />
            <Row k="Address" v={form?.address} isDark={isDarkText} />
            <Row k="PIN" v={form?.pincode} isDark={isDarkText} />
            <Row k="Country/State/City" v={`${form?.country || "-"} / ${stateFinal || "-"} / ${cityFinal || "-"}`} isDark={isDarkText} />
            <Row k="Guardian" v={`${form?.guardianRelation || "-"} • ${form?.guardianName || "-"}`} isDark={isDarkText} />
            <Row k="Phone" v={`${form?.phoneCountryCode || ""} ${form?.phoneNumber || ""}`} isDark={isDarkText} />
            <Row k="WhatsApp" v={`${form?.whatsappCountryCode || ""} ${form?.whatsappNumber || ""}`} isDark={isDarkText} />
            <Row
              k="Family Member"
              v={
                form?.familyMemberRelation === "other"
                  ? `${form?.familyMemberName || "-"} • ${form?.familyMemberRelationOther || "-"} • ${form?.familyMemberMobile || "-"}`
                  : `${form?.familyMemberName || "-"} • ${form?.familyMemberRelation || "-"} • ${form?.familyMemberMobile || "-"}`
              }
              isDark={isDarkText}
            />
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setConfirmEditOpen(false);
              openSecondFormBeforeFinalize();
            }}
            className={`flex-1 px-4 py-3 rounded-2xl ${btnGhost} disabled:opacity-60`}
          >
            Back (Edit Extra Details)
          </button>

          <button
            type="button"
            disabled={busy || !canFinalizeEdit}
            onClick={confirmEditAndFinalize}
            className={`flex-1 px-4 py-3 rounded-2xl font-semibold ${btnPrimary} disabled:opacity-60 flex items-center justify-center gap-2`}
          >
            {busy ? <BufferSpinner size={18} /> : null}
            {busy ? "Processing..." : "Finalize & Move to Sitting"}
          </button>
        </div>
      </LayerModal>

      {/* Print Modal */}
      <LayerModal
        open={printOpen}
        layerName="Print"
        title="Print (Form2 Template)"
        sub="Uses public/print/form2.html"
        onClose={() => setPrintOpen(false)}
        maxWidth="max-w-2xl"
      >
        <div className={`rounded-3xl border p-4 ${panelBg}`}>
          <div className="text-sm font-semibold">Template Print</div>
          <div className={`mt-1 text-xs ${hint}`}>
            Guardian/Gender/Marital/ID/Family details automatically fill honge.
            {sequenceNo ? (
              <>
                {" "}
                Card No: <b>#{sequenceNo}</b>
              </>
            ) : null}
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button type="button" onClick={() => setPrintOpen(false)} className={`flex-1 px-4 py-3 rounded-2xl ${btnGhost}`}>
            Close
          </button>
          <button type="button" onClick={openPrintPage} className={`flex-1 px-4 py-3 rounded-2xl font-semibold ${btnPrimary}`}>
            Open Print Preview
          </button>
        </div>
      </LayerModal>

      {/* Done Modal */}
      <LayerModal
        open={doneOpen}
        layerName="Done"
        title="Done"
        sub="Operation completed"
        onClose={() => {
          setDoneOpen(false);
          onChanged?.();
          onClose();
        }}
        maxWidth="max-w-md"
        disableBackdropClose
      >
        <div className={`rounded-2xl border p-5 ${panelBg} text-center`}>
          <div className="text-xl font-bold">{doneMsg || "Done"}</div>
          <div className={`text-sm mt-2 ${hint}`}>Close to continue.</div>
          <button
            type="button"
            onClick={() => {
              setDoneOpen(false);
              onChanged?.();
              onClose();
            }}
            className={`mt-4 px-5 py-3 rounded-2xl font-semibold ${btnPrimary}`}
          >
            Close
          </button>
        </div>
      </LayerModal>

      {/* Date Picker Modal */}
      <LayerModal
        open={datePickerOpen}
        layerName="Calendar Picker"
        title={`Select Date (${mode})`}
        sub="Tap a date → Confirm / Show Date"
        onClose={() => setDatePickerOpen(false)}
        maxWidth="max-w-3xl"
      >
        <CalendarGrid
          month={datePickerMonth}
          onPrev={() => setDatePickerMonth((m) => addMonths(m, -1))}
          onNext={() => setDatePickerMonth((m) => addMonths(m, 1))}
          selectedKey={datePickerSelected}
          onSelect={(k) => setDatePickerSelected(k)}
          isDarkText={isDarkText}
        />

        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            disabled={!datePickerSelected}
            onClick={() => confirmPickedDate(datePickerSelected)}
            className={`flex-1 px-4 py-3 rounded-2xl font-semibold ${btnPrimary} disabled:opacity-60`}
          >
            Confirm
          </button>

          <button
            type="button"
            disabled={!datePickerSelected}
            onClick={async () => await showDateContainerPreview(datePickerSelected)}
            className={`flex-1 px-4 py-3 rounded-2xl ${btnGhost} disabled:opacity-60`}
          >
            Show Date
          </button>
        </div>

        <div className={`mt-3 text-xs ${hint}`}>
          Selected: <b>{datePickerSelected || "—"}</b>
        </div>
      </LayerModal>

      {/* Show Date Preview Modal */}
      <LayerModal
        open={showDateOpen}
        layerName="Date Container"
        title="Container Preview"
        sub={showDateInfo?.dateKey ? `${showDateInfo.dateKey} • ${showDateInfo.mode}` : "Loading..."}
        onClose={() => setShowDateOpen(false)}
        maxWidth="max-w-4xl"
      >
        <div className={`rounded-3xl border p-5 ${panelBg}`}>
          {showDateBusy ? (
            <div className={hint}>Loading...</div>
          ) : showDateInfo?.error ? (
            <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">{showDateInfo.error}</div>
          ) : !showDateInfo?.container?._id ? (
            <div className={hint}>No container found for this date.</div>
          ) : (
            <>
              <div className="text-sm font-semibold">Container</div>
              <div className={`mt-1 text-xs ${hint}`}>ID: {safeId(showDateInfo.container._id)}</div>

              <div className="mt-4 grid sm:grid-cols-3 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="text-xs opacity-70">IN CONTAINER</div>
                  <div className="text-xl font-bold">{(showDateInfo.assignments || []).length}</div>
                </div>

                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-3">
                  <div className="text-xs opacity-70">RESERVED (Meeting holds)</div>
                  <div className="text-xl font-bold">{(showDateInfo.reserved || []).length}</div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="text-xs opacity-70">LIMIT</div>
                  <div className="text-xl font-bold">{showDateInfo.container?.limit ?? 20}</div>
                </div>
              </div>
            </>
          )}

          <div className="mt-4 flex gap-2">
            <button type="button" onClick={() => setShowDateOpen(false)} className={`flex-1 px-4 py-3 rounded-2xl ${btnGhost}`}>
              Close
            </button>
          </div>
        </div>
      </LayerModal>

      <CustomerHistoryModal open={hmmOpen} onClose={() => setHmmOpen(false)} customerId={safeId(customer._id)} />
      {CommitModal}
    </>
  );
}

/* -------------------------
   Calendar Grid Component
-------------------------- */
function CalendarGrid({ month, onPrev, onNext, selectedKey, onSelect, isDarkText }) {
  const hint = isDarkText ? "text-black/60" : "text-white/60";

  const shell = isDarkText ? "border-black/10 bg-white/60" : "border-white/10 bg-black/20";
  const navBtn = isDarkText
    ? "bg-black/10 border-black/10 hover:bg-black/20 text-black"
    : "bg-white/10 border-white/10 hover:bg-white/15 text-white";

  const monthLabel = useMemo(() => {
    try {
      return month?.toLocaleString?.(undefined, { month: "long", year: "numeric" }) || "";
    } catch {
      return "";
    }
  }, [month]);

  const days = useMemo(() => {
    const first = startOfMonth(month);
    const firstDow = first.getDay();
    const start = new Date(first.getFullYear(), first.getMonth(), first.getDate() - firstDow);

    const out = [];
    for (let i = 0; i < 42; i++) out.push(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
    return out;
  }, [month]);

  const today = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => toDateKey(today), [today]);

  return (
    <div className={`rounded-3xl border p-4 ${shell}`}>
      <div className="flex items-center justify-between gap-2 mb-3">
        <button type="button" onClick={onPrev} className={`px-3 py-2 rounded-xl border ${navBtn}`}>
          Prev
        </button>

        <div className={`font-semibold ${isDarkText ? "text-black" : "text-white"}`}>{monthLabel}</div>

        <button type="button" onClick={onNext} className={`px-3 py-2 rounded-xl border ${navBtn}`}>
          Next
        </button>
      </div>

      <div className={`grid grid-cols-7 gap-2 text-xs ${hint} mb-2`}>
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="text-center">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map((d) => {
          const key = toDateKey(d);
          const inMonth = d.getMonth() === month.getMonth();
          const isPast = d < new Date(today.getFullYear(), today.getMonth(), today.getDate());
          const isSelected = selectedKey === key;
          const isToday = key === todayKey;

          const baseText = isDarkText ? "text-black" : "text-white";
          const baseBorder = isDarkText ? "border-black/10" : "border-white/10";
          const hover = isDarkText ? "hover:bg-black/10" : "hover:bg-white/10";

          return (
            <button
              key={key}
              type="button"
              disabled={isPast}
              onClick={() => onSelect(key)}
              className={[
                "h-10 rounded-xl border text-sm",
                baseBorder,
                inMonth ? "" : "opacity-40",
                isPast ? "opacity-35 cursor-not-allowed" : hover,
                isSelected ? "bg-white text-black font-semibold" : `bg-transparent ${baseText}`,
                isToday ? "border-blue-400/80" : "",
              ].join(" ")}
              title={key}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>

      <div className={`mt-3 text-xs ${hint}`}>Past dates disabled. Today highlight blue border.</div>
    </div>
  );
}

function Row({ k, v, isDark }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className={isDark ? "text-black/70" : "text-white/70"}>{k}</div>
      <div className={`text-right break-words max-w-[60%] ${isDark ? "text-black" : "text-white"}`}>{v || "-"}</div>
    </div>
  );
}

function FieldX({ label, value, onChange, required = false, placeholder = "", type = "text", isDark }) {
  const cls = isDark
    ? "bg-white border-black/10 text-black focus:ring-black/20"
    : "bg-white/5 border-white/10 text-white focus:ring-blue-500/40";

  return (
    <div>
      <div className={`text-xs mb-1 ${isDark ? "text-black/70" : "text-white/70"}`}>
        {label} {required ? "*" : ""}
      </div>
      <input
        value={value}
        type={type}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:ring-2 ${cls}`}
      />
    </div>
  );
}

function SelectX({ label, value, onChange, options, required = false, isDark }) {
  const cls = isDark ? "bg-white border-black/10 text-black" : "bg-white/5 border-white/10 text-white";
  return (
    <div>
      <div className={`text-xs mb-1 ${isDark ? "text-black/70" : "text-white/70"}`}>
        {label} {required ? "*" : ""}
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none ${cls}`}
      >
        <option value="">Select...</option>
        {(options || []).map((x, idx) => (
          <option key={`${x}_${idx}`} value={x}>
            {x}
          </option>
        ))}
      </select>
    </div>
  );
}

function ToggleBtn({ label, value, onToggle, btnGhost, hint }) {
  return (
    <button type="button" onClick={onToggle} className={`px-3 py-2 rounded-xl text-left ${btnGhost}`}>
      <div className="text-sm font-semibold">{label}</div>
      <div className={`text-xs ${hint}`}>{value ? "YES" : "NO"}</div>
    </button>
  );
}

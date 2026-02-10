"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import LayerModal from "@/components/LayerModal";
import { useCommitGate } from "@/components/CommitGate";

const DRAFT_KEY_V2 = "sysbyte_addcustomer_draft_v2";
const DRAFT_KEY_V1 = "sysbyte_addcustomer_draft_v1";

// NOTE: existing values kept, only "husband" added for HTML parity (old drafts with "husbend" still work)
const FAMILY_OPTIONS = ["mother", "father", "mother&father", "husband", "husbend", "wife", "other"];

const APPROVERS = [
  "Albeli baba",
  "sundari baba",
  "sahachari baba",
  "pyari sharan babab",
  "garbeli baba",
  "mahaMadhuri baba",
  "navalNagri baba",
  "permRasdaini baba",
  "navalKishori baba",
];

const MARITAL = ["marrid", "unmarrid", "divorce", "wido", "virakt", "sepreted"];

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

// HTML fallback states for some countries (used when API doesn't return)
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

function makeSubmissionId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
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

function hasMeaningfulDraft(form) {
  if (!form) return false;
  return Boolean(
    String(form.name || "").trim() ||
      String(form.age || "").trim() ||
      String(form.gender || "").trim() ||
      String(form.country || "").trim() ||
      String(form.state || "").trim() ||
      String(form.stateOther || "").trim() ||
      String(form.city || "").trim() ||
      String(form.cityOther || "").trim() ||
      String(form.occupation || "").trim() ||
      String(form.note || "").trim() ||
      String(form.approver || "").trim() ||
      String(form.maritalStatus || "").trim() ||
      String(form.familyPermissionRelation || "").trim() ||
      String(form.familyPermissionOther || "").trim() ||
      String(form.remarks || "").trim() ||
      String(form.dikshaYear || "").trim() || // ✅ HTML field
      String(form.vrindavanVisits || "").trim() || // ✅ HTML field
      String(form.firstDikshaYear || "").trim() || // ✅ HTML field
      form.onionGarlic ||
      form.hasPet ||
      form.hadTeacherBefore ||
      form.nasha // ✅ HTML field
  );
}

function Toggle({ label, val, setVal }) {
  return (
    <button
      type="button"
      onClick={() => setVal(!val)}
      className={`rounded-2xl border px-3 py-2 text-left transition ${
        val ? "bg-white text-black border-white" : "bg-white/5 text-white border-white/10 hover:bg-white/10"
      }`}
    >
      <div className="text-xs font-semibold">{label}</div>
      <div className="text-[11px] opacity-70">{val ? "YES" : "NO"}</div>
    </button>
  );
}

function Field({ label, value, onChange, required = false, placeholder = "", type = "text" }) {
  return (
    <div>
      <div className="text-xs text-white/70 mb-1">
        {label} {required ? "*" : ""}
      </div>
      <input
        value={value}
        type={type}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500/40"
      />
    </div>
  );
}

function Select({ label, value, onChange, options, required = false }) {
  return (
    <div>
      <div className="text-xs text-white/70 mb-1">
        {label} {required ? "*" : ""}
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white outline-none"
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
    const cities = uniqStrings(data?.data || []);
    return cities;
  } catch {
    return [];
  }
}

// ✅ HTML logic: load ALL countries (REST Countries)
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

// ✅ HTML logic: states by country (CountriesNow)
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

// ✅ HTML logic: cities by country+state (CountriesNow)
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

async function reverseGeocode(lat, lon) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  const a = data.address || {};
  return {
    country: a.country || "India",
    state: a.state || a.region || "",
    city: a.city || a.town || a.village || a.county || "",
  };
}

export default function AddCustomer({ session }) {
  const username = session?.username || "UNKNOWN";

  const [manualOpen, setManualOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [doneOpen, setDoneOpen] = useState(false);

  const [submissionId, setSubmissionId] = useState("");
  const inFlight = useRef(false);

  const [error, setError] = useState("");
  const [doneInfo, setDoneInfo] = useState({ rollNo: null });

  // ✅ HTML logic: countries list + async loading
  const [countries, setCountries] = useState([]);
  const [countriesLoading, setCountriesLoading] = useState(false);

  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  const [stateLoading, setStateLoading] = useState(false);
  const [cityLoading, setCityLoading] = useState(false);

  const [remarksUnlocked, setRemarksUnlocked] = useState(false);
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [unlockPwd, setUnlockPwd] = useState("");

  const [form, setForm] = useState({
    name: "",
    age: "",
    gender: "OTHER",

    occupation: "",
    note: "",
    approver: "",
    maritalStatus: "",

    // ✅ HTML address logic: country dynamic + manual state support
    country: "India",
    state: "",
    stateOther: "", // ✅ NEW (HTML manual state)
    city: "",
    cityOther: "",

    // ✅ HTML diksha fields (NEW)
    dikshaYear: "",
    vrindavanVisits: "",
    firstDikshaYear: "",

    familyPermissionRelation: "",
    familyPermissionOther: "",

    onionGarlic: false,
    hasPet: false,
    hadTeacherBefore: false,
    nasha: false, // ✅ NEW (HTML toggle)

    remarks: username,
  });

  const computedAddress = useMemo(() => {
    const c = String(form.country || "India").trim();
    const s = form.state === "__OTHER__" ? String(form.stateOther || "").trim() : String(form.state || "").trim();
    const city = form.city === "__OTHER__" ? String(form.cityOther || "").trim() : String(form.city || "").trim();
    return [city, s, c].map((x) => String(x || "").trim()).filter(Boolean).join(", ");
  }, [form.country, form.state, form.stateOther, form.city, form.cityOther]);

  useEffect(() => {
    try {
      const raw2 = localStorage.getItem(DRAFT_KEY_V2);
      const raw1 = localStorage.getItem(DRAFT_KEY_V1);
      const raw = raw2 || raw1;
      if (!raw) return;

      const d = JSON.parse(raw);

      if (d?.form && typeof d.form === "object") {
        setForm((prev) => ({
          ...prev,
          ...d.form,
          country: d.form.country || prev.country || "India",
          remarks: d.form.remarks || prev.remarks || username,
        }));
      }
      if (d?.submissionId) setSubmissionId(String(d.submissionId));
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      if (!submissionId && !hasMeaningfulDraft(form)) {
        localStorage.removeItem(DRAFT_KEY_V2);
        return;
      }
      localStorage.setItem(
        DRAFT_KEY_V2,
        JSON.stringify({ submissionId: submissionId || null, form, updatedAt: new Date().toISOString() })
      );
    } catch {}
  }, [form, submissionId]);

  // ✅ HTML logic: load countries on mount
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
        // minimal fallback (HTML fallback style)
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

  // ✅ HTML logic: load states when country changes
  useEffect(() => {
    let alive = true;
    (async () => {
      const country = String(form.country || "").trim();
      if (!country) {
        setStates([]);
        return;
      }

      setStateLoading(true);
      try {
        const st = await fetchStatesByCountry(country);
        const final = uniqStrings(st);
        if (!alive) return;
        setStates(final);
      } finally {
        if (alive) setStateLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [form.country]);

  // If saved draft has state not in list => move to manual state
  useEffect(() => {
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
  }, [states]);

  // ✅ HTML logic: load cities when country/state changes
  useEffect(() => {
    let alive = true;
    (async () => {
      const country = String(form.country || "").trim();
      const state = String(form.state || "").trim();

      if (!country || !state) {
        setCities([]);
        return;
      }

      if (state === "__OTHER__") {
        // manual state => manual city
        setCities([]);
        setCityLoading(false);
        return;
      }

      setCityLoading(true);
      try {
        const list = await fetchCitiesByCountryState(country, state);
        const final = uniqStrings(list);
        if (!alive) return;
        setCities(final);
      } finally {
        if (alive) setCityLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [form.country, form.state]);

  // If saved draft has city not in list => move to manual city
  useEffect(() => {
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
  }, [cities]);

  const { requestCommit, CommitModal } = useCommitGate({
    defaultSuggestions: ["Created profile (manual)", "New customer entry", "Customer submitted basic details"],
  });

  const canGoConfirm = useMemo(() => {
    const nameOk = String(form.name || "").trim();
    const ageOk = String(form.age || "").trim();
    const countryOk = String(form.country || "").trim();

    const stateOk =
      form.state === "__OTHER__" ? String(form.stateOther || "").trim() : String(form.state || "").trim();

    const cityOk =
      form.city === "__OTHER__" ? String(form.cityOther || "").trim() : String(form.city || "").trim();

    return Boolean(nameOk && ageOk && countryOk && stateOk && cityOk);
  }, [form]);

  function resetAll() {
    setError("");
    setDoneInfo({ rollNo: null });
    setSubmissionId("");
    inFlight.current = false;

    setRemarksUnlocked(false);
    setUnlockOpen(false);
    setUnlockPwd("");

    setForm({
      name: "",
      age: "",
      gender: "OTHER",
      occupation: "",
      note: "",
      approver: "",
      maritalStatus: "",

      country: "India",
      state: "",
      stateOther: "",
      city: "",
      cityOther: "",

      dikshaYear: "",
      vrindavanVisits: "",
      firstDikshaYear: "",

      familyPermissionRelation: "",
      familyPermissionOther: "",

      onionGarlic: false,
      hasPet: false,
      hadTeacherBefore: false,
      nasha: false,

      remarks: username,
    });

    try {
      localStorage.removeItem(DRAFT_KEY_V2);
    } catch {}
  }

  function openManualDirect() {
    if (!submissionId) setSubmissionId(makeSubmissionId());
    setForm((prev) => ({ ...prev, remarks: prev.remarks || username }));
    setManualOpen(true);
  }

  async function autofillFromGPS() {
    setError("");
    if (!navigator.geolocation) return alert("Geolocation not supported");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const info = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
          setForm((prev) => ({
            ...prev,
            country: info.country || prev.country || "India",
            state: info.state || prev.state,
            city: info.city || prev.city,
          }));
        } catch {
          alert("AutoFetch failed");
        }
      },
      () => alert("Location permission denied"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function unlockRemarks() {
    setError("");
    const pwd = String(unlockPwd || "");
    if (!pwd) return setError("Enter password");

    const res = await fetch("/api/auth/verify-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pwd }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setError(data.error || "Wrong password");

    setRemarksUnlocked(true);
    setUnlockOpen(false);
    setUnlockPwd("");
  }

  async function submitManualFinal() {
    setError("");
    if (inFlight.current) return;

    if (!canGoConfirm) {
      setError("Name, Age, Country, State, City required");
      return;
    }

    const commitMessage = await requestCommit({
      title: "Submit Customer",
      subtitle: "Customer will be created in Recent (Today DB).",
      preset: "Created profile (manual)",
    }).catch(() => null);

    if (!commitMessage) return;

    const stateFinal = form.state === "__OTHER__" ? String(form.stateOther || "").trim() : String(form.state || "").trim();
    const cityFinal = form.city === "__OTHER__" ? String(form.cityOther || "").trim() : String(form.city || "").trim();

    inFlight.current = true;

    try {
      const res = await fetch("/api/customers/today", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId,
          commitMessage,

          name: form.name,
          age: form.age,
          gender: form.gender,

          // ✅ HTML logic: dynamic country/state/city
          country: form.country,
          state: stateFinal,
          city: cityFinal,
          address: computedAddress,

          occupation: form.occupation,
          note: form.note,
          approver: form.approver,
          maritalStatus: form.maritalStatus,

          // ✅ NEW fields from HTML
          dikshaYear: form.dikshaYear,
          vrindavanVisits: form.vrindavanVisits,
          firstDikshaYear: form.firstDikshaYear,

          familyPermission: Boolean(form.familyPermissionRelation),
          familyPermissionRelation: form.familyPermissionRelation,
          familyPermissionOther: form.familyPermissionRelation === "other" ? form.familyPermissionOther : "",

          remarks: form.remarks || username,
          remarksBy: username,

          onionGarlic: form.onionGarlic,
          hasPet: form.hasPet,
          hadTeacherBefore: form.hadTeacherBefore,

          // ✅ NEW toggle from HTML
          nasha: form.nasha,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        inFlight.current = false;
        setError(data.error || "Submit failed");
        return;
      }

      setDoneInfo({ rollNo: data.rollNo || null });

      setConfirmOpen(false);
      setManualOpen(false);
      setDoneOpen(true);
    } catch {
      inFlight.current = false;
      setError("Network error");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-white/60">Entry</div>
          <h2 className="text-white font-semibold text-lg">Add Customer</h2>
        </div>

        <button
          type="button"
          onClick={openManualDirect}
          className="px-4 py-2 rounded-2xl bg-white/10 border border-white/10 text-white hover:bg-white/15 transition shadow-[0_0_35px_rgba(59,130,246,0.12)]"
        >
          + Add
        </button>
      </div>

      <LayerModal
        open={manualOpen}
        layerName="Manual Form"
        title="Manual Entry"
        sub="Fill details → Confirm"
        onClose={() => setManualOpen(false)}
        maxWidth="max-w-5xl"
        disableBackdropClose
      >
        <div className="text-[11px] text-white/50 mb-3">submissionId: {submissionId || "—"}</div>

        {error ? (
          <div className="mb-3 rounded-2xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Name" required value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <Field label="Age" required value={form.age} onChange={(v) => setForm({ ...form, age: v })} />

          <div>
            <div className="text-xs text-white/70 mb-1">Gender</div>
            <select
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
              className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white outline-none"
            >
              <option value="MALE">MALE</option>
              <option value="FEMALE">FEMALE</option>
              <option value="OTHER">OTHER</option>
            </select>
          </div>

          <Field
            label="Occupation"
            value={form.occupation}
            onChange={(v) => setForm({ ...form, occupation: v })}
            placeholder="e.g. business/job..."
          />

          {/* ✅ HTML: Country dropdown (instead of fixed India) */}
          <div>
            <div className="text-xs text-white/70 mb-1">Country *</div>
            <select
              value={form.country}
              onChange={(e) => {
                const c = e.target.value;
                setForm((prev) => ({
                  ...prev,
                  country: c,
                  state: "",
                  stateOther: "",
                  city: "",
                  cityOther: "",
                }));
              }}
              className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white outline-none"
            >
              {countriesLoading ? <option value="">Loading countries...</option> : <option value="">Select Country...</option>}

              {/* India default on top (HTML behavior) */}
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

          {/* ✅ HTML: State dropdown with manual option */}
          <div>
            <div className="text-xs text-white/70 mb-1">State *</div>
            <select
              value={form.state}
              onChange={(e) => {
                const v = e.target.value;

                if (v === "__OTHER__") {
                  setForm((prev) => ({
                    ...prev,
                    state: "__OTHER__",
                    stateOther: prev.stateOther || "",
                    city: "__OTHER__",
                    cityOther: "",
                  }));
                  return;
                }

                setForm((prev) => ({
                  ...prev,
                  state: v,
                  stateOther: "",
                  city: "",
                  cityOther: "",
                }));
              }}
              disabled={!form.country || stateLoading}
              className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white outline-none"
            >
              <option value="">
                {!form.country ? "Select country first..." : stateLoading ? "Loading states..." : "Select..."}
              </option>
              {states.map((s, idx) => (
                <option key={`${s}_${idx}`} value={s}>
                  {s}
                </option>
              ))}
              <option value="__OTHER__">Enter State Manually</option>
            </select>

            {stateLoading ? <div className="text-[11px] text-white/50 mt-1">Loading states...</div> : null}

            {form.state === "__OTHER__" ? (
              <input
                value={form.stateOther}
                onChange={(e) => setForm((prev) => ({ ...prev, stateOther: e.target.value }))}
                placeholder="Type state name..."
                className="mt-2 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            ) : null}
          </div>

          {/* ✅ HTML: City dropdown + manual city */}
          <div>
            <div className="text-xs text-white/70 mb-1">City *</div>

            <select
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value, cityOther: "" })}
              className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white outline-none"
              disabled={!form.state || form.state === "__OTHER__" || cityLoading}
            >
              <option value="">
                {!form.state
                  ? "Select..."
                  : form.state === "__OTHER__"
                    ? "Manual state selected"
                    : cityLoading
                      ? "Loading cities..."
                      : "Select..."}
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
                onChange={(e) => setForm({ ...form, city: "__OTHER__", cityOther: e.target.value })}
                placeholder="Type city name..."
                className="mt-2 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            ) : form.city === "__OTHER__" ? (
              <input
                value={form.cityOther}
                onChange={(e) => setForm({ ...form, cityOther: e.target.value })}
                placeholder="Type city name..."
                className="mt-2 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            ) : null}

            {cityLoading ? <div className="text-[11px] text-white/50 mt-1">Loading cities...</div> : null}
          </div>

          <div className="sm:col-span-2">
            <button
              type="button"
              onClick={autofillFromGPS}
              className="w-full px-4 py-3 rounded-2xl bg-white/10 border border-white/10 hover:bg-white/15"
            >
              AutoFetch State/City (GPS)
            </button>
            <div className="text-[11px] text-white/50 mt-1">Internet required • GPS permission required</div>
          </div>

          <Select label="Maritial Status" value={form.maritalStatus} onChange={(v) => setForm({ ...form, maritalStatus: v })} options={MARITAL} />

          <Select label="Approver" value={form.approver} onChange={(v) => setForm({ ...form, approver: v })} options={APPROVERS} />

          {/* ✅ NEW: Diksha fields (from HTML) */}
          <div className="sm:col-span-2 mt-2 text-xs text-white/60">Diksha Information</div>

          <Field
            label="Diksha ke liye kab aaye the (Year)"
            type="number"
            value={form.dikshaYear}
            onChange={(v) => setForm({ ...form, dikshaYear: v })}
            placeholder="e.g. 2020"
          />

          <Field
            label="Kitni baar aye Vrindavan"
            type="number"
            value={form.vrindavanVisits}
            onChange={(v) => setForm({ ...form, vrindavanVisits: v })}
            placeholder="Enter number"
          />

          <Field
            label="Diksha me pratham upastithi (Year)"
            type="number"
            value={form.firstDikshaYear}
            onChange={(v) => setForm({ ...form, firstDikshaYear: v })}
            placeholder="e.g. 2021"
          />

          <div>
            <div className="text-xs text-white/70 mb-1">Family Permission</div>
            <select
              value={form.familyPermissionRelation}
              onChange={(e) => {
                const rel = e.target.value;
                setForm((prev) => ({
                  ...prev,
                  familyPermissionRelation: rel,
                  familyPermissionOther: rel === "other" ? prev.familyPermissionOther : "",
                }));
              }}
              className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white outline-none"
            >
              <option value="">Select...</option>
              {FAMILY_OPTIONS.map((x, idx) => (
                <option key={`${x}_${idx}`} value={x}>
                  {x}
                </option>
              ))}
            </select>

            {form.familyPermissionRelation === "other" ? (
              <input
                value={form.familyPermissionOther}
                onChange={(e) => setForm({ ...form, familyPermissionOther: e.target.value })}
                placeholder="Other (type here)..."
                className="mt-2 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            ) : null}
          </div>

          {/* ✅ NEW: Nasha toggle (from HTML) */}
          <div className="sm:col-span-2 grid sm:grid-cols-2 lg:grid-cols-4 gap-2 mt-1">
            <Toggle label="Onion/Garlic?" val={form.onionGarlic} setVal={(x) => setForm({ ...form, onionGarlic: x })} />
            <Toggle label="Has Pet?" val={form.hasPet} setVal={(x) => setForm({ ...form, hasPet: x })} />
            <Toggle label="Teacher Before?" val={form.hadTeacherBefore} setVal={(x) => setForm({ ...form, hadTeacherBefore: x })} />
            <Toggle label="Kya Nasha Karte Ho?" val={form.nasha} setVal={(x) => setForm({ ...form, nasha: x })} />
          </div>

          <div className="sm:col-span-2">
            <div className="text-xs text-white/70 mb-1">Note</div>
            <textarea
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="Note..."
              className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white outline-none min-h-[90px]"
            />
          </div>

          <div className="sm:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <div className="text-xs text-white/70">Remarks (auto)</div>
              <button
                type="button"
                onClick={() => setUnlockOpen(true)}
                className="px-3 py-1 rounded-xl bg-white/10 border border-white/10 hover:bg-white/15 text-xs"
              >
                Unlock (Password)
              </button>
            </div>

            <input
              value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              readOnly={!remarksUnlocked}
              className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none ${
                remarksUnlocked
                  ? "bg-black/30 border-white/10 text-white focus:ring-2 focus:ring-blue-500/40"
                  : "bg-white/5 border-white/10 text-white/70"
              }`}
            />
            <div className="text-[11px] text-white/50 mt-1">
              Default: <b>{username}</b> • Unlock ke baad edit possible
            </div>
          </div>
        </div>

        <div className="mt-4 text-xs text-white/60">
          Computed Address: <b className="text-white">{computedAddress || "—"}</b>
        </div>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={() => setManualOpen(false)}
            className="flex-1 px-4 py-3 rounded-2xl bg-white/10 border border-white/10 hover:bg-white/15"
          >
            Close
          </button>

          <button
            type="button"
            disabled={!canGoConfirm}
            onClick={() => {
              setError("");
              if (!canGoConfirm) {
                setError("Name, Age, Country, State, City required");
                return;
              }
              setConfirmOpen(true);
            }}
            className="flex-1 px-4 py-3 rounded-2xl bg-white text-black font-semibold disabled:opacity-60"
          >
            Confirm
          </button>
        </div>

        <div className="mt-3 text-[11px] text-white/45">Draft auto-saved. Modal close ho bhi jaye to data safe rahega.</div>
      </LayerModal>

      {/* Unlock remarks modal */}
      <LayerModal
        open={unlockOpen}
        layerName="Unlock Remarks"
        title="Unlock Remarks"
        sub="Enter your password"
        onClose={() => {
          setUnlockOpen(false);
          setUnlockPwd("");
          setError("");
        }}
        maxWidth="max-w-md"
        disableBackdropClose
      >
        {error ? (
          <div className="mb-3 rounded-2xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <input
          type="password"
          value={unlockPwd}
          onChange={(e) => setUnlockPwd(e.target.value)}
          placeholder="Password..."
          className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white outline-none"
        />

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => {
              setUnlockOpen(false);
              setUnlockPwd("");
              setError("");
            }}
            className="flex-1 px-4 py-3 rounded-2xl bg-white/10 border border-white/10 hover:bg-white/15"
          >
            Cancel
          </button>

          <button type="button" onClick={unlockRemarks} className="flex-1 px-4 py-3 rounded-2xl bg-white text-black font-semibold">
            Unlock
          </button>
        </div>
      </LayerModal>

      {/* Confirm */}
      <LayerModal
        open={confirmOpen}
        layerName="Confirm"
        title="Confirm Customer"
        sub="Review → Submit"
        onClose={() => setConfirmOpen(false)}
        maxWidth="max-w-3xl"
        disableBackdropClose
      >
        {error ? (
          <div className="mb-3 rounded-2xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <div className="rounded-3xl border border-white/10 bg-black/30 p-5 space-y-2">
          <Line k="Name" v={form.name} />
          <Line k="Age" v={form.age} />
          <Line k="Gender" v={form.gender} />
          <Line k="Occupation" v={form.occupation || "-"} />
          <Line k="Address" v={computedAddress || "-"} />
          <Line k="Maritial Status" v={form.maritalStatus || "-"} />
          <Line k="Approver" v={form.approver || "-"} />

          {/* ✅ NEW review lines from HTML */}
          <Line k="Diksha Year" v={form.dikshaYear || "-"} />
          <Line k="Vrindavan Visits" v={form.vrindavanVisits || "-"} />
          <Line k="First Diksha Year" v={form.firstDikshaYear || "-"} />

          <Line k="Family Permission" v={form.familyPermissionRelation ? form.familyPermissionRelation : "NO"} />
          {form.familyPermissionRelation === "other" ? <Line k="Family Other" v={form.familyPermissionOther || "-"} /> : null}
          <Line k="Onion/Garlic" v={form.onionGarlic ? "YES" : "NO"} />
          <Line k="Has Pet" v={form.hasPet ? "YES" : "NO"} />
          <Line k="Teacher Before" v={form.hadTeacherBefore ? "YES" : "NO"} />
          <Line k="Nasha" v={form.nasha ? "YES" : "NO"} />

          <Line k="Remarks" v={form.remarks || "-"} />
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setConfirmOpen(false)}
            className="flex-1 px-4 py-3 rounded-2xl bg-white/10 border border-white/10 hover:bg-white/15"
          >
            Edit
          </button>

          <button type="button" onClick={submitManualFinal} className="flex-1 px-4 py-3 rounded-2xl bg-white text-black font-semibold">
            Submit (Commit required)
          </button>
        </div>
      </LayerModal>

      {/* Done */}
      <LayerModal
        open={doneOpen}
        layerName="Done"
        title="Customer Added"
        sub="Saved in Recent (Today DB)"
        onClose={() => {
          setDoneOpen(false);
          resetAll();
        }}
        maxWidth="max-w-2xl"
        disableBackdropClose
      >
        <div className="rounded-3xl border border-white/10 bg-black/30 p-6 text-center">
          <div className="text-2xl font-bold">Done</div>
          <div className="text-white/60 text-sm mt-2">Customer created successfully.</div>

          <div className="mt-4 rounded-2xl bg-white/5 border border-white/10 p-4">
            <div className="text-xs text-white/60">Roll No</div>
            <div className="text-3xl font-extrabold tracking-wide">{doneInfo.rollNo || "—"}</div>
          </div>

          <button
            type="button"
            onClick={() => {
              setDoneOpen(false);
              resetAll();
            }}
            className="mt-5 px-5 py-3 rounded-2xl bg-white text-black font-semibold"
          >
            Close
          </button>
        </div>
      </LayerModal>

      {CommitModal}
    </div>
  );
}

function Line({ k, v }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="text-white/60 text-sm">{k}</div>
      <div className="text-white text-sm text-right break-words max-w-[60%]">{String(v ?? "").trim() || "-"}</div>
    </div>
  );
}

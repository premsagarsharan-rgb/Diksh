// components/dashboard/AddCustomer.js
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import LayerModal from "@/components/LayerModal";
import { useCommitGate } from "@/components/CommitGate";
import { useTheme } from "@/components/ThemeProvider";

/* ═══════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════ */

const DRAFT_KEY_V2 = "sysbyte_addcustomer_draft_v2";
const DRAFT_KEY_V1 = "sysbyte_addcustomer_draft_v1";
const LAST_ADDED_KEY = "sysbyte_last_added_customer";

const FAMILY_OPTIONS = ["mother", "father", "mother&father", "husband", "husbend", "wife", "other"];

const APPROVERS = [
  "Albeli baba", "sundari baba", "sahachari baba", "pyari sharan babab",
  "garbeli baba", "mahaMadhuri baba", "navalNagri baba",
  "permRasdaini baba", "navalKishori baba",
];

const MARITAL = ["marrid", "unmarrid", "divorce", "wido", "virakt", "sepreted"];

const OCCUPATION_SUGGESTIONS = [
  "Business", "Private Job", "Government Job", "House Wife", "ShopKeeper",
  "Freelancer", "Student", "Teacher", "Doctor", "Engineer", "Farmer",
  "Retired", "Self Employed", "Daily Wage", "Driver", "Lawyer",
  "Accountant", "Nurse", "Electrician", "Plumber", "Tailor",
  "Mechanic", "Painter", "Carpenter", "Chef", "Security Guard",
  "Clerk", "Manager", "Director", "Consultant", "Architect",
  "Pharmacist", "Journalist", "Photographer", "Designer",
  "Software Developer", "Data Entry", "Bank Employee",
  "Police", "Army", "Navy", "Air Force", "Priest", "Pandit",
  "Sadhu", "Sevadaar", "NGO Worker", "Social Worker",
  "Real Estate", "Insurance Agent", "CA", "CS", "MBA",
  "Contractor", "Transporter", "Wholesaler", "Retailer",
  "Import Export", "Factory Worker", "Labour", "Unemployed", "Other",
];

const INDIA_STATES_FALLBACK = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa",
  "Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala",
  "Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland",
  "Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura",
  "Uttar Pradesh","Uttarakhand","West Bengal","Delhi","Jammu and Kashmir",
  "Ladakh","Puducherry","Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu","Andaman and Nicobar Islands","Lakshadweep",
];

const STATES_BACKUP = {
  "United States": ["Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming"],
  Canada: ["Alberta","British Columbia","Manitoba","New Brunswick","Newfoundland and Labrador","Northwest Territories","Nova Scotia","Nunavut","Ontario","Prince Edward Island","Quebec","Saskatchewan","Yukon"],
  Australia: ["Australian Capital Territory","New South Wales","Northern Territory","Queensland","South Australia","Tasmania","Victoria","Western Australia"],
  "United Kingdom": ["England","Scotland","Wales","Northern Ireland"],
};

const COUNTRIES_FALLBACK = [
  "India","United States","United Kingdom","Canada","Australia",
  "Germany","France","Japan","China","Nepal","Bangladesh","Sri Lanka",
].map((n) => ({ name: n, flag: "", code: n }));

/* ═══════════════════════════════════════════════
   THEME COLORS
   ═══════════════════════════════════════════════ */

const AC = {
  dark: {
    page: "#06060f",
    cardBg: "rgba(255,255,255,0.04)",
    cardBorder: "rgba(255,255,255,0.06)",
    cardHoverBg: "rgba(255,255,255,0.07)",
    inputBg: "rgba(255,255,255,0.05)",
    inputBorder: "rgba(255,255,255,0.08)",
    inputBorderFocus: "rgba(99,102,241,0.50)",
    inputText: "#ffffff",
    inputPlaceholder: "rgba(255,255,255,0.30)",
    inputFocusRing: "rgba(99,102,241,0.25)",
    inputDisabledBg: "rgba(255,255,255,0.02)",
    inputDisabledText: "rgba(255,255,255,0.30)",
    t1: "#ffffff",
    t2: "rgba(255,255,255,0.62)",
    t3: "rgba(255,255,255,0.38)",
    labelColor: "rgba(255,255,255,0.55)",
    requiredStar: "#f87171",
    sectionLabel: "rgba(255,255,255,0.40)",
    sectionLine: "rgba(255,255,255,0.06)",
    toggleOff: "rgba(255,255,255,0.06)",
    toggleOffBorder: "rgba(255,255,255,0.08)",
    toggleOffText: "rgba(255,255,255,0.70)",
    toggleOffSub: "rgba(255,255,255,0.35)",
    toggleOn: "rgba(99,102,241,0.18)",
    toggleOnBorder: "rgba(99,102,241,0.40)",
    toggleOnText: "#ffffff",
    toggleOnSub: "rgba(99,102,241,0.80)",
    toggleDot: "#818cf8",
    toggleDotOff: "rgba(255,255,255,0.20)",
    errorBg: "rgba(239,68,68,0.08)",
    errorBorder: "rgba(239,68,68,0.18)",
    errorText: "#fca5a5",
    errorInline: "#f87171",
    btnGhostBg: "rgba(255,255,255,0.06)",
    btnGhostBorder: "rgba(255,255,255,0.08)",
    btnGhostHover: "rgba(255,255,255,0.10)",
    btnGhostText: "#ffffff",
    btnSolidBg: "#ffffff",
    btnSolidText: "#000000",
    btnSolidDisabled: "rgba(255,255,255,0.30)",
    reviewBg: "rgba(255,255,255,0.03)",
    reviewBorder: "rgba(255,255,255,0.06)",
    reviewRowAlt: "rgba(255,255,255,0.02)",
    reviewKey: "rgba(255,255,255,0.50)",
    reviewVal: "#ffffff",
    doneBg: "rgba(255,255,255,0.03)",
    doneAccent: "#818cf8",
    hintColor: "rgba(255,255,255,0.35)",
    subId: "rgba(255,255,255,0.30)",
    loadingDot: "#818cf8",
    acc: "#818cf8",
    accG: "linear-gradient(135deg,#6366f1,#818cf8)",
    headerShadow: "0 0 40px rgba(99,102,241,0.08)",
    emptyIconBg: "rgba(99,102,241,0.12)",
    emptyIconGlow: "rgba(99,102,241,0.06)",
    draftBadgeBg: "rgba(251,191,36,0.12)",
    draftBadgeText: "#fbbf24",
    lastAddedBg: "rgba(34,197,94,0.08)",
    lastAddedBorder: "rgba(34,197,94,0.15)",
    lastAddedText: "rgba(34,197,94,0.80)",
    lastAddedName: "#4ade80",
    dropBg: "rgba(6,6,15,0.95)",
    dropBorder: "rgba(255,255,255,0.08)",
    dropItemText: "rgba(255,255,255,0.85)",
    dropItemHover: "rgba(255,255,255,0.06)",
  },
  light: {
    page: "#f4f4f8",
    cardBg: "rgba(255,255,255,0.70)",
    cardBorder: "rgba(0,0,0,0.06)",
    cardHoverBg: "rgba(255,255,255,0.88)",
    inputBg: "rgba(0,0,0,0.03)",
    inputBorder: "rgba(0,0,0,0.08)",
    inputBorderFocus: "rgba(161,98,7,0.45)",
    inputText: "#0f172a",
    inputPlaceholder: "rgba(15,23,42,0.30)",
    inputFocusRing: "rgba(161,98,7,0.18)",
    inputDisabledBg: "rgba(0,0,0,0.02)",
    inputDisabledText: "rgba(15,23,42,0.30)",
    t1: "#0f172a",
    t2: "rgba(15,23,42,0.58)",
    t3: "rgba(15,23,42,0.32)",
    labelColor: "rgba(15,23,42,0.55)",
    requiredStar: "#dc2626",
    sectionLabel: "rgba(15,23,42,0.40)",
    sectionLine: "rgba(0,0,0,0.06)",
    toggleOff: "rgba(0,0,0,0.03)",
    toggleOffBorder: "rgba(0,0,0,0.08)",
    toggleOffText: "rgba(15,23,42,0.70)",
    toggleOffSub: "rgba(15,23,42,0.35)",
    toggleOn: "rgba(161,98,7,0.10)",
    toggleOnBorder: "rgba(161,98,7,0.30)",
    toggleOnText: "#0f172a",
    toggleOnSub: "rgba(161,98,7,0.80)",
    toggleDot: "#a16207",
    toggleDotOff: "rgba(0,0,0,0.15)",
    errorBg: "rgba(220,38,38,0.05)",
    errorBorder: "rgba(220,38,38,0.12)",
    errorText: "#dc2626",
    errorInline: "#dc2626",
    btnGhostBg: "rgba(0,0,0,0.03)",
    btnGhostBorder: "rgba(0,0,0,0.08)",
    btnGhostHover: "rgba(0,0,0,0.06)",
    btnGhostText: "#0f172a",
    btnSolidBg: "#0f172a",
    btnSolidText: "#ffffff",
    btnSolidDisabled: "rgba(15,23,42,0.30)",
    reviewBg: "rgba(0,0,0,0.02)",
    reviewBorder: "rgba(0,0,0,0.06)",
    reviewRowAlt: "rgba(0,0,0,0.02)",
    reviewKey: "rgba(15,23,42,0.50)",
    reviewVal: "#0f172a",
    doneBg: "rgba(0,0,0,0.02)",
    doneAccent: "#a16207",
    hintColor: "rgba(15,23,42,0.35)",
    subId: "rgba(15,23,42,0.25)",
    loadingDot: "#a16207",
    acc: "#a16207",
    accG: "linear-gradient(135deg,#a16207,#ca8a04)",
    headerShadow: "0 0 40px rgba(161,98,7,0.06)",
    emptyIconBg: "rgba(161,98,7,0.09)",
    emptyIconGlow: "rgba(161,98,7,0.04)",
    draftBadgeBg: "rgba(161,98,7,0.10)",
    draftBadgeText: "#92400e",
    lastAddedBg: "rgba(22,163,74,0.06)",
    lastAddedBorder: "rgba(22,163,74,0.12)",
    lastAddedText: "rgba(22,163,74,0.75)",
    lastAddedName: "#15803d",
    dropBg: "rgba(255,255,255,0.98)",
    dropBorder: "rgba(0,0,0,0.08)",
    dropItemText: "rgba(15,23,42,0.80)",
    dropItemHover: "rgba(0,0,0,0.04)",
  },
};

/* ═══════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════ */

function makeSubmissionId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
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

function hasMeaningfulDraft(form) {
  if (!form) return false;
  return Boolean(
    String(form.name || "").trim() || String(form.age || "").trim() ||
    String(form.gender || "").trim() || String(form.country || "").trim() ||
    String(form.state || "").trim() || String(form.stateOther || "").trim() ||
    String(form.city || "").trim() || String(form.cityOther || "").trim() ||
    String(form.occupation || "").trim() ||
    String(form.approver || "").trim() || String(form.maritalStatus || "").trim() ||
    String(form.familyPermissionRelation || "").trim() ||
    String(form.familyPermissionOther || "").trim() ||
    String(form.remarks || "").trim() || String(form.dikshaYear || "").trim() ||
    String(form.vrindavanVisits || "").trim() || String(form.firstDikshaYear || "").trim() ||
    form.onionGarlic || form.hasPet || form.hadTeacherBefore || form.nasha
  );
}

function timeAgo(dateStr) {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  } catch {
    return "";
  }
}

function loadLastAdded() {
  try {
    const raw = localStorage.getItem(LAST_ADDED_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function saveLastAdded(name, rollNo) {
  try {
    localStorage.setItem(LAST_ADDED_KEY, JSON.stringify({
      name, rollNo, time: new Date().toISOString(),
    }));
  } catch {}
}

/* ═══════════════════════════════════════════════
   CACHE
   ═══════════════════════════════════════════════ */

const _cache = { countries: null, states: {}, cities: {} };

async function loadCountries() {
  if (_cache.countries) return _cache.countries;
  try {
    const stored = sessionStorage.getItem("sb_countries");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 10) {
        _cache.countries = parsed;
        return parsed;
      }
    }
  } catch {}
  try {
    const res = await fetch("https://restcountries.com/v3.1/all");
    const data = await res.json().catch(() => []);
    const list = (data || [])
      .map((c) => ({ name: c?.name?.common, flag: c?.flag || "", code: c?.cca2 || c?.name?.common }))
      .filter((x) => x.name)
      .sort((a, b) => String(a.name).localeCompare(String(b.name)));
    if (list.length) {
      _cache.countries = list;
      try { sessionStorage.setItem("sb_countries", JSON.stringify(list)); } catch {}
      return list;
    }
  } catch {}
  _cache.countries = COUNTRIES_FALLBACK;
  return COUNTRIES_FALLBACK;
}

async function loadStates(country) {
  if (!country) return [];
  const ck = country.toLowerCase();
  if (_cache.states[ck]) return _cache.states[ck];
  if (country === "India") {
    try {
      const res = await fetch("https://countriesnow.space/api/v0.1/countries/states", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country: "India" }),
      });
      const data = await res.json().catch(() => ({}));
      const states = uniqStrings((data?.data?.states || []).map((s) => s.name).filter(Boolean));
      if (states.length) { _cache.states[ck] = states; return states; }
    } catch {}
    _cache.states[ck] = INDIA_STATES_FALLBACK;
    return INDIA_STATES_FALLBACK;
  }
  try {
    const res = await fetch("https://countriesnow.space/api/v0.1/countries/states", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country }),
    });
    const data = await res.json().catch(() => ({}));
    const states = uniqStrings((data?.data?.states || []).map((s) => s?.name).filter(Boolean));
    if (states.length) { _cache.states[ck] = states; return states; }
  } catch {}
  const fb = STATES_BACKUP[country] || [];
  if (fb.length) _cache.states[ck] = fb;
  return fb;
}

async function loadCities(country, state) {
  if (!country || !state || state === "__OTHER__") return [];
  const ck = `${country}__${state}`.toLowerCase();
  if (_cache.cities[ck]) return _cache.cities[ck];
  try {
    const res = await fetch("https://countriesnow.space/api/v0.1/countries/state/cities", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country, state }),
    });
    const data = await res.json().catch(() => ({}));
    const cities = uniqStrings(data?.data || []).sort((a, b) => a.localeCompare(b));
    if (cities.length) { _cache.cities[ck] = cities; return cities; }
  } catch {}
  return [];
}

/* ═══════════════════════════════════════════════
   DEBOUNCE HOOK
   ═══════════════════════════════════════════════ */

function useDebouncedEffect(fn, deps, delay = 500) {
  const timer = useRef(null);
  useEffect(() => {
    timer.current = setTimeout(fn, delay);
    return () => clearTimeout(timer.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/* ═══════════════════════════════════════════════
   THEMED SUB-COMPONENTS
   ═══════════════════════════════════════════════ */

function SectionHeader({ icon, label, c }) {
  return (
    <div className="sm:col-span-2 flex items-center gap-3 mt-5 mb-1">
      <span className="text-lg">{icon}</span>
      <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: c.sectionLabel }}>
        {label}
      </span>
      <div className="flex-1 h-px" style={{ background: c.sectionLine }} />
    </div>
  );
}

function Field({ label, value, onChange, required, placeholder, type = "text", error, c, disabled, hint }) {
  return (
    <div>
      <div className="text-[11px] font-semibold mb-1.5 flex items-center gap-1" style={{ color: c.labelColor }}>
        {label}
        {required && <span style={{ color: c.requiredStar }}>*</span>}
      </div>
      <input
        value={value}
        type={type}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full rounded-2xl border px-4 py-3 text-[13px] outline-none transition-all duration-200"
        style={{
          background: disabled ? c.inputDisabledBg : c.inputBg,
          borderColor: error ? c.errorInline : c.inputBorder,
          color: disabled ? c.inputDisabledText : c.inputText,
        }}
        onFocusCapture={(e) => {
          if (!disabled) {
            e.currentTarget.style.boxShadow = `0 0 0 3px ${c.inputFocusRing}`;
            e.currentTarget.style.borderColor = c.inputBorderFocus;
          }
        }}
        onBlurCapture={(e) => {
          e.currentTarget.style.boxShadow = "none";
          e.currentTarget.style.borderColor = error ? c.errorInline : c.inputBorder;
        }}
      />
      {error && <div className="text-[11px] mt-1 font-medium" style={{ color: c.errorInline }}>{error}</div>}
      {hint && !error && <div className="text-[10px] mt-1" style={{ color: c.hintColor }}>{hint}</div>}
    </div>
  );
}

function Select({ label, value, onChange, options, required, c, disabled, error, children }) {
  return (
    <div>
      <div className="text-[11px] font-semibold mb-1.5 flex items-center gap-1" style={{ color: c.labelColor }}>
        {label}
        {required && <span style={{ color: c.requiredStar }}>*</span>}
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full rounded-2xl border px-4 py-3 text-[13px] outline-none transition-all duration-200 appearance-none"
        style={{
          background: disabled ? c.inputDisabledBg : c.inputBg,
          borderColor: error ? c.errorInline : c.inputBorder,
          color: disabled ? c.inputDisabledText : c.inputText,
        }}
        onFocusCapture={(e) => {
          if (!disabled) e.currentTarget.style.boxShadow = `0 0 0 3px ${c.inputFocusRing}`;
        }}
        onBlurCapture={(e) => { e.currentTarget.style.boxShadow = "none"; }}
      >
        {children || (
          <>
            <option value="">Select...</option>
            {(options || []).map((x, idx) => <option key={`${x}_${idx}`} value={x}>{x}</option>)}
          </>
        )}
      </select>
      {error && <div className="text-[11px] mt-1 font-medium" style={{ color: c.errorInline }}>{error}</div>}
    </div>
  );
}

function OccupationField({ value, onChange, c }) {
  return (
    <div>
      <div className="text-[11px] font-semibold mb-1.5" style={{ color: c.labelColor }}>Occupation</div>
      <SuggestInputInline
        value={value}
        onChange={onChange}
        suggestions={OCCUPATION_SUGGESTIONS}
        placeholder="e.g. Business, Private Job..."
        c={c}
      />
    </div>
  );
}

// Inline SuggestInput (no external import needed for occupation)
function SuggestInputInline({ value, onChange, suggestions, placeholder, c }) {
  const [open, setOpen] = useState(false);
  const filtered = useMemo(() => {
    const v = (value || "").toLowerCase();
    const list = v ? suggestions.filter((s) => String(s).toLowerCase().includes(v)) : suggestions;
    return list.slice(0, 30);
  }, [value, suggestions]);

  return (
    <div className="relative">
      <input
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        placeholder={placeholder}
        className="w-full rounded-2xl border px-4 py-3 text-[13px] outline-none transition-all duration-200"
        style={{ background: c.inputBg, borderColor: c.inputBorder, color: c.inputText }}
        onFocusCapture={(e) => {
          e.currentTarget.style.boxShadow = `0 0 0 3px ${c.inputFocusRing}`;
          e.currentTarget.style.borderColor = c.inputBorderFocus;
        }}
        onBlurCapture={(e) => {
          e.currentTarget.style.boxShadow = "none";
          e.currentTarget.style.borderColor = c.inputBorder;
        }}
      />
      {open && filtered.length > 0 && (
        <div
          className="absolute z-[200] mt-1.5 w-full rounded-2xl border overflow-hidden max-h-52 overflow-y-auto"
          style={{ background: c.dropBg, borderColor: c.dropBorder, backdropFilter: "blur(20px)" }}
        >
          {filtered.map((s) => (
            <button
              key={s} type="button"
              onMouseDown={() => { onChange(String(s)); setOpen(false); }}
              className="w-full text-left px-4 py-2.5 text-[12px] font-medium transition-colors duration-100"
              style={{ color: c.dropItemText }}
              onMouseEnter={(e) => { e.currentTarget.style.background = c.dropItemHover; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Toggle({ label, val, setVal, c }) {
  return (
    <button
      type="button"
      onClick={() => setVal(!val)}
      className="rounded-2xl border px-3.5 py-2.5 text-left transition-all duration-200 w-full"
      style={{
        background: val ? c.toggleOn : c.toggleOff,
        borderColor: val ? c.toggleOnBorder : c.toggleOffBorder,
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[12px] font-semibold" style={{ color: val ? c.toggleOnText : c.toggleOffText }}>
            {label}
          </div>
          <div className="text-[10px] font-bold mt-0.5" style={{ color: val ? c.toggleOnSub : c.toggleOffSub }}>
            {val ? "YES" : "NO"}
          </div>
        </div>
        <div
          className="w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200"
          style={{ background: val ? c.toggleDot : c.toggleDotOff }}
        >
          {val && (
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
              <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>
      </div>
    </button>
  );
}

function ErrorBanner({ message, c }) {
  if (!message) return null;
  return (
    <div
      className="mb-4 rounded-2xl border px-4 py-3 text-[13px] font-medium flex items-center gap-2"
      style={{ background: c.errorBg, borderColor: c.errorBorder, color: c.errorText }}
    >
      <span>⚠️</span> {message}
    </div>
  );
}

function LoadingSpinner({ c, size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className="animate-spin" style={{ color: c.loadingDot }}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.2" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function ReviewLine({ k, v, c, alt }) {
  return (
    <div
      className="flex items-start justify-between gap-3 px-4 py-2.5 rounded-xl"
      style={{ background: alt ? c.reviewRowAlt : "transparent" }}
    >
      <div className="text-[12px] font-medium" style={{ color: c.reviewKey }}>{k}</div>
      <div className="text-[12px] font-semibold text-right break-words max-w-[60%]" style={{ color: c.reviewVal }}>
        {String(v ?? "").trim() || "—"}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   EMPTY STATE / ENTRY POINT
   ═══════════════════════════════════════════════ */

function EntryCard({ onStart, onResume, hasDraft, lastAdded, c }) {
  return (
    <div className="flex flex-col items-center justify-center py-6 max-md:py-4">
      {/* Main card */}
      <div
        className="w-full max-w-md rounded-3xl border p-8 max-md:p-5 text-center transition-all duration-200"
        style={{
          background: c.cardBg,
          borderColor: c.cardBorder,
          boxShadow: c.headerShadow,
        }}
      >
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="relative">
            <div
              className="w-16 h-16 max-md:w-14 max-md:h-14 rounded-2xl flex items-center justify-center text-3xl max-md:text-2xl"
              style={{ background: c.emptyIconBg }}
            >
              ➕
            </div>
            <div
              className="absolute -inset-2 rounded-3xl -z-10"
              style={{ background: c.emptyIconGlow }}
            />
          </div>
        </div>

        <h3 className="text-lg max-md:text-base font-bold" style={{ color: c.t1 }}>
          Add Customer
        </h3>
        <p className="text-[13px] max-md:text-[12px] mt-1" style={{ color: c.t3 }}>
          Manual entry → Saved in Recent (Today DB)
        </p>

        {/* Draft badge */}
        {hasDraft && (
          <div
            className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full text-[11px] font-bold"
            style={{ background: c.draftBadgeBg, color: c.draftBadgeText }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: c.draftBadgeText }} />
            Unsaved draft found
          </div>
        )}

        {/* Buttons */}
        <div className="mt-5 flex flex-col gap-2">
          {hasDraft ? (
            <>
              <button
                type="button"
                onClick={onResume}
                className="w-full py-3 rounded-2xl text-[13px] font-bold text-white transition-all duration-200"
                style={{ background: c.accG, boxShadow: c.headerShadow }}
              >
                Resume Draft →
              </button>
              <button
                type="button"
                onClick={onStart}
                className="w-full py-3 rounded-2xl text-[13px] font-semibold border transition-all duration-200"
                style={{ background: c.btnGhostBg, borderColor: c.btnGhostBorder, color: c.btnGhostText }}
              >
                Start Fresh
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onStart}
              className="w-full py-3.5 rounded-2xl text-[13px] font-bold text-white transition-all duration-200"
              style={{ background: c.accG, boxShadow: c.headerShadow }}
            >
              + Start Adding
            </button>
          )}
        </div>
      </div>

      {/* Last added strip */}
      {lastAdded && (
        <div
          className="mt-4 w-full max-w-md rounded-2xl border px-4 py-3 flex items-center gap-3"
          style={{ background: c.lastAddedBg, borderColor: c.lastAddedBorder }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
            style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e" }}
          >
            ✓
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-bold truncate" style={{ color: c.lastAddedName }}>
              {lastAdded.name}
            </div>
            <div className="text-[10px]" style={{ color: c.lastAddedText }}>
              Roll #{lastAdded.rollNo || "—"} • {timeAgo(lastAdded.time)}
            </div>
          </div>
          <div className="text-[10px] font-semibold" style={{ color: c.lastAddedText }}>
            Last Added
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */

export default function AddCustomer({ session }) {
  const username = session?.username || "UNKNOWN";
  const themeApi = useTheme();
  const isLight = themeApi?.theme === "light";
  const c = isLight ? AC.light : AC.dark;

  const [manualOpen, setManualOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [doneOpen, setDoneOpen] = useState(false);
  const [unlockOpen, setUnlockOpen] = useState(false);

  const [submissionId, setSubmissionId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [apiError, setApiError] = useState("");
  const [unlockError, setUnlockError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const [doneInfo, setDoneInfo] = useState({ rollNo: null });
  const [lastAdded, setLastAdded] = useState(null);
  const [hasDraft, setHasDraft] = useState(false);

  const [countries, setCountries] = useState([]);
  const [countriesLoading, setCountriesLoading] = useState(false);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [stateLoading, setStateLoading] = useState(false);
  const [cityLoading, setCityLoading] = useState(false);

  const [remarksUnlocked, setRemarksUnlocked] = useState(false);
  const [unlockPwd, setUnlockPwd] = useState("");

  const [form, setForm] = useState({
    name: "", age: "", gender: "OTHER", occupation: "",
    approver: "", maritalStatus: "",
    country: "India", state: "", stateOther: "", city: "", cityOther: "",
    dikshaYear: "", vrindavanVisits: "", firstDikshaYear: "",
    familyPermissionRelation: "", familyPermissionOther: "",
    onionGarlic: false, hasPet: false, hadTeacherBefore: false, nasha: false,
    remarks: username,
  });

  const upd = useCallback((key, val) => {
    setForm((p) => ({ ...p, [key]: val }));
    setFieldErrors((p) => ({ ...p, [key]: "" }));
  }, []);

  const computedAddress = useMemo(() => {
    const co = String(form.country || "India").trim();
    const s = form.state === "__OTHER__" ? String(form.stateOther || "").trim() : String(form.state || "").trim();
    const ci = form.city === "__OTHER__" ? String(form.cityOther || "").trim() : String(form.city || "").trim();
    return [ci, s, co].filter(Boolean).join(", ");
  }, [form.country, form.state, form.stateOther, form.city, form.cityOther]);

  /* ─── Load last added + draft check ─── */
  useEffect(() => {
    setLastAdded(loadLastAdded());
  }, []);

  /* ─── Draft: Load ─── */
  useEffect(() => {
    try {
      const raw2 = localStorage.getItem(DRAFT_KEY_V2);
      const raw1 = localStorage.getItem(DRAFT_KEY_V1);
      const raw = raw2 || raw1;
      if (!raw) { setHasDraft(false); return; }
      const d = JSON.parse(raw);
      if (d?.form && typeof d.form === "object" && hasMeaningfulDraft(d.form)) {
        setForm((prev) => ({
          ...prev, ...d.form,
          country: d.form.country || prev.country || "India",
          remarks: d.form.remarks || prev.remarks || username,
        }));
        if (d?.submissionId) setSubmissionId(String(d.submissionId));
        setHasDraft(true);
      }
      if (raw1) { try { localStorage.removeItem(DRAFT_KEY_V1); } catch {} }
    } catch { setHasDraft(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ─── Draft: Save (debounced) ─── */
  useDebouncedEffect(() => {
    try {
      if (!submissionId && !hasMeaningfulDraft(form)) {
        localStorage.removeItem(DRAFT_KEY_V2);
        return;
      }
      localStorage.setItem(DRAFT_KEY_V2, JSON.stringify({
        submissionId: submissionId || null, form,
        updatedAt: new Date().toISOString(),
      }));
    } catch {}
  }, [form, submissionId], 500);

  /* ─── Countries ─── */
  useEffect(() => {
    let alive = true;
    (async () => {
      setCountriesLoading(true);
      try {
        const list = await loadCountries();
        if (alive) setCountries(list);
      } catch {
        if (alive) setCountries(COUNTRIES_FALLBACK);
      } finally {
        if (alive) setCountriesLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  /* ─── States ─── */
  useEffect(() => {
    let alive = true;
    (async () => {
      const country = String(form.country || "").trim();
      if (!country) { setStates([]); return; }
      setStateLoading(true);
      try {
        const st = await loadStates(country);
        if (alive) setStates(uniqStrings(st));
      } finally { if (alive) setStateLoading(false); }
    })();
    return () => { alive = false; };
  }, [form.country]);

  useEffect(() => {
    if (!form.state || form.state === "__OTHER__" || !states.length) return;
    if (states.includes(form.state)) return;
    setForm((p) => ({
      ...p, state: "__OTHER__", stateOther: p.stateOther || p.state,
      city: "__OTHER__", cityOther: p.cityOther || p.city || "",
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [states]);

  /* ─── Cities ─── */
  useEffect(() => {
    let alive = true;
    (async () => {
      const country = String(form.country || "").trim();
      const state = String(form.state || "").trim();
      if (!country || !state || state === "__OTHER__") { setCities([]); return; }
      setCityLoading(true);
      try {
        const list = await loadCities(country, state);
        if (alive) setCities(uniqStrings(list));
      } finally { if (alive) setCityLoading(false); }
    })();
    return () => { alive = false; };
  }, [form.country, form.state]);

  useEffect(() => {
    if (!form.city || form.city === "__OTHER__" || !cities.length) return;
    if (cities.includes(form.city)) return;
    setForm((p) => ({ ...p, city: "__OTHER__", cityOther: p.cityOther || p.city }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cities]);

  /* ─── CommitGate ─── */
  const { requestCommit, CommitModal } = useCommitGate({
    defaultSuggestions: ["Created profile (manual)", "New customer entry", "Customer submitted basic details"],
  });

  /* ─── Validation ─── */
  function validate() {
    const errs = {};
    const name = String(form.name || "").trim();
    const age = String(form.age || "").trim();
    const country = String(form.country || "").trim();
    const state = form.state === "__OTHER__" ? String(form.stateOther || "").trim() : String(form.state || "").trim();
    const city = form.city === "__OTHER__" ? String(form.cityOther || "").trim() : String(form.city || "").trim();

    if (!name) errs.name = "Name required";
    else if (name.length < 2) errs.name = "Min 2 characters";
    if (!age) errs.age = "Age required";
    else { const n = parseInt(age, 10); if (isNaN(n) || n < 1 || n > 150) errs.age = "Age must be 1-150"; }
    if (!country) errs.country = "Country required";
    if (!state) errs.state = "State required";
    if (!city) errs.city = "City required";

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  const canGoConfirm = useMemo(() => {
    const nameOk = String(form.name || "").trim().length >= 2;
    const ageStr = String(form.age || "").trim();
    const ageNum = parseInt(ageStr, 10);
    const ageOk = ageStr && !isNaN(ageNum) && ageNum >= 1 && ageNum <= 150;
    const countryOk = String(form.country || "").trim();
    const stateOk = form.state === "__OTHER__" ? String(form.stateOther || "").trim() : String(form.state || "").trim();
    const cityOk = form.city === "__OTHER__" ? String(form.cityOther || "").trim() : String(form.city || "").trim();
    return Boolean(nameOk && ageOk && countryOk && stateOk && cityOk);
  }, [form]);

  /* ─── Reset ─── */
  function resetAll() {
    setApiError(""); setFieldErrors({}); setDoneInfo({ rollNo: null });
    setSubmissionId(""); setSubmitting(false); setHasDraft(false);
    setRemarksUnlocked(false); setUnlockOpen(false); setUnlockPwd(""); setUnlockError("");
    setForm({
      name: "", age: "", gender: "OTHER", occupation: "",
      approver: "", maritalStatus: "",
      country: "India", state: "", stateOther: "", city: "", cityOther: "",
      dikshaYear: "", vrindavanVisits: "", firstDikshaYear: "",
      familyPermissionRelation: "", familyPermissionOther: "",
      onionGarlic: false, hasPet: false, hadTeacherBefore: false, nasha: false,
      remarks: username,
    });
    try { localStorage.removeItem(DRAFT_KEY_V2); } catch {}
  }

  /* ─── Open form ─── */
  function openFresh() {
    resetAll();
    const sid = makeSubmissionId();
    setSubmissionId(sid);
    setForm((p) => ({ ...p, remarks: p.remarks || username }));
    setManualOpen(true);
  }

  function openResumeDraft() {
    if (!submissionId) setSubmissionId(makeSubmissionId());
    setForm((p) => ({ ...p, remarks: p.remarks || username }));
    setApiError(""); setFieldErrors({});
    setManualOpen(true);
  }

  /* ─── Unlock Remarks ─── */
  async function unlockRemarks() {
    setUnlockError("");
    const pwd = String(unlockPwd || "");
    if (!pwd) return setUnlockError("Enter password");
    const res = await fetch("/api/auth/verify-password", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pwd }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setUnlockError(data.error || "Wrong password");
    setRemarksUnlocked(true); setUnlockOpen(false); setUnlockPwd("");
  }

  /* ─── Submit ─── */
  async function submitFinal() {
    setApiError("");
    if (submitting) return;
    if (!validate()) return;

    const commitMessage = await requestCommit({
      title: "Submit Customer",
      subtitle: "Customer will be created in Recent (Today DB).",
      preset: "Created profile (manual)",
    }).catch(() => null);
    if (!commitMessage) return;

    const stateFinal = form.state === "__OTHER__" ? String(form.stateOther || "").trim() : String(form.state || "").trim();
    const cityFinal = form.city === "__OTHER__" ? String(form.cityOther || "").trim() : String(form.city || "").trim();

    setSubmitting(true);
    try {
      const res = await fetch("/api/customers/today", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId, commitMessage,
          name: form.name, age: form.age, gender: form.gender,
          country: form.country, state: stateFinal, city: cityFinal,
          address: computedAddress,
          occupation: form.occupation,
          approver: form.approver, maritalStatus: form.maritalStatus,
          dikshaYear: form.dikshaYear, vrindavanVisits: form.vrindavanVisits,
          firstDikshaYear: form.firstDikshaYear,
          familyPermission: Boolean(form.familyPermissionRelation),
          familyPermissionRelation: form.familyPermissionRelation,
          familyPermissionOther: form.familyPermissionRelation === "other" ? form.familyPermissionOther : "",
          remarks: form.remarks || username, remarksBy: username,
          onionGarlic: form.onionGarlic, hasPet: form.hasPet,
          hadTeacherBefore: form.hadTeacherBefore, nasha: form.nasha,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setSubmitting(false); setApiError(data.error || "Submit failed"); return; }

      // Save last added
      saveLastAdded(form.name, data.rollNo);
      setLastAdded({ name: form.name, rollNo: data.rollNo, time: new Date().toISOString() });

      setDoneInfo({ rollNo: data.rollNo || null });
      setConfirmOpen(false); setManualOpen(false); setDoneOpen(true); setSubmitting(false);
    } catch {
      setSubmitting(false);
      setApiError("Network error — check internet");
    }
  }

  /* ═══════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════ */

  return (
    <div>
      {/* ─── Entry Point (replaces ugly header) ─── */}
      {!manualOpen && !doneOpen && (
        <EntryCard
          onStart={openFresh}
          onResume={openResumeDraft}
          hasDraft={hasDraft}
          lastAdded={lastAdded}
          c={c}
        />
      )}

      {/* ═══ FORM MODAL ═══ */}
      <LayerModal
        open={manualOpen}
        layerName="Manual Form"
        title="Manual Entry"
        sub="Fill details → Confirm"
        onClose={() => setManualOpen(false)}
        maxWidth="max-w-5xl"
        disableBackdropClose
      >
        <div className="text-[10px] font-mono mb-3" style={{ color: c.subId }}>
          ID: {submissionId || "—"}
        </div>

        <ErrorBanner message={apiError} c={c} />

        <div className="grid sm:grid-cols-2 gap-3">

          <SectionHeader icon="👤" label="Personal Information" c={c} />

          <Field label="Name" required value={form.name} onChange={(v) => upd("name", v)}
            error={fieldErrors.name} c={c} placeholder="Full name..." />

          <Field label="Age" required value={form.age} onChange={(v) => upd("age", v)}
            error={fieldErrors.age} c={c} placeholder="e.g. 28" type="number" />

          <Select label="Gender" value={form.gender} onChange={(v) => upd("gender", v)} c={c}>
            <option value="MALE">MALE</option>
            <option value="FEMALE">FEMALE</option>
            <option value="OTHER">OTHER</option>
          </Select>

          <OccupationField value={form.occupation} onChange={(v) => upd("occupation", v)} c={c} />

          <Select label="Marital Status" value={form.maritalStatus}
            onChange={(v) => upd("maritalStatus", v)} options={MARITAL} c={c} />

          <Select label="Approver" value={form.approver}
            onChange={(v) => upd("approver", v)} options={APPROVERS} c={c} />

          {/* ── Address ── */}
          <SectionHeader icon="📍" label="Address" c={c} />

          <Select label="Country" required value={form.country}
            error={fieldErrors.country} c={c}
            onChange={(v) => {
              setForm((p) => ({ ...p, country: v, state: "", stateOther: "", city: "", cityOther: "" }));
              setFieldErrors((p) => ({ ...p, country: "" }));
            }}
            disabled={countriesLoading}
          >
            {countriesLoading ? (
              <option value="">Loading countries...</option>
            ) : (
              <>
                <option value="">Select Country...</option>
                <option value="India">🇮🇳 India (Default)</option>
                <option disabled>──────────────</option>
                {countries.filter((x) => x.name !== "India").map((co) => (
                  <option key={co.code} value={co.name}>
                    {co.flag ? `${co.flag} ` : ""}{co.name}
                  </option>
                ))}
              </>
            )}
          </Select>

          <div>
            <Select label="State" required value={form.state}
              error={fieldErrors.state} c={c}
              disabled={!form.country || stateLoading}
              onChange={(v) => {
                if (v === "__OTHER__") {
                  setForm((p) => ({ ...p, state: "__OTHER__", stateOther: p.stateOther || "", city: "__OTHER__", cityOther: "" }));
                } else {
                  setForm((p) => ({ ...p, state: v, stateOther: "", city: "", cityOther: "" }));
                }
                setFieldErrors((p) => ({ ...p, state: "" }));
              }}
            >
              <option value="">
                {!form.country ? "Select country first..." : stateLoading ? "Loading states..." : "Select..."}
              </option>
              {states.map((s, i) => <option key={`${s}_${i}`} value={s}>{s}</option>)}
              <option value="__OTHER__">Enter State Manually</option>
            </Select>
            {stateLoading && (
              <div className="flex items-center gap-2 mt-1.5">
                <LoadingSpinner c={c} size={14} />
                <span className="text-[10px]" style={{ color: c.hintColor }}>Loading states...</span>
              </div>
            )}
            {form.state === "__OTHER__" && (
              <input value={form.stateOther}
                onChange={(e) => { upd("stateOther", e.target.value); setFieldErrors((p) => ({ ...p, state: "" })); }}
                placeholder="Type state name..."
                className="mt-2 w-full rounded-2xl border px-4 py-3 text-[13px] outline-none transition-all duration-200"
                style={{ background: c.inputBg, borderColor: c.inputBorder, color: c.inputText }}
              />
            )}
          </div>

          <div>
            <Select label="City" required value={form.city}
              error={fieldErrors.city} c={c}
              disabled={!form.state || form.state === "__OTHER__" || cityLoading}
              onChange={(v) => { upd("city", v); upd("cityOther", ""); }}
            >
              <option value="">
                {!form.state ? "Select..." : form.state === "__OTHER__" ? "Manual state" : cityLoading ? "Loading..." : "Select..."}
              </option>
              {cities.map((ci, i) => <option key={`${ci}_${i}`} value={ci}>{ci}</option>)}
              <option value="__OTHER__">Other</option>
            </Select>
            {cityLoading && (
              <div className="flex items-center gap-2 mt-1.5">
                <LoadingSpinner c={c} size={14} />
                <span className="text-[10px]" style={{ color: c.hintColor }}>Loading cities...</span>
              </div>
            )}
            {(form.state === "__OTHER__" || form.city === "__OTHER__") && (
              <input value={form.cityOther}
                onChange={(e) => {
                  setForm((p) => ({ ...p, city: "__OTHER__", cityOther: e.target.value }));
                  setFieldErrors((p) => ({ ...p, city: "" }));
                }}
                placeholder="Type city name..."
                className="mt-2 w-full rounded-2xl border px-4 py-3 text-[13px] outline-none transition-all duration-200"
                style={{ background: c.inputBg, borderColor: c.inputBorder, color: c.inputText }}
              />
            )}
          </div>

          <div className="sm:col-span-2">
            <div className="text-[10px] flex items-center gap-2" style={{ color: c.hintColor }}>
              📫 Computed: <span className="font-semibold" style={{ color: c.t2 }}>{computedAddress || "—"}</span>
            </div>
          </div>

          {/* ── Diksha ── */}
          <SectionHeader icon="🙏" label="Diksha Information" c={c} />

          <Field label="Diksha ke liye kab aaye (Year)" type="number" value={form.dikshaYear}
            onChange={(v) => upd("dikshaYear", v)} c={c} placeholder="e.g. 2020" />

          <Field label="Kitni baar aye Vrindavan" type="number" value={form.vrindavanVisits}
            onChange={(v) => upd("vrindavanVisits", v)} c={c} placeholder="Enter number" />

          <Field label="Pratham upastithi (Year)" type="number" value={form.firstDikshaYear}
            onChange={(v) => upd("firstDikshaYear", v)} c={c} placeholder="e.g. 2021" />

          {/* ── Family ── */}
          <SectionHeader icon="👨‍👩‍👧" label="Family & Permissions" c={c} />

          <div>
            <Select label="Family Permission" value={form.familyPermissionRelation}
              onChange={(v) => {
                setForm((p) => ({
                  ...p, familyPermissionRelation: v,
                  familyPermissionOther: v === "other" ? p.familyPermissionOther : "",
                }));
              }} options={FAMILY_OPTIONS} c={c} />
            {form.familyPermissionRelation === "other" && (
              <input value={form.familyPermissionOther}
                onChange={(e) => upd("familyPermissionOther", e.target.value)}
                placeholder="Other (type here)..."
                className="mt-2 w-full rounded-2xl border px-4 py-3 text-[13px] outline-none transition-all duration-200"
                style={{ background: c.inputBg, borderColor: c.inputBorder, color: c.inputText }}
              />
            )}
          </div>

          <div className="sm:col-span-2 grid sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mt-1">
            <Toggle label="Onion/Garlic?" val={form.onionGarlic} setVal={(x) => upd("onionGarlic", x)} c={c} />
            <Toggle label="Has Pet?" val={form.hasPet} setVal={(x) => upd("hasPet", x)} c={c} />
            <Toggle label="Teacher Before?" val={form.hadTeacherBefore} setVal={(x) => upd("hadTeacherBefore", x)} c={c} />
            <Toggle label="Kya Nasha Karte Ho?" val={form.nasha} setVal={(x) => upd("nasha", x)} c={c} />
          </div>

          {/* ── Remarks ── */}
          <SectionHeader icon="📝" label="Remarks" c={c} />

          <div className="sm:col-span-2">
            <div className="flex items-center justify-between mb-1.5">
              <div className="text-[11px] font-semibold" style={{ color: c.labelColor }}>Remarks (auto)</div>
              <button type="button"
                onClick={() => { setUnlockOpen(true); setUnlockError(""); }}
                className="px-3 py-1 rounded-xl text-[11px] font-semibold border transition-all duration-200"
                style={{ background: c.btnGhostBg, borderColor: c.btnGhostBorder, color: c.btnGhostText }}
              >
                🔓 Unlock
              </button>
            </div>
            <input value={form.remarks}
              onChange={(e) => upd("remarks", e.target.value)}
              readOnly={!remarksUnlocked}
              className="w-full rounded-2xl border px-4 py-3 text-[13px] outline-none transition-all duration-200"
              style={{
                background: remarksUnlocked ? c.inputBg : c.inputDisabledBg,
                borderColor: c.inputBorder,
                color: remarksUnlocked ? c.inputText : c.inputDisabledText,
              }}
            />
            <div className="text-[10px] mt-1" style={{ color: c.hintColor }}>
              Default: <b style={{ color: c.t2 }}>{username}</b> • Unlock ke baad edit
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <button type="button" onClick={() => setManualOpen(false)}
            className="flex-1 px-4 py-3 rounded-2xl text-[13px] font-semibold border transition-all duration-200"
            style={{ background: c.btnGhostBg, borderColor: c.btnGhostBorder, color: c.btnGhostText }}
          >
            Close
          </button>
          <button type="button" disabled={!canGoConfirm}
            onClick={() => { setApiError(""); if (!validate()) return; setConfirmOpen(true); }}
            className="flex-1 px-4 py-3 rounded-2xl text-[13px] font-bold transition-all duration-200 disabled:opacity-40"
            style={{ background: c.btnSolidBg, color: c.btnSolidText }}
          >
            Confirm →
          </button>
        </div>

        <div className="mt-3 text-[10px]" style={{ color: c.hintColor }}>
          ✓ Draft auto-saved. Modal close karo — data safe rahega.
        </div>
      </LayerModal>

      {/* ═══ UNLOCK ═══ */}
      <LayerModal open={unlockOpen} layerName="Unlock Remarks" title="Unlock Remarks"
        sub="Enter your password"
        onClose={() => { setUnlockOpen(false); setUnlockPwd(""); setUnlockError(""); }}
        maxWidth="max-w-md" disableBackdropClose
      >
        <ErrorBanner message={unlockError} c={c} />
        <input type="password" value={unlockPwd}
          onChange={(e) => setUnlockPwd(e.target.value)}
          placeholder="Password..."
          className="w-full rounded-2xl border px-4 py-3 text-[13px] outline-none transition-all duration-200"
          style={{ background: c.inputBg, borderColor: c.inputBorder, color: c.inputText }}
          onKeyDown={(e) => { if (e.key === "Enter") unlockRemarks(); }}
        />
        <div className="mt-3 flex gap-2">
          <button type="button"
            onClick={() => { setUnlockOpen(false); setUnlockPwd(""); setUnlockError(""); }}
            className="flex-1 px-4 py-3 rounded-2xl text-[13px] font-semibold border transition-all duration-200"
            style={{ background: c.btnGhostBg, borderColor: c.btnGhostBorder, color: c.btnGhostText }}
          >Cancel</button>
          <button type="button" onClick={unlockRemarks}
            className="flex-1 px-4 py-3 rounded-2xl text-[13px] font-bold transition-all duration-200"
            style={{ background: c.btnSolidBg, color: c.btnSolidText }}
          >Unlock</button>
        </div>
      </LayerModal>

      {/* ═══ CONFIRM ═══ */}
      <LayerModal open={confirmOpen} layerName="Confirm" title="Confirm Customer"
        sub="Review → Submit" onClose={() => setConfirmOpen(false)}
        maxWidth="max-w-3xl" disableBackdropClose
      >
        <ErrorBanner message={apiError} c={c} />
        <div className="rounded-3xl border overflow-hidden"
          style={{ background: c.reviewBg, borderColor: c.reviewBorder }}
        >
          {[
            ["Name", form.name], ["Age", form.age], ["Gender", form.gender],
            ["Occupation", form.occupation], ["Address", computedAddress],
            ["Marital Status", form.maritalStatus], ["Approver", form.approver],
            ["Diksha Year", form.dikshaYear], ["Vrindavan Visits", form.vrindavanVisits],
            ["First Diksha Year", form.firstDikshaYear],
            ["Family Permission", form.familyPermissionRelation || "NO"],
            ...(form.familyPermissionRelation === "other" ? [["Family Other", form.familyPermissionOther]] : []),
            ["Onion/Garlic", form.onionGarlic ? "YES" : "NO"],
            ["Has Pet", form.hasPet ? "YES" : "NO"],
            ["Teacher Before", form.hadTeacherBefore ? "YES" : "NO"],
            ["Nasha", form.nasha ? "YES" : "NO"],
            ["Remarks", form.remarks],
          ].map(([k, v], i) => (
            <ReviewLine key={k} k={k} v={v} c={c} alt={i % 2 === 1} />
          ))}
        </div>
        <div className="mt-5 flex gap-3">
          <button type="button" onClick={() => setConfirmOpen(false)}
            className="flex-1 px-4 py-3 rounded-2xl text-[13px] font-semibold border transition-all duration-200"
            style={{ background: c.btnGhostBg, borderColor: c.btnGhostBorder, color: c.btnGhostText }}
          >← Edit</button>
          <button type="button" onClick={submitFinal} disabled={submitting}
            className="flex-1 px-4 py-3 rounded-2xl text-[13px] font-bold transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: c.btnSolidBg, color: c.btnSolidText }}
          >
            {submitting ? (
              <><LoadingSpinner c={{ loadingDot: c.btnSolidText }} size={16} /> Submitting...</>
            ) : "Submit (Commit)"}
          </button>
        </div>
      </LayerModal>

      {/* ═══ DONE ═══ */}
      <LayerModal open={doneOpen} layerName="Done" title="Customer Added"
        sub="Saved in Recent (Today DB)"
        onClose={() => { setDoneOpen(false); resetAll(); }}
        maxWidth="max-w-2xl" disableBackdropClose
      >
        <div className="rounded-3xl border p-8 text-center"
          style={{ background: c.doneBg, borderColor: c.cardBorder }}
        >
          <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4"
            style={{ background: c.accG }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="text-2xl font-black" style={{ color: c.t1 }}>Done!</div>
          <div className="text-[13px] mt-1" style={{ color: c.t3 }}>Customer created successfully.</div>
          <div className="mt-5 rounded-2xl border p-5 inline-block min-w-[160px]"
            style={{ background: c.inputBg, borderColor: c.cardBorder }}
          >
            <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: c.t3 }}>Roll No</div>
            <div className="text-4xl font-black mt-1" style={{ color: c.doneAccent }}>{doneInfo.rollNo || "—"}</div>
          </div>
          <div className="mt-6">
            <button type="button" onClick={() => { setDoneOpen(false); resetAll(); }}
              className="px-8 py-3 rounded-2xl text-[13px] font-bold transition-all duration-200"
              style={{ background: c.btnSolidBg, color: c.btnSolidText }}
            >Close</button>
          </div>
        </div>
      </LayerModal>

      {CommitModal}
    </div>
  );
}

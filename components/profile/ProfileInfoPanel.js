// components/profile/ProfileInfoPanel.js
"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { SectionHeader, Field, Select, Toggle, ErrorBanner, LoadingSpinner } from "./ProfileSubComponents";

/* ═══════════════════════════════════════════════
   CONSTANTS (same as AddCustomer)
   ═══════════════════════════════════════════════ */

const OCCUPATION_SUGGESTIONS = [
  "Business","Private Job","Government Job","House Wife","ShopKeeper",
  "Freelancer","Student","Teacher","Doctor","Engineer","Farmer",
  "Retired","Self Employed","Daily Wage","Driver","Lawyer",
  "Accountant","Nurse","Electrician","Plumber","Tailor",
  "Mechanic","Painter","Carpenter","Chef","Security Guard",
  "Clerk","Manager","Director","Consultant","Architect",
  "Pharmacist","Journalist","Photographer","Designer",
  "Software Developer","Data Entry","Bank Employee",
  "Police","Army","Navy","Air Force","Priest","Pandit",
  "Sadhu","Sevadaar","NGO Worker","Social Worker",
  "Real Estate","Insurance Agent","CA","CS","MBA",
  "Contractor","Transporter","Wholesaler","Retailer",
  "Import Export","Factory Worker","Labour","Unemployed","Other",
];
const MARITAL = ["married","unmarried","divorce","widow","virakt","separated"];
const APPROVERS = [
  "Albeli baba","sundari baba","sahachari baba","pyari sharan baba",
  "garbeli baba","mahaMadhuri baba","navalNagri baba",
  "permRasdaini baba","navalKishori baba",
];
const FAMILY_OPTIONS = ["mother","father","mother&father","husband","wife","other"];

const PET_SUGGESTIONS = [
  "Dog","Cat","Parrot","Cow","Buffalo","Goat","Fish",
  "Rabbit","Hamster","Turtle","Horse","Pigeon","Hen",
  "Duck","Peacock","Monkey","Snake","Lizard","Other",
];

const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = 1950;
const STAGGER = 40;

/* ═══════════════════════════════════════════════
   COLLAPSIBLE SECTION (Read + Edit both)
   ═══════════════════════════════════════════════ */

function CollapsibleSection({ icon, label, open, onToggle, c, children }) {
  const contentRef = useRef(null);
  const [measuredH, setMeasuredH] = useState(0);
  const firstRender = useRef(true);

  useEffect(() => {
    if (contentRef.current) setMeasuredH(contentRef.current.scrollHeight);
  }, [children, open]);

  useEffect(() => { firstRender.current = false; }, []);

  return (
    <div className="border-b last:border-b-0" style={{ borderColor: c.divider || c.panelBorder }}>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between py-3 max-md:py-2.5 px-1 text-left transition-colors duration-150 active:scale-[0.995]"
        style={{ color: c.t1 }}
        onMouseEnter={(e) => { e.currentTarget.style.background = c.panelHover || "rgba(128,128,128,0.04)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
      >
        <div className="flex items-center gap-2">
          <span className="text-base max-md:text-sm">{icon}</span>
          <span className="text-[12px] max-md:text-[11px] font-bold uppercase tracking-wider" style={{ color: c.sectionLabel || c.t3 }}>
            {label}
          </span>
        </div>
        <svg
          width="14" height="14" viewBox="0 0 16 16" fill="none"
          className="flex-shrink-0 transition-transform duration-300"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          <path d="M4 6l4 4 4-4" stroke={c.t3} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      <div
        ref={contentRef}
        className="overflow-hidden"
        style={{
          maxHeight: open ? `${measuredH + 60}px` : "0px",
          opacity: open ? 1 : 0,
          transition: firstRender.current ? "none" : "max-height 0.35s cubic-bezier(0.22,1,0.36,1), opacity 0.25s ease",
        }}
      >
        <div className="pb-3 max-md:pb-2.5 px-1">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   READ ROW
   ═══════════════════════════════════════════════ */

function ReadRow({ k, v, c, copyable, idx = 0 }) {
  const [copied, setCopied] = useState(false);
  const display = String(v ?? "").trim();
  if (!display || display === "undefined") return null;

  const handleCopy = () => {
    if (!copyable || !display) return;
    navigator.clipboard?.writeText(display).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div
      className="flex items-start justify-between gap-3 max-md:gap-2 py-1.5 max-md:py-1 rounded-lg px-2 max-md:px-1.5 transition-all duration-150 will-change-transform"
      style={{
        cursor: copyable ? "pointer" : "default",
        opacity: 0,
        animation: `profileFadeUp 0.3s ease-out ${idx * STAGGER}ms forwards`,
      }}
      onClick={copyable ? handleCopy : undefined}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = c.panelHover || "rgba(128,128,128,0.04)";
        e.currentTarget.style.transform = "translateX(3px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.transform = "translateX(0)";
      }}
    >
      <div className="text-[12px] max-md:text-[11px] font-medium shrink-0" style={{ color: c.t3 }}>{k}</div>
      <div className="text-[12px] max-md:text-[11px] font-semibold text-right break-words max-w-[65%] flex items-center gap-1.5" style={{ color: c.t1 }}>
        {display}
        {copyable && (
          <span className="text-[10px] transition-all duration-200"
            style={{ color: copied ? c.acc : c.t4, transform: copied ? "scale(1.2)" : "scale(1)" }}>
            {copied ? "✓" : "📋"}
          </span>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   OCCUPATION FIELD (searchable)
   ═══════════════════════════════════════════════ */

function OccupationField({ value, onChange, c }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const filtered = useMemo(() => {
    const v = (value || "").toLowerCase();
    return v ? OCCUPATION_SUGGESTIONS.filter((s) => s.toLowerCase().includes(v)).slice(0, 20) : OCCUPATION_SUGGESTIONS;
  }, [value]);

  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative" ref={wrapRef}>
      <div className="text-[11px] max-md:text-[10px] font-semibold mb-1.5 max-md:mb-1" style={{ color: c.labelColor }}>Occupation</div>
      <input value={value || ""} onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="e.g. Business, Student..."
        className="w-full rounded-2xl max-md:rounded-xl border px-4 max-md:px-3.5 py-3 max-md:py-2.5 text-[13px] outline-none transition-all duration-200"
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
          className="absolute mt-1.5 w-full rounded-2xl max-md:rounded-xl border overflow-hidden max-h-44 overflow-y-auto overscroll-contain"
          style={{
            background: c.dropBg || c.panelBg,
            borderColor: c.dropBorder || c.inputBorder,
            boxShadow: c.dropShadow || "0 8px 32px rgba(0,0,0,0.20)",
            zIndex: 9999,
            backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          }}
        >
          {filtered.map((s, idx) => (
            <button key={`${s}_${idx}`} type="button"
              onMouseDown={() => { onChange(s); setOpen(false); }}
              className="w-full text-left px-4 max-md:px-3 py-2 max-md:py-1.5 text-[12px] max-md:text-[11px] font-medium transition-colors duration-100"
              style={{ color: c.dropItemText || c.t2 }}
              onMouseEnter={(e) => { e.currentTarget.style.background = c.dropItemHover || "rgba(128,128,128,0.06)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >{s}</button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SUGGEST INPUT (for pet)
   ═══════════════════════════════════════════════ */

function SuggestInput({ value, onChange, suggestions, placeholder, c }) {
  const [open, setOpen] = useState(false);
  const filtered = useMemo(() => {
    const v = (value || "").toLowerCase();
    return v ? suggestions.filter((s) => s.toLowerCase().includes(v)).slice(0, 15) : suggestions;
  }, [value, suggestions]);

  return (
    <div className="relative">
      <input value={value || ""} onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        className="w-full rounded-xl max-md:rounded-lg border px-3 max-md:px-2.5 py-2.5 max-md:py-2 text-[12px] max-md:text-[11px] outline-none transition-all duration-200"
        style={{ background: c.inputBg, borderColor: c.inputBorder, color: c.inputText }}
        onFocusCapture={(e) => { e.currentTarget.style.boxShadow = `0 0 0 3px ${c.inputFocusRing}`; e.currentTarget.style.borderColor = c.inputBorderFocus; }}
        onBlurCapture={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = c.inputBorder; }}
      />
      {open && filtered.length > 0 && (
        <div className="absolute mt-1 w-full rounded-xl border overflow-hidden max-h-36 overflow-y-auto overscroll-contain"
          style={{ background: c.dropBg || c.panelBg, borderColor: c.dropBorder || c.inputBorder, boxShadow: "0 6px 24px rgba(0,0,0,0.15)", zIndex: 9999 }}>
          {filtered.map((s, idx) => (
            <button key={`${s}_${idx}`} type="button"
              onMouseDown={() => { onChange(s); setOpen(false); }}
              className="w-full text-left px-3 py-1.5 text-[11px] font-medium transition-colors duration-100"
              style={{ color: c.dropItemText || c.t2 }}
              onMouseEnter={(e) => { e.currentTarget.style.background = c.dropItemHover || "rgba(128,128,128,0.06)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >{s}</button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   TRI-STATE TOGGLE (null=neutral, true=yes, false=no)
   ═══════════════════════════════════════════════ */

function TriToggle({ icon, label, value, onChange, expandContent, c }) {
  const isYes = value === true;
  const isNo = value === false;
  const isNeutral = value === null || value === undefined;

  const bgColor = isYes ? (c.triYesBg || "rgba(34,197,94,0.08)")
    : isNo ? (c.triNoBg || "rgba(239,68,68,0.06)")
    : (c.triNeutralBg || "rgba(128,128,128,0.04)");

  const borderColor = isYes ? (c.triYesBorder || "rgba(34,197,94,0.20)")
    : isNo ? (c.triNoBorder || "rgba(239,68,68,0.15)")
    : (c.triNeutralBorder || c.inputBorder);

  const textColor = isYes ? (c.triYesText || "#4ade80")
    : isNo ? (c.triNoText || "#f87171")
    : (c.triNeutralText || c.t3);

  const pillBg = c.triPillBg || "rgba(128,128,128,0.06)";
  const pillBorder = c.triPillBorder || c.inputBorder;
  const pillIcon = c.triIcon || c.t3;

  return (
    <div className="rounded-2xl max-md:rounded-xl border overflow-hidden transition-all duration-200"
      style={{ background: bgColor, borderColor }}>
      <div className="flex items-center gap-2.5 max-md:gap-2 px-3.5 max-md:px-3 py-3 max-md:py-2.5">
        <span className="text-base max-md:text-sm flex-shrink-0">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="text-[12px] max-md:text-[11px] font-semibold leading-tight" style={{ color: textColor }}>{label}</div>
          <div className="text-[9.5px] max-md:text-[8.5px] font-medium mt-0.5"
            style={{ color: textColor, opacity: isNeutral ? 0.5 : 0.7 }}>
            {isYes ? "✓ Yes" : isNo ? "✗ No" : "Not selected"}
          </div>
        </div>

        <div className="flex rounded-xl max-md:rounded-lg overflow-hidden border flex-shrink-0"
          style={{ borderColor: pillBorder, background: pillBg }}>
          <button type="button" onClick={() => onChange(false)}
            className="px-2.5 max-md:px-2 py-1.5 max-md:py-1 text-[10px] max-md:text-[9px] font-bold transition-all duration-150 active:scale-95"
            style={{
              background: isNo ? (c.triNoBg || "rgba(239,68,68,0.10)") : "transparent",
              color: isNo ? (c.triNoText || "#f87171") : pillIcon,
              borderRight: `1px solid ${pillBorder}`,
              boxShadow: isNo ? `inset 0 0 0 1px ${c.triNoBorder || "rgba(239,68,68,0.20)"}` : "none",
            }}>No</button>
          <button type="button" onClick={() => onChange(null)}
            className="px-2.5 max-md:px-2 py-1.5 max-md:py-1 text-[10px] max-md:text-[9px] font-bold transition-all duration-150 active:scale-95"
            style={{
              background: isNeutral ? (c.triPillActiveBg || "rgba(128,128,128,0.08)") : "transparent",
              color: isNeutral ? (c.triNeutralText || c.t3) : pillIcon,
              borderRight: `1px solid ${pillBorder}`,
              boxShadow: isNeutral ? `inset 0 0 0 1px ${c.triNeutralBorder || c.inputBorder}` : "none",
            }}>—</button>
          <button type="button" onClick={() => onChange(true)}
            className="px-2.5 max-md:px-2 py-1.5 max-md:py-1 text-[10px] max-md:text-[9px] font-bold transition-all duration-150 active:scale-95"
            style={{
              background: isYes ? (c.triYesBg || "rgba(34,197,94,0.10)") : "transparent",
              color: isYes ? (c.triYesText || "#4ade80") : pillIcon,
              boxShadow: isYes ? `inset 0 0 0 1px ${c.triYesBorder || "rgba(34,197,94,0.20)"}` : "none",
            }}>Yes</button>
        </div>

        <div className="w-2 h-2 rounded-full flex-shrink-0 transition-all duration-200"
          style={{ background: isYes ? (c.triYesText || "#4ade80") : isNo ? (c.triNoText || "#f87171") : (c.triNeutralDot || "rgba(128,128,128,0.15)") }} />
      </div>

      {isYes && expandContent && (
        <div className="px-3.5 max-md:px-3 pb-3 max-md:pb-2.5 pt-1"
          style={{ borderTop: `1px solid ${c.triExpandBorder || c.inputBorder}`, background: c.triExpandBg || "rgba(128,128,128,0.02)" }}>
          {expandContent}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   HELPER — tri-state display for Read mode
   ═══════════════════════════════════════════════ */

function triReadDisplay(val, note) {
  if (val === null || val === undefined) return null; // hides row
  if (val === true) return `Yes${note ? ` — ${note}` : ""}`;
  return "No";
}

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */

export default function ProfileInfoPanel({
  customer, form, setForm, editMode, setEditMode,
  source, c, busy, err, onSave, onFinalize,
  fullLoadBusy, fullLoadErr,
  countries, countriesLoading, states, stateLoading, cities, cityLoading,
  stateFinal, cityFinal, computedAddress,
  canFinalizeEdit, fullLoadedRef,
}) {
  const [expandedSections, setExpandedSections] = useState({
    personal: true, address: true, diksha: true, family: true, lifestyle: true, notes: true,
  });

  const toggleSection = (key) => {
    setExpandedSections((p) => ({ ...p, [key]: !p[key] }));
  };

  const upd = useCallback((key, val) => {
    setForm((p) => ({ ...p, [key]: val }));
  }, [setForm]);

  const [entered, setEntered] = useState(false);
  useEffect(() => {
    setEntered(false);
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
  }, [editMode]);

  // ═══════════════════════════════════════
  // READ MODE
  // ═══════════════════════════════════════
  if (!editMode) {
    return (
      <div
        className="rounded-2xl max-md:rounded-xl border p-4 max-md:p-3 will-change-transform"
        style={{
          background: c.panelBg, borderColor: c.panelBorder,
          transform: entered ? "translateY(0)" : "translateY(8px)",
          opacity: entered ? 1 : 0,
          transition: "transform 0.4s cubic-bezier(0.22,1,0.36,1), opacity 0.35s ease-out",
        }}
      >
        <div className="flex items-center justify-between mb-3 max-md:mb-2">
          <div className="text-[13px] max-md:text-[12px] font-bold" style={{ color: c.t1 }}>Profile Details</div>
          <button type="button"
            onClick={() => { setEditMode(true); if (fullLoadedRef) fullLoadedRef.current = false; }}
            className="px-3 max-md:px-2.5 py-1.5 max-md:py-1 rounded-xl max-md:rounded-lg text-[11px] max-md:text-[10px] font-semibold border transition-all duration-200 active:scale-95"
            style={{ background: c.btnGhostBg, borderColor: c.btnGhostBorder, color: c.btnGhostText }}
            onMouseEnter={(e) => { e.currentTarget.style.background = c.btnGhostHover || c.btnGhostBg; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = c.btnGhostBg; }}
          >✏️ Edit</button>
        </div>

        <div className="space-y-0">
          {/* Personal */}
          <CollapsibleSection icon="👤" label="Personal" open={expandedSections.personal} onToggle={() => toggleSection("personal")} c={c}>
            <ReadRow k="Name" v={customer?.name} c={c} idx={0} />
            <ReadRow k="Age" v={customer?.age} c={c} idx={1} />
            <ReadRow k="Gender" v={customer?.gender} c={c} idx={2} />
            <ReadRow k="Occupation" v={customer?.occupation} c={c} idx={3} />
            <ReadRow k="Marital Status" v={customer?.maritalStatus} c={c} idx={4} />
            <ReadRow k="Approver" v={customer?.approver} c={c} idx={5} />
          </CollapsibleSection>

          {/* Address */}
          <CollapsibleSection icon="📍" label="Address" open={expandedSections.address} onToggle={() => toggleSection("address")} c={c}>
            <ReadRow k="Country" v={customer?.country} c={c} idx={0} />
            <ReadRow k="State" v={customer?.state} c={c} idx={1} />
            <ReadRow k="City" v={customer?.city} c={c} idx={2} />
            <ReadRow k="Address" v={customer?.address} c={c} idx={3} />
          </CollapsibleSection>

          {/* Diksha */}
          <CollapsibleSection icon="🙏" label="Diksha" open={expandedSections.diksha} onToggle={() => toggleSection("diksha")} c={c}>
            <ReadRow k="सत्संग श्रवण" v={customer?.dikshaYear} c={c} idx={0} />
            <ReadRow k="वृंदावन कितनी बार आये" v={customer?.vrindavanVisits} c={c} idx={1} />
            <ReadRow k="दीक्षा प्रथम उपस्थिति" v={customer?.firstDikshaYear} c={c} idx={2} />
          </CollapsibleSection>

          {/* Family */}
          <CollapsibleSection icon="👨‍👩‍👧" label="Family & Permissions" open={expandedSections.family} onToggle={() => toggleSection("family")} c={c}>
            <ReadRow k="Family Permission" v={customer?.familyPermissionRelation} c={c} idx={0} />
            {customer?.familyPermissionRelation === "other" && (
              <ReadRow k="Other" v={customer?.familyPermissionOther} c={c} idx={1} />
            )}
          </CollapsibleSection>

          {/* Lifestyle */}
          <CollapsibleSection icon="⚡" label="Lifestyle" open={expandedSections.lifestyle} onToggle={() => toggleSection("lifestyle")} c={c}>
            <ReadRow k="🧅 Onion/Garlic" v={triReadDisplay(customer?.onionGarlic, customer?.onionGarlicNote)} c={c} idx={0} />
            <ReadRow k="🐾 Has Pet" v={triReadDisplay(customer?.hasPet, customer?.petNote)} c={c} idx={1} />
            <ReadRow k="🙏 Before GuruDev" v={triReadDisplay(customer?.hadTeacherBefore, customer?.guruNote)} c={c} idx={2} />
            <ReadRow k="🚬 Nasha" v={triReadDisplay(customer?.nasha, customer?.nashaNote)} c={c} idx={3} />
          </CollapsibleSection>

          {/* Notes */}
          <CollapsibleSection icon="📝" label="Notes" open={expandedSections.notes} onToggle={() => toggleSection("notes")} c={c}>
            <ReadRow k="Note" v={customer?.note} c={c} idx={0} />
            <ReadRow k="Remarks" v={customer?.remarks} c={c} idx={1} />
          </CollapsibleSection>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════
  // EDIT MODE (CollapsibleSection based)
  // ═══════════════════════════════════════
  return (
    <div
      className="rounded-2xl max-md:rounded-xl border p-4 max-md:p-3 will-change-transform"
      style={{
        background: c.panelBg, borderColor: c.panelBorder,
        transform: entered ? "translateY(0)" : "translateY(8px)",
        opacity: entered ? 1 : 0,
        transition: "transform 0.4s cubic-bezier(0.22,1,0.36,1), opacity 0.35s ease-out",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="text-[13px] max-md:text-[12px] font-bold" style={{ color: c.t1 }}>✏️ Editing Profile</div>
        <button type="button" onClick={() => setEditMode(false)}
          className="px-3 max-md:px-2.5 py-1.5 max-md:py-1 rounded-xl max-md:rounded-lg text-[11px] max-md:text-[10px] font-semibold border transition-all duration-200 active:scale-95"
          style={{ background: c.btnDangerBg || c.btnGhostBg, borderColor: c.btnDangerBorder || c.btnGhostBorder, color: c.btnDangerText || "#f87171" }}
        >✕ Close Edit</button>
      </div>

      {fullLoadBusy && (
        <div className="flex items-center gap-2 my-2">
          <LoadingSpinner c={c} size={14} />
          <span className="text-[11px] max-md:text-[10px]" style={{ color: c.hintColor }}>Loading full profile...</span>
        </div>
      )}
      {fullLoadErr && <ErrorBanner message={fullLoadErr} c={c} />}
      {err && <ErrorBanner message={err} c={c} />}

      <div className="mt-2 space-y-0">

        {/* ── Personal ── */}
        <CollapsibleSection icon="👤" label="Personal" open={expandedSections.personal} onToggle={() => toggleSection("personal")} c={c}>
          <div className="grid sm:grid-cols-2 gap-3 max-md:gap-2.5">
            <Field label="Name" required value={form.name} onChange={(v) => upd("name", v)} c={c} placeholder="Full name..." />
            <Field label="Age" required value={form.age} onChange={(v) => upd("age", v)} c={c} placeholder="e.g. 28" type="number" />
            <Select label="Gender" value={form.gender} onChange={(v) => upd("gender", v)} c={c}>
              <option value="MALE">MALE</option>
              <option value="FEMALE">FEMALE</option>
              <option value="OTHER">OTHER</option>
            </Select>
            <OccupationField value={form.occupation} onChange={(v) => upd("occupation", v)} c={c} />
            <Select label="Marital Status" value={form.maritalStatus} onChange={(v) => upd("maritalStatus", v)} options={MARITAL} c={c} />
            <Select label="Approver" value={form.approver} onChange={(v) => upd("approver", v)} options={APPROVERS} c={c} />
          </div>
        </CollapsibleSection>

        {/* ── Address ── */}
        <CollapsibleSection icon="📍" label="Address" open={expandedSections.address} onToggle={() => toggleSection("address")} c={c}>
          <div className="grid sm:grid-cols-2 gap-3 max-md:gap-2.5">
            <Select label="Country" required value={form.country} c={c}
              onChange={(v) => setForm((p) => ({ ...p, country: v, state: "", stateOther: "", city: "", cityOther: "" }))}
              disabled={countriesLoading}
            >
              {countriesLoading ? <option value="">Loading...</option> : (
                <>
                  <option value="">Select Country...</option>
                  <option value="India">🇮🇳 India</option>
                  <option disabled>──────────</option>
                  {countries.filter((x) => x.name !== "India").map((co) => (
                    <option key={co.code} value={co.name}>{co.flag ? `${co.flag} ` : ""}{co.name}</option>
                  ))}
                </>
              )}
            </Select>

            <div>
              <Select label="State" required value={form.state} c={c}
                disabled={!form.country || stateLoading}
                onChange={(v) => {
                  if (v === "__OTHER__") setForm((p) => ({ ...p, state: "__OTHER__", stateOther: p.stateOther || "", city: "__OTHER__", cityOther: "" }));
                  else setForm((p) => ({ ...p, state: v, stateOther: "", city: "", cityOther: "" }));
                }}
              >
                <option value="">{!form.country ? "Select country first..." : stateLoading ? "Loading..." : "Select..."}</option>
                {states.map((s, i) => <option key={`${s}_${i}`} value={s}>{s}</option>)}
                <option value="__OTHER__">Enter Manually</option>
              </Select>
              {stateLoading && (
                <div className="flex items-center gap-1.5 mt-1">
                  <LoadingSpinner c={c} size={12} />
                  <span className="text-[10px] max-md:text-[9px]" style={{ color: c.hintColor }}>Loading...</span>
                </div>
              )}
              {form.state === "__OTHER__" && (
                <input value={form.stateOther || ""} onChange={(e) => upd("stateOther", e.target.value)}
                  placeholder="Type state..."
                  className="mt-2 w-full rounded-2xl max-md:rounded-xl border px-4 max-md:px-3.5 py-3 max-md:py-2.5 text-[13px] outline-none transition-all duration-200"
                  style={{ background: c.inputBg, borderColor: c.inputBorder, color: c.inputText }}
                />
              )}
            </div>

            <div>
              <Select label="City" required value={form.city} c={c}
                disabled={!form.state || form.state === "__OTHER__" || cityLoading}
                onChange={(v) => { upd("city", v); upd("cityOther", ""); }}
              >
                <option value="">{!form.state ? "Select..." : cityLoading ? "Loading..." : "Select..."}</option>
                {cities.map((ci, i) => <option key={`${ci}_${i}`} value={ci}>{ci}</option>)}
                <option value="__OTHER__">Other</option>
              </Select>
              {cityLoading && (
                <div className="flex items-center gap-1.5 mt-1">
                  <LoadingSpinner c={c} size={12} />
                  <span className="text-[10px] max-md:text-[9px]" style={{ color: c.hintColor }}>Loading...</span>
                </div>
              )}
              {(form.state === "__OTHER__" || form.city === "__OTHER__") && (
                <input value={form.cityOther || ""} onChange={(e) => setForm((p) => ({ ...p, city: "__OTHER__", cityOther: e.target.value }))}
                  placeholder="Type city..."
                  className="mt-2 w-full rounded-2xl max-md:rounded-xl border px-4 max-md:px-3.5 py-3 max-md:py-2.5 text-[13px] outline-none transition-all duration-200"
                  style={{ background: c.inputBg, borderColor: c.inputBorder, color: c.inputText }}
                />
              )}
            </div>

            <div className="sm:col-span-2">
              <div className="text-[10px] max-md:text-[9px] flex items-center gap-2 px-2 py-1.5 rounded-xl"
                style={{ color: c.hintColor, background: c.glassBg || "rgba(128,128,128,0.03)" }}>
                📫 Computed: <span className="font-semibold" style={{ color: c.t2 }}>{computedAddress || "—"}</span>
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* ── Diksha ── */}
        <CollapsibleSection icon="🙏" label="Diksha" open={expandedSections.diksha} onToggle={() => toggleSection("diksha")} c={c}>
          <div className="grid sm:grid-cols-2 gap-3 max-md:gap-2.5">
            <Field label="सत्संग श्रवण" type="number" value={form.dikshaYear} onChange={(v) => upd("dikshaYear", v)} c={c} placeholder="e.g. 2020" hint={`${MIN_YEAR} – ${CURRENT_YEAR}`} />
            <Field label="वृंदावन कितनी बार आये" type="number" value={form.vrindavanVisits} onChange={(v) => upd("vrindavanVisits", v)} c={c} placeholder="Number" hint="0 or more" />
            <Field label="दीक्षा प्रथम उपस्थिति" type="number" value={form.firstDikshaYear} onChange={(v) => upd("firstDikshaYear", v)} c={c} placeholder="e.g. 2021" hint={`${MIN_YEAR} – ${CURRENT_YEAR}`} />
          </div>
        </CollapsibleSection>

        {/* ── Family & Permissions ── */}
        <CollapsibleSection icon="👨‍👩‍👧" label="Family & Permissions" open={expandedSections.family} onToggle={() => toggleSection("family")} c={c}>
          <div className="space-y-3 max-md:space-y-2.5">
            <Select label="Family Permission" value={form.familyPermissionRelation}
              onChange={(v) => setForm((p) => ({ ...p, familyPermissionRelation: v, familyPermissionOther: v === "other" ? p.familyPermissionOther : "" }))}
              options={FAMILY_OPTIONS} c={c}
            />
            {form.familyPermissionRelation === "other" && (
              <input value={form.familyPermissionOther || ""} onChange={(e) => upd("familyPermissionOther", e.target.value)}
                placeholder="Other (type here)..."
                className="w-full rounded-2xl max-md:rounded-xl border px-4 max-md:px-3.5 py-3 max-md:py-2.5 text-[13px] outline-none transition-all duration-200"
                style={{ background: c.inputBg, borderColor: c.inputBorder, color: c.inputText }}
                onFocusCapture={(e) => { e.currentTarget.style.boxShadow = `0 0 0 3px ${c.inputFocusRing}`; e.currentTarget.style.borderColor = c.inputBorderFocus; }}
                onBlurCapture={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = c.inputBorder; }}
              />
            )}
          </div>
        </CollapsibleSection>

        {/* ── Lifestyle (Tri-state) ── */}
        <CollapsibleSection icon="⚡" label="Lifestyle" open={expandedSections.lifestyle} onToggle={() => toggleSection("lifestyle")} c={c}>
          <div className="grid sm:grid-cols-2 gap-2.5 max-md:gap-2">

            <TriToggle icon="🧅" label="Onion / Garlic?"
              value={form.onionGarlic}
              onChange={(v) => { upd("onionGarlic", v); if (v !== true) upd("onionGarlicNote", ""); }}
              c={c}
              expandContent={
                <div>
                  <div className="text-[10px] max-md:text-[9px] font-semibold mb-1.5" style={{ color: c.triSubLabel || c.t3 }}>
                    Details <span style={{ color: c.hintColor }}>(optional)</span>
                  </div>
                  <input value={form.onionGarlicNote || ""} onChange={(e) => upd("onionGarlicNote", e.target.value)}
                    placeholder="e.g. Only onion, Both..."
                    className="w-full rounded-xl max-md:rounded-lg border px-3 max-md:px-2.5 py-2.5 max-md:py-2 text-[12px] max-md:text-[11px] outline-none transition-all duration-200"
                    style={{ background: c.inputBg, borderColor: c.inputBorder, color: c.inputText }}
                    onFocusCapture={(e) => { e.currentTarget.style.boxShadow = `0 0 0 3px ${c.inputFocusRing}`; e.currentTarget.style.borderColor = c.inputBorderFocus; }}
                    onBlurCapture={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = c.inputBorder; }}
                  />
                </div>
              }
            />

            <TriToggle icon="🐾" label="Has Pet?"
              value={form.hasPet}
              onChange={(v) => { upd("hasPet", v); if (v !== true) upd("petNote", ""); }}
              c={c}
              expandContent={
                <div>
                  <div className="text-[10px] max-md:text-[9px] font-semibold mb-1.5" style={{ color: c.triSubLabel || c.t3 }}>Which animal?</div>
                  <SuggestInput value={form.petNote} onChange={(v) => upd("petNote", v)}
                    suggestions={PET_SUGGESTIONS} placeholder="e.g. Dog, Cat, Cow..." c={c} />
                </div>
              }
            />

            <TriToggle icon="🙏" label="Before GuruDev?"
              value={form.hadTeacherBefore}
              onChange={(v) => { upd("hadTeacherBefore", v); if (v !== true) upd("guruNote", ""); }}
              c={c}
              expandContent={
                <div>
                  <div className="text-[10px] max-md:text-[9px] font-semibold mb-1.5" style={{ color: c.triSubLabel || c.t3 }}>
                    Details <span style={{ color: c.hintColor }}>(optional)</span>
                  </div>
                  <input value={form.guruNote || ""} onChange={(e) => upd("guruNote", e.target.value)}
                    placeholder="Previous guru details..."
                    className="w-full rounded-xl max-md:rounded-lg border px-3 max-md:px-2.5 py-2.5 max-md:py-2 text-[12px] max-md:text-[11px] outline-none transition-all duration-200"
                    style={{ background: c.inputBg, borderColor: c.inputBorder, color: c.inputText }}
                    onFocusCapture={(e) => { e.currentTarget.style.boxShadow = `0 0 0 3px ${c.inputFocusRing}`; e.currentTarget.style.borderColor = c.inputBorderFocus; }}
                    onBlurCapture={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = c.inputBorder; }}
                  />
                </div>
              }
            />

            <TriToggle icon="🚬" label="Nasha?"
              value={form.nasha}
              onChange={(v) => { upd("nasha", v); if (v !== true) upd("nashaNote", ""); }}
              c={c}
              expandContent={
                <div>
                  <div className="text-[10px] max-md:text-[9px] font-semibold mb-1.5" style={{ color: c.triSubLabel || c.t3 }}>
                    Details <span style={{ color: c.hintColor }}>(optional)</span>
                  </div>
                  <input value={form.nashaNote || ""} onChange={(e) => upd("nashaNote", e.target.value)}
                    placeholder="Type of nasha..."
                    className="w-full rounded-xl max-md:rounded-lg border px-3 max-md:px-2.5 py-2.5 max-md:py-2 text-[12px] max-md:text-[11px] outline-none transition-all duration-200"
                    style={{ background: c.inputBg, borderColor: c.inputBorder, color: c.inputText }}
                    onFocusCapture={(e) => { e.currentTarget.style.boxShadow = `0 0 0 3px ${c.inputFocusRing}`; e.currentTarget.style.borderColor = c.inputBorderFocus; }}
                    onBlurCapture={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = c.inputBorder; }}
                  />
                </div>
              }
            />
          </div>
        </CollapsibleSection>

        {/* ── Notes ── */}
        <CollapsibleSection icon="📝" label="Notes & Remarks" open={expandedSections.notes} onToggle={() => toggleSection("notes")} c={c}>
          <div className="space-y-3 max-md:space-y-2.5">
            <div>
              <div className="text-[11px] max-md:text-[10px] font-semibold mb-1.5 max-md:mb-1" style={{ color: c.labelColor }}>
                Note <span style={{ color: c.hintColor, fontWeight: 400 }}>(optional)</span>
              </div>
              <textarea value={form.note || ""} onChange={(e) => upd("note", e.target.value)}
                placeholder="Any note..."
                className="w-full rounded-2xl max-md:rounded-xl border px-4 max-md:px-3.5 py-3 max-md:py-2.5 text-[13px] outline-none transition-all duration-200 min-h-[80px] max-md:min-h-[60px] resize-y"
                style={{ background: c.inputBg, borderColor: c.inputBorder, color: c.inputText }}
                onFocusCapture={(e) => { e.currentTarget.style.boxShadow = `0 0 0 3px ${c.inputFocusRing}`; e.currentTarget.style.borderColor = c.inputBorderFocus; }}
                onBlurCapture={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = c.inputBorder; }}
              />
            </div>
            <Field label="Remarks" value={form.remarks} onChange={(v) => upd("remarks", v)} c={c} />
          </div>
        </CollapsibleSection>
      </div>

      {/* ── Action Buttons ── */}
      <div className="flex flex-col sm:flex-row gap-2 max-md:gap-1.5 mt-5 max-md:mt-4">
        <button type="button" disabled={busy} onClick={onSave}
          className="flex-1 px-4 max-md:px-3 py-3 max-md:py-2.5 rounded-2xl max-md:rounded-xl text-[13px] max-md:text-[12px] font-bold transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.97]"
          style={{ background: c.btnSolidBg, color: c.btnSolidText }}
        >
          {busy ? <LoadingSpinner c={{ loadingDot: c.btnSolidText }} size={16} /> : null}
          {busy ? "Saving..." : "💾 Save Changes"}
        </button>

        {source === "TODAY" && onFinalize && (
          <button type="button" disabled={busy || !canFinalizeEdit} onClick={onFinalize}
            className="flex-1 px-4 max-md:px-3 py-3 max-md:py-2.5 rounded-2xl max-md:rounded-xl text-[13px] max-md:text-[12px] font-bold transition-all duration-200 disabled:opacity-40 active:scale-[0.97]"
            style={{ background: c.accG, color: "#ffffff" }}
          >🚀 Finalize → Sitting</button>
        )}
      </div>

      <div className="mt-2.5 max-md:mt-2 text-[10px] max-md:text-[9px] text-center" style={{ color: c.hintColor }}>
        Changes saved only when you click Save
      </div>
    </div>
  );
}

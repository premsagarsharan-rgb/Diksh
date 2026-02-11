// components/profile/ProfileInfoPanel.js
"use client";

import { useState, useMemo, useCallback } from "react";
import { SectionHeader, Field, Select, Toggle, ReviewLine, ErrorBanner, LoadingSpinner } from "./ProfileSubComponents";

const OCCUPATION_SUGGESTIONS = [
  "Business","Private Job","Government Job","House Wife","ShopKeeper",
  "Freelancer","Student","Teacher","Doctor","Engineer","Farmer",
  "Retired","Self Employed","Daily Wage","Driver","Lawyer","Other",
];

const MARITAL = ["marrid","unmarrid","divorce","wido","virakt","sepreted"];

const APPROVERS = [
  "Albeli baba","sundari baba","sahachari baba","pyari sharan babab",
  "garbeli baba","mahaMadhuri baba","navalNagri baba",
  "permRasdaini baba","navalKishori baba",
];

const FAMILY_OPTIONS = ["mother","father","mother&father","husband","husbend","wife","other"];

export default function ProfileInfoPanel({
  customer, form, setForm, editMode, setEditMode,
  source, c, busy, err, onSave, onFinalize,
  fullLoadBusy, fullLoadErr,
  countries, countriesLoading, states, stateLoading, cities, cityLoading,
  stateFinal, cityFinal, computedAddress,
  canFinalizeEdit,
  fullLoadedRef,
}) {
  const [expandedSections, setExpandedSections] = useState({
    personal: true, address: true, diksha: true, family: true, toggles: true, notes: true,
  });

  const toggleSection = (key) => {
    setExpandedSections((p) => ({ ...p, [key]: !p[key] }));
  };

  const upd = useCallback((key, val) => {
    setForm((p) => ({ ...p, [key]: val }));
  }, [setForm]);

  if (!editMode) {
    return (
      <div
        className="rounded-2xl border p-4 transition-all duration-200"
        style={{ background: c.panelBg, borderColor: c.panelBorder }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="text-[13px] font-bold" style={{ color: c.t1 }}>Profile Details</div>
          <button
            type="button"
            onClick={() => { setEditMode(true); if (fullLoadedRef) fullLoadedRef.current = false; }}
            className="px-3 py-1.5 rounded-xl text-[11px] font-semibold border transition-all duration-200"
            style={{ background: c.btnGhostBg, borderColor: c.btnGhostBorder, color: c.btnGhostText }}
            onMouseEnter={(e) => { e.currentTarget.style.background = c.btnGhostHover; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = c.btnGhostBg; }}
          >
            ✏️ Edit
          </button>
        </div>

        <div className="space-y-0">
          {/* Personal */}
          <CollapsibleSection icon="👤" label="Personal" open={expandedSections.personal} onToggle={() => toggleSection("personal")} c={c}>
            <ReadRow k="Name" v={customer?.name} c={c} />
            <ReadRow k="Age" v={customer?.age} c={c} />
            <ReadRow k="Gender" v={customer?.gender} c={c} />
            <ReadRow k="Occupation" v={customer?.occupation} c={c} />
            <ReadRow k="Marital Status" v={customer?.maritalStatus} c={c} />
            <ReadRow k="Approver" v={customer?.approver} c={c} />
          </CollapsibleSection>

          <CollapsibleSection icon="📍" label="Address" open={expandedSections.address} onToggle={() => toggleSection("address")} c={c}>
            <ReadRow k="Address" v={customer?.address} c={c} />
            <ReadRow k="Country" v={customer?.country} c={c} />
            <ReadRow k="State" v={customer?.state} c={c} />
            <ReadRow k="City" v={customer?.city} c={c} />
            <ReadRow k="Pincode" v={customer?.pincode} c={c} />
          </CollapsibleSection>

          <CollapsibleSection icon="🙏" label="Diksha" open={expandedSections.diksha} onToggle={() => toggleSection("diksha")} c={c}>
            <ReadRow k="Diksha Year" v={customer?.dikshaYear} c={c} />
            <ReadRow k="Vrindavan Visits" v={customer?.vrindavanVisits} c={c} />
            <ReadRow k="First Diksha Year" v={customer?.firstDikshaYear} c={c} />
            <ReadRow k="Follow Years" v={customer?.followYears} c={c} />
            <ReadRow k="Club Visits" v={customer?.clubVisitsBefore} c={c} />
          </CollapsibleSection>

          <CollapsibleSection icon="👨‍👩‍👧" label="Family & Contact" open={expandedSections.family} onToggle={() => toggleSection("family")} c={c}>
            <ReadRow k="Guardian" v={customer?.guardianRelation ? `${customer.guardianRelation} • ${customer.guardianName || "-"}` : null} c={c} />
            <ReadRow k="Phone" v={customer?.phoneNumber ? `${customer.phoneCountryCode || ""} ${customer.phoneNumber}` : null} c={c} copyable />
            <ReadRow k="WhatsApp" v={customer?.whatsappNumber ? `${customer.whatsappCountryCode || ""} ${customer.whatsappNumber}` : null} c={c} copyable />
            <ReadRow k="ID" v={customer?.idValue ? `${(customer.idType || "").toUpperCase()} • ${customer.idValue}` : null} c={c} />
            <ReadRow k="Family Member" v={customer?.familyMemberName ? `${customer.familyMemberName} • ${customer.familyMemberRelation || "-"} • ${customer.familyMemberMobile || "-"}` : null} c={c} />
            <ReadRow k="Family Permission" v={customer?.familyPermissionRelation} c={c} />
          </CollapsibleSection>

          <CollapsibleSection icon="📝" label="Notes" open={expandedSections.notes} onToggle={() => toggleSection("notes")} c={c}>
            <ReadRow k="Note" v={customer?.note} c={c} />
            <ReadRow k="Remarks" v={customer?.remarks} c={c} />
          </CollapsibleSection>
        </div>
      </div>
    );
  }

  // ── EDIT MODE ──
  return (
    <div
      className="rounded-2xl border p-4 transition-all duration-200"
      style={{ background: c.panelBg, borderColor: c.panelBorder }}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="text-[13px] font-bold" style={{ color: c.t1 }}>✏️ Editing Profile</div>
        <button
          type="button"
          onClick={() => setEditMode(false)}
          className="px-3 py-1.5 rounded-xl text-[11px] font-semibold border transition-all duration-200"
          style={{ background: c.btnDangerBg, borderColor: c.btnDangerBorder, color: c.btnDangerText }}
        >
          ✕ Close Edit
        </button>
      </div>

      {fullLoadBusy && (
        <div className="flex items-center gap-2 my-2">
          <LoadingSpinner c={c} size={14} />
          <span className="text-[11px]" style={{ color: c.hintColor }}>Loading full profile...</span>
        </div>
      )}
      {fullLoadErr && <ErrorBanner message={fullLoadErr} c={c} />}
      {err && <ErrorBanner message={err} c={c} />}

      <div className="grid sm:grid-cols-2 gap-3 mt-3">
        <SectionHeader icon="👤" label="Personal" c={c} />

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

        <SectionHeader icon="📍" label="Address" c={c} />

        <Field label="Address" required value={form.address} onChange={(v) => upd("address", v)} c={c} placeholder="Full address..." />
        <Field label="Pincode" value={form.pincode} onChange={(v) => upd("pincode", v)} c={c} placeholder="6 digits..." />

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
          {stateLoading && <div className="flex items-center gap-1.5 mt-1"><LoadingSpinner c={c} size={12} /><span className="text-[10px]" style={{ color: c.hintColor }}>Loading...</span></div>}
          {form.state === "__OTHER__" && (
            <input value={form.stateOther} onChange={(e) => upd("stateOther", e.target.value)}
              placeholder="Type state..."
              className="mt-2 w-full rounded-2xl border px-4 py-3 text-[13px] outline-none transition-all duration-200"
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
          {cityLoading && <div className="flex items-center gap-1.5 mt-1"><LoadingSpinner c={c} size={12} /><span className="text-[10px]" style={{ color: c.hintColor }}>Loading...</span></div>}
          {(form.state === "__OTHER__" || form.city === "__OTHER__") && (
            <input value={form.cityOther} onChange={(e) => setForm((p) => ({ ...p, city: "__OTHER__", cityOther: e.target.value }))}
              placeholder="Type city..."
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

        <SectionHeader icon="🙏" label="Diksha" c={c} />

        <Field label="Follow Years" value={form.followYears} onChange={(v) => upd("followYears", v)} c={c} />
        <Field label="Club Visits Before" value={form.clubVisitsBefore} onChange={(v) => upd("clubVisitsBefore", v)} c={c} />
        <Field label="Month/Year" value={form.monthYear} onChange={(v) => upd("monthYear", v)} c={c} />
        <Field label="Diksha Year" type="number" value={form.dikshaYear} onChange={(v) => upd("dikshaYear", v)} c={c} placeholder="e.g. 2020" />
        <Field label="Vrindavan Visits" type="number" value={form.vrindavanVisits} onChange={(v) => upd("vrindavanVisits", v)} c={c} />
        <Field label="First Diksha Year" type="number" value={form.firstDikshaYear} onChange={(v) => upd("firstDikshaYear", v)} c={c} />

        <SectionHeader icon="👨‍👩‍👧" label="Family & Permissions" c={c} />

        <div>
          <Select label="Family Permission" value={form.familyPermissionRelation}
            onChange={(v) => setForm((p) => ({ ...p, familyPermissionRelation: v, familyPermissionOther: v === "other" ? p.familyPermissionOther : "" }))}
            options={FAMILY_OPTIONS} c={c}
          />
          {form.familyPermissionRelation === "other" && (
            <input value={form.familyPermissionOther} onChange={(e) => upd("familyPermissionOther", e.target.value)}
              placeholder="Other..."
              className="mt-2 w-full rounded-2xl border px-4 py-3 text-[13px] outline-none transition-all duration-200"
              style={{ background: c.inputBg, borderColor: c.inputBorder, color: c.inputText }}
            />
          )}
        </div>

        <div className="sm:col-span-2 grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5 mt-1">
          <Toggle label="Onion/Garlic?" val={!!form.onionGarlic} setVal={(x) => upd("onionGarlic", x)} c={c} />
          <Toggle label="Has Pet?" val={!!form.hasPet} setVal={(x) => upd("hasPet", x)} c={c} />
          <Toggle label="Teacher Before?" val={!!form.hadTeacherBefore} setVal={(x) => upd("hadTeacherBefore", x)} c={c} />
          <Toggle label="Family Permission" val={!!form.familyPermission} setVal={(x) => upd("familyPermission", x)} c={c} />
          <Toggle label="Nasha?" val={!!form.nasha} setVal={(x) => upd("nasha", x)} c={c} />
        </div>

        <SectionHeader icon="📝" label="Notes & Remarks" c={c} />

        <div className="sm:col-span-2">
          <div className="text-[11px] font-semibold mb-1.5" style={{ color: c.labelColor }}>Note</div>
          <textarea value={form.note || ""} onChange={(e) => upd("note", e.target.value)}
            placeholder="Any note..."
            className="w-full rounded-2xl border px-4 py-3 text-[13px] outline-none transition-all duration-200 min-h-[80px] resize-y"
            style={{ background: c.inputBg, borderColor: c.inputBorder, color: c.inputText }}
          />
        </div>

        <div className="sm:col-span-2">
          <Field label="Remarks" value={form.remarks} onChange={(v) => upd("remarks", v)} c={c} />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-2 mt-5">
        <button type="button" disabled={busy} onClick={onSave}
          className="flex-1 px-4 py-3 rounded-2xl text-[13px] font-bold transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ background: c.btnSolidBg, color: c.btnSolidText }}
        >
          {busy ? <LoadingSpinner c={{ loadingDot: c.btnSolidText }} size={16} /> : null}
          {busy ? "Saving..." : "💾 Save Changes"}
        </button>
        {source === "TODAY" && (
          <button type="button" disabled={busy || !canFinalizeEdit} onClick={onFinalize}
            className="flex-1 px-4 py-3 rounded-2xl text-[13px] font-bold transition-all duration-200 disabled:opacity-40"
            style={{ background: c.accG, color: "#ffffff" }}
          >
            🚀 Finalize → Sitting
          </button>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ──

function CollapsibleSection({ icon, label, open, onToggle, c, children }) {
  return (
    <div className="border-b" style={{ borderColor: c.divider }}>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between py-3 px-1 text-left transition-colors duration-150"
        style={{ color: c.t1 }}
        onMouseEnter={(e) => { e.currentTarget.style.background = c.panelHover; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
      >
        <div className="flex items-center gap-2">
          <span className="text-base">{icon}</span>
          <span className="text-[12px] font-bold uppercase tracking-wider" style={{ color: c.sectionLabel }}>{label}</span>
        </div>
        <span
          className="text-[14px] transition-transform duration-200"
          style={{ color: c.t3, transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          ▾
        </span>
      </button>
      {open && (
        <div className="pb-3 px-1 space-y-1.5" style={{ animation: "fadeSlide 0.2s ease-out" }}>
          {children}
        </div>
      )}
    </div>
  );
}

function ReadRow({ k, v, c, copyable }) {
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
      className="flex items-start justify-between gap-3 py-1.5 rounded-lg px-2 transition-colors duration-100"
      style={{ cursor: copyable ? "pointer" : "default" }}
      onClick={copyable ? handleCopy : undefined}
      onMouseEnter={(e) => { e.currentTarget.style.background = c.panelHover; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
    >
      <div className="text-[12px] font-medium shrink-0" style={{ color: c.t3 }}>{k}</div>
      <div className="text-[12px] font-semibold text-right break-words max-w-[65%] flex items-center gap-1.5" style={{ color: c.t1 }}>
        {display}
        {copyable && (
          <span className="text-[10px]" style={{ color: copied ? c.acc : c.t4 }}>
            {copied ? "✓" : "📋"}
          </span>
        )}
      </div>
    </div>
  );
}

function OccupationField({ value, onChange, c }) {
  const [open, setOpen] = useState(false);
  const filtered = useMemo(() => {
    const v = (value || "").toLowerCase();
    return v ? OCCUPATION_SUGGESTIONS.filter((s) => s.toLowerCase().includes(v)).slice(0, 20) : OCCUPATION_SUGGESTIONS;
  }, [value]);

  return (
    <div className="relative">
      <div className="text-[11px] font-semibold mb-1.5" style={{ color: c.labelColor }}>Occupation</div>
      <input value={value} onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        placeholder="e.g. Business..."
        className="w-full rounded-2xl border px-4 py-3 text-[13px] outline-none transition-all duration-200"
        style={{ background: c.inputBg, borderColor: c.inputBorder, color: c.inputText }}
        onFocusCapture={(e) => { e.currentTarget.style.boxShadow = `0 0 0 3px ${c.inputFocusRing}`; }}
        onBlurCapture={(e) => { e.currentTarget.style.boxShadow = "none"; }}
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-[200] mt-1 w-full rounded-2xl border overflow-hidden max-h-48 overflow-y-auto"
          style={{ background: c.dropBg, borderColor: c.dropBorder, backdropFilter: "blur(20px)" }}
        >
          {filtered.map((s) => (
            <button key={s} type="button"
              onMouseDown={() => { onChange(s); setOpen(false); }}
              className="w-full text-left px-4 py-2 text-[12px] font-medium transition-colors duration-100"
              style={{ color: c.dropItemText }}
              onMouseEnter={(e) => { e.currentTarget.style.background = c.dropItemHover; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >{s}</button>
          ))}
        </div>
      )}
    </div>
  );
}

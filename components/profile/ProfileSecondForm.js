// components/profile/ProfileSecondForm.js
"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import LayerModal from "@/components/LayerModal";
import { SectionHeader, Field, ErrorBanner, LoadingSpinner } from "./ProfileSubComponents";
import { parsePhoneNumberFromString } from "libphonenumber-js/min";

/* ═══════════════════════════════════════════════
   SMART HELPERS
   ═══════════════════════════════════════════════ */

// Aadhaar: 4-4-4 format
function formatAadhaar(raw) {
  const digits = String(raw || "").replace(/\D/g, "").slice(0, 12);
  const parts = [];
  for (let i = 0; i < digits.length; i += 4) {
    parts.push(digits.slice(i, i + 4));
  }
  return parts.join(" ");
}

function isAadhaarValid(raw) {
  return String(raw || "").replace(/\D/g, "").length === 12;
}

// Phone validation
function isPhoneValid(num) {
  const digits = String(num || "").replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15;
}

// PIN validation
function isPinValid(pin) {
  return /^\d{6}$/.test(String(pin || "").trim());
}

// PIN auto-lookup cache
const _pinCache = {};

async function lookupPin(pin) {
  const p = String(pin || "").trim();
  if (!/^\d{6}$/.test(p)) return null;
  if (_pinCache[p]) return _pinCache[p];
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${p}`);
    const data = await res.json().catch(() => []);
    if (data?.[0]?.Status === "Success" && data[0]?.PostOffice?.length) {
      const po = data[0].PostOffice[0];
      const result = { city: po.District || po.Division || "", state: po.State || "" };
      _pinCache[p] = result;
      return result;
    }
  } catch {}
  return null;
}

/* ═══════════════════════════════════════════════
   SMART FIELD COMPONENTS
   ═══════════════════════════════════════════════ */

function SmartField({ label, value, onChange, required, placeholder, c, disabled,
  valid, invalid, hint, icon, maxLength, inputMode, mono }) {
  const borderColor = invalid ? c.smartInputErrorBorder
    : valid ? c.smartInputValidBorder
    : c.inputBorder;
  const bgColor = invalid ? c.smartInputError
    : valid ? c.smartInputValid
    : c.inputBg;

  return (
    <div>
      <div className="text-[11px] font-semibold mb-1.5 flex items-center gap-1" style={{ color: c.labelColor }}>
        {label}
        {required && <span style={{ color: c.requiredStar }}>*</span>}
      </div>
      <div className="relative">
        <input
          value={value || ""}
          onChange={(e) => onChange(maxLength ? e.target.value.slice(0, maxLength) : e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          inputMode={inputMode}
          className={`w-full rounded-2xl border px-4 py-3 text-[13px] outline-none transition-all duration-200 ${mono ? "font-mono tracking-wider" : ""}`}
          style={{
            background: disabled ? c.inputDisabledBg : bgColor,
            borderColor,
            color: disabled ? c.inputDisabledText : c.inputText,
            paddingRight: (valid || invalid) ? "40px" : "16px",
          }}
          onFocusCapture={(e) => {
            if (!disabled) {
              e.currentTarget.style.boxShadow = `0 0 0 3px ${c.inputFocusRing}`;
              e.currentTarget.style.borderColor = c.inputBorderFocus;
            }
          }}
          onBlurCapture={(e) => {
            e.currentTarget.style.boxShadow = "none";
            e.currentTarget.style.borderColor = borderColor;
          }}
        />
        {/* Validation icon */}
        {(valid || invalid) && (
          <div
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[14px] transition-all duration-200"
            style={{
              color: valid ? c.smartInputValidIcon : c.smartInputErrorIcon,
              opacity: 0,
              animation: "profileFadeUp 0.2s ease-out 0.05s forwards",
            }}
          >
            {valid ? "✓" : "✗"}
          </div>
        )}
      </div>
      {hint && (
        <div
          className="text-[10px] mt-1.5 px-2 py-1 rounded-lg flex items-center gap-1.5"
          style={{
            background: c.smartInputHintBg,
            border: `1px solid ${c.smartInputHintBorder}`,
            color: c.smartInputHintText,
          }}
        >
          {icon && <span className="text-[11px]">{icon}</span>}
          {hint}
        </div>
      )}
    </div>
  );
}

/* ── Smart Dropdown (custom styled, no native select) ── */
function SmartDropdown({ label, value, onChange, options, required, c, placeholder }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const displayLabel = useMemo(() => {
    if (!value) return placeholder || "Select...";
    const opt = options.find((o) => (typeof o === "string" ? o : o.value) === value);
    if (!opt) return value;
    return typeof opt === "string" ? opt : opt.label;
  }, [value, options, placeholder]);

  const isSelected = Boolean(value);

  return (
    <div ref={ref} className="relative">
      <div className="text-[11px] font-semibold mb-1.5 flex items-center gap-1" style={{ color: c.labelColor }}>
        {label}
        {required && <span style={{ color: c.requiredStar }}>*</span>}
      </div>

      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full rounded-2xl border px-4 py-3 text-[13px] text-left outline-none transition-all duration-200 flex items-center justify-between gap-2"
        style={{
          background: c.inputBg,
          borderColor: open ? c.inputBorderFocus : c.inputBorder,
          color: isSelected ? c.inputText : c.inputPlaceholder,
          boxShadow: open ? `0 0 0 3px ${c.inputFocusRing}` : "none",
        }}
      >
        <span className="truncate">{displayLabel}</span>
        <span
          className="text-[12px] transition-transform duration-200 shrink-0"
          style={{ color: c.t3, transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          ▾
        </span>
      </button>

      {open && (
        <div
          className="absolute z-[300] mt-1 w-full rounded-2xl border overflow-hidden max-h-52 overflow-y-auto"
          style={{
            background: c.smartDropdownBg,
            borderColor: c.smartDropdownBorder,
            boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
            opacity: 0,
            animation: "profileFadeUp 0.2s ease-out forwards",
          }}
        >
          {options.map((opt, i) => {
            const optValue = typeof opt === "string" ? opt : opt.value;
            const optLabel = typeof opt === "string" ? opt : opt.label;
            const isActive = optValue === value;

            return (
              <button
                key={`${optValue}_${i}`}
                type="button"
                onClick={() => { onChange(optValue); setOpen(false); }}
                className="w-full text-left px-4 py-2.5 text-[12px] font-medium transition-all duration-100 flex items-center justify-between gap-2"
                style={{
                  color: isActive ? c.smartDropdownCheck : c.smartDropdownItemText,
                  background: isActive ? c.smartDropdownItemActive : "transparent",
                  fontWeight: isActive ? 700 : 500,
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = c.smartDropdownItemHover;
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = "transparent";
                }}
              >
                <span className="truncate">{optLabel}</span>
                {isActive && (
                  <span className="text-[13px] shrink-0" style={{ color: c.smartDropdownCheck }}>✓</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */

export default function ProfileSecondForm({
  open, onClose, reg2, setReg2, reg2Err, setReg2Err,
  onContinue, c, busy,
}) {
  const [pinLooking, setPinLooking] = useState(false);
  const [pinHint, setPinHint] = useState("");
  const [entered, setEntered] = useState(false);
  const pinTimerRef = useRef(null);

  useEffect(() => {
    if (open) {
      setEntered(false);
      requestAnimationFrame(() => setEntered(true));
    }
  }, [open]);

  // ── PIN auto-lookup ──
  useEffect(() => {
    if (!reg2?.pinCode) { setPinHint(""); return; }
    const pin = String(reg2.pinCode).trim();
    if (pin.length !== 6) { setPinHint(""); return; }

    clearTimeout(pinTimerRef.current);
    pinTimerRef.current = setTimeout(async () => {
      setPinLooking(true);
      const result = await lookupPin(pin);
      setPinLooking(false);
      if (result) {
        setPinHint(`📍 ${result.city}, ${result.state}`);
      } else {
        setPinHint("");
      }
    }, 400);

    return () => clearTimeout(pinTimerRef.current);
  }, [reg2?.pinCode]);

  if (!open || !reg2) return null;

  // ── Updater ──
  const upd = (key, val) => setReg2((p) => ({ ...(p || {}), [key]: val }));

  // ── Phone auto-detect ──
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

  // ── Aadhaar handler ──
  function onAadhaarChange(raw) {
    const digits = String(raw || "").replace(/\D/g, "").slice(0, 12);
    upd("idValue", formatAadhaar(digits));
  }

  // ── WhatsApp same as phone ──
  function copyPhoneToWhatsApp() {
    setReg2((p) => ({
      ...(p || {}),
      whatsappCountryCode: p?.phoneCountryCode || "+91",
      whatsappNumber: p?.phoneNumber || "",
    }));
  }

  // ── Validations for inline indicators ──
  const phoneValid = isPhoneValid(reg2.phoneNumber);
  const pinValid = isPinValid(reg2.pinCode);
  const aadhaarValid = reg2.idType === "aadhaar" ? isAadhaarValid(reg2.idValue) : null;
  const guardianNameFilled = String(reg2.guardianName || "").trim().length > 0;
  const familyNameFilled = String(reg2.familyMemberName || "").trim().length > 0;
  const addressFilled = String(reg2.address2 || "").trim().length > 0;

  return (
    <LayerModal
      open={open}
      layerName="Extra Details"
      title="Finalize Details"
      sub="Required before moving to Sitting"
      onClose={onClose}
      maxWidth="max-w-4xl"
      disableBackdropClose
    >
      <ErrorBanner message={reg2Err} c={c} />

      <div
        className="rounded-3xl border p-4 will-change-transform"
        style={{
          background: c.panelBg,
          borderColor: c.panelBorder,
          transform: entered ? "translateY(0)" : "translateY(8px)",
          opacity: entered ? 1 : 0,
          transition: "transform 0.4s cubic-bezier(0.22,1,0.36,1), opacity 0.35s ease-out",
        }}
      >
        <div className="grid sm:grid-cols-2 gap-3">

          {/* ═══ Guardian ═══ */}
          <FormSection icon="🛡️" label="Guardian" delay={0} c={c}>
            <SmartDropdown
              label="Relation" required value={reg2.guardianRelation}
              onChange={(v) => upd("guardianRelation", v)} c={c}
              options={[
                { value: "father", label: "👨 Father" },
                { value: "mother", label: "👩 Mother" },
                { value: "husband", label: "💑 Husband" },
              ]}
              placeholder="Select relation..."
            />

            <SmartField
              label="Guardian Name" required value={reg2.guardianName}
              onChange={(v) => upd("guardianName", v)} c={c}
              placeholder="Full name..."
              valid={guardianNameFilled}
            />

            <SmartField
              label="PIN Code" required value={reg2.pinCode}
              onChange={(v) => upd("pinCode", String(v || "").replace(/\D/g, "").slice(0, 6))}
              c={c} placeholder="6 digits..."
              inputMode="numeric" maxLength={6} mono
              valid={pinValid && !pinLooking}
              invalid={reg2.pinCode?.length === 6 && !pinValid}
              hint={pinLooking ? "Looking up..." : pinHint || null}
              icon={pinLooking ? "⏳" : "📍"}
            />
          </FormSection>

          {/* ═══ Phone & WhatsApp ═══ */}
          <FormSection icon="📱" label="Phone & WhatsApp" delay={1} c={c}>
            <SmartField
              label="Phone Country Code" required value={reg2.phoneCountryCode}
              onChange={(v) => upd("phoneCountryCode", v)} c={c}
              placeholder="+91" mono
              valid={String(reg2.phoneCountryCode || "").startsWith("+")}
            />

            <SmartField
              label="Phone Number" required value={reg2.phoneNumber}
              onChange={onPhoneTyping} c={c}
              placeholder="Enter full number or with code..."
              inputMode="tel" mono
              valid={phoneValid}
              invalid={reg2.phoneNumber?.length > 0 && !phoneValid}
              hint={phoneValid ? "✓ Valid phone number" : reg2.phoneNumber?.length > 0 ? "Enter 8-15 digits" : null}
              icon={phoneValid ? "✅" : "📱"}
            />

            <div className="sm:col-span-2">
              <button
                type="button"
                onClick={copyPhoneToWhatsApp}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-[11px] font-bold border transition-all duration-200 active:scale-[0.97]"
                style={{
                  background: c.smartInputHintBg,
                  borderColor: c.smartInputHintBorder,
                  color: c.smartInputHintText,
                }}
              >
                📋 Same as Phone → WhatsApp
              </button>
            </div>

            <SmartField
              label="WhatsApp Country Code" value={reg2.whatsappCountryCode}
              onChange={(v) => upd("whatsappCountryCode", v)} c={c}
              placeholder="+91" mono
            />

            <SmartField
              label="WhatsApp Number" value={reg2.whatsappNumber}
              onChange={(v) => upd("whatsappNumber", v)} c={c}
              placeholder="Enter number..." inputMode="tel" mono
            />
          </FormSection>

          {/* ═══ Identity ═══ */}
          <FormSection icon="🪪" label="Identity" delay={2} c={c}>
            {/* ID Type Selector */}
            <div className="sm:col-span-2 flex flex-wrap gap-2">
              {[
                { val: "aadhaar", label: "🪪 AADHAAR", desc: "12-digit" },
                { val: "passport", label: "🛂 PASSPORT", desc: "Alphanumeric" },
                { val: "other", label: "📄 OTHER", desc: "Custom ID" },
              ].map((t) => (
                <button
                  key={t.val}
                  type="button"
                  onClick={() => setReg2((p) => ({
                    ...(p || {}), idType: t.val, idValue: "",
                    idTypeName: t.val === "other" ? p?.idTypeName || "" : "",
                  }))}
                  className="flex-1 min-w-[100px] px-3 py-2.5 rounded-xl text-left border transition-all duration-200 active:scale-[0.97]"
                  style={{
                    background: reg2.idType === t.val ? `${c.acc}15` : c.btnGhostBg,
                    borderColor: reg2.idType === t.val ? c.acc : c.btnGhostBorder,
                    color: reg2.idType === t.val ? c.t1 : c.btnGhostText,
                    boxShadow: reg2.idType === t.val ? `0 0 0 1px ${c.acc}30` : "none",
                  }}
                >
                  <div className="text-[12px] font-bold">{t.label}</div>
                  <div className="text-[9px] mt-0.5" style={{ color: c.t3 }}>{t.desc}</div>
                </button>
              ))}
            </div>

            {reg2.idType === "other" && (
              <SmartField
                label="Other ID Type Name" required value={reg2.idTypeName}
                onChange={(v) => upd("idTypeName", v)} c={c}
                placeholder="e.g. Voter ID, Driving License..."
                valid={String(reg2.idTypeName || "").trim().length > 0}
              />
            )}

            <div className={reg2.idType === "other" ? "" : "sm:col-span-2"}>
              {reg2.idType === "aadhaar" ? (
                <SmartField
                  label="Aadhaar Number" required
                  value={reg2.idValue}
                  onChange={onAadhaarChange}
                  c={c}
                  placeholder="XXXX XXXX XXXX"
                  inputMode="numeric" mono maxLength={14}
                  valid={aadhaarValid === true}
                  invalid={reg2.idValue?.length > 0 && aadhaarValid === false}
                  hint={
                    aadhaarValid
                      ? "✓ Valid 12-digit Aadhaar"
                      : reg2.idValue?.length > 0
                      ? `${12 - String(reg2.idValue || "").replace(/\D/g, "").length} digits remaining`
                      : null
                  }
                  icon={aadhaarValid ? "✅" : "🪪"}
                />
              ) : (
                <SmartField
                  label={reg2.idType === "passport" ? "Passport Number" : "ID Number"}
                  required value={reg2.idValue}
                  onChange={(v) => upd("idValue", v)} c={c}
                  placeholder="Enter number..."
                  valid={String(reg2.idValue || "").trim().length > 3}
                />
              )}
            </div>
          </FormSection>

          {/* ═══ Family Member ═══ */}
          <FormSection icon="👨‍👩‍👧" label="Family Member" delay={3} c={c}>
            <SmartField
              label="Name" required value={reg2.familyMemberName}
              onChange={(v) => upd("familyMemberName", v)} c={c}
              placeholder="Full name..."
              valid={familyNameFilled}
            />

            <SmartDropdown
              label="Relation" required value={reg2.familyMemberRelation}
              onChange={(v) => setReg2((p) => ({
                ...(p || {}), familyMemberRelation: v,
                familyMemberRelationOther: v === "other" ? (p?.familyMemberRelationOther || "") : "",
              }))}
              options={[
                { value: "mother", label: "👩 Mother" },
                { value: "father", label: "👨 Father" },
                { value: "parents", label: "👨‍👩‍👧 Parents" },
                { value: "other", label: "📝 Other" },
              ]}
              c={c} placeholder="Select relation..."
            />

            {reg2.familyMemberRelation === "other" && (
              <SmartField
                label="Other Relation" required value={reg2.familyMemberRelationOther}
                onChange={(v) => upd("familyMemberRelationOther", v)} c={c}
                placeholder="Type relation..."
                valid={String(reg2.familyMemberRelationOther || "").trim().length > 0}
              />
            )}

            <SmartField
              label="Mobile" required value={reg2.familyMemberMobile}
              onChange={(v) => upd("familyMemberMobile", v)} c={c}
              placeholder="Phone number..." inputMode="tel" mono
              valid={isPhoneValid(reg2.familyMemberMobile)}
              invalid={reg2.familyMemberMobile?.length > 0 && !isPhoneValid(reg2.familyMemberMobile)}
            />
          </FormSection>

          {/* ═══ Address ═══ */}
          <FormSection icon="🏠" label="Address" delay={4} c={c}>
            <div className="sm:col-span-2">
              <div className="text-[11px] font-semibold mb-1.5 flex items-center gap-1" style={{ color: c.labelColor }}>
                Complete Address <span style={{ color: c.requiredStar }}>*</span>
              </div>
              <div className="relative">
                <textarea
                  value={reg2.address2 || ""}
                  onChange={(e) => upd("address2", e.target.value)}
                  placeholder="Enter complete address..."
                  className="w-full rounded-2xl border px-4 py-3 text-[13px] outline-none transition-all duration-200 min-h-[100px] resize-y"
                  style={{
                    background: addressFilled ? c.smartInputValid : c.inputBg,
                    borderColor: addressFilled ? c.smartInputValidBorder : c.inputBorder,
                    color: c.inputText,
                  }}
                  onFocusCapture={(e) => {
                    e.currentTarget.style.boxShadow = `0 0 0 3px ${c.inputFocusRing}`;
                    e.currentTarget.style.borderColor = c.inputBorderFocus;
                  }}
                  onBlurCapture={(e) => {
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.borderColor = addressFilled ? c.smartInputValidBorder : c.inputBorder;
                  }}
                />
                {addressFilled && (
                  <div
                    className="absolute right-3 top-3 text-[14px]"
                    style={{ color: c.smartInputValidIcon }}
                  >
                    ✓
                  </div>
                )}
              </div>

              {/* PIN hint auto-fill display */}
              {pinHint && (
                <div
                  className="mt-2 flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-medium"
                  style={{
                    background: c.smartInputHintBg,
                    border: `1px solid ${c.smartInputHintBorder}`,
                    color: c.smartInputHintText,
                  }}
                >
                  {pinHint}
                  <span className="text-[9px]" style={{ color: c.t3 }}>(from PIN)</span>
                </div>
              )}
            </div>
          </FormSection>
        </div>
      </div>

      {/* ── Action Buttons ── */}
      <div
        className="mt-4 flex gap-3"
        style={{
          opacity: 0,
          animation: "profileFadeUp 0.35s ease-out 0.3s forwards",
        }}
      >
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-3 rounded-2xl text-[13px] font-semibold border transition-all duration-200 active:scale-[0.97]"
          style={{ background: c.btnGhostBg, borderColor: c.btnGhostBorder, color: c.btnGhostText }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onContinue}
          disabled={busy}
          className="flex-1 px-4 py-3 rounded-2xl text-[13px] font-bold transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.97]"
          style={{ background: c.btnSolidBg, color: c.btnSolidText }}
        >
          {busy ? <LoadingSpinner c={{ loadingDot: c.btnSolidText }} size={16} /> : null}
          Continue →
        </button>
      </div>
    </LayerModal>
  );
}

/* ── Form Section with stagger ── */
function FormSection({ icon, label, delay = 0, c, children }) {
  return (
    <>
      <div
        className="sm:col-span-2"
        style={{
          opacity: 0,
          animation: `profileFadeUp 0.35s ease-out ${delay * 80}ms forwards`,
        }}
      >
        <div className="flex items-center gap-3 mt-5 mb-1">
          <span className="text-lg">{icon}</span>
          <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: c.sectionLabel }}>
            {label}
          </span>
          <div className="flex-1 h-px" style={{ background: c.sectionLine }} />
        </div>
      </div>
      {children}
    </>
  );
}

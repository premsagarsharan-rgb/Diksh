// components/profile/ProfileSecondForm.js
"use client";

import LayerModal from "@/components/LayerModal";
import { SectionHeader, Field, Select, ErrorBanner, LoadingSpinner } from "./ProfileSubComponents";
import { parsePhoneNumberFromString } from "libphonenumber-js/min";

export default function ProfileSecondForm({
  open, onClose, reg2, setReg2, reg2Err, setReg2Err,
  onContinue, c, busy,
}) {
  if (!reg2) return null;

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

  const upd = (key, val) => setReg2((p) => ({ ...(p || {}), [key]: val }));

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
        className="rounded-3xl border p-4"
        style={{ background: c.panelBg, borderColor: c.panelBorder }}
      >
        <div className="grid sm:grid-cols-2 gap-3">

          {/* Guardian */}
          <SectionHeader icon="🛡️" label="Guardian" c={c} />

          <Select label="Relation" required value={reg2.guardianRelation}
            onChange={(v) => upd("guardianRelation", v)} c={c}
          >
            <option value="">Select...</option>
            <option value="father">Father</option>
            <option value="mother">Mother</option>
            <option value="husband">Husband</option>
          </Select>

          <Field label="Guardian Name" required value={reg2.guardianName}
            onChange={(v) => upd("guardianName", v)} c={c} placeholder="Full name..."
          />

          <Field label="PIN Code" required value={reg2.pinCode}
            onChange={(v) => upd("pinCode", String(v || "").replace(/\D/g, "").slice(0, 6))}
            c={c} placeholder="6 digits..."
          />

          {/* Phone */}
          <SectionHeader icon="📱" label="Phone & WhatsApp" c={c} />

          <Field label="Phone Country Code" required value={reg2.phoneCountryCode}
            onChange={(v) => upd("phoneCountryCode", v)} c={c} placeholder="+91"
          />

          <Field label="Phone Number" required value={reg2.phoneNumber}
            onChange={onPhoneTyping} c={c} placeholder="Enter number..."
          />

          <Field label="WhatsApp Country Code" value={reg2.whatsappCountryCode}
            onChange={(v) => upd("whatsappCountryCode", v)} c={c} placeholder="+91"
          />

          <Field label="WhatsApp Number" value={reg2.whatsappNumber}
            onChange={(v) => upd("whatsappNumber", v)} c={c} placeholder="Enter number..."
          />

          {/* ID */}
          <SectionHeader icon="🪪" label="Identity" c={c} />

          <div className="sm:col-span-2 flex flex-wrap gap-2">
            {["aadhaar", "passport", "other"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setReg2((p) => ({
                  ...(p || {}), idType: t, idValue: "", idTypeName: t === "other" ? p?.idTypeName || "" : "",
                }))}
                className="px-4 py-2 rounded-xl text-[12px] font-bold border transition-all duration-200"
                style={{
                  background: reg2.idType === t ? c.btnSolidBg : c.btnGhostBg,
                  borderColor: reg2.idType === t ? c.btnSolidBg : c.btnGhostBorder,
                  color: reg2.idType === t ? c.btnSolidText : c.btnGhostText,
                }}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>

          {reg2.idType === "other" && (
            <>
              <Field label="Other ID Type Name" required value={reg2.idTypeName}
                onChange={(v) => upd("idTypeName", v)} c={c} placeholder="e.g. Voter ID"
              />
              <Field label="ID Number" required value={reg2.idValue}
                onChange={(v) => upd("idValue", v)} c={c} placeholder="Enter number..."
              />
            </>
          )}

          {reg2.idType !== "other" && (
            <div className="sm:col-span-2">
              <Field
                label={reg2.idType === "passport" ? "Passport Number" : "Aadhaar Number"}
                required value={reg2.idValue}
                onChange={(v) => upd("idValue", v)} c={c}
                placeholder="Enter number..."
              />
            </div>
          )}

          {/* Family member */}
          <SectionHeader icon="👨‍👩‍👧" label="Family Member" c={c} />

          <Field label="Name" required value={reg2.familyMemberName}
            onChange={(v) => upd("familyMemberName", v)} c={c} placeholder="Full name..."
          />

          <Select label="Relation" required value={reg2.familyMemberRelation}
            onChange={(v) => setReg2((p) => ({
              ...(p || {}), familyMemberRelation: v,
              familyMemberRelationOther: v === "other" ? (p?.familyMemberRelationOther || "") : "",
            }))}
            options={["mother", "father", "parents", "other"]} c={c}
          />

          {reg2.familyMemberRelation === "other" && (
            <Field label="Other Relation" required value={reg2.familyMemberRelationOther}
              onChange={(v) => upd("familyMemberRelationOther", v)} c={c} placeholder="Type relation..."
            />
          )}

          <Field label="Mobile" required value={reg2.familyMemberMobile}
            onChange={(v) => upd("familyMemberMobile", v)} c={c} placeholder="Phone number..."
          />

          {/* Address */}
          <SectionHeader icon="🏠" label="Address" c={c} />

          <div className="sm:col-span-2">
            <div className="text-[11px] font-semibold mb-1.5" style={{ color: c.labelColor }}>
              Complete Address <span style={{ color: c.requiredStar }}>*</span>
            </div>
            <textarea
              value={reg2.address2 || ""}
              onChange={(e) => upd("address2", e.target.value)}
              placeholder="Enter complete address..."
              className="w-full rounded-2xl border px-4 py-3 text-[13px] outline-none transition-all duration-200 min-h-[100px] resize-y"
              style={{ background: c.inputBg, borderColor: c.inputBorder, color: c.inputText }}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-3 rounded-2xl text-[13px] font-semibold border transition-all duration-200"
          style={{ background: c.btnGhostBg, borderColor: c.btnGhostBorder, color: c.btnGhostText }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onContinue}
          disabled={busy}
          className="flex-1 px-4 py-3 rounded-2xl text-[13px] font-bold transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ background: c.btnSolidBg, color: c.btnSolidText }}
        >
          {busy ? <LoadingSpinner c={{ loadingDot: c.btnSolidText }} size={16} /> : null}
          Continue →
        </button>
      </div>
    </LayerModal>
  );
}

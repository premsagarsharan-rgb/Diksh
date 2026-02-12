// components/dashboard/calander/AddCustomerSheet.js
"use client";

import { useCT, getCardStyle } from "./calanderTheme";
import { useTheme } from "@/components/ThemeProvider";
import BufferSpinner from "@/components/BufferSpinner";
import LayerModal from "@/components/LayerModal";

function safeId(x) {
  if (!x) return "";
  if (typeof x === "string") return x;
  if (typeof x === "object" && x.$oid) return String(x.$oid);
  return String(x);
}

export default function AddCustomerSheet({
  open,
  onClose,
  sittingActive,
  pickMode,
  onPickModeChange,
  selectedIds,
  onToggleSelect,
  pushing,
  onInitiateSingle,
  onInitiateFamily,
}) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const c = useCT(isLight);

  return (
    <LayerModal
      open={open}
      layerName="Add Customer"
      title="Add Customer"
      sub="Sitting ACTIVE"
      onClose={onClose}
      maxWidth="max-w-4xl"
    >
      {/* Mode Selector */}
      <div className="flex gap-2 items-center flex-wrap" style={{ marginBottom: 12 }}>
        {["SINGLE", "FAMILY"].map((m) => {
          const active = pickMode === m;
          return (
            <button
              key={m}
              type="button"
              onClick={() => onPickModeChange(m)}
              style={{
                padding: "8px 18px",
                borderRadius: 18,
                fontSize: 13,
                fontWeight: active ? 700 : 500,
                background: active ? c.btnSolidBg : c.btnGhostBg,
                color: active ? c.btnSolidText : c.btnGhostText,
                border: active ? "none" : `1px solid ${c.btnGhostBorder}`,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {m === "SINGLE" ? "Single" : "Family (2+)"}
            </button>
          );
        })}
        {pickMode === "FAMILY" && (
          <button
            type="button"
            onClick={onInitiateFamily}
            disabled={selectedIds.length < 2}
            style={{
              marginLeft: "auto",
              padding: "8px 18px",
              borderRadius: 18,
              fontSize: 13,
              fontWeight: 700,
              background: c.btnSolidBg,
              color: c.btnSolidText,
              border: "none",
              cursor: selectedIds.length < 2 ? "not-allowed" : "pointer",
              opacity: selectedIds.length < 2 ? 0.5 : 1,
            }}
          >
            Next ({selectedIds.length})
          </button>
        )}
      </div>

      {/* Customer Grid */}
      <div
        className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 overflow-y-auto pr-1"
        style={{ maxHeight: "65vh" }}
      >
        {sittingActive.map((cust) => {
          const id = safeId(cust._id);
          const selected = selectedIds.includes(id);
          const gender = cust?.gender;
          const cs = getCardStyle(gender, c);

          let cardBg = c.cardBg;
          let cardBorder = c.cardBorder;

          if (pickMode === "FAMILY" && selected) {
            cardBg =
              selectedIds.length === 2
                ? c.pickerSelectedCoupleBg
                : c.pickerSelectedFamilyBg;
            cardBorder =
              selectedIds.length === 2
                ? c.pickerSelectedCoupleBorder
                : c.pickerSelectedFamilyBorder;
          }

          return (
            <div
              key={id}
              style={{
                borderRadius: 18,
                border: `1px solid ${cardBorder}`,
                background: cardBg,
                padding: 14,
                transition: "all 0.15s",
              }}
            >
              {/* Customer Info */}
              <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
                <span
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    fontWeight: 700,
                    flexShrink: 0,
                    background: cs.seq,
                    color: cs.seqText,
                  }}
                >
                  {gender === "MALE" ? "♂" : gender === "FEMALE" ? "♀" : "?"}
                </span>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 14,
                      color: c.t1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {cust.name}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: c.t3,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {cust.address || "—"}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex justify-end" style={{ marginTop: 10 }}>
                {pickMode === "SINGLE" ? (
                  <button
                    type="button"
                    disabled={pushing}
                    onClick={() => onInitiateSingle(id)}
                    style={{
                      padding: "7px 16px",
                      borderRadius: 14,
                      fontSize: 12,
                      fontWeight: 600,
                      background: c.btnSolidBg,
                      color: c.btnSolidText,
                      border: "none",
                      cursor: pushing ? "not-allowed" : "pointer",
                      opacity: pushing ? 0.5 : 1,
                    }}
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onToggleSelect(id)}
                    style={{
                      padding: "7px 16px",
                      borderRadius: 14,
                      fontSize: 12,
                      fontWeight: selected ? 700 : 500,
                      background: selected ? c.btnConfirmBg : c.btnGhostBg,
                      color: selected ? c.btnConfirmText : c.btnGhostText,
                      border: `1px solid ${selected ? c.btnConfirmBorder : c.btnGhostBorder}`,
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    {selected ? "✓ Selected" : "Select"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </LayerModal>
  );
}

// components/dashboard/calander/ConfirmDikshaSheet.js
"use client";

import { useCT, getCardStyle } from "./calanderTheme";
import { useTheme } from "@/components/ThemeProvider";
import LayerModal from "@/components/LayerModal";
import BufferSpinner from "@/components/BufferSpinner";

export default function ConfirmDikshaSheet({
  open,
  onClose,
  target,
  pushing,
  onConfirm,
}) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const c = useCT(isLight);

  if (!target) return null;

  const cust = target.customer;
  const gender = cust?.gender;
  const cs = getCardStyle(gender, c);

  return (
    <LayerModal
      open={open}
      layerName="Confirm to Diksha"
      title="Confirm → Diksha"
      sub="Review before confirming"
      onClose={onClose}
      maxWidth="max-w-md"
      disableBackdropClose
    >
      <div className="space-y-4">
        {/* Customer Card */}
        <div
          style={{
            borderRadius: 18,
            border: `1px solid ${c.panelBorder}`,
            background: c.panelBg,
            padding: 16,
          }}
        >
          <div className="flex items-center gap-3">
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                flexShrink: 0,
                background: cs.seq,
                color: cs.seqText,
              }}
            >
              {gender === "FEMALE" ? "👩" : "👨"}
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 18,
                  color: c.t1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {cust?.name || "—"}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: c.t3,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {cust?.address || "—"}
              </div>
            </div>
          </div>
        </div>

        {/* What will happen */}
        <div
          style={{
            borderRadius: 18,
            border: `1px solid ${c.confirmInfoBorder}`,
            background: c.confirmInfoBg,
            padding: 16,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 600, color: c.confirmInfoText, marginBottom: 10 }}>
            What will happen:
          </div>
          <div className="space-y-2">
            {[
              { text: <>Card will move to <b>Diksha container ({target.occupiedDate || "—"})</b></> },
              { text: <>Customer marked as <b>Diksha Eligible</b></> },
              { text: <><b>WhatsApp confirmation</b> will be sent</> },
              { text: <>A <b>history record</b> will remain in this meeting date</> },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <span style={{ color: c.confirmInfoArrow, marginTop: 2, flexShrink: 0 }}>→</span>
                <span style={{ fontSize: 12, color: c.confirmInfoText }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Diksha Date */}
        <div
          style={{
            borderRadius: 18,
            border: `1px solid ${c.confirmDateBorder}`,
            background: c.confirmDateBg,
            padding: 14,
          }}
        >
          <div className="flex items-center justify-between">
            <span style={{ fontSize: 12, color: c.confirmDateText, opacity: 0.7 }}>
              Diksha Date
            </span>
            <span style={{ fontWeight: 700, color: c.confirmDateText }}>
              {target.occupiedDate || "—"}
            </span>
          </div>
        </div>

        {/* Group Warning */}
        {target.kind && target.kind !== "SINGLE" && (
          <div
            style={{
              borderRadius: 18,
              border: `1px solid ${c.confirmWarnBorder}`,
              background: c.confirmWarnBg,
              padding: 14,
            }}
          >
            <div style={{ fontSize: 12, color: c.confirmWarnText }}>
              ⚠️ This is a <b>{target.kind}</b> — all members will be confirmed together
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-2" style={{ paddingTop: 8 }}>
          <button
            type="button"
            onClick={onClose}
            disabled={pushing}
            style={{
              flex: 1,
              padding: "12px 16px",
              borderRadius: 18,
              background: c.btnGhostBg,
              color: c.btnGhostText,
              border: `1px solid ${c.btnGhostBorder}`,
              fontSize: 13,
              cursor: pushing ? "not-allowed" : "pointer",
              opacity: pushing ? 0.6 : 1,
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(target)}
            disabled={pushing}
            style={{
              flex: 1,
              padding: "12px 16px",
              borderRadius: 18,
              background: c.btnConfirmSolidBg,
              color: c.btnConfirmSolidText,
              border: "none",
              fontSize: 13,
              fontWeight: 600,
              cursor: pushing ? "not-allowed" : "pointer",
              opacity: pushing ? 0.6 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "transform 0.1s",
            }}
            onPointerDown={(e) => {
              if (!pushing) e.currentTarget.style.transform = "scale(0.98)";
            }}
            onPointerUp={(e) => (e.currentTarget.style.transform = "")}
            onPointerLeave={(e) => (e.currentTarget.style.transform = "")}
          >
            {pushing ? <BufferSpinner size={16} /> : null}
            {pushing ? "Confirming..." : "✓ Confirm & Send"}
          </button>
        </div>
      </div>
    </LayerModal>
  );
}

// components/dashboard/calander/RejectOptionsSheet.js
"use client";

import { useCT } from "./calanderTheme";
import { useTheme } from "@/components/ThemeProvider";
import LayerModal from "@/components/LayerModal";
import BufferSpinner from "@/components/BufferSpinner";

function safeId(x) {
  if (!x) return "";
  if (typeof x === "string") return x;
  if (typeof x === "object" && x.$oid) return String(x.$oid);
  return String(x);
}

export default function RejectOptionsSheet({
  open,
  onClose,
  rejectTarget,
  rejectTargetSeq,
  pushing,
  onTrash,
  onPending,
  onApproveFor,
}) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const c = useCT(isLight);

  const cust = rejectTarget?.customer;

  const OPTIONS = [
    {
      key: "TRASH",
      icon: "🗑️",
      title: "Trash",
      desc: "Card will be marked as REJECTED and moved to Trash",
      bgToken: c.rejectTrashBg,
      borderToken: c.rejectTrashBorder,
      textToken: c.rejectTrashText,
      iconBg: c.rejectTrashIconBg,
      action: () => rejectTarget && onTrash(rejectTarget),
    },
    {
      key: "PENDING",
      icon: "📋",
      title: "Push to Pending",
      desc: "Move to Pending DB with ELIGIBLE status for future Diksha",
      bgToken: c.rejectPendingBg,
      borderToken: c.rejectPendingBorder,
      textToken: c.rejectPendingText,
      iconBg: c.rejectPendingIconBg,
      action: () => rejectTarget && onPending(rejectTarget),
    },
    {
      key: "APPROVE",
      icon: "🔄",
      title: "Approve For (Shift)",
      desc: "Shift customer to a different container/date",
      bgToken: c.rejectApproveBg,
      borderToken: c.rejectApproveBorder,
      textToken: c.rejectApproveText,
      iconBg: c.rejectApproveIconBg,
      action: () => rejectTarget && onApproveFor(rejectTarget, rejectTargetSeq),
    },
  ];

  return (
    <LayerModal
      open={open}
      layerName="Reject"
      title="Reject Options"
      sub="Choose what to do with this customer"
      onClose={onClose}
      maxWidth="max-w-md"
      disableBackdropClose
    >
      <div
        style={{
          borderRadius: 20,
          border: `1px solid ${c.surfaceBorder}`,
          background: c.surfaceBg,
          padding: 20,
        }}
      >
        {/* Customer Preview */}
        <div
          style={{
            borderRadius: 18,
            border: `1px solid ${c.panelBorder}`,
            background: c.panelBg,
            padding: 14,
            marginBottom: 20,
          }}
        >
          <div className="flex items-center gap-3">
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: "50%",
                background: c.panelBg,
                border: `1px solid ${c.panelBorder}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                flexShrink: 0,
              }}
            >
              {cust?.gender === "FEMALE" ? "👩" : "👤"}
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 600,
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
                {rejectTargetSeq ? ` • #${rejectTargetSeq}` : ""}
              </div>
            </div>
          </div>
        </div>

        {/* Option Buttons */}
        <div className="space-y-3">
          {OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              disabled={pushing}
              onClick={opt.action}
              style={{
                width: "100%",
                borderRadius: 18,
                border: `1px solid ${opt.borderToken}`,
                background: opt.bgToken,
                padding: 16,
                textAlign: "left",
                cursor: pushing ? "not-allowed" : "pointer",
                opacity: pushing ? 0.6 : 1,
                transition: "transform 0.1s, opacity 0.15s",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
              onPointerDown={(e) => {
                if (!pushing) e.currentTarget.style.transform = "scale(0.98)";
              }}
              onPointerUp={(e) => (e.currentTarget.style.transform = "")}
              onPointerLeave={(e) => (e.currentTarget.style.transform = "")}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 14,
                  background: opt.iconBg,
                  border: `1px solid ${opt.borderToken}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  flexShrink: 0,
                  transition: "transform 0.15s",
                }}
              >
                {opt.icon}
              </div>
              <div>
                <div style={{ fontWeight: 600, color: opt.textToken }}>{opt.title}</div>
                <div style={{ fontSize: 12, color: opt.textToken, opacity: 0.7, marginTop: 2 }}>
                  {opt.desc}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Cancel */}
        <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${c.divider}` }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: 18,
              background: c.btnGhostBg,
              color: c.btnGhostText,
              border: `1px solid ${c.btnGhostBorder}`,
              fontSize: 13,
              cursor: "pointer",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = c.btnGhostHover)}
            onMouseLeave={(e) => (e.currentTarget.style.background = c.btnGhostBg)}
          >
            Cancel
          </button>
        </div>
      </div>
    </LayerModal>
  );
}

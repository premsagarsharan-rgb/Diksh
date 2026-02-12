// components/dashboard/calander/AssignmentCard.js
"use client";

import { useState, useCallback } from "react";
import { useCT, getCardStyle } from "./calanderTheme";
import { useTheme } from "@/components/ThemeProvider";

export default function AssignmentCard({
  assignment,
  seq,
  containerMode,
  pushing,
  locked,
  onOpenProfile,
  onConfirm,
  onReject,
  onOut,
  onDone,
  onShowWarn,
}) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const c = useCT(isLight);

  const [hovered, setHovered] = useState(false);

  const cust = assignment?.customer;
  const gender = cust?.gender;
  const isMeeting = containerMode === "MEETING";
  const qualified = assignment?.cardStatus === "QUALIFIED";
  const isBypass = assignment?.bypass === true || assignment?.occupiedDate === "BYPASS";
  const cs = getCardStyle(gender, c);

  // Lock: all actions disabled
  const actionsDisabled = locked || pushing;

  const handleLockedClick = useCallback((actionName) => {
    if (locked) {
      onShowWarn?.("🔒 Container Locked", `Cannot ${actionName}. Container has reached its limit and is locked.\n\nOnly Admin can temporarily unlock this container.`);
      return true;
    }
    return false;
  }, [locked, onShowWarn]);

  return (
    <div
      onClick={() => onOpenProfile?.(cust, seq)}
      style={{
        borderRadius: 18,
        border: `1px solid ${cs.border}`,
        background: cs.bg,
        padding: 14,
        cursor: "pointer",
        transition: "background 0.15s ease, transform 0.1s ease, opacity 0.15s",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 12,
        position: "relative",
        overflow: "hidden",
        opacity: locked ? c.lockDisabledOpacity + 0.25 : 1,
      }}
      onMouseEnter={(e) => {
        setHovered(true);
        e.currentTarget.style.background = cs.hover;
      }}
      onMouseLeave={(e) => {
        setHovered(false);
        e.currentTarget.style.background = cs.bg;
      }}
      onPointerDown={(e) => (e.currentTarget.style.transform = "scale(0.99)")}
      onPointerUp={(e) => (e.currentTarget.style.transform = "")}
      onPointerLeave={(e) => {
        e.currentTarget.style.transform = "";
        setHovered(false);
        e.currentTarget.style.background = cs.bg;
      }}
    >
      {/* Lock overlay indicator */}
      {locked && (
        <div style={{
          position: "absolute", top: 0, right: 0,
          padding: "3px 10px 3px 14px",
          borderRadius: "0 0 0 14px",
          background: c.lockBadgeBg,
          border: `1px solid ${c.lockBadgeBorder}`,
          borderTop: "none", borderRight: "none",
          fontSize: 9, fontWeight: 600, color: c.lockBadgeText,
          display: "flex", alignItems: "center", gap: 3,
          zIndex: 2,
        }}>
          🔒 Locked
        </div>
      )}

      {/* Left Content */}
      <div style={{ minWidth: 0, flex: 1 }}>
        <div className="flex items-center gap-2">
          {/* Sequence badge */}
          <span
            style={{
              width: 26,
              height: 26,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              fontWeight: 700,
              flexShrink: 0,
              background: cs.seq,
              color: cs.seqText,
            }}
          >
            {seq}
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
              {cust?.name || "—"}
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
              {cust?.address || "—"}
            </div>
          </div>
        </div>

        {/* Badges row */}
        <div className="flex flex-wrap gap-1" style={{ marginTop: 8, marginLeft: 34 }}>
          {/* Gender */}
          <span
            style={{
              fontSize: 9,
              padding: "2px 7px",
              borderRadius: 999,
              background: gender === "MALE" ? c.maleBg : gender === "FEMALE" ? c.femaleBg : c.panelBg,
              border: `1px solid ${gender === "MALE" ? c.maleBorder : gender === "FEMALE" ? c.femaleBorder : c.panelBorder}`,
              color: gender === "MALE" ? c.maleText : gender === "FEMALE" ? c.femaleText : c.t3,
            }}
          >
            {gender || "?"}
          </span>

          {/* Kind */}
          <span
            style={{
              fontSize: 9,
              padding: "2px 7px",
              borderRadius: 999,
              background: c.kindBg,
              border: `1px solid ${c.kindBorder}`,
              color: c.kindText,
            }}
          >
            {assignment?.kind || "SINGLE"}
          </span>

          {/* BYPASS badge */}
          {isBypass && (
            <span
              style={{
                fontSize: 9,
                padding: "2px 7px",
                borderRadius: 999,
                background: c.bypassBadgeBg,
                border: `1px solid ${c.bypassBadgeBorder}`,
                color: c.bypassBadgeText,
                fontWeight: 600,
              }}
            >
              ⚡ BYPASS
            </span>
          )}

          {/* Occupy date (Meeting) */}
          {isMeeting && assignment?.occupiedDate && !isBypass && (
            <span
              style={{
                fontSize: 9,
                padding: "2px 7px",
                borderRadius: 999,
                background: c.occupyBg,
                border: `1px solid ${c.occupyBorder}`,
                color: c.occupyText,
              }}
            >
              🔱 {assignment.occupiedDate}
            </span>
          )}

          {/* Eligible */}
          {(cust?.dikshaEligible === true || cust?.status === "ELIGIBLE") && (
            <span
              style={{
                fontSize: 9,
                padding: "2px 7px",
                borderRadius: 999,
                background: c.eligibleBg,
                border: `1px solid ${c.eligibleBorder}`,
                color: c.eligibleText,
              }}
            >
              ✅ ELIGIBLE
            </span>
          )}

          {/* Qualified */}
          {qualified && (
            <span
              style={{
                fontSize: 9,
                padding: "2px 7px",
                borderRadius: 999,
                background: c.qualifiedBg,
                border: `1px solid ${c.qualifiedBorder}`,
                color: c.qualifiedText,
              }}
            >
              👑 QUALIFIED
            </span>
          )}
        </div>
      </div>

      {/* Right Action Buttons */}
      <div className="flex flex-col gap-1.5" style={{ flexShrink: 0 }}>
        {isMeeting ? (
          <>
            {/* Confirm Button */}
            <button
              disabled={actionsDisabled}
              onClick={(e) => {
                e.stopPropagation();
                if (handleLockedClick("confirm")) return;
                onConfirm?.(assignment);
              }}
              title={locked ? "🔒 Container locked — Admin can unlock" : "Confirm → Diksha"}
              style={{
                padding: "6px 14px",
                borderRadius: 14,
                background: locked ? c.lockOverlay : c.btnSolidBg,
                color: locked ? c.lockBadgeText : c.btnSolidText,
                fontSize: 11,
                fontWeight: 600,
                border: locked ? `1px solid ${c.lockBadgeBorder}` : "none",
                cursor: actionsDisabled ? "not-allowed" : "pointer",
                opacity: actionsDisabled ? c.lockDisabledOpacity : 1,
                transition: "transform 0.1s, opacity 0.15s",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
              onPointerDown={(e) => {
                if (!actionsDisabled) e.currentTarget.style.transform = "scale(0.95)";
              }}
              onPointerUp={(e) => (e.currentTarget.style.transform = "")}
            >
              {locked && <span style={{ fontSize: 10 }}>🔒</span>}
              ✓ Confirm
            </button>

            {/* Reject Button */}
            <button
              disabled={actionsDisabled}
              onClick={(e) => {
                e.stopPropagation();
                if (handleLockedClick("reject")) return;
                onReject?.(assignment, seq);
              }}
              title={locked ? "🔒 Container locked — Admin can unlock" : "Reject options"}
              style={{
                padding: "6px 14px",
                borderRadius: 14,
                background: locked ? c.lockOverlay : c.btnGhostBg,
                color: locked ? c.lockBadgeText : c.btnGhostText,
                fontSize: 11,
                border: `1px solid ${locked ? c.lockBadgeBorder : c.btnGhostBorder}`,
                cursor: actionsDisabled ? "not-allowed" : "pointer",
                opacity: actionsDisabled ? c.lockDisabledOpacity : 1,
                transition: "transform 0.1s, opacity 0.15s",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
              onPointerDown={(e) => {
                if (!actionsDisabled) e.currentTarget.style.transform = "scale(0.95)";
              }}
              onPointerUp={(e) => (e.currentTarget.style.transform = "")}
            >
              {locked && <span style={{ fontSize: 10 }}>🔒</span>}
              ✗ Reject
            </button>
          </>
        ) : (
          <>
            {/* Out Button */}
            <button
              disabled={actionsDisabled || qualified}
              onClick={(e) => {
                e.stopPropagation();
                if (handleLockedClick("remove")) return;
                onOut?.(assignment._id);
              }}
              title={locked ? "🔒 Container locked — Admin can unlock" : qualified ? "QUALIFIED — cannot remove" : "Out"}
              style={{
                padding: "6px 14px",
                borderRadius: 14,
                background: locked ? c.lockOverlay : c.btnGhostBg,
                color: locked ? c.lockBadgeText : c.btnGhostText,
                fontSize: 11,
                border: `1px solid ${locked ? c.lockBadgeBorder : c.btnGhostBorder}`,
                cursor: actionsDisabled || qualified ? "not-allowed" : "pointer",
                opacity: actionsDisabled || qualified ? c.lockDisabledOpacity : 1,
                transition: "transform 0.1s, opacity 0.15s",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
              onPointerDown={(e) => {
                if (!actionsDisabled && !qualified) e.currentTarget.style.transform = "scale(0.95)";
              }}
              onPointerUp={(e) => (e.currentTarget.style.transform = "")}
            >
              {locked && <span style={{ fontSize: 10 }}>🔒</span>}
              Out
            </button>

            {/* Done Button (Diksha only) */}
            {containerMode === "DIKSHA" && (
              <button
                disabled={actionsDisabled || qualified}
                onClick={(e) => {
                  e.stopPropagation();
                  if (handleLockedClick("mark as done")) return;
                  onDone?.(assignment);
                }}
                title={locked ? "🔒 Container locked — Admin can unlock" : qualified ? "Already QUALIFIED" : "Done (Qualified)"}
                style={{
                  padding: "6px 14px",
                  borderRadius: 14,
                  background: locked ? c.lockOverlay : c.btnDoneBg,
                  color: locked ? c.lockBadgeText : c.btnDoneText,
                  fontSize: 11,
                  fontWeight: 600,
                  border: locked ? `1px solid ${c.lockBadgeBorder}` : "none",
                  cursor: actionsDisabled || qualified ? "not-allowed" : "pointer",
                  opacity: actionsDisabled || qualified ? c.lockDisabledOpacity : 1,
                  transition: "transform 0.1s, opacity 0.15s",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
                onPointerDown={(e) => {
                  if (!actionsDisabled && !qualified) e.currentTarget.style.transform = "scale(0.95)";
                }}
                onPointerUp={(e) => (e.currentTarget.style.transform = "")}
              >
                {locked && <span style={{ fontSize: 10 }}>🔒</span>}
                ✓ Done
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

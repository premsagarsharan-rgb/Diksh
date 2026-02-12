// components/dashboard/calander/ContainerPanel.js
"use client";

import { useState } from "react";
import { useCT, getModeStyle, getLockStatus } from "./calanderTheme";
import { useTheme } from "@/components/ThemeProvider";
import ContainerStatsBar from "./ContainerStatsBar";
import AssignmentCard from "./AssignmentCard";
import HistorySection from "./HistorySection";
import ContainerLockBanner from "./ContainerLockBanner";
import BufferSpinner from "@/components/BufferSpinner";

export default function ContainerPanel({
  container,
  assignments,
  reserved,
  historyRecords,
  counts,
  reservedCounts,
  mode,
  role,
  pushing,
  housefull,
  containerLoading,
  selectedDate,
  showList,
  onToggleList,
  onOpenAdd,
  onIncreaseLimit,
  onUnlockContainer,
  onPrintAll,
  onPrintList,
  onOpenProfile,
  onConfirm,
  onReject,
  onOut,
  onDone,
  onShowWarn,
  variant = "default", // "default" (desktop modal) | "inline" (mobile)
}) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const c = useCT(isLight);
  const ms = getModeStyle(mode, c);

  const [mobileTab, setMobileTab] = useState("LIST");

  // Blueprint section controls
  const [reservedOpen, setReservedOpen] = useState(true);
  const [reservedShowAll, setReservedShowAll] = useState(false);

  const isReady = !!container && (selectedDate ? container?.date === selectedDate : true);
  const isInline = variant === "inline";

  // Lock status
  const lock = getLockStatus(container, counts, reservedCounts);
  const isLocked = lock.isLocked;

  const reservedList = Array.isArray(reserved) ? reserved : [];
  const showBlueprint = mode === "DIKSHA" && reservedList.length > 0;

  const maxPreview = isInline ? 3 : 8;
  const reservedDisplay = reservedShowAll ? reservedList : reservedList.slice(0, maxPreview);
  const hasMoreReserved = reservedList.length > maxPreview;

  if (containerLoading && isInline) {
    return (
      <div
        style={{
          borderRadius: 24,
          border: `1px solid ${c.surfaceBorder}`,
          background: c.surfaceBg,
          padding: 20,
        }}
      >
        <div className="flex items-center justify-center gap-2 py-8" style={{ color: c.t3 }}>
          <BufferSpinner size={18} />
          <span style={{ fontSize: 13 }}>Loading container...</span>
        </div>
      </div>
    );
  }

  if (!isReady && isInline) {
    return (
      <div
        style={{
          borderRadius: 24,
          border: `1px solid ${c.surfaceBorder}`,
          background: c.surfaceBg,
          padding: 20,
          textAlign: "center",
        }}
      >
        <div style={{ color: c.t3, fontSize: 13, padding: "20px 0" }}>
          Pick a date to see container details.
        </div>
      </div>
    );
  }

  if (!isReady) return null;

  const listContent = (
    <>
      {!showList ? (
        <div style={{ color: c.t3, fontSize: 13, textAlign: "center", padding: "20px 0" }}>
          List hidden. Tap 👁 to show.
        </div>
      ) : assignments.length === 0 ? (
        <div style={{ textAlign: "center", padding: "24px 0" }}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>📭</div>
          <div style={{ color: c.t3, fontSize: 13 }}>No customers in this container.</div>
        </div>
      ) : (
        <div className={isInline ? "space-y-2" : "grid sm:grid-cols-2 lg:grid-cols-2 gap-2"}>
          {assignments.map((a, idx) => (
            <AssignmentCard
              key={a._id || idx}
              assignment={a}
              seq={idx + 1}
              containerMode={mode}
              pushing={pushing}
              locked={isLocked}
              onOpenProfile={onOpenProfile}
              onConfirm={onConfirm}
              onReject={onReject}
              onOut={onOut}
              onDone={onDone}
              onShowWarn={onShowWarn}
            />
          ))}
        </div>
      )}
    </>
  );

  const blueprintPanel = showBlueprint ? (
    <div
      style={{
        borderRadius: 18,
        border: `1px solid ${c.blueprintBorder}`,
        background: c.blueprintBg,
        padding: 14,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Blueprint grid */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(to right, ${c.blueprintGrid} 1px, transparent 1px),
            linear-gradient(to bottom, ${c.blueprintGrid} 1px, transparent 1px)
          `,
          backgroundSize: "18px 18px",
          opacity: 0.35,
          pointerEvents: "none",
        }}
      />

      <div className="flex items-start justify-between gap-3" style={{ position: "relative" }}>
        <div style={{ minWidth: 0 }}>
          <div className="flex items-center gap-2">
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background: c.blueprintDot,
                boxShadow: `0 0 0 3px ${c.blueprintBadgeBg}`,
                flexShrink: 0,
              }}
            />
            <div style={{ fontSize: 13, fontWeight: 800, color: c.blueprintText }}>
              Reserved / Occupied
            </div>
            <span
              style={{
                fontSize: 10,
                padding: "2px 10px",
                borderRadius: 999,
                background: c.blueprintBadgeBg,
                border: `1px solid ${c.blueprintBadgeBorder}`,
                color: c.blueprintBadgeText,
                fontWeight: 700,
              }}
            >
              🔒 {reservedList.length}
            </span>
          </div>
          <div style={{ fontSize: 11, color: c.blueprintMuted, marginTop: 4, lineHeight: 1.4 }}>
            Meeting holds. Confirm ke baad yeh customers is Diksha date me move honge.
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasMoreReserved && (
            <button
              type="button"
              onClick={() => setReservedShowAll((v) => !v)}
              style={{
                padding: "8px 12px",
                borderRadius: 14,
                background: c.btnGhostBg,
                border: `1px solid ${c.btnGhostBorder}`,
                color: c.btnGhostText,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {reservedShowAll ? "Less" : "All"}
            </button>
          )}

          <button
            type="button"
            onClick={() => setReservedOpen((v) => !v)}
            style={{
              width: 38,
              height: 38,
              borderRadius: 14,
              background: c.btnGhostBg,
              border: `1px solid ${c.btnGhostBorder}`,
              color: c.btnGhostText,
              fontSize: 14,
              cursor: "pointer",
            }}
            title={reservedOpen ? "Collapse" : "Expand"}
          >
            {reservedOpen ? "▾" : "▸"}
          </button>
        </div>
      </div>

      {reservedOpen ? (
        <div className="space-y-2" style={{ marginTop: 12, position: "relative" }}>
          {reservedDisplay.map((a, idx) => {
            const cust = a?.customer || {};
            const gender = cust?.gender;

            return (
              <BlueprintReservedCard
                key={String(a?._id || idx)}
                c={c}
                assignment={a}
                customer={cust}
                gender={gender}
                onClick={() => {
                  if (!cust?._id) return;
                  onOpenProfile?.(cust, null);
                }}
              />
            );
          })}
        </div>
      ) : null}
    </div>
  ) : null;

  return (
    <div
      style={{
        borderRadius: isInline ? 24 : 0,
        border: isInline ? `1px solid ${c.surfaceBorder}` : "none",
        background: isInline ? c.surfaceBg : "transparent",
        padding: isInline ? 16 : 0,
      }}
    >
      {/* Housefull */}
      {housefull && !isLocked && (
        <div
          style={{
            borderRadius: 18,
            border: `1px solid ${c.housefullBorder}`,
            background: c.housefullBg,
            padding: 12,
            marginBottom: 12,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 600, color: c.housefullAccent }}>🚫 Housefull</div>
          <div style={{ fontSize: 12, color: c.housefullText, marginTop: 4 }}>
            Limit reached. Admin can increase limit.
          </div>
        </div>
      )}

      {/* Lock banner */}
      <ContainerLockBanner
        container={container}
        counts={counts}
        reservedCounts={reservedCounts}
        role={role}
        onUnlock={onUnlockContainer}
        onShowWarn={onShowWarn}
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-3" style={{ marginBottom: 12 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 11, color: c.t3, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Container
            </span>
            <span
              style={{
                padding: "2px 10px",
                borderRadius: 999,
                fontSize: 10,
                fontWeight: 600,
                background: ms.bg,
                border: `1px solid ${ms.border}`,
                color: ms.text,
              }}
            >
              {ms.icon} {mode}
            </span>
            {isLocked && (
              <span
                style={{
                  padding: "2px 10px",
                  borderRadius: 999,
                  fontSize: 10,
                  fontWeight: 600,
                  background: c.lockBadgeBg,
                  border: `1px solid ${c.lockBadgeBorder}`,
                  color: c.lockBadgeText,
                }}
              >
                🔒 Locked
              </span>
            )}
          </div>
          <div
            style={{
              marginTop: 4,
              fontWeight: 700,
              fontSize: 18,
              color: c.t1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {container.date}
          </div>
        </div>

        <div className="flex items-center gap-1.5" style={{ flexShrink: 0 }}>
          {role === "ADMIN" && (
            <ActionIconBtn
              icon="+"
              title={isLocked ? "Unlock first to change limit" : "Increase limit"}
              disabled={pushing || isLocked}
              onClick={() => {
                if (isLocked) {
                  onShowWarn?.("🔒 Locked", "Container is locked. Unlock it first to change limit.");
                  return;
                }
                onIncreaseLimit?.();
              }}
              c={c}
              solid
            />
          )}
          <ActionIconBtn icon="🖨" title="Print all forms" disabled={pushing} onClick={onPrintAll} c={c} />
          <ActionIconBtn
            icon="＋"
            title={isLocked ? "Container locked — cannot add" : "Add customer"}
            disabled={pushing || isLocked}
            onClick={() => {
              if (isLocked) {
                onShowWarn?.("🔒 Locked", "Container is locked. Cannot add customers.\n\nAdmin can temporarily unlock.");
                return;
              }
              onOpenAdd?.();
            }}
            c={c}
          />
          <ActionIconBtn icon="📄" title="Print list" disabled={pushing} onClick={onPrintList} c={c} />
          <ActionIconBtn
            icon={showList ? "👁" : "👁‍🗨"}
            title={showList ? "Hide list" : "Show list"}
            disabled={pushing}
            onClick={onToggleList}
            c={c}
          />
        </div>
      </div>

      {/* Stats */}
      <ContainerStatsBar
        container={container}
        counts={counts}
        reservedCounts={reservedCounts}
        historyCount={historyRecords?.length || 0}
        mode={mode}
        variant={isInline ? "compact" : "default"}
      />

      {/* MOBILE: keep blueprint stacked (top) */}
      {isInline && blueprintPanel ? <div style={{ marginBottom: 12 }}>{blueprintPanel}</div> : null}

      {/* Mobile tabs */}
      {isInline && (
        <div className="flex gap-1.5" style={{ marginBottom: 12 }}>
          <TabBtn label={`📋 List (${counts.total})`} active={mobileTab === "LIST"} onClick={() => setMobileTab("LIST")} c={c} />
          <TabBtn label="📊 Stats" active={mobileTab === "STATS"} onClick={() => setMobileTab("STATS")} c={c} />
          {mode === "MEETING" && (historyRecords?.length || 0) > 0 && (
            <TabBtn
              label={`✅ History (${historyRecords.length})`}
              active={mobileTab === "HISTORY"}
              onClick={() => setMobileTab("HISTORY")}
              c={c}
              historyStyle
            />
          )}
        </div>
      )}

      {/* STATS tab */}
      {isInline && mobileTab === "STATS" ? (
        <MobileStatsContent container={container} counts={counts} reservedCounts={reservedCounts} mode={mode} c={c} />
      ) : null}

      {/* HISTORY tab */}
      {isInline && mobileTab === "HISTORY" && mode === "MEETING" ? <HistorySection records={historyRecords} /> : null}

      {/* DESKTOP: Diksha => LEFT list + RIGHT blueprint */}
      {!isInline && mode === "DIKSHA" && blueprintPanel ? (
        <div className="grid lg:grid-cols-3 gap-3" style={{ marginTop: 12 }}>
          <div className="lg:col-span-2">{listContent}</div>
          <div>{blueprintPanel}</div>
        </div>
      ) : (
        // Normal layout
        <div style={{ marginTop: 12 }}>{isInline ? (mobileTab === "LIST" ? listContent : null) : listContent}</div>
      )}

      {/* Desktop history below list */}
      {!isInline && mode === "MEETING" && (historyRecords?.length || 0) > 0 ? (
        <div style={{ marginTop: 16 }}>
          <HistorySection records={historyRecords} />
        </div>
      ) : null}
    </div>
  );
}

/* ═══════ Internal Sub-Components ═══════ */

function BlueprintReservedCard({ c, assignment, customer, gender, onClick }) {
  const kind = assignment?.kind || "SINGLE";
  const name = customer?.name || "—";
  const address = customer?.address || "—";

  const genderBadge =
    gender === "MALE"
      ? { bg: c.maleBg, border: c.maleBorder, text: c.maleText, label: "MALE" }
      : gender === "FEMALE"
      ? { bg: c.femaleBg, border: c.femaleBorder, text: c.femaleText, label: "FEMALE" }
      : { bg: c.kindBg, border: c.kindBorder, text: c.kindText, label: "OTHER" };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter") onClick?.();
      }}
      style={{
        borderRadius: 16,
        border: `1px solid ${c.blueprintBorder}`,
        background: c.blueprintBg,
        padding: 12,
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
        transition: "transform 0.12s ease",
      }}
      onPointerDown={(e) => (e.currentTarget.style.transform = "scale(0.99)")}
      onPointerUp={(e) => (e.currentTarget.style.transform = "")}
      onPointerLeave={(e) => (e.currentTarget.style.transform = "")}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(to right, ${c.blueprintGrid} 1px, transparent 1px),
            linear-gradient(to bottom, ${c.blueprintGrid} 1px, transparent 1px)
          `,
          backgroundSize: "16px 16px",
          opacity: 0.35,
          pointerEvents: "none",
        }}
      />

      <div className="flex items-center justify-between gap-2" style={{ position: "relative" }}>
        <span
          style={{
            fontSize: 10,
            padding: "2px 10px",
            borderRadius: 999,
            background: c.blueprintBadgeBg,
            border: `1px solid ${c.blueprintBadgeBorder}`,
            color: c.blueprintBadgeText,
            fontWeight: 800,
          }}
        >
          🔒 RESERVED
        </span>

        <div className="flex items-center gap-1">
          <span
            style={{
              fontSize: 9,
              padding: "2px 8px",
              borderRadius: 999,
              background: genderBadge.bg,
              border: `1px solid ${genderBadge.border}`,
              color: genderBadge.text,
              fontWeight: 700,
            }}
          >
            {genderBadge.label}
          </span>
          <span
            style={{
              fontSize: 9,
              padding: "2px 8px",
              borderRadius: 999,
              background: c.kindBg,
              border: `1px solid ${c.kindBorder}`,
              color: c.kindText,
              fontWeight: 700,
            }}
          >
            {kind}
          </span>
        </div>
      </div>

      <div style={{ position: "relative", marginTop: 10 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 800,
            color: c.blueprintText,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {name}
        </div>
        <div
          style={{
            fontSize: 11,
            color: c.blueprintMuted,
            marginTop: 2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {address}
        </div>

        <div className="flex items-center justify-between" style={{ marginTop: 10 }}>
          <div style={{ fontSize: 10, color: c.blueprintMuted }}>
            For: <b style={{ color: c.blueprintText }}>{assignment?.occupiedDate || "—"}</b>
          </div>
          <div style={{ fontSize: 10, color: c.blueprintMuted, fontWeight: 700 }}>Blueprint</div>
        </div>
      </div>
    </div>
  );
}

function ActionIconBtn({ icon, title, disabled, onClick, c, solid }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        width: 40,
        height: 40,
        borderRadius: 14,
        background: solid ? c.btnSolidBg : c.btnGhostBg,
        color: solid ? c.btnSolidText : c.btnGhostText,
        border: solid ? "none" : `1px solid ${c.btnGhostBorder}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: solid ? 16 : 14,
        fontWeight: solid ? 700 : 400,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        transition: "all 0.15s",
        flexShrink: 0,
      }}
      onPointerDown={(e) => {
        if (!disabled) e.currentTarget.style.transform = "scale(0.95)";
      }}
      onPointerUp={(e) => (e.currentTarget.style.transform = "")}
      onPointerLeave={(e) => (e.currentTarget.style.transform = "")}
    >
      {icon}
    </button>
  );
}

function TabBtn({ label, active, onClick, c, historyStyle }) {
  let bg, color;
  if (historyStyle) {
    bg = active ? c.tabHistoryActiveBg : c.tabHistoryInactiveBg;
    color = active ? c.tabHistoryActiveText : c.tabHistoryInactiveText;
  } else {
    bg = active ? c.tabActiveBg : c.tabInactiveBg;
    color = active ? c.tabActiveText : c.tabInactiveText;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        padding: "8px 12px",
        borderRadius: 14,
        fontSize: 12,
        fontWeight: 600,
        border: "none",
        cursor: "pointer",
        background: bg,
        color: color,
        transition: "all 0.15s",
      }}
    >
      {label}
    </button>
  );
}

function MobileStatsContent({ container, counts, reservedCounts, mode, c }) {
  const isDiksha = mode === "DIKSHA";
  const limit = container?.limit ?? 20;
  const used = isDiksha ? counts.total + reservedCounts.total : counts.total;
  const remaining = isDiksha ? Math.max(0, limit - used) : null;

  return (
    <div className="space-y-3" style={{ marginBottom: 12 }}>
      <div style={{ borderRadius: 18, border: `1px solid ${c.panelBorder}`, background: c.panelBg, padding: 14 }}>
        <div style={{ fontSize: 11, color: c.t3, fontWeight: 500, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Gender Breakdown
        </div>
        <div className="space-y-3">
          {[
            { label: "👨 Male", value: counts.male, bar: c.maleText, text: c.maleText },
            { label: "👩 Female", value: counts.female, bar: c.femaleText, text: c.femaleText },
            ...(counts.other > 0 ? [{ label: "Other", value: counts.other, bar: c.otherText, text: c.otherText }] : []),
          ].map((item, i) => (
            <div key={i}>
              <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: item.text, fontWeight: 600 }}>{item.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: c.t1 }}>{item.value}</span>
              </div>
              <div style={{ height: 5, borderRadius: 999, background: c.gaugeTrack, overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    borderRadius: 999,
                    background: item.bar,
                    width: counts.total ? `${(item.value / counts.total) * 100}%` : "0%",
                    transition: "width 0.4s ease",
                    opacity: 0.7,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {isDiksha && (
        <div style={{ borderRadius: 18, border: `1px solid ${c.panelBorder}`, background: c.panelBg, padding: 14 }}>
          <div style={{ fontSize: 11, color: c.t3, fontWeight: 500, marginBottom: 6 }}>Capacity</div>
          <div className="flex items-center justify-between">
            <div>
              <div style={{ fontSize: 11, color: c.t4 }}>Used</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: c.t1 }}>
                {used} / {limit}
              </div>
            </div>
            <span
              style={{
                padding: "4px 14px",
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 700,
                background: remaining <= 0 ? c.gaugeFullBg : remaining <= 3 ? c.gaugeWarnBg : c.gaugeOkBg,
                border: `1px solid ${remaining <= 0 ? c.gaugeFullBorder : remaining <= 3 ? c.gaugeWarnBorder : c.gaugeOkBorder}`,
                color: remaining <= 0 ? c.gaugeFullText : remaining <= 3 ? c.gaugeWarnText : c.gaugeOkText,
              }}
            >
              {remaining} left
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

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

  const isReady = !!container && (selectedDate ? container?.date === selectedDate : true);
  const isInline = variant === "inline";

  // Lock status
  const lock = getLockStatus(container, counts, reservedCounts);
  const isLocked = lock.isLocked;

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

  return (
    <div
      style={{
        borderRadius: isInline ? 24 : 0,
        border: isInline ? `1px solid ${c.surfaceBorder}` : "none",
        background: isInline ? c.surfaceBg : "transparent",
        padding: isInline ? 16 : 0,
      }}
    >
      {/* ─── Housefull Banner ─── */}
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

      {/* ─── Lock Banner ─── */}
      <ContainerLockBanner
        container={container}
        counts={counts}
        reservedCounts={reservedCounts}
        role={role}
        onUnlock={onUnlockContainer}
        onShowWarn={onShowWarn}
      />

      {/* ─── Container Header ─── */}
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

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5" style={{ flexShrink: 0 }}>
          {/* Increase limit — admin only, not when locked */}
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

      {/* ─── Stats Bar ─── */}
      <ContainerStatsBar
        container={container}
        counts={counts}
        reservedCounts={reservedCounts}
        historyCount={historyRecords?.length || 0}
        mode={mode}
        variant={isInline ? "compact" : "default"}
      />

      {/* ─── Mobile Tabs (inline only) ─── */}
      {isInline && (
        <div className="flex gap-1.5" style={{ marginBottom: 12 }}>
          <TabBtn
            label={`📋 List (${counts.total})`}
            active={mobileTab === "LIST"}
            onClick={() => setMobileTab("LIST")}
            c={c}
          />
          <TabBtn
            label="📊 Stats"
            active={mobileTab === "STATS"}
            onClick={() => setMobileTab("STATS")}
            c={c}
          />
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

      {/* ─── STATS Tab (Mobile) ─── */}
      {isInline && mobileTab === "STATS" && (
        <MobileStatsContent
          container={container}
          counts={counts}
          reservedCounts={reservedCounts}
          mode={mode}
          c={c}
        />
      )}

      {/* ─── HISTORY Tab (Mobile) ─── */}
      {isInline && mobileTab === "HISTORY" && mode === "MEETING" && (
        <HistorySection records={historyRecords} />
      )}

      {/* ─── LIST Content ─── */}
      {(isInline ? mobileTab === "LIST" : true) && (
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
            <div
              className={isInline ? "space-y-2" : "grid sm:grid-cols-2 lg:grid-cols-3 gap-2"}
            >
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
      )}

      {/* ─── History Section (Desktop — always visible below list) ─── */}
      {!isInline && mode === "MEETING" && (historyRecords?.length || 0) > 0 && (
        <div style={{ marginTop: 16 }}>
          <HistorySection records={historyRecords} />
        </div>
      )}
    </div>
  );
}

/* ═══════ Internal Sub-Components ═══════ */

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
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.background = solid ? c.btnSolidHover : c.btnGhostHover;
          e.currentTarget.style.transform = "scale(1.05)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = solid ? c.btnSolidBg : c.btnGhostBg;
        e.currentTarget.style.transform = "";
      }}
      onPointerDown={(e) => {
        if (!disabled) e.currentTarget.style.transform = "scale(0.95)";
      }}
      onPointerUp={(e) => (e.currentTarget.style.transform = "")}
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
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = historyStyle ? c.tabHistoryInactiveBg : c.tabInactiveHover;
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = historyStyle ? c.tabHistoryInactiveBg : c.tabInactiveBg;
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
      {/* Gender Breakdown */}
      <div
        style={{
          borderRadius: 18,
          border: `1px solid ${c.panelBorder}`,
          background: c.panelBg,
          padding: 14,
        }}
      >
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

      {/* Diksha Capacity */}
      {isDiksha && (
        <>
          <div
            style={{
              borderRadius: 18,
              border: `1px solid ${c.reservedBorder}`,
              background: c.reservedBg,
              padding: 14,
            }}
          >
            <div style={{ fontSize: 11, color: c.reservedText, fontWeight: 500, marginBottom: 6 }}>
              Reserved / Occupied (Meeting holds)
            </div>
            <div className="flex items-center gap-3">
              <div style={{ fontSize: 26, fontWeight: 800, color: c.reservedText }}>{reservedCounts.total}</div>
              <div className="flex gap-1.5 flex-wrap">
                <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 999, background: c.maleBg, border: `1px solid ${c.maleBorder}`, color: c.maleText }}>
                  M {reservedCounts.male}
                </span>
                <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 999, background: c.femaleBg, border: `1px solid ${c.femaleBorder}`, color: c.femaleText }}>
                  F {reservedCounts.female}
                </span>
              </div>
            </div>
          </div>

          <div
            style={{
              borderRadius: 18,
              border: `1px solid ${c.panelBorder}`,
              background: c.panelBg,
              padding: 14,
            }}
          >
            <div style={{ fontSize: 11, color: c.t3, fontWeight: 500, marginBottom: 6 }}>Capacity</div>
            <div className="flex items-center justify-between">
              <div>
                <div style={{ fontSize: 11, color: c.t4 }}>Used</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: c.t1 }}>{used} / {limit}</div>
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
            <div
              style={{
                marginTop: 8,
                height: 8,
                borderRadius: 999,
                background: c.gaugeTrack,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  borderRadius: 999,
                  background: remaining <= 0 ? c.gaugeFull : remaining <= 3 ? c.gaugeWarn : c.gaugeOk,
                  width: `${Math.min(100, (used / limit) * 100)}%`,
                  transition: "width 0.4s ease",
                }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// components/dashboard/calander/ContainerLockBanner.js
"use client";

import { useState, useEffect, useCallback } from "react";
import { useCT, getLockStatus } from "./calanderTheme";
import { useTheme } from "@/components/ThemeProvider";
import LayerModal from "@/components/LayerModal";

const DURATION_OPTIONS = [
  { label: "30 min", minutes: 30 },
  { label: "1 hour", minutes: 60 },
  { label: "2 hours", minutes: 120 },
  { label: "4 hours", minutes: 240 },
  { label: "8 hours", minutes: 480 },
  { label: "Custom", minutes: 0 },
];

function formatTimeLeft(ms) {
  if (ms <= 0) return "Expired";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function ContainerLockBanner({
  container,
  counts,
  reservedCounts,
  role,
  onUnlock,
  onShowWarn,
}) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const c = useCT(isLight);

  const lock = getLockStatus(container, counts, reservedCounts);

  const [unlockModalOpen, setUnlockModalOpen] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(null);
  const [customMinutes, setCustomMinutes] = useState("");
  const [unlocking, setUnlocking] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");

  // Timer for unlocked state
  useEffect(() => {
    if (!lock.isUnlocked || !lock.unlockExpiresAt) {
      setTimeLeft("");
      return;
    }
    function tick() {
      const ms = lock.unlockExpiresAt.getTime() - Date.now();
      setTimeLeft(formatTimeLeft(ms));
      if (ms <= 0) setTimeLeft("Expired — re-locking...");
    }
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [lock.isUnlocked, lock.unlockExpiresAt]);

  const handleUnlockClick = useCallback(() => {
    if (role !== "ADMIN") {
      onShowWarn?.("Not Allowed", "Only Admin can unlock containers. MOD permission system coming soon.");
      return;
    }
    setSelectedDuration(null);
    setCustomMinutes("");
    setUnlockModalOpen(true);
  }, [role, onShowWarn]);

  const handleConfirmUnlock = useCallback(async () => {
    let minutes;
    if (selectedDuration === null) return;

    const opt = DURATION_OPTIONS[selectedDuration];
    if (opt.minutes === 0) {
      minutes = parseInt(customMinutes, 10);
      if (!Number.isFinite(minutes) || minutes < 1) {
        onShowWarn?.("Invalid", "Enter valid minutes (minimum 1)");
        return;
      }
    } else {
      minutes = opt.minutes;
    }

    setUnlocking(true);
    try {
      await onUnlock?.(minutes);
      setUnlockModalOpen(false);
    } catch {
      onShowWarn?.("Failed", "Unlock failed");
    } finally {
      setUnlocking(false);
    }
  }, [selectedDuration, customMinutes, onUnlock, onShowWarn]);

  // Don't render if not full
  if (!lock.isFull) return null;

  return (
    <>
      {/* ─── Lock Banner ─── */}
      {lock.isLocked && (
        <div
          style={{
            borderRadius: 20,
            border: `1px solid ${c.lockBorder}`,
            background: c.lockBg,
            padding: 16,
            marginBottom: 14,
            position: "relative",
            overflow: "hidden",
            boxShadow: `0 0 30px ${c.lockGlow}`,
          }}
        >
          {/* Top glow bar */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 2,
            background: `linear-gradient(90deg, transparent, ${c.lockAccent}, transparent)`,
            opacity: 0.6,
          }} />

          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div
                style={{
                  width: 44, height: 44, borderRadius: 14,
                  background: c.lockIconBg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22, flexShrink: 0,
                }}
              >
                🔒
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: c.lockAccent }}>
                  Container Locked
                </div>
                <div style={{ fontSize: 12, color: c.lockText, marginTop: 4, lineHeight: 1.5 }}>
                  Limit reached ({lock.used}/{lock.limit}). All operations are disabled.
                  Cards can only be viewed and printed.
                </div>
                <div className="flex items-center gap-2 flex-wrap" style={{ marginTop: 8 }}>
                  <span style={{
                    padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600,
                    background: c.lockBadgeBg, border: `1px solid ${c.lockBadgeBorder}`, color: c.lockBadgeText,
                  }}>
                    {lock.used}/{lock.limit} Cards
                  </span>
                  <span style={{
                    padding: "3px 10px", borderRadius: 999, fontSize: 11,
                    background: c.lockBadgeBg, border: `1px solid ${c.lockBadgeBorder}`, color: c.lockBadgeText,
                  }}>
                    🔒 Read-Only Mode
                  </span>
                </div>
              </div>
            </div>

            {/* Admin unlock button */}
            {role === "ADMIN" && (
              <button
                type="button"
                onClick={handleUnlockClick}
                style={{
                  padding: "10px 18px", borderRadius: 14,
                  background: c.unlockBtnBg, color: c.unlockBtnText,
                  fontSize: 13, fontWeight: 600, border: "none",
                  cursor: "pointer", flexShrink: 0,
                  transition: "all 0.15s",
                  display: "flex", alignItems: "center", gap: 6,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.03)"; e.currentTarget.style.opacity = "0.9"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.opacity = ""; }}
                onPointerDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
                onPointerUp={(e) => (e.currentTarget.style.transform = "")}
              >
                🔓 Unlock
              </button>
            )}
          </div>
        </div>
      )}

      {/* ─── Temporarily Unlocked Banner ─── */}
      {lock.isUnlocked && (
        <div
          style={{
            borderRadius: 20,
            border: `1px solid ${c.unlockTimerBorder}`,
            background: c.unlockTimerBg,
            padding: 14,
            marginBottom: 14,
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: c.unlockBg, border: `1px solid ${c.unlockBorder}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18, flexShrink: 0,
                }}
              >
                🔓
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: c.unlockTimerAccent }}>
                  Temporarily Unlocked
                </div>
                <div style={{ fontSize: 11, color: c.unlockTimerText, marginTop: 2 }}>
                  Admin ne unlock kiya hai. Operations allowed until timer expires.
                </div>
              </div>
            </div>
            <div style={{
              padding: "8px 16px", borderRadius: 14,
              background: c.unlockTimerBg, border: `1px solid ${c.unlockTimerBorder}`,
              textAlign: "center", flexShrink: 0, minWidth: 90,
            }}>
              <div style={{ fontSize: 10, color: c.unlockTimerText, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Time Left
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: c.unlockTimerAccent, marginTop: 2, fontVariantNumeric: "tabular-nums" }}>
                {timeLeft}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Unlock Duration Modal ─── */}
      <LayerModal
        open={unlockModalOpen}
        layerName="Unlock Container"
        title="🔓 Unlock Container"
        sub="Select duration — container will auto-lock after timer expires"
        onClose={() => setUnlockModalOpen(false)}
        maxWidth="max-w-md"
        disableBackdropClose
      >
        <div style={{ padding: 0 }}>
          {/* Info */}
          <div style={{
            borderRadius: 18, border: `1px solid ${c.panelBorder}`,
            background: c.panelBg, padding: 14, marginBottom: 14,
          }}>
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 14 }}>⚠️</span>
              <div style={{ fontSize: 12, color: c.t2, lineHeight: 1.5 }}>
                Unlock karne se container pe temporarily sab operations allow ho jayenge.
                Timer khatam hone pe container automatically lock ho jayega.
              </div>
            </div>
          </div>

          {/* Duration Options */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: c.t2, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Select Duration
            </div>
            <div className="grid grid-cols-3 gap-2">
              {DURATION_OPTIONS.map((opt, idx) => {
                const active = selectedDuration === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedDuration(idx)}
                    style={{
                      padding: "12px 8px", borderRadius: 14,
                      background: active ? c.durationOptionActiveBg : c.durationOptionBg,
                      border: `1px solid ${active ? c.durationOptionActiveBorder : c.durationOptionBorder}`,
                      color: active ? c.durationOptionActiveText : c.durationOptionText,
                      fontSize: 13, fontWeight: active ? 700 : 500,
                      cursor: "pointer", textAlign: "center",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      if (!active) e.currentTarget.style.background = c.durationOptionHover;
                    }}
                    onMouseLeave={(e) => {
                      if (!active) e.currentTarget.style.background = c.durationOptionBg;
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom minutes input */}
          {selectedDuration !== null && DURATION_OPTIONS[selectedDuration].minutes === 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: c.t3, marginBottom: 4 }}>Custom minutes:</div>
              <input
                type="number"
                min="1"
                max="1440"
                value={customMinutes}
                onChange={(e) => setCustomMinutes(e.target.value)}
                placeholder="e.g. 45"
                style={{
                  width: "100%", padding: "10px 14px", borderRadius: 14,
                  background: c.panelBg, border: `1px solid ${c.panelBorder}`,
                  color: c.t1, fontSize: 14, outline: "none",
                }}
              />
            </div>
          )}

          {/* Selected summary */}
          {selectedDuration !== null && (
            <div style={{
              borderRadius: 16, border: `1px solid ${c.unlockBorder}`,
              background: c.unlockBg, padding: 12, marginBottom: 14,
            }}>
              <div className="flex items-center justify-between">
                <span style={{ fontSize: 12, color: c.unlockText }}>Will unlock for:</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: c.unlockText }}>
                  {DURATION_OPTIONS[selectedDuration].minutes === 0
                    ? `${customMinutes || "?"} minutes`
                    : DURATION_OPTIONS[selectedDuration].label
                  }
                </span>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setUnlockModalOpen(false)}
              style={{
                flex: 1, padding: "13px 16px", borderRadius: 18,
                background: c.btnGhostBg, color: c.btnGhostText,
                border: `1px solid ${c.btnGhostBorder}`,
                cursor: "pointer", fontSize: 14, fontWeight: 500,
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={selectedDuration === null || unlocking}
              onClick={handleConfirmUnlock}
              style={{
                flex: 1, padding: "13px 16px", borderRadius: 18,
                background: selectedDuration === null ? c.btnGhostBg : c.unlockBtnBg,
                color: selectedDuration === null ? c.t3 : c.unlockBtnText,
                border: "none",
                cursor: selectedDuration === null || unlocking ? "not-allowed" : "pointer",
                opacity: selectedDuration === null ? 0.5 : 1,
                fontSize: 14, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                transition: "all 0.15s",
              }}
              onPointerDown={(e) => { if (selectedDuration !== null) e.currentTarget.style.transform = "scale(0.98)"; }}
              onPointerUp={(e) => (e.currentTarget.style.transform = "")}
            >
              {unlocking ? "Unlocking..." : "🔓 Confirm Unlock"}
            </button>
          </div>
        </div>
      </LayerModal>
    </>
  );
}

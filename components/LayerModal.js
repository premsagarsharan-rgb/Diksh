// components/LayerModal.js
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLayerStack } from "@/components/LayerStackProvider";
import { useTheme } from "@/components/ThemeProvider";

/* ═══════════════════════════════════════════════
   THEME COLORS — LayerModal
   ═══════════════════════════════════════════════ */

const LM = {
  dark: {
    overlay: "rgba(0,0,0,0.72)",
    panelBg: "rgba(12,12,28,0.97)",
    panelBorder: "rgba(255,255,255,0.08)",
    panelShadow: "0 0 80px rgba(99,102,241,0.10)",
    headerBg: "rgba(6,6,15,0.80)",
    headerBorder: "rgba(255,255,255,0.06)",
    badgeBg: "rgba(255,255,255,0.08)",
    badgeBorder: "rgba(255,255,255,0.08)",
    badgeText: "rgba(255,255,255,0.75)",
    layerNameText: "rgba(255,255,255,0.50)",
    subText: "rgba(255,255,255,0.50)",
    titleText: "#ffffff",
    closeBg: "rgba(255,255,255,0.08)",
    closeHoverBg: "rgba(239,68,68,0.12)",
    closeBorder: "rgba(255,255,255,0.08)",
    closeHoverBorder: "rgba(239,68,68,0.30)",
    closeText: "rgba(255,255,255,0.70)",
    closeHoverText: "#f87171",
    bodyBg: "transparent",
  },
  light: {
    overlay: "rgba(0,0,0,0.30)",
    panelBg: "rgba(255,255,255,0.97)",
    panelBorder: "rgba(0,0,0,0.08)",
    panelShadow: "0 20px 60px rgba(0,0,0,0.12)",
    headerBg: "rgba(245,246,250,0.85)",
    headerBorder: "rgba(0,0,0,0.06)",
    badgeBg: "rgba(0,0,0,0.05)",
    badgeBorder: "rgba(0,0,0,0.06)",
    badgeText: "rgba(15,23,42,0.60)",
    layerNameText: "rgba(15,23,42,0.45)",
    subText: "rgba(15,23,42,0.45)",
    titleText: "#0f172a",
    closeBg: "rgba(0,0,0,0.04)",
    closeHoverBg: "rgba(220,38,38,0.08)",
    closeBorder: "rgba(0,0,0,0.06)",
    closeHoverBorder: "rgba(220,38,38,0.20)",
    closeText: "rgba(15,23,42,0.50)",
    closeHoverText: "#dc2626",
    bodyBg: "transparent",
  },
};

export default function LayerModal({
  open,
  title,
  sub,
  onClose,
  children,
  maxWidth = "max-w-6xl",
  layerName = "",
  zIndexBoost = 0,
  disableBackdropClose = false,
}) {
  const stackApi = useLayerStack();
  const themeApi = useTheme();
  const isLight = themeApi?.theme === "light";
  const c = isLight ? LM.light : LM.dark;

  const idRef = useRef(`layer_${Math.random().toString(16).slice(2)}_${Date.now()}`);
  const id = idRef.current;

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const register = stackApi?.register;
  const unregister = stackApi?.unregister;
  const bringToTop = stackApi?.bringToTop;
  const registerClose = stackApi?.registerClose;
  const unregisterClose = stackApi?.unregisterClose;
  const stack = stackApi?.stack || [];

  useEffect(() => {
    if (!open || !register || !unregister || !bringToTop) return;
    register(id);
    bringToTop(id);
    return () => unregister(id);
  }, [open, id, register, unregister, bringToTop]);

  useEffect(() => {
    if (!open || !registerClose || !unregisterClose || !onClose) return;
    registerClose(id, onClose);
    return () => unregisterClose(id);
  }, [open, id, onClose, registerClose, unregisterClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = prev);
  }, [open]);

  const layerIndex = useMemo(() => {
    const idx = stack.indexOf(id);
    return idx >= 0 ? idx + 1 : 1;
  }, [stack, id]);

  const layerTotal = useMemo(() => (stack.length ? stack.length : 1), [stack]);

  const zIndex = useMemo(() => {
    const base = 60;
    return base + layerIndex * 20 + zIndexBoost;
  }, [layerIndex, zIndexBoost]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{
        zIndex,
        background: c.overlay,
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
      onPointerDown={(e) => {
        if (disableBackdropClose) return;
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        className={`w-full ${maxWidth} overflow-hidden`}
        style={{
          borderRadius: 28,
          border: `1px solid ${c.panelBorder}`,
          background: c.panelBg,
          boxShadow: c.panelShadow,
          backdropFilter: "blur(40px)",
          WebkitBackdropFilter: "blur(40px)",
        }}
      >
        {/* ── Header ── */}
        <div
          className="sticky top-0 z-10"
          style={{
            borderBottom: `1px solid ${c.headerBorder}`,
            background: c.headerBg,
            backdropFilter: "blur(28px)",
            WebkitBackdropFilter: "blur(28px)",
          }}
        >
          <div className="p-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="px-2 py-1 rounded-full text-[11px] font-semibold"
                  style={{
                    background: c.badgeBg,
                    border: `1px solid ${c.badgeBorder}`,
                    color: c.badgeText,
                  }}
                >
                  Layer {layerIndex}/{layerTotal}
                </span>
                {layerName ? (
                  <span className="text-[11px] font-medium" style={{ color: c.layerNameText }}>
                    {layerName}
                  </span>
                ) : null}
              </div>
              {sub ? (
                <div className="text-xs font-medium" style={{ color: c.subText }}>
                  {sub}
                </div>
              ) : null}
              {title ? (
                <div
                  className="text-xl font-bold truncate"
                  style={{ color: c.titleText }}
                >
                  {title}
                </div>
              ) : null}
            </div>
            <button
              onClick={onClose}
              className="shrink-0 w-11 h-11 rounded-2xl text-2xl leading-none flex items-center justify-center transition-all duration-200"
              style={{
                background: c.closeBg,
                border: `1px solid ${c.closeBorder}`,
                color: c.closeText,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = c.closeHoverBg;
                e.currentTarget.style.borderColor = c.closeHoverBorder;
                e.currentTarget.style.color = c.closeHoverText;
                e.currentTarget.style.transform = "rotate(90deg)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = c.closeBg;
                e.currentTarget.style.borderColor = c.closeBorder;
                e.currentTarget.style.color = c.closeText;
                e.currentTarget.style.transform = "";
              }}
              title="Close"
              type="button"
            >
              ×
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div
          className="p-4 max-h-[80vh] overflow-auto pr-1"
          style={{ background: c.bodyBg }}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

// components/CommitGate.js
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import SuggestInput from "@/components/SuggestInput";
import { useTheme } from "@/components/ThemeProvider";

const LS_KEY = "sysbyte_commit_suggestions_v1";

const CT = {
  dark: {
    overlay: "rgba(0,0,0,0.72)",
    panelBg: "rgba(12,12,28,0.96)",
    panelBorder: "rgba(255,255,255,0.08)",
    panelShadow: "0 0 80px rgba(99,102,241,0.12)",
    labelColor: "rgba(255,255,255,0.50)",
    titleColor: "#ffffff",
    subtitleColor: "rgba(255,255,255,0.55)",
    closeColor: "rgba(255,255,255,0.50)",
    closeHover: "#ffffff",
    btnGhostBg: "rgba(255,255,255,0.06)",
    btnGhostBorder: "rgba(255,255,255,0.08)",
    btnGhostHover: "rgba(255,255,255,0.10)",
    btnGhostText: "#ffffff",
    btnSolidBg: "#ffffff",
    btnSolidText: "#000000",
    hintColor: "rgba(255,255,255,0.40)",
    inputBg: "rgba(255,255,255,0.05)",
    inputBorder: "rgba(255,255,255,0.08)",
    inputText: "#ffffff",
    inputPlaceholder: "rgba(255,255,255,0.35)",
    inputFocusRing: "rgba(99,102,241,0.35)",
    dropBg: "rgba(6,6,15,0.95)",
    dropBorder: "rgba(255,255,255,0.08)",
    dropItemText: "rgba(255,255,255,0.85)",
    dropItemHover: "rgba(255,255,255,0.06)",
  },
  light: {
    overlay: "rgba(0,0,0,0.35)",
    panelBg: "rgba(255,255,255,0.97)",
    panelBorder: "rgba(0,0,0,0.08)",
    panelShadow: "0 20px 60px rgba(0,0,0,0.12)",
    labelColor: "rgba(15,23,42,0.45)",
    titleColor: "#0f172a",
    subtitleColor: "rgba(15,23,42,0.50)",
    closeColor: "rgba(15,23,42,0.40)",
    closeHover: "#0f172a",
    btnGhostBg: "rgba(0,0,0,0.04)",
    btnGhostBorder: "rgba(0,0,0,0.08)",
    btnGhostHover: "rgba(0,0,0,0.07)",
    btnGhostText: "#0f172a",
    btnSolidBg: "#0f172a",
    btnSolidText: "#ffffff",
    hintColor: "rgba(15,23,42,0.35)",
    inputBg: "rgba(0,0,0,0.03)",
    inputBorder: "rgba(0,0,0,0.08)",
    inputText: "#0f172a",
    inputPlaceholder: "rgba(15,23,42,0.35)",
    inputFocusRing: "rgba(161,98,7,0.25)",
    dropBg: "rgba(255,255,255,0.98)",
    dropBorder: "rgba(0,0,0,0.08)",
    dropItemText: "rgba(15,23,42,0.80)",
    dropItemHover: "rgba(0,0,0,0.04)",
  },
};

function loadLocalSuggestions() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const arr = JSON.parse(raw || "[]");
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveLocalSuggestions(list) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(list.slice(0, 200)));
  } catch {}
}

export function useCommitGate({ defaultSuggestions = [] } = {}) {
  const themeApi = useTheme();
  const isLight = themeApi?.theme === "light";
  const c = isLight ? CT.light : CT.dark;

  const resolver = useRef(null);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("Commit required");
  const [subtitle, setSubtitle] = useState("");
  const [value, setValue] = useState("");
  const [localSuggestions, setLocalSuggestions] = useState([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    setLocalSuggestions(loadLocalSuggestions());
  }, [open]);

  const suggestions = useMemo(() => {
    const merged = [...defaultSuggestions, ...localSuggestions];
    return Array.from(new Set(merged)).filter(Boolean);
  }, [defaultSuggestions, localSuggestions]);

  function requestCommit(opts = {}) {
    const {
      title = "Commit required",
      subtitle = "Please enter commit message",
      preset = "",
    } = opts;
    return new Promise((resolve, reject) => {
      resolver.current = { resolve, reject };
      setTitle(title);
      setSubtitle(subtitle);
      setValue(preset);
      setOpen(true);
    });
  }

  function closeCancel() {
    setOpen(false);
    const r = resolver.current;
    resolver.current = null;
    r?.reject?.(new Error("CANCELLED"));
  }

  function confirm() {
    const msg = String(value || "").trim();
    if (!msg) return;
    setOpen(false);
    const r = resolver.current;
    resolver.current = null;
    r?.resolve?.(msg);
  }

  function addToSuggestions() {
    const msg = String(value || "").trim();
    if (!msg) return;
    const next = Array.from(new Set([msg, ...localSuggestions]));
    setLocalSuggestions(next);
    saveLocalSuggestions(next);
  }

  const suggestColors = {
    inputBg: c.inputBg,
    inputBorder: c.inputBorder,
    inputText: c.inputText,
    inputPlaceholder: c.inputPlaceholder,
    inputFocusRing: c.inputFocusRing,
    dropBg: c.dropBg,
    dropBorder: c.dropBorder,
    dropItemText: c.dropItemText,
    dropItemHover: c.dropItemHover,
  };

  const CommitModalNode = open ? (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{
        zIndex: 999999,
        background: c.overlay,
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
    >
      <div
        className="w-full max-w-lg overflow-hidden"
        style={{
          borderRadius: 28,
          border: `1px solid ${c.panelBorder}`,
          background: c.panelBg,
          boxShadow: c.panelShadow,
          backdropFilter: "blur(40px)",
          WebkitBackdropFilter: "blur(40px)",
        }}
      >
        <div className="p-5 flex items-start justify-between gap-3">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: c.labelColor }}>
              Commit Detector
            </div>
            <div className="text-xl font-bold mt-0.5" style={{ color: c.titleColor }}>
              {title}
            </div>
            <div className="text-sm mt-1" style={{ color: c.subtitleColor }}>
              {subtitle}
            </div>
          </div>
          <button
            type="button"
            onClick={closeCancel}
            className="text-2xl leading-none transition-colors duration-150 shrink-0 mt-1"
            style={{ color: c.closeColor }}
            onMouseEnter={(e) => { e.currentTarget.style.color = c.closeHover; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = c.closeColor; }}
          >
            ×
          </button>
        </div>

        <div className="px-5 pb-5">
          <SuggestInput
            themeColors={suggestColors}
            allowScroll
            value={value}
            onChange={setValue}
            suggestions={suggestions}
            placeholder="Write commit message..."
          />

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={addToSuggestions}
              className="flex-1 px-4 py-2.5 rounded-2xl text-sm font-semibold border transition-all duration-200"
              style={{
                background: c.btnGhostBg,
                borderColor: c.btnGhostBorder,
                color: c.btnGhostText,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = c.btnGhostHover; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = c.btnGhostBg; }}
            >
              + Add Suggestion
            </button>
            <button
              type="button"
              disabled={!String(value || "").trim()}
              onClick={confirm}
              className="flex-1 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all duration-200 disabled:opacity-50"
              style={{
                background: c.btnSolidBg,
                color: c.btnSolidText,
              }}
            >
              Confirm
            </button>
          </div>

          <div className="mt-3 text-[11px]" style={{ color: c.hintColor }}>
            Commit will be asked only when an action happens (Assign/Out/Edit/etc).
          </div>
        </div>
      </div>
    </div>
  ) : null;

  const CommitModal = open && mounted ? createPortal(CommitModalNode, document.body) : null;

  return { requestCommit, CommitModal };
}

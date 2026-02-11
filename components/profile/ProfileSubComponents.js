// components/profile/ProfileSubComponents.js
"use client";

import { useState, useMemo } from "react";

export function SectionHeader({ icon, label, c }) {
  return (
    <div className="sm:col-span-2 flex items-center gap-3 mt-5 mb-1">
      <span className="text-lg">{icon}</span>
      <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: c.sectionLabel }}>
        {label}
      </span>
      <div className="flex-1 h-px" style={{ background: c.sectionLine }} />
    </div>
  );
}

export function Field({ label, value, onChange, required, placeholder, type = "text", error, c, disabled, hint }) {
  return (
    <div>
      <div className="text-[11px] font-semibold mb-1.5 flex items-center gap-1" style={{ color: c.labelColor }}>
        {label}
        {required && <span style={{ color: c.requiredStar }}>*</span>}
      </div>
      <input
        value={value}
        type={type}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full rounded-2xl border px-4 py-3 text-[13px] outline-none transition-all duration-200"
        style={{
          background: disabled ? c.inputDisabledBg : c.inputBg,
          borderColor: error ? c.errorInline : c.inputBorder,
          color: disabled ? c.inputDisabledText : c.inputText,
        }}
        onFocusCapture={(e) => {
          if (!disabled) {
            e.currentTarget.style.boxShadow = `0 0 0 3px ${c.inputFocusRing}`;
            e.currentTarget.style.borderColor = c.inputBorderFocus;
          }
        }}
        onBlurCapture={(e) => {
          e.currentTarget.style.boxShadow = "none";
          e.currentTarget.style.borderColor = error ? c.errorInline : c.inputBorder;
        }}
      />
      {error && <div className="text-[11px] mt-1 font-medium" style={{ color: c.errorInline }}>{error}</div>}
      {hint && !error && <div className="text-[10px] mt-1" style={{ color: c.hintColor }}>{hint}</div>}
    </div>
  );
}

export function Select({ label, value, onChange, options, required, c, disabled, error, children }) {
  return (
    <div>
      <div className="text-[11px] font-semibold mb-1.5 flex items-center gap-1" style={{ color: c.labelColor }}>
        {label}
        {required && <span style={{ color: c.requiredStar }}>*</span>}
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full rounded-2xl border px-4 py-3 text-[13px] outline-none transition-all duration-200 appearance-none"
        style={{
          background: disabled ? c.inputDisabledBg : c.inputBg,
          borderColor: error ? c.errorInline : c.inputBorder,
          color: disabled ? c.inputDisabledText : c.inputText,
        }}
        onFocusCapture={(e) => {
          if (!disabled) e.currentTarget.style.boxShadow = `0 0 0 3px ${c.inputFocusRing}`;
        }}
        onBlurCapture={(e) => { e.currentTarget.style.boxShadow = "none"; }}
      >
        {children || (
          <>
            <option value="">Select...</option>
            {(options || []).map((x, idx) => <option key={`${x}_${idx}`} value={x}>{x}</option>)}
          </>
        )}
      </select>
      {error && <div className="text-[11px] mt-1 font-medium" style={{ color: c.errorInline }}>{error}</div>}
    </div>
  );
}

export function Toggle({ label, val, setVal, c }) {
  return (
    <button
      type="button"
      onClick={() => setVal(!val)}
      className="rounded-2xl border px-3.5 py-2.5 text-left transition-all duration-200 w-full"
      style={{
        background: val ? c.toggleOn : c.toggleOff,
        borderColor: val ? c.toggleOnBorder : c.toggleOffBorder,
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[12px] font-semibold" style={{ color: val ? c.toggleOnText : c.toggleOffText }}>
            {label}
          </div>
          <div className="text-[10px] font-bold mt-0.5" style={{ color: val ? c.toggleOnSub : c.toggleOffSub }}>
            {val ? "YES" : "NO"}
          </div>
        </div>
        <div
          className="w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200"
          style={{ background: val ? c.toggleDot : c.toggleDotOff }}
        >
          {val && (
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
              <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      </div>
    </button>
  );
}

export function ReviewLine({ k, v, c, alt }) {
  return (
    <div
      className="flex items-start justify-between gap-3 px-4 py-2.5 rounded-xl"
      style={{ background: alt ? c.reviewRowAlt : "transparent" }}
    >
      <div className="text-[12px] font-medium" style={{ color: c.reviewKey }}>{k}</div>
      <div className="text-[12px] font-semibold text-right break-words max-w-[60%]" style={{ color: c.reviewVal }}>
        {String(v ?? "").trim() || "—"}
      </div>
    </div>
  );
}

export function ErrorBanner({ message, c }) {
  if (!message) return null;
  return (
    <div
      className="mb-4 rounded-2xl border px-4 py-3 text-[13px] font-medium flex items-center gap-2"
      style={{ background: c.errorBg, borderColor: c.errorBorder, color: c.errorText }}
    >
      <span>⚠️</span> {message}
    </div>
  );
}

export function LoadingSpinner({ c, size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className="animate-spin" style={{ color: c.loadingDot }}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.2" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function Divider({ c }) {
  return <div className="h-px w-full" style={{ background: c.divider }} />;
}

export function TabBar({ tabs, active, onChange, c }) {
  return (
    <div
      className="flex rounded-2xl border overflow-hidden"
      style={{ borderColor: c.tabBorder }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          className="flex-1 px-4 py-2.5 text-[12px] font-bold transition-all duration-200 flex items-center justify-center gap-1.5"
          style={{
            background: active === tab.key ? c.tabActiveBg : c.tabInactiveBg,
            color: active === tab.key ? c.tabActiveText : c.tabInactiveText,
          }}
        >
          {tab.icon && <span>{tab.icon}</span>}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// components/SuggestInput.js
"use client";
import { useMemo, useState } from "react";

export default function SuggestInput({
  value,
  onChange,
  suggestions = [],
  placeholder,
  themeColors = null,
  allowScroll = true,
}) {
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const v = (value || "").toLowerCase();
    const list = v
      ? suggestions.filter((s) => String(s).toLowerCase().includes(v))
      : suggestions;
    return list.slice(0, 120);
  }, [value, suggestions]);

  // Fallback colors if no themeColors passed (backward compat)
  const c = themeColors || {
    inputBg: "rgba(0,0,0,0.3)",
    inputBorder: "rgba(255,255,255,0.10)",
    inputText: "#ffffff",
    inputPlaceholder: "rgba(255,255,255,0.40)",
    inputFocusRing: "rgba(99,102,241,0.35)",
    dropBg: "rgba(0,0,0,0.92)",
    dropBorder: "rgba(255,255,255,0.10)",
    dropItemText: "rgba(255,255,255,0.90)",
    dropItemHover: "rgba(255,255,255,0.08)",
  };

  return (
    <div className="relative">
      <input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        placeholder={placeholder}
        className="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition-all duration-200"
        style={{
          background: c.inputBg,
          borderColor: c.inputBorder,
          color: c.inputText,
          boxShadow: "none",
        }}
        onFocus2={null}
        onFocusCapture={(e) => {
          e.currentTarget.style.boxShadow = `0 0 0 3px ${c.inputFocusRing}`;
        }}
        onBlurCapture={(e) => {
          e.currentTarget.style.boxShadow = "none";
          setTimeout(() => setOpen(false), 120);
        }}
      />

      {open && filtered.length > 0 && (
        <div
          className={`absolute z-[200] mt-2 w-full rounded-2xl border overflow-hidden backdrop-blur-xl ${
            allowScroll ? "max-h-60 overflow-y-auto" : ""
          }`}
          style={{
            background: c.dropBg,
            borderColor: c.dropBorder,
          }}
        >
          {filtered.map((s) => (
            <button
              type="button"
              key={s}
              onMouseDown={() => {
                onChange(String(s));
                setOpen(false);
              }}
              className="w-full text-left px-4 py-2.5 text-xs font-medium transition-colors duration-100"
              style={{ color: c.dropItemText }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = c.dropItemHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// components/profile/ProfileActionsPanel.js
"use client";

import { useState } from "react";
import SuggestInput from "@/components/SuggestInput";
import { LoadingSpinner } from "./ProfileSubComponents";

const noteSuggestions = [
  "Bring ID proof",
  "Arrive 10 minutes early",
  "First time visitor",
  "VIP",
  "Needs follow-up",
  "Confirmed by family",
];

export default function ProfileActionsPanel({
  source, c, busy,
  approveStep, setApproveStep,
  mode, setMode,
  pickedDate, setPickedDate,
  note, setNote,
  isApproveForShift,
  onApprove,
  onOpenDatePicker,
}) {
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

  return (
    <div
      className="rounded-2xl border p-4 transition-all duration-200"
      style={{ background: c.panelBg, borderColor: c.panelBorder }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">⚡</span>
        <div className="text-[13px] font-bold" style={{ color: c.t1 }}>Actions</div>
      </div>

      {/* Action cards */}
      <div className="space-y-2">
        <ActionCard
          icon="📅"
          title="Approve For Container"
          description={
            isApproveForShift
              ? "Shift meeting card to selected container"
              : source === "PENDING"
              ? "Assign pending customer to container"
              : "Assign to calendar container"
          }
          active={!!approveStep}
          onClick={() => {
            if (!approveStep) setApproveStep("pickDate");
          }}
          c={c}
        />
      </div>

      {/* Approve flow */}
      {approveStep && (
        <div
          className="mt-4 rounded-2xl border p-4"
          style={{
            background: c.glassBg,
            borderColor: c.panelBorder,
            animation: "fadeSlide 0.25s ease-out",
          }}
        >
          {approveStep === "pickDate" && (
            <div>
              <div className="text-[13px] font-bold mb-3" style={{ color: c.t1 }}>
                Step 1: Pick Date & Mode
              </div>

              {/* Mode toggle */}
              <div
                className="flex rounded-2xl border overflow-hidden mb-3"
                style={{ borderColor: c.panelBorder }}
              >
                <button
                  type="button"
                  onClick={() => { setMode("DIKSHA"); setPickedDate(null); setNote(""); }}
                  className="flex-1 px-4 py-2.5 text-[12px] font-bold transition-all duration-200"
                  style={{
                    background: mode === "DIKSHA" ? c.btnSolidBg : c.btnGhostBg,
                    color: mode === "DIKSHA" ? c.btnSolidText : c.btnGhostText,
                  }}
                >
                  🔱 Diksha
                </button>
                <button
                  type="button"
                  onClick={() => { setMode("MEETING"); setPickedDate(null); setNote(""); }}
                  className="flex-1 px-4 py-2.5 text-[12px] font-bold transition-all duration-200"
                  style={{
                    background: mode === "MEETING" ? c.btnSolidBg : c.btnGhostBg,
                    color: mode === "MEETING" ? c.btnSolidText : c.btnGhostText,
                  }}
                >
                  📋 Meeting
                </button>
              </div>

              {/* Date selector button */}
              <button
                type="button"
                onClick={onOpenDatePicker}
                className="w-full rounded-2xl border px-4 py-3.5 text-left transition-all duration-200"
                style={{
                  background: c.inputBg,
                  borderColor: pickedDate ? c.acc : c.inputBorder,
                  color: c.t1,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = c.panelHover; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = c.inputBg; }}
              >
                <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: c.t3 }}>
                  Selected Date
                </div>
                <div className="text-[14px] font-bold mt-0.5" style={{ color: pickedDate ? c.acc : c.t3 }}>
                  {pickedDate || "Tap to open Calendar →"}
                </div>
              </button>

              <div className="text-[10px] mt-2" style={{ color: c.hintColor }}>
                Calendar picker → select date → confirm
              </div>
            </div>
          )}

          {approveStep === "note" && (
            <div>
              <div className="text-[13px] font-bold mb-1" style={{ color: c.t1 }}>
                Step 2: Note & Submit
              </div>
              <div className="text-[11px] mb-3" style={{ color: c.t3 }}>
                Date: <span className="font-bold" style={{ color: c.acc }}>{pickedDate}</span> • {mode}
              </div>

              <SuggestInput
                themeColors={suggestColors}
                allowScroll
                value={note}
                onChange={setNote}
                suggestions={noteSuggestions}
                placeholder="Note (optional)..."
              />

              <button
                type="button"
                disabled={busy}
                onClick={() => onApprove()}
                className="mt-3 w-full px-4 py-3 rounded-2xl text-[13px] font-bold transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: c.btnSolidBg, color: c.btnSolidText }}
              >
                {busy ? <LoadingSpinner c={{ loadingDot: c.btnSolidText }} size={16} /> : null}
                {busy
                  ? "Processing..."
                  : isApproveForShift
                  ? "🔄 Approve For (Shift Now)"
                  : "📤 Push to Container"}
              </button>

              <button
                type="button"
                disabled={busy}
                onClick={() => setApproveStep("pickDate")}
                className="mt-2 w-full px-4 py-2.5 rounded-2xl text-[12px] font-semibold border transition-all duration-200 disabled:opacity-50"
                style={{ background: c.btnGhostBg, borderColor: c.btnGhostBorder, color: c.btnGhostText }}
              >
                ← Change Date
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ActionCard({ icon, title, description, active, onClick, c }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl border p-3.5 text-left transition-all duration-200"
      style={{
        background: active ? c.panelHover : c.glassBg,
        borderColor: active ? c.acc : c.panelBorder,
        boxShadow: active ? `0 0 0 1px ${c.acc}40` : "none",
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = c.panelHover;
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = c.glassBg;
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
          style={{ background: active ? `${c.acc}18` : c.badgeBg }}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-bold" style={{ color: c.t1 }}>{title}</div>
          <div className="text-[11px] mt-0.5" style={{ color: c.t3 }}>{description}</div>
        </div>
        <span
          className="text-sm transition-transform duration-200"
          style={{ color: c.t3, transform: active ? "rotate(90deg)" : "rotate(0deg)" }}
        >
          ›
        </span>
      </div>
    </button>
  );
}

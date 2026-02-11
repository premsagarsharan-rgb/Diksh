// components/profile/ProfileDoneModal.js
"use client";

import LayerModal from "@/components/LayerModal";

export default function ProfileDoneModal({ open, onClose, message, c }) {
  return (
    <LayerModal
      open={open}
      layerName="Done"
      title="Done"
      sub="Operation completed"
      onClose={onClose}
      maxWidth="max-w-md"
      disableBackdropClose
    >
      <div
        className="rounded-3xl border p-8 text-center"
        style={{ background: c.doneBg, borderColor: c.panelBorder }}
      >
        {/* Checkmark */}
        <div
          className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4"
          style={{ background: c.accG }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <div className="text-2xl font-black" style={{ color: c.t1 }}>
          {message || "Done!"}
        </div>
        <div className="text-[13px] mt-1" style={{ color: c.t3 }}>
          Close to continue.
        </div>

        <div className="mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-8 py-3 rounded-2xl text-[13px] font-bold transition-all duration-200"
            style={{ background: c.btnSolidBg, color: c.btnSolidText }}
          >
            Close
          </button>
        </div>
      </div>
    </LayerModal>
  );
}

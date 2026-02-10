// components/SessionGuard.js
"use client";

import { useEffect, useRef, useState } from "react";

export default function SessionGuard() {
  const [expired, setExpired] = useState(false);
  const intervalRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    async function checkSession() {
      try {
        const res = await fetch("/api/auth/check-session", {
          cache: "no-store",
          credentials: "include",
        });
        const data = await res.json().catch(() => ({}));

        if (!mountedRef.current) return;

        if (data.valid === false) {
          setExpired(true);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      } catch {
        // Network error — retry karega
      }
    }

    // Pehle 5 sec baad check
    const initialTimeout = setTimeout(checkSession, 5000);

    // Har 60 sec pe check (ab kick nahi hoga toh zyada frequent zaruri nahi)
    intervalRef.current = setInterval(checkSession, 60000);

    // Tab visible hone pe check
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        checkSession();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      mountedRef.current = false;
      clearTimeout(initialTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  if (!expired) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" />

      <div className="relative w-full max-w-sm">
        <div className="rounded-3xl border border-amber-500/20 bg-gradient-to-b from-gray-900 to-black shadow-[0_0_80px_rgba(245,158,11,0.15)] overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500" />

          <div className="pt-8 pb-2 flex justify-center">
            <div className="w-20 h-20 rounded-full bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center">
              <svg
                className="w-10 h-10 text-amber-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>

          <div className="px-6 pt-4 pb-2 text-center">
            <h2 className="text-xl font-bold text-white">Session Expired</h2>

            <div className="mt-4 rounded-2xl border border-amber-400/15 bg-amber-500/8 p-4">
              <p className="text-sm text-amber-200/90 leading-relaxed">
                Aapka session expire ho gaya hai. Please dubara login karo.
              </p>
            </div>
          </div>

          <div className="p-6 pt-4">
            <button
              onClick={() => {
                window.location.href = "/login";
              }}
              className="w-full py-3.5 rounded-2xl bg-white text-black font-semibold text-sm transition-all active:scale-[0.98]"
            >
              Login Page pe Jaao
            </button>
          </div>

          <div className="px-6 pb-5">
            <div className="flex items-center justify-center gap-2 text-[11px] text-white/30">
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                />
              </svg>
              <span>Session security check</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

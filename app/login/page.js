// app/(auth)/login/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [checkingSession, setCheckingSession] = useState(true);

  // Already logged in modal state
  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const [blockedMessage, setBlockedMessage] = useState("");
  const [blockedMessage2, setBlockedMessage2] = useState("");

  // Mount pe check — valid session hai toh seedha dashboard
  useEffect(() => {
    let cancelled = false;

    async function checkExistingSession() {
      try {
        const res = await fetch("/api/auth/check-session", {
          method: "GET",
          credentials: "include",
        });
        if (!cancelled && res.ok) {
          const data = await res.json();
          if (data.valid) {
            router.replace("/dashboard");
            return;
          }
        }
      } catch (e) {
        console.log("Session check fail, login pe raho:", e);
      }
      if (!cancelled) {
        setCheckingSession(false);
      }
    }

    checkExistingSession();
    return () => {
      cancelled = true;
    };
  }, [router]);

  // Back button pe login page pe hi raho
  useEffect(() => {
    try {
      window.history.replaceState({ page: "login" }, "", window.location.href);
      window.history.pushState(
        { page: "login", buffer: true },
        "",
        window.location.href
      );
    } catch {}

    function onPopState() {
      try {
        window.history.pushState(
          { page: "login", buffer: true },
          "",
          window.location.href
        );
      } catch {}
    }

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 409 && data.error === "ALREADY_LOGGED_IN") {
        // Ultra UIX Modal dikhao
        setBlockedMessage(
          data.message || "Someone is already logged in using this account."
        );
        setBlockedMessage2(
          data.message2 || "Contact your senior to resolve this."
        );
        setShowBlockedModal(true);
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setErr(data.error || data.message || "Login failed");
        setLoading(false);
        return;
      }

      // Clean navigation
      window.location.href = "/dashboard";
    } catch {
      setErr("Network error");
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Checking session...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ═══════ BLOCKED MODAL — Ultra UIX ═══════ */}
      {showBlockedModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            onClick={() => setShowBlockedModal(false)}
          />

          {/* Modal Card */}
          <div className="relative w-full max-w-sm animate-in zoom-in-95 fade-in duration-300">
            <div className="rounded-3xl border border-red-500/20 bg-gradient-to-b from-gray-900 to-black shadow-[0_0_80px_rgba(239,68,68,0.15)] overflow-hidden">
              {/* Top Red Accent Bar */}
              <div className="h-1.5 bg-gradient-to-r from-red-500 via-orange-500 to-red-500" />

              {/* Icon */}
              <div className="pt-8 pb-2 flex justify-center">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center">
                    <svg
                      className="w-10 h-10 text-red-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                      />
                    </svg>
                  </div>
                  {/* Pulse ring */}
                  <div className="absolute inset-0 rounded-full border-2 border-red-500/20 animate-ping" />
                </div>
              </div>

              {/* Content */}
              <div className="px-6 pt-4 pb-2 text-center">
                <h2 className="text-xl font-bold text-white">
                  Access Denied
                </h2>

                {/* Primary Message */}
                <div className="mt-4 rounded-2xl border border-red-400/15 bg-red-500/8 p-4">
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center mt-0.5">
                      <svg
                        className="w-4 h-4 text-red-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 9v2m0 4h.01"
                        />
                      </svg>
                    </div>
                    <p className="text-sm text-red-200/90 text-left leading-relaxed">
                      {blockedMessage}
                    </p>
                  </div>
                </div>

                {/* Secondary Message — Contact Senior */}
                <div className="mt-3 rounded-2xl border border-amber-400/15 bg-amber-500/8 p-4">
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center mt-0.5">
                      <svg
                        className="w-4 h-4 text-amber-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
                        />
                      </svg>
                    </div>
                    <p className="text-sm text-amber-200/90 text-left leading-relaxed">
                      {blockedMessage2}
                    </p>
                  </div>
                </div>

                {/* Device Info Badge */}
                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[11px] text-white/50">
                    Another device is currently active
                  </span>
                </div>
              </div>

              {/* Button */}
              <div className="p-6 pt-4">
                <button
                  onClick={() => setShowBlockedModal(false)}
                  className="w-full py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-semibold text-sm transition-all active:scale-[0.98]"
                >
                  Understood
                </button>
              </div>

              {/* Bottom accent */}
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
                  <span>Single device policy enforced</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ LOGIN FORM ═══════ */}
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_0_70px_rgba(59,130,246,0.12)] overflow-hidden fade-up">
          <div className="p-6">
            <div className="text-xs text-white/60">Secure Login</div>
            <h1 className="text-2xl font-bold mt-1">Sysbyte Dashboard</h1>
            <p className="text-sm text-white/60 mt-1">
              Admin (Boss) / User (Employee)
            </p>

            {err ? (
              <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {err}
              </div>
            ) : null}

            <form onSubmit={submit} className="mt-5 space-y-3">
              <input
                className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/40"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
              <input
                type="password"
                className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/40"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />

              <button
                disabled={loading}
                className="w-full rounded-2xl bg-white text-black font-semibold py-3 shadow-[0_0_40px_rgba(255,255,255,0.10)] hover:shadow-[0_0_60px_rgba(255,255,255,0.15)] transition disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Login"}
              </button>
            </form>
          </div>

          <div className="px-6 py-4 border-t border-white/10 text-xs text-white/50">
            🔐 Single device login only. If already logged in elsewhere, access
            will be denied.
          </div>
        </div>
      </div>
    </>
  );
}

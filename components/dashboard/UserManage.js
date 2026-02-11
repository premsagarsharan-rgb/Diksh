// components/dashboard/UserManagement.js
"use client";

import { useEffect, useState } from "react";
import BufferSpinner from "@/components/BufferSpinner";

const PERM_KEYS = [
  { key: "recent", label: "Recent" },
  { key: "add", label: "Add" },
  { key: "calander", label: "Calander" },
  { key: "pending", label: "Pending" },
  { key: "sitting", label: "Sitting" },
  { key: "tracker", label: "Tracker" },
  { key: "screensCreate", label: "Screens: Create" },
  { key: "screensView", label: "Screens: View" },
];

const DEFAULT_USER_PERMS = {
  recent: true,
  add: true,
  calander: true,
  pending: true,
  sitting: false,
  tracker: false,
  screensCreate: false,
  screensView: false,
  screens: false,
};

function normalizePerms(p) {
  const base = { ...DEFAULT_USER_PERMS, ...(p || {}) };
  if (typeof base.screens === "boolean") {
    if (typeof base.screensCreate !== "boolean") base.screensCreate = base.screens;
    if (typeof base.screensView !== "boolean") base.screensView = base.screens;
  }
  base.screens = !!(base.screensCreate || base.screensView);
  return base;
}

function timeAgo(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function shortDevice(ua) {
  if (!ua || ua === "Unknown") return "Unknown Device";
  const s = String(ua);
  if (s.includes("Mobile")) return "📱 Mobile";
  if (s.includes("Android")) return "📱 Android";
  if (s.includes("iPhone")) return "📱 iPhone";
  if (s.includes("iPad")) return "📱 iPad";
  if (s.includes("Windows")) return "💻 Windows";
  if (s.includes("Mac")) return "💻 Mac";
  if (s.includes("Linux")) return "💻 Linux";
  if (s.includes("Chrome")) return "🌐 Chrome";
  if (s.includes("Firefox")) return "🌐 Firefox";
  if (s.includes("Safari")) return "🌐 Safari";
  return "🖥 Device";
}

export default function UserManage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [permDraft, setPermDraft] = useState({});
  const [deviceDraft, setDeviceDraft] = useState({});
  const [savingDevice, setSavingDevice] = useState({});
  const [kicking, setKicking] = useState({});
  const [expandedSessions, setExpandedSessions] = useState({});

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      const data = await res.json().catch(() => ({}));
      const list = data.items || data.users || [];
      setItems(list);

      const d = {};
      const dd = {};
      list.forEach((u) => {
        d[u._id] = normalizePerms(u.permissions);
        dd[u._id] = u.maxDevices || 1;
      });
      setPermDraft(d);
      setDeviceDraft(dd);
    } catch {
      setItems([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function toggle(userId, key) {
    setPermDraft((prev) => {
      const nextUser = normalizePerms(prev[userId] || {});
      nextUser[key] = !nextUser[key];
      nextUser.screens = !!(nextUser.screensCreate || nextUser.screensView);
      return { ...prev, [userId]: nextUser };
    });
  }

  async function savePermissions(userId) {
    const permissions = normalizePerms(permDraft[userId]);
    const res = await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ permissions }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return alert(data.error || "Save failed");
    alert("Permissions updated");
    load();
  }

  async function resetPassword(userId, username) {
    const pass = prompt(`New password for ${username}?`);
    if (!pass) return;
    const res = await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pass }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return alert(data.error || "Reset failed");
    alert("Password updated");
  }

  async function toggleActive(userId, active) {
    const res = await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return alert(data.error || "Update failed");
    load();
  }

  async function saveMaxDevices(userId) {
    const maxDevices = deviceDraft[userId] || 1;
    setSavingDevice((prev) => ({ ...prev, [userId]: true }));
    try {
      const res = await fetch(`/api/users/${userId}/max-devices`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maxDevices }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return alert(data.error || "Failed to update device limit");
      load();
    } finally {
      setSavingDevice((prev) => ({ ...prev, [userId]: false }));
    }
  }

  async function kickAllSessions(userId, username) {
    const ok = confirm(
      `Force logout ALL devices for "${username}"?\n\nAll active sessions will be terminated immediately.`
    );
    if (!ok) return;

    setKicking((prev) => ({ ...prev, [userId]: true }));
    try {
      const res = await fetch(`/api/users/${userId}/kick-sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return alert(data.error || "Kick failed");
      alert(`${data.sessionsKicked || 0} session(s) terminated for ${username}`);
      load();
    } finally {
      setKicking((prev) => ({ ...prev, [userId]: false }));
    }
  }

  function toggleSessionExpand(userId) {
    setExpandedSessions((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 gap-2 text-white/60">
        <BufferSpinner size={18} /> Loading users...
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-semibold text-lg">
          User Manage (Permissions & Devices)
        </h2>
        <button
          onClick={load}
          className="px-3 py-2 rounded-xl bg-white/10 border border-white/10 text-white hover:bg-white/15"
        >
          Refresh
        </button>
      </div>

      {items.length === 0 ? (
        <div className="text-white/60">No users</div>
      ) : (
        <div className="space-y-4">
          {items.map((u) => {
            const activeCount = u.activeSessionCount || (Array.isArray(u.activeSessions) ? u.activeSessions.length : 0);
            const maxDev = u.maxDevices || 1;
            const sessions = u.activeSessions || [];
            const isExpanded = expandedSessions[u._id];
            const isSavingDev = savingDevice[u._id];
            const isKicking = kicking[u._id];
            const draftMax = deviceDraft[u._id] || 1;
            const draftChanged = draftMax !== maxDev;

            return (
              <div
                key={u._id}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_0_35px_rgba(59,130,246,0.10)]"
              >
                {/* ═══════ Header ═══════ */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="text-white font-semibold">{u.username}</div>
                      {/* Active sessions badge */}
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
                          activeCount > 0
                            ? "bg-emerald-500/15 border-emerald-400/20 text-emerald-200"
                            : "bg-white/10 border-white/10 text-white/50"
                        }`}
                      >
                        {activeCount > 0 ? (
                          <>
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1 animate-pulse" />
                            {activeCount} active
                          </>
                        ) : (
                          "Offline"
                        )}
                      </span>
                    </div>
                    <div className="text-xs text-white/60 mt-0.5">
                      Role: {u.role} | Active: {u.active ? "YES" : "NO"} | Max
                      Devices: {maxDev}
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => toggleActive(u._id, u.active)}
                      className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs"
                    >
                      {u.active ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={() => resetPassword(u._id, u.username)}
                      className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs"
                    >
                      Reset Pass
                    </button>
                  </div>
                </div>

                {/* ═══════ Device Management Section ═══════ */}
                <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm">📱</span>
                    <div className="text-sm font-semibold text-white">
                      Device Management
                    </div>
                  </div>

                  {/* Max Devices Control */}
                  <div className="rounded-xl border border-white/10 bg-black/20 p-3 mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs text-white/60">
                        Max Devices Allowed
                      </div>
                      <div className="text-lg font-bold text-white">
                        {draftMax}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={1}
                        max={5}
                        step={1}
                        value={draftMax}
                        onChange={(e) =>
                          setDeviceDraft((prev) => ({
                            ...prev,
                            [u._id]: parseInt(e.target.value, 10),
                          }))
                        }
                        className="flex-1 h-2 rounded-full appearance-none bg-white/10 accent-blue-500 cursor-pointer"
                      />
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            onClick={() =>
                              setDeviceDraft((prev) => ({
                                ...prev,
                                [u._id]: n,
                              }))
                            }
                            className={`w-8 h-8 rounded-lg text-xs font-bold transition ${
                              draftMax === n
                                ? "bg-blue-500 text-white"
                                : "bg-white/10 text-white/60 hover:bg-white/15"
                            }`}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>

                    {draftChanged ? (
                      <button
                        onClick={() => saveMaxDevices(u._id)}
                        disabled={isSavingDev}
                        className="mt-2 w-full px-3 py-2 rounded-xl bg-blue-500 text-white text-xs font-semibold disabled:opacity-60 flex items-center justify-center gap-2 active:scale-[0.98] transition"
                      >
                        {isSavingDev ? (
                          <>
                            <BufferSpinner size={14} /> Saving...
                          </>
                        ) : (
                          `Save: ${maxDev} → ${draftMax} devices`
                        )}
                      </button>
                    ) : null}
                  </div>

                  {/* Active Sessions */}
                  <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs text-white/60">
                        Active Sessions ({activeCount}/{maxDev})
                      </div>
                      <div className="flex gap-1.5">
                        {activeCount > 0 ? (
                          <button
                            onClick={() => toggleSessionExpand(u._id)}
                            className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-[10px] text-white/70"
                          >
                            {isExpanded ? "Hide" : "Show"}
                          </button>
                        ) : null}
                        {activeCount > 0 ? (
                          <button
                            onClick={() =>
                              kickAllSessions(u._id, u.username)
                            }
                            disabled={isKicking}
                            className="px-2.5 py-1 rounded-lg bg-red-500/15 hover:bg-red-500/25 border border-red-400/20 text-[10px] text-red-200 font-medium disabled:opacity-60 flex items-center gap-1"
                          >
                            {isKicking ? (
                              <BufferSpinner size={10} />
                            ) : (
                              "🔴"
                            )}
                            Kick All
                          </button>
                        ) : null}
                      </div>
                    </div>

                    {/* Session usage bar */}
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden mb-2">
                      <div
                        className={`h-full rounded-full transition-all ${
                          activeCount >= maxDev
                            ? "bg-red-500/60"
                            : activeCount > 0
                            ? "bg-emerald-500/60"
                            : "bg-white/10"
                        }`}
                        style={{
                          width: `${Math.min(
                            100,
                            (activeCount / maxDev) * 100
                          )}%`,
                        }}
                      />
                    </div>

                    <div className="text-[10px] text-white/40">
                      {activeCount === 0
                        ? "No active sessions"
                        : activeCount >= maxDev
                        ? "⚠️ All device slots used — new logins will be blocked"
                        : `${maxDev - activeCount} slot${
                            maxDev - activeCount > 1 ? "s" : ""
                          } available`}
                    </div>

                    {/* Expanded session list */}
                    {isExpanded && sessions.length > 0 ? (
                      <div className="mt-3 space-y-2">
                        {sessions.map((s, idx) => (
                          <div
                            key={idx}
                            className="rounded-xl border border-white/10 bg-white/5 p-2.5"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                                  <div className="text-xs font-medium text-white truncate">
                                    {shortDevice(s.deviceLabel)}
                                  </div>
                                </div>
                                <div className="text-[10px] text-white/40 mt-1 ml-3.5">
                                  IP: {s.ip || "unknown"}
                                </div>
                                <div className="text-[10px] text-white/40 ml-3.5">
                                  Login: {timeAgo(s.createdAt)}
                                </div>
                              </div>
                              <div className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/20 text-emerald-200 shrink-0">
                                #{idx + 1}
                              </div>
                            </div>

                            {/* Full User-Agent (collapsed) */}
                            <details className="mt-1.5 ml-3.5">
                              <summary className="text-[9px] text-white/30 cursor-pointer hover:text-white/50">
                                Full device info
                              </summary>
                              <div className="text-[9px] text-white/30 mt-1 break-all leading-relaxed">
                                {s.deviceLabel || "Unknown"}
                              </div>
                            </details>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* ═══════ Permissions Section ═══════ */}
                {u.role === "ADMIN" ? (
                  <div className="mt-3 text-xs text-white/60">
                    Admin has all components by default (permissions not
                    required).
                  </div>
                ) : (
                  <>
                    <div className="mt-4 text-xs text-white/60 mb-2">
                      Dashboard Components Allowed:
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
                      {PERM_KEYS.map((p) => (
                        <label
                          key={p.key}
                          className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs"
                        >
                          <input
                            type="checkbox"
                            checked={!!permDraft?.[u._id]?.[p.key]}
                            onChange={() => toggle(u._id, p.key)}
                          />
                          <span className="text-white/80">{p.label}</span>
                        </label>
                      ))}
                    </div>

                    <button
                      onClick={() => savePermissions(u._id)}
                      className="mt-3 px-4 py-2 rounded-xl bg-white text-black font-semibold"
                    >
                      Save Permissions
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

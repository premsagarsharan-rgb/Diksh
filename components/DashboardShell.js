// components/DashboardShell.js
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import LayerModal from "@/components/LayerModal";
import ThemeToggle from "@/components/ThemeToggle";
import { useTheme } from "@/components/ThemeProvider";

import RecentCustomer from "@/components/dashboard/RecentCustomer";
import AddCustomer from "@/components/dashboard/AddCustomer";
import Calander from "@/components/dashboard/Calander";
import Pending from "@/components/dashboard/Pending";
import SittingData from "@/components/dashboard/SittingData";
import UserCreate from "@/components/dashboard/UserCreate";
import UserManage from "@/components/dashboard/UserManage";
import CustomerLocationTracker from "@/components/dashboard/CustomerLocationTracker";
import Trash from "@/components/dashboard/Trash";

import ScreensCreate from "@/components/dashboard/ScreenCreate";
import ScreensViewer from "@/components/dashboard/ScreenViewer";

/* ────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────── */

function normalizePerms(input) {
  const base = {
    recent: true,
    add: true,
    calander: true,
    pending: true,
    sitting: false,
    tracker: false,
    trash: true,
    screensCreate: true,
    screensView: true,
    screens: true,
    ...(input || {}),
  };
  if (typeof base.screens === "boolean") {
    if (typeof base.screensCreate !== "boolean") base.screensCreate = base.screens;
    if (typeof base.screensView !== "boolean") base.screensView = base.screens;
  }
  base.screens = !!(base.screensCreate || base.screensView);
  return base;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning ☀️";
  if (h < 17) return "Good afternoon 🌤️";
  return "Good evening 🌙";
}

/* tile icons */
const TILE_ICONS = {
  recent: "📋",
  add: "➕",
  calander: "📅",
  pending: "⏸️",
  sitting: "🪑",
  trash: "🗑️",
  tracker: "📍",
  screensCreate: "🖥️",
  screensView: "👁️",
  usercreate: "👤",
  usermanage: "⚙️",
};

/* bottom nav pinned keys (mobile) */
const MOBILE_NAV_KEYS = ["recent", "add", "calander", "pending"];

/* ────────────────────────────────────────────
   Orbs Component (30% opacity, GPU-accelerated)
   ──────────────────────────────────────────── */

function BackgroundOrbs({ isLight }) {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {/* Orbs */}
      <div
        className="absolute rounded-full will-change-transform"
        style={{
          width: 600,
          height: 600,
          top: -200,
          left: -120,
          background: isLight
            ? "rgba(196,125,9,0.06)"
            : "rgba(59,130,246,0.07)",
          filter: "blur(100px)",
          animation: "orbFloat1 25s ease-in-out infinite",
          opacity: 0.3,
        }}
      />
      <div
        className="absolute rounded-full will-change-transform"
        style={{
          width: 450,
          height: 450,
          top: "45%",
          right: -160,
          background: isLight
            ? "rgba(180,83,9,0.05)"
            : "rgba(139,92,246,0.06)",
          filter: "blur(100px)",
          animation: "orbFloat2 30s ease-in-out infinite",
          animationDelay: "-8s",
          opacity: 0.3,
        }}
      />
      <div
        className="absolute rounded-full will-change-transform"
        style={{
          width: 380,
          height: 380,
          bottom: -120,
          left: "35%",
          background: isLight
            ? "rgba(196,125,9,0.04)"
            : "rgba(6,182,212,0.05)",
          filter: "blur(100px)",
          animation: "orbFloat3 35s ease-in-out infinite",
          animationDelay: "-16s",
          opacity: 0.3,
        }}
      />

      {/* Grid overlay */}
      <div
        className="fixed inset-0"
        style={{
          backgroundImage: isLight
            ? "linear-gradient(rgba(0,0,0,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,0.04) 1px,transparent 1px)"
            : "linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)",
          backgroundSize: "70px 70px",
          maskImage: "radial-gradient(ellipse at center,black 20%,transparent 70%)",
          WebkitMaskImage: "radial-gradient(ellipse at center,black 20%,transparent 70%)",
          opacity: 0.5,
        }}
      />
    </div>
  );
}

/* ────────────────────────────────────────────
   Spotlight Hook (cursor glow on tile)
   ──────────────────────────────────────────── */

function useSpotlight() {
  const ref = useRef(null);
  const spotRef = useRef({ x: 0, y: 0 });

  const onMouseMove = useCallback((e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    spotRef.current.x = e.clientX - rect.left;
    spotRef.current.y = e.clientY - rect.top;
    ref.current.style.setProperty("--spot-x", `${spotRef.current.x}px`);
    ref.current.style.setProperty("--spot-y", `${spotRef.current.y}px`);
  }, []);

  return { ref, onMouseMove };
}

/* ────────────────────────────────────────────
   TileCard Component
   ──────────────────────────────────────────── */

function TileCard({ tile, onClick, isLight, index }) {
  const { ref, onMouseMove } = useSpotlight();

  const accentColor = isLight ? "rgba(196,125,9,0.12)" : "rgba(59,130,246,0.12)";
  const accentBorder = isLight ? "rgba(196,125,9,0.4)" : "rgba(59,130,246,0.4)";
  const glowShadow = isLight
    ? "0 0 55px rgba(196,125,9,0.08)"
    : "0 0 55px rgba(59,130,246,0.08)";
  const hoverGlow = isLight
    ? "0 8px 40px rgba(196,125,9,0.12)"
    : "0 8px 40px rgba(59,130,246,0.14)";

  return (
    <button
      ref={ref}
      onClick={onClick}
      onMouseMove={onMouseMove}
      type="button"
      className={`
        group relative text-left rounded-3xl border backdrop-blur-xl
        overflow-hidden transition-all duration-300 outline-none
        flex flex-col
        p-6
        md:flex-col
        max-md:flex-row max-md:items-center max-md:gap-3.5 max-md:p-4 max-md:rounded-2xl
        ${isLight
          ? "border-black/[0.06] bg-white/60 hover:bg-white/80"
          : "border-white/[0.07] bg-white/[0.035] hover:bg-white/[0.07]"
        }
      `}
      style={{
        boxShadow: glowShadow,
        animationDelay: `${index * 60}ms`,
        "--spot-x": "50%",
        "--spot-y": "50%",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = hoverGlow;
        e.currentTarget.style.borderColor = accentBorder;
        e.currentTarget.style.transform = "translateY(-5px) scale(1.01)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = glowShadow;
        e.currentTarget.style.borderColor = "";
        e.currentTarget.style.transform = "";
      }}
    >
      {/* Spotlight radial glow */}
      <div
        className="absolute inset-0 rounded-inherit pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background:
            "radial-gradient(250px circle at var(--spot-x) var(--spot-y), rgba(255,255,255,0.06), transparent 70%)",
        }}
      />

      {/* Top accent bar on hover */}
      <div
        className={`
          absolute top-0 left-0 right-0 h-[3px] rounded-t-3xl max-md:rounded-t-2xl
          opacity-0 group-hover:opacity-100 transition-opacity duration-300
          ${isLight
            ? "bg-gradient-to-r from-amber-600 to-yellow-500"
            : "bg-gradient-to-r from-blue-500 to-purple-500"
          }
        `}
      />

      {/* Icon */}
      <div className="flex items-start justify-between mb-4 max-md:mb-0 max-md:shrink-0">
        <div
          className="w-[52px] h-[52px] max-md:w-[44px] max-md:h-[44px] rounded-2xl flex items-center justify-center text-[26px] max-md:text-[22px] relative"
          style={{ background: accentColor }}
        >
          {TILE_ICONS[tile.key] || "📦"}
          <div
            className="absolute -inset-[5px] rounded-2xl"
            style={{
              background: isLight ? "rgba(196,125,9,0.06)" : "rgba(59,130,246,0.06)",
            }}
          />
        </div>
        {/* Desktop: green dot */}
        <div className="hidden md:block">
          <div
            className="w-2 h-2 rounded-full bg-green-500"
            style={{
              boxShadow: "0 0 8px rgba(34,197,94,0.5)",
              animation: "pulseGreen 2s ease-in-out infinite",
            }}
          />
        </div>
      </div>

      {/* Text content */}
      <div className="flex-1 min-w-0">
        <div
          className={`text-[11px] font-semibold uppercase tracking-wider mb-1 ${
            isLight ? "text-black/30" : "text-white/38"
          }`}
        >
          {tile.sub}
        </div>
        <div
          className={`text-[19px] max-md:text-[15px] font-extrabold tracking-tight ${
            isLight ? "text-gray-900" : "text-white"
          }`}
        >
          {tile.title}
        </div>
      </div>

      {/* Desktop: footer */}
      <div className="hidden md:flex items-center justify-between mt-4">
        <div
          className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${
            isLight
              ? "text-black/30 group-hover:text-amber-700"
              : "text-white/38 group-hover:text-blue-400"
          }`}
        >
          Open{" "}
          <span className="inline-block transition-transform duration-300 group-hover:translate-x-1.5">
            →
          </span>
        </div>
        {tile.isAdmin && (
          <span
            className={`text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
              isLight
                ? "bg-amber-100 text-amber-700"
                : "bg-amber-500/12 text-amber-400"
            }`}
          >
            🔒 Admin
          </span>
        )}
      </div>

      {/* Mobile: arrow */}
      <div
        className={`md:hidden shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors ${
          isLight
            ? "bg-black/[0.04] text-black/30 group-hover:text-amber-700 group-hover:bg-amber-50"
            : "bg-white/[0.04] text-white/30 group-hover:text-blue-400 group-hover:bg-white/[0.07]"
        }`}
      >
        ›
      </div>
    </button>
  );
}

/* ────────────────────────────────────────────
   MoreSheet Component (Mobile bottom nav "More")
   ──────────────────────────────────────────── */

function MoreSheet({ open, tiles, onSelect, onClose, isLight }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90]" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Sheet from bottom */}
      <div
        className={`absolute bottom-[72px] left-0 right-0 rounded-t-3xl border-t overflow-hidden
          ${isLight
            ? "bg-white/95 border-black/[0.06]"
            : "bg-[#0a0a1a]/95 border-white/[0.07]"
          }
          backdrop-blur-2xl
        `}
        style={{
          animation: "slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)",
          maxHeight: "60vh",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pull indicator */}
        <div className="flex justify-center pt-3 pb-2">
          <div
            className={`w-9 h-1 rounded-full ${
              isLight ? "bg-black/10" : "bg-white/10"
            }`}
          />
        </div>

        <div className="px-4 pb-2">
          <div
            className={`text-xs font-bold uppercase tracking-wider ${
              isLight ? "text-black/30" : "text-white/38"
            }`}
          >
            All Modules
          </div>
        </div>

        <div className="px-3 pb-4 overflow-y-auto" style={{ maxHeight: "calc(60vh - 60px)" }}>
          {tiles.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => onSelect(t.key)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors text-left ${
                isLight
                  ? "hover:bg-black/[0.04] active:bg-black/[0.06]"
                  : "hover:bg-white/[0.04] active:bg-white/[0.07]"
              }`}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                style={{
                  background: isLight ? "rgba(196,125,9,0.10)" : "rgba(59,130,246,0.10)",
                }}
              >
                {TILE_ICONS[t.key] || "📦"}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-bold ${isLight ? "text-gray-900" : "text-white"}`}>
                  {t.title}
                </div>
                <div className={`text-xs ${isLight ? "text-black/40" : "text-white/40"}`}>
                  {t.sub}
                </div>
              </div>
              <span className={`text-lg ${isLight ? "text-black/20" : "text-white/20"}`}>›</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   MobileBottomNav Component
   ──────────────────────────────────────────── */

function MobileBottomNav({ tiles, onOpenTile, isLight }) {
  const [moreOpen, setMoreOpen] = useState(false);

  const pinnedTiles = useMemo(() => {
    return MOBILE_NAV_KEYS.map((k) => tiles.find((t) => t.key === k)).filter(Boolean);
  }, [tiles]);

  const allTiles = tiles;

  const handleNav = (key) => {
    if (key === "__more__") {
      setMoreOpen(true);
    } else {
      setMoreOpen(false);
      onOpenTile(key);
    }
  };

  const accentColor = isLight ? "#b45309" : "#3b82f6";

  return (
    <>
      <MoreSheet
        open={moreOpen}
        tiles={allTiles}
        onSelect={(k) => {
          setMoreOpen(false);
          onOpenTile(k);
        }}
        onClose={() => setMoreOpen(false)}
        isLight={isLight}
      />

      <nav
        className={`
          md:hidden fixed bottom-0 left-0 right-0 z-[80]
          flex justify-around items-center h-[72px] border-t backdrop-blur-2xl
          ${isLight
            ? "bg-white/90 border-black/[0.06]"
            : "bg-[#08081a]/92 border-white/[0.07]"
          }
        `}
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0)" }}
      >
        {pinnedTiles.map((t) => {
          const isAdd = t.key === "add";
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => handleNav(t.key)}
              className={`flex flex-col items-center gap-1 text-[10px] font-semibold py-1.5 px-2.5 rounded-xl transition-colors relative ${
                isLight ? "text-black/40" : "text-white/38"
              }`}
            >
              {isAdd ? (
                <span
                  className="flex items-center justify-center w-[52px] h-[52px] -mt-7 rounded-full text-white text-2xl"
                  style={{
                    background: isLight
                      ? "linear-gradient(135deg, #b45309, #d97706)"
                      : "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                    boxShadow: isLight
                      ? "0 4px 16px rgba(180,83,9,0.3)"
                      : "0 4px 16px rgba(59,130,246,0.3)",
                  }}
                >
                  ➕
                </span>
              ) : (
                <span className="text-xl">{TILE_ICONS[t.key]}</span>
              )}
              <span className={isAdd ? "-mt-1" : ""}>{t.title.split(" ")[0]}</span>
            </button>
          );
        })}

        {/* More button */}
        <button
          type="button"
          onClick={() => handleNav("__more__")}
          className={`flex flex-col items-center gap-1 text-[10px] font-semibold py-1.5 px-2.5 rounded-xl transition-colors ${
            moreOpen
              ? isLight
                ? "text-amber-700"
                : "text-blue-400"
              : isLight
              ? "text-black/40"
              : "text-white/38"
          }`}
        >
          <span className="text-xl">☰</span>
          <span>More</span>
          {moreOpen && (
            <span
              className="absolute -top-px left-1/2 -translate-x-1/2 w-5 h-[3px] rounded-b"
              style={{ background: accentColor }}
            />
          )}
        </button>
      </nav>
    </>
  );
}

/* ────────────────────────────────────────────
   MAIN: DashboardShell
   ──────────────────────────────────────────── */

export default function DashboardShell({ session }) {
  const themeApi = useTheme();
  const isLight = themeApi?.theme === "light";
  const isAdmin = session.role === "ADMIN";

  const perms = useMemo(() => normalizePerms(session.permissions), [session.permissions]);

  const can = useCallback(
    (key) => {
      if (isAdmin) return true;
      if (key === "screensCreate") return !!(perms.screensCreate || perms.screens);
      if (key === "screensView") return !!(perms.screensView || perms.screens);
      return !!perms[key];
    },
    [isAdmin, perms]
  );

  const tiles = useMemo(() => {
    const t = [];
    if (can("recent"))
      t.push({ key: "recent", title: "Recent", sub: "Today DB", C: RecentCustomer });
    if (can("add"))
      t.push({ key: "add", title: "Add Customer", sub: "Manual → Recent", C: AddCustomer });
    if (can("calander"))
      t.push({ key: "calander", title: "Calander", sub: "Containers", C: Calander });
    if (can("pending"))
      t.push({ key: "pending", title: "Pending", sub: "Paused", C: Pending });
    if (can("sitting"))
      t.push({ key: "sitting", title: "Sitting", sub: "ACTIVE", C: SittingData });
    if (can("trash"))
      t.push({ key: "trash", title: "Trash", sub: "Rejected Cards", C: Trash });
    if (can("tracker"))
      t.push({
        key: "tracker",
        title: "Tracker",
        sub: "Where is customer now?",
        C: CustomerLocationTracker,
      });
    if (can("screensCreate"))
      t.push({
        key: "screensCreate",
        title: "Screens Create",
        sub: "Create / Manage presentation screens",
        C: ScreensCreate,
      });
    if (can("screensView"))
      t.push({
        key: "screensView",
        title: "Screens View",
        sub: "View by 5-char code (viewer tool)",
        C: ScreensViewer,
      });
    if (isAdmin)
      t.push({
        key: "usercreate",
        title: "User Create",
        sub: "Create employee",
        C: UserCreate,
        isAdmin: true,
      });
    if (isAdmin)
      t.push({
        key: "usermanage",
        title: "User Manage",
        sub: "Permissions",
        C: UserManage,
        isAdmin: true,
      });
    return t;
  }, [isAdmin, can]);

  const [openKey, setOpenKey] = useState(null);
  const active = tiles.find((t) => t.key === openKey);
  const ActiveComp = active?.C;

  const greeting = useMemo(() => getGreeting(), []);

  /* ── render ── */
  return (
    <div
      className={`min-h-screen relative ${isLight ? "text-gray-900" : "text-white"}`}
      style={{ background: isLight ? "#f5f6fa" : "#050510" }}
    >
      {/* Animated background */}
      <BackgroundOrbs isLight={isLight} />

      {/* ─── Desktop Topbar ─── */}
      <header
        className={`
          hidden md:block sticky top-0 z-40 border-b backdrop-blur-2xl transition-all duration-300
          ${isLight
            ? "border-black/[0.06] bg-[#f5f6fa]/70"
            : "border-white/[0.07] bg-[#050510]/75"
          }
        `}
      >
        <div className="max-w-[1320px] mx-auto px-7 h-[68px] flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex flex-col">
            <span
              className={`text-[10px] uppercase tracking-[2px] font-bold ${
                isLight ? "text-black/30" : "text-white/38"
              }`}
            >
              Premium Dashboard
            </span>
            <span
              className={`text-xl font-black ${
                isLight ? "text-amber-700" : ""
              }`}
              style={
                !isLight
                  ? {
                      background: "linear-gradient(135deg,#3b82f6,#8b5cf6,#ec4899)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundSize: "200% 200%",
                      animation: "gradShift 4s ease infinite",
                    }
                  : undefined
              }
            >
              ⚡ Sysbyte WebApp
            </span>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[13px] font-bold">{session.username}</div>
              <div
                className={`text-[10px] uppercase tracking-[0.5px] font-semibold ${
                  session.role === "ADMIN"
                    ? "text-amber-500"
                    : isLight
                    ? "text-black/30"
                    : "text-white/38"
                }`}
              >
                {session.role}
              </div>
            </div>

            {/* Avatar */}
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-[15px] font-black text-white relative"
              style={{
                background: isLight
                  ? "linear-gradient(135deg,#b45309,#d97706)"
                  : "linear-gradient(135deg,#3b82f6,#8b5cf6)",
                boxShadow: isLight
                  ? "0 0 0 2px #f5f6fa, 0 0 0 4px #b45309"
                  : "0 0 0 2px #050510, 0 0 0 4px #3b82f6",
              }}
            >
              {session.username?.[0]?.toUpperCase() || "U"}
              <div
                className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2"
                style={{
                  borderColor: isLight ? "#f5f6fa" : "#050510",
                  animation: "pulseGreen 2s ease-in-out infinite",
                }}
              />
            </div>

            <ThemeToggle />

            <button
              className={`
                px-4 py-2 rounded-3xl text-[13px] font-semibold border transition-all duration-300
                ${isLight
                  ? "border-red-200 text-red-600 bg-red-50/50 hover:bg-red-100/60"
                  : "border-red-500/25 text-red-400 bg-transparent hover:bg-red-500/[0.08]"
                }
              `}
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
                window.location.href = "/login";
              }}
              type="button"
            >
              🚪 Logout
            </button>
          </div>
        </div>
      </header>

      {/* ─── Mobile Header ─── */}
      <header
        className={`
          md:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3.5
          border-b backdrop-blur-2xl
          ${isLight
            ? "border-black/[0.06] bg-[#f5f6fa]/70"
            : "border-white/[0.07] bg-[#050510]/75"
          }
        `}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black text-white relative"
            style={{
              background: isLight
                ? "linear-gradient(135deg,#b45309,#d97706)"
                : "linear-gradient(135deg,#3b82f6,#8b5cf6)",
            }}
          >
            {session.username?.[0]?.toUpperCase() || "U"}
            <div
              className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-green-500 border-2"
              style={{ borderColor: isLight ? "#f5f6fa" : "#050510" }}
            />
          </div>
          <div>
            <div className="text-sm font-extrabold">{session.username}</div>
            <div
              className={`text-[10px] uppercase tracking-[0.5px] font-semibold ${
                session.role === "ADMIN"
                  ? "text-amber-500"
                  : isLight
                  ? "text-black/30"
                  : "text-white/38"
              }`}
            >
              {session.role}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            className={`
              w-9 h-9 rounded-full flex items-center justify-center text-base border transition-all
              ${isLight
                ? "border-black/[0.06] bg-white/40 text-red-500"
                : "border-white/[0.07] bg-white/[0.04] text-red-400"
              }
            `}
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
              window.location.href = "/login";
            }}
            type="button"
            title="Logout"
          >
            🚪
          </button>
        </div>
      </header>

      {/* ─── Main Content ─── */}
      <main className="relative z-[1] max-w-[1320px] mx-auto px-7 max-md:px-3.5 py-8 max-md:py-4 pb-28 max-md:pb-[120px]">
        {/* Greeting */}
        <div className="mb-8 max-md:mb-5">
          <div
            className={`text-sm max-md:text-[13px] font-medium mb-1 ${
              isLight ? "text-black/30" : "text-white/38"
            }`}
          >
            {greeting}, {session.username}
          </div>
          <div className="text-[30px] max-md:text-[22px] font-black tracking-tight flex items-center gap-3.5 flex-wrap">
            Dashboard
            <span
              className="text-[11px] px-3 py-1 rounded-full text-white font-bold uppercase tracking-[0.5px]"
              style={{
                background: isLight
                  ? "linear-gradient(135deg,#b45309,#d97706)"
                  : "linear-gradient(135deg,#3b82f6,#8b5cf6)",
              }}
            >
              {tiles.length} modules
            </span>
          </div>
        </div>

        {/* Tile Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[18px] max-md:gap-3">
          {tiles.map((t, i) => (
            <TileCard
              key={t.key}
              tile={t}
              index={i}
              isLight={isLight}
              onClick={() => setOpenKey(t.key)}
            />
          ))}
        </div>
      </main>

      {/* ─── Footer (desktop only) ─── */}
      <footer
        className={`hidden md:block relative z-[1] text-center py-8 text-xs ${
          isLight ? "text-black/25" : "text-white/25"
        }`}
      >
        ⚡ Sysbyte WebApp · Premium Dashboard · Built with ❤️
      </footer>

      {/* ─── Mobile Bottom Nav ─── */}
      <MobileBottomNav
        tiles={tiles}
        onOpenTile={(key) => setOpenKey(key)}
        isLight={isLight}
      />

      {/* ─── LayerModal ─── */}
      <LayerModal
        open={!!active}
        zIndex={55}
        layerIndex={1}
        layerTotal={1}
        layerName="Dashboard Component"
        title={active?.title || ""}
        sub={active?.sub || ""}
        onClose={() => setOpenKey(null)}
        maxWidth="max-w-6xl"
      >
        {ActiveComp ? <ActiveComp role={session.role} session={session} /> : null}
      </LayerModal>

      {/* ─── Global CSS for animations ─── */}
      <style jsx global>{`
        @keyframes orbFloat1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(60px, -40px) scale(1.08); }
          50% { transform: translate(-30px, 50px) scale(0.92); }
          75% { transform: translate(40px, 25px) scale(1.04); }
        }
        @keyframes orbFloat2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-50px, 30px) scale(1.06); }
          66% { transform: translate(40px, -40px) scale(0.95); }
        }
        @keyframes orbFloat3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(50px, -30px) scale(1.1); }
        }
        @keyframes gradShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes pulseGreen {
          0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.4); }
          50% { box-shadow: 0 0 0 6px rgba(34,197,94,0); }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

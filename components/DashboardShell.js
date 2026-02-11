// components/DashboardShell.js
"use client";

import { useCallback, useMemo, useRef, useState } from "react";
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
   Theme Color Map — Single Source of Truth
   ──────────────────────────────────────────── */

const THEME = {
  dark: {
    pageBg: "#050510",
    topbarBg: "rgba(5,5,16,0.75)",
    mobileNavBg: "rgba(8,8,22,0.92)",
    cardBg: "rgba(255,255,255,0.035)",
    cardHoverBg: "rgba(255,255,255,0.07)",
    glassBg: "rgba(255,255,255,0.04)",
    sheetBg: "rgba(10,10,26,0.95)",

    border: "rgba(255,255,255,0.07)",
    borderHover: "rgba(59,130,246,0.4)",

    textPrimary: "#ffffff",
    textSecondary: "rgba(255,255,255,0.65)",
    textMuted: "rgba(255,255,255,0.38)",

    accent1: "#3b82f6",
    accent2: "#8b5cf6",
    accent3: "#ec4899",
    accentGrad: "linear-gradient(135deg,#3b82f6,#8b5cf6)",
    accentGradFull: "linear-gradient(135deg,#3b82f6,#8b5cf6,#ec4899)",

    iconBg: "rgba(59,130,246,0.12)",
    iconGlow: "rgba(59,130,246,0.06)",

    tileGlow: "0 0 55px rgba(59,130,246,0.08)",
    tileHoverGlow: "0 8px 40px rgba(59,130,246,0.14)",
    avatarRing: "0 0 0 2px #050510, 0 0 0 4px #3b82f6",
    mobileAddShadow: "0 4px 16px rgba(59,130,246,0.3)",

    spotlightBg:
      "radial-gradient(250px circle at var(--spot-x) var(--spot-y), rgba(255,255,255,0.06), transparent 70%)",

    topAccentGrad: "linear-gradient(90deg,#3b82f6,#8b5cf6)",

    adminBadgeBg: "rgba(245,158,11,0.12)",
    adminBadgeText: "#fbbf24",

    pullBar: "rgba(255,255,255,0.10)",

    logoutBorder: "rgba(239,68,68,0.25)",
    logoutText: "#f87171",
    logoutHoverBg: "rgba(239,68,68,0.08)",

    dotBorderColor: "#050510",
  },

  light: {
    pageBg: "#f5f6fa",
    topbarBg: "rgba(245,246,250,0.80)",
    mobileNavBg: "rgba(245,246,250,0.92)",
    cardBg: "rgba(255,255,255,0.75)",
    cardHoverBg: "rgba(255,255,255,0.92)",
    glassBg: "rgba(255,255,255,0.50)",
    sheetBg: "rgba(255,255,255,0.96)",

    border: "rgba(0,0,0,0.08)",
    borderHover: "rgba(180,83,9,0.35)",

    textPrimary: "#111827",
    textSecondary: "rgba(17,24,39,0.60)",
    textMuted: "rgba(17,24,39,0.35)",

    accent1: "#b45309",
    accent2: "#d97706",
    accent3: "#f59e0b",
    accentGrad: "linear-gradient(135deg,#b45309,#d97706)",
    accentGradFull: "linear-gradient(135deg,#b45309,#d97706,#f59e0b)",

    iconBg: "rgba(180,83,9,0.10)",
    iconGlow: "rgba(180,83,9,0.05)",

    tileGlow: "0 2px 20px rgba(0,0,0,0.04)",
    tileHoverGlow: "0 8px 40px rgba(180,83,9,0.10)",
    avatarRing: "0 0 0 2px #f5f6fa, 0 0 0 4px #b45309",
    mobileAddShadow: "0 4px 16px rgba(180,83,9,0.25)",

    spotlightBg:
      "radial-gradient(250px circle at var(--spot-x) var(--spot-y), rgba(180,83,9,0.04), transparent 70%)",

    topAccentGrad: "linear-gradient(90deg,#b45309,#d97706)",

    adminBadgeBg: "rgba(180,83,9,0.10)",
    adminBadgeText: "#92400e",

    pullBar: "rgba(0,0,0,0.10)",

    logoutBorder: "rgba(220,38,38,0.18)",
    logoutText: "#dc2626",
    logoutHoverBg: "rgba(220,38,38,0.06)",

    dotBorderColor: "#f5f6fa",
  },
};

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

const MOBILE_NAV_KEYS = ["recent", "add", "calander", "pending"];

/* ────────────────────────────────────────────
   Orbs + Grid Background
   ──────────────────────────────────────────── */

function BackgroundOrbs({ c, isLight }) {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
      <div
        className="absolute rounded-full will-change-transform"
        style={{
          width: 600,
          height: 600,
          top: -200,
          left: -120,
          background: c.accent1,
          opacity: isLight ? 0.04 : 0.07,
          filter: isLight ? "blur(120px)" : "blur(100px)",
          animation: "orbFloat1 25s ease-in-out infinite",
        }}
      />
      <div
        className="absolute rounded-full will-change-transform"
        style={{
          width: 450,
          height: 450,
          top: "45%",
          right: -160,
          background: c.accent2,
          opacity: isLight ? 0.03 : 0.06,
          filter: isLight ? "blur(120px)" : "blur(100px)",
          animation: "orbFloat2 30s ease-in-out infinite",
          animationDelay: "-8s",
        }}
      />
      <div
        className="absolute rounded-full will-change-transform"
        style={{
          width: 380,
          height: 380,
          bottom: -120,
          left: "35%",
          background: c.accent3,
          opacity: isLight ? 0.03 : 0.05,
          filter: isLight ? "blur(120px)" : "blur(100px)",
          animation: "orbFloat3 35s ease-in-out infinite",
          animationDelay: "-16s",
        }}
      />

      {/* Grid overlay */}
      <div
        className="fixed inset-0"
        style={{
          backgroundImage: `linear-gradient(${c.border} 1px,transparent 1px),linear-gradient(90deg,${c.border} 1px,transparent 1px)`,
          backgroundSize: "70px 70px",
          maskImage: "radial-gradient(ellipse at center,black 20%,transparent 70%)",
          WebkitMaskImage: "radial-gradient(ellipse at center,black 20%,transparent 70%)",
          opacity: isLight ? 0.3 : 0.5,
        }}
      />
    </div>
  );
}

/* ────────────────────────────────────────────
   Spotlight Hook
   ──────────────────────────────────────────── */

function useSpotlight() {
  const ref = useRef(null);
  const onMouseMove = useCallback((e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    ref.current.style.setProperty("--spot-x", `${e.clientX - rect.left}px`);
    ref.current.style.setProperty("--spot-y", `${e.clientY - rect.top}px`);
  }, []);
  return { ref, onMouseMove };
}

/* ────────────────────────────────────────────
   TileCard
   ──────────────────────────────────────────── */

function TileCard({ tile, onClick, c, index }) {
  const { ref, onMouseMove } = useSpotlight();

  return (
    <button
      ref={ref}
      onClick={onClick}
      onMouseMove={onMouseMove}
      type="button"
      className="group relative text-left rounded-3xl border backdrop-blur-xl overflow-hidden transition-all duration-300 outline-none flex flex-col p-6 md:flex-col max-md:flex-row max-md:items-center max-md:gap-3.5 max-md:p-4 max-md:rounded-2xl"
      style={{
        borderColor: c.border,
        background: c.cardBg,
        boxShadow: c.tileGlow,
        color: c.textPrimary,
        "--spot-x": "50%",
        "--spot-y": "50%",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = c.tileHoverGlow;
        e.currentTarget.style.borderColor = c.borderHover;
        e.currentTarget.style.background = c.cardHoverBg;
        e.currentTarget.style.transform = "translateY(-5px) scale(1.01)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = c.tileGlow;
        e.currentTarget.style.borderColor = c.border;
        e.currentTarget.style.background = c.cardBg;
        e.currentTarget.style.transform = "";
      }}
    >
      {/* Spotlight glow */}
      <div
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: c.spotlightBg, borderRadius: "inherit" }}
      />

      {/* Top accent bar on hover */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: c.topAccentGrad, borderRadius: "inherit" }}
      />

      {/* Icon */}
      <div className="flex items-start justify-between mb-4 max-md:mb-0 max-md:shrink-0">
        <div
          className="w-[52px] h-[52px] max-md:w-[44px] max-md:h-[44px] rounded-2xl flex items-center justify-center text-[26px] max-md:text-[22px] relative"
          style={{ background: c.iconBg }}
        >
          {TILE_ICONS[tile.key] || "📦"}
          <div
            className="absolute -inset-[5px] rounded-2xl"
            style={{ background: c.iconGlow }}
          />
        </div>
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

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div
          className="text-[11px] font-semibold uppercase tracking-wider mb-1"
          style={{ color: c.textMuted }}
        >
          {tile.sub}
        </div>
        <div
          className="text-[19px] max-md:text-[15px] font-extrabold tracking-tight"
          style={{ color: c.textPrimary }}
        >
          {tile.title}
        </div>
      </div>

      {/* Desktop footer */}
      <div className="hidden md:flex items-center justify-between mt-4">
        <div
          className="flex items-center gap-1.5 text-xs font-semibold transition-colors"
          style={{ color: c.textMuted }}
        >
          Open{" "}
          <span className="inline-block transition-transform duration-300 group-hover:translate-x-1.5">
            →
          </span>
        </div>
        {tile.isAdmin && (
          <span
            className="text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
            style={{ background: c.adminBadgeBg, color: c.adminBadgeText }}
          >
            🔒 Admin
          </span>
        )}
      </div>

      {/* Mobile arrow */}
      <div
        className="md:hidden shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors"
        style={{ background: c.glassBg, color: c.textMuted }}
      >
        ›
      </div>
    </button>
  );
}

/* ────────────────────────────────────────────
   MoreSheet (Mobile)
   ──────────────────────────────────────────── */

function MoreSheet({ open, tiles, onSelect, onClose, c }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="absolute bottom-[72px] left-0 right-0 rounded-t-3xl border-t overflow-hidden backdrop-blur-2xl"
        style={{
          background: c.sheetBg,
          borderColor: c.border,
          animation: "slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)",
          maxHeight: "60vh",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-9 h-1 rounded-full" style={{ background: c.pullBar }} />
        </div>

        <div className="px-4 pb-2">
          <div
            className="text-xs font-bold uppercase tracking-wider"
            style={{ color: c.textMuted }}
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
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors text-left"
              style={{ color: c.textPrimary }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = c.glassBg;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                style={{ background: c.iconBg }}
              >
                {TILE_ICONS[t.key] || "📦"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold">{t.title}</div>
                <div className="text-xs" style={{ color: c.textMuted }}>
                  {t.sub}
                </div>
              </div>
              <span style={{ color: c.textMuted }}>›</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   MobileBottomNav
   ──────────────────────────────────────────── */

function MobileBottomNav({ tiles, onOpenTile, c }) {
  const [moreOpen, setMoreOpen] = useState(false);

  const pinnedTiles = useMemo(() => {
    return MOBILE_NAV_KEYS.map((k) => tiles.find((t) => t.key === k)).filter(Boolean);
  }, [tiles]);

  const handleNav = (key) => {
    if (key === "__more__") {
      setMoreOpen(true);
    } else {
      setMoreOpen(false);
      onOpenTile(key);
    }
  };

  return (
    <>
      <MoreSheet
        open={moreOpen}
        tiles={tiles}
        onSelect={(k) => {
          setMoreOpen(false);
          onOpenTile(k);
        }}
        onClose={() => setMoreOpen(false)}
        c={c}
      />

      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-[80] flex justify-around items-center h-[72px] border-t backdrop-blur-2xl"
        style={{
          background: c.mobileNavBg,
          borderColor: c.border,
          paddingBottom: "env(safe-area-inset-bottom, 0)",
        }}
      >
        {pinnedTiles.map((t) => {
          const isAdd = t.key === "add";
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => handleNav(t.key)}
              className="flex flex-col items-center gap-1 text-[10px] font-semibold py-1.5 px-2.5 rounded-xl transition-colors relative"
              style={{ color: c.textMuted }}
            >
              {isAdd ? (
                <span
                  className="flex items-center justify-center w-[52px] h-[52px] -mt-7 rounded-full text-white text-2xl"
                  style={{
                    background: c.accentGrad,
                    boxShadow: c.mobileAddShadow,
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

        <button
          type="button"
          onClick={() => handleNav("__more__")}
          className="flex flex-col items-center gap-1 text-[10px] font-semibold py-1.5 px-2.5 rounded-xl transition-colors relative"
          style={{ color: moreOpen ? c.accent1 : c.textMuted }}
        >
          <span className="text-xl">☰</span>
          <span>More</span>
          {moreOpen && (
            <span
              className="absolute -top-px left-1/2 -translate-x-1/2 w-5 h-[3px] rounded-b"
              style={{ background: c.accent1 }}
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

  const c = isLight ? THEME.light : THEME.dark;

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

  return (
    <div className="min-h-screen relative" style={{ background: c.pageBg, color: c.textPrimary }}>
      <BackgroundOrbs c={c} isLight={isLight} />

      {/* ─── Desktop Topbar ─── */}
      <header
        className="hidden md:block sticky top-0 z-40 border-b backdrop-blur-2xl transition-all duration-300"
        style={{ borderColor: c.border, background: c.topbarBg }}
      >
        <div className="max-w-[1320px] mx-auto px-7 h-[68px] flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span
              className="text-[10px] uppercase tracking-[2px] font-bold"
              style={{ color: c.textMuted }}
            >
              Premium Dashboard
            </span>
            <span
              className="text-xl font-black"
              style={
                isLight
                  ? { color: c.accent1 }
                  : {
                      background: c.accentGradFull,
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundSize: "200% 200%",
                      animation: "gradShift 4s ease infinite",
                    }
              }
            >
              ⚡ Sysbyte WebApp
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[13px] font-bold" style={{ color: c.textPrimary }}>
                {session.username}
              </div>
              <div
                className="text-[10px] uppercase tracking-[0.5px] font-semibold"
                style={{ color: session.role === "ADMIN" ? "#f59e0b" : c.textMuted }}
              >
                {session.role}
              </div>
            </div>

            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-[15px] font-black text-white relative"
              style={{ background: c.accentGrad, boxShadow: c.avatarRing }}
            >
              {session.username?.[0]?.toUpperCase() || "U"}
              <div
                className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500"
                style={{
                  border: `2px solid ${c.dotBorderColor}`,
                  animation: "pulseGreen 2s ease-in-out infinite",
                }}
              />
            </div>

            <ThemeToggle />

            <button
              className="px-4 py-2 rounded-3xl text-[13px] font-semibold border transition-all duration-300"
              style={{
                borderColor: c.logoutBorder,
                color: c.logoutText,
                background: "transparent",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = c.logoutHoverBg;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
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
        className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3.5 border-b backdrop-blur-2xl"
        style={{ borderColor: c.border, background: c.topbarBg }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black text-white relative"
            style={{ background: c.accentGrad }}
          >
            {session.username?.[0]?.toUpperCase() || "U"}
            <div
              className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-green-500"
              style={{ border: `2px solid ${c.dotBorderColor}` }}
            />
          </div>
          <div>
            <div className="text-sm font-extrabold" style={{ color: c.textPrimary }}>
              {session.username}
            </div>
            <div
              className="text-[10px] uppercase tracking-[0.5px] font-semibold"
              style={{ color: session.role === "ADMIN" ? "#f59e0b" : c.textMuted }}
            >
              {session.role}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            className="w-9 h-9 rounded-full flex items-center justify-center text-base border transition-all"
            style={{
              borderColor: c.border,
              background: c.glassBg,
              color: c.logoutText,
            }}
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
        <div className="mb-8 max-md:mb-5">
          <div
            className="text-sm max-md:text-[13px] font-medium mb-1"
            style={{ color: c.textMuted }}
          >
            {greeting}, {session.username}
          </div>
          <div
            className="text-[30px] max-md:text-[22px] font-black tracking-tight flex items-center gap-3.5 flex-wrap"
            style={{ color: c.textPrimary }}
          >
            Dashboard
            <span
              className="text-[11px] px-3 py-1 rounded-full text-white font-bold uppercase tracking-[0.5px]"
              style={{ background: c.accentGrad }}
            >
              {tiles.length} modules
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[18px] max-md:gap-3">
          {tiles.map((t, i) => (
            <TileCard
              key={t.key}
              tile={t}
              index={i}
              c={c}
              onClick={() => setOpenKey(t.key)}
            />
          ))}
        </div>
      </main>

      <footer
        className="hidden md:block relative z-[1] text-center py-8 text-xs"
        style={{ color: c.textMuted }}
      >
        ⚡ Sysbyte WebApp · Premium Dashboard · Built with ❤️
      </footer>

      <MobileBottomNav tiles={tiles} onOpenTile={(key) => setOpenKey(key)} c={c} />

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

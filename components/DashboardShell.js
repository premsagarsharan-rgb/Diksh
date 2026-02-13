// components/DashboardShell.js
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import LayerModal from "@/components/LayerModal";
import ThemeToggle from "@/components/ThemeToggle";
import { useTheme } from "@/components/ThemeProvider";

import RecentCustomer from "@/components/dashboard/RecentCustomer";
import AddCustomer from "@/components/dashboard/AddCustomer";
import MeetingCalander from "@/components/dashboard/MeetingCalander";
import DikshaCalander from "@/components/dashboard/DikshaCalander";
import Pending from "@/components/dashboard/Pending";
import SittingData from "@/components/dashboard/SittingData";
import UserCreate from "@/components/dashboard/UserCreate";
import UserManage from "@/components/dashboard/UserManage";
import CustomerLocationTracker from "@/components/dashboard/CustomerLocationTracker";
import Trash from "@/components/dashboard/Trash";
import ScreensCreate from "@/components/dashboard/ScreenCreate";
import ScreensViewer from "@/components/dashboard/ScreenViewer";

/* ═══════════════════════════════════════════════
   THEME — Dual Color System
   ═══════════════════════════════════════════════ */

const T = {
  dark: {
    page: "#06060f",
    topbar: "rgba(6,6,15,0.82)",
    nav: "rgba(6,6,15,0.90)",
    card: "rgba(255,255,255,0.04)",
    cardH: "rgba(255,255,255,0.08)",
    cardA: "rgba(255,255,255,0.12)",
    glass: "rgba(255,255,255,0.05)",
    sheet: "rgba(12,12,28,0.96)",
    b: "rgba(255,255,255,0.08)",
    bH: "rgba(99,102,241,0.5)",
    bCard: "rgba(255,255,255,0.06)",
    t1: "#ffffff",
    t2: "rgba(255,255,255,0.62)",
    t3: "rgba(255,255,255,0.34)",
    acc: "#818cf8",
    acc2: "#a78bfa",
    accG: "linear-gradient(135deg,#6366f1,#a78bfa,#f472b6)",
    accGBtn: "linear-gradient(135deg,#6366f1,#818cf8)",
    iconBg: "rgba(99,102,241,0.14)",
    iconGlow: "rgba(99,102,241,0.08)",
    glow: "0 0 0 1px rgba(99,102,241,0.08)",
    glowH: "0 0 0 1px rgba(99,102,241,0.25), 0 20px 50px -12px rgba(99,102,241,0.18)",
    avatarRing: "0 0 0 2px #06060f, 0 0 0 3.5px #818cf8",
    addShadow: "0 6px 24px rgba(99,102,241,0.35)",
    spot: "radial-gradient(300px circle at var(--mx) var(--my),rgba(99,102,241,0.10),transparent 65%)",
    topBar: "linear-gradient(90deg,#6366f1,#a78bfa)",
    adminBg: "rgba(251,191,36,0.10)",
    adminT: "#fbbf24",
    pull: "rgba(255,255,255,0.12)",
    logoutB: "rgba(248,113,113,0.20)",
    logoutT: "#f87171",
    logoutH: "rgba(248,113,113,0.10)",
    dot: "#06060f",
    neu: "none",
    neuH: "none",
    orbA: "rgba(99,102,241,0.06)",
    orbB: "rgba(168,85,247,0.05)",
    orbC: "rgba(244,114,182,0.04)",
    gridO: 0.35,
  },
  light: {
    page: "#f4f4f8",
    topbar: "rgba(244,244,248,0.78)",
    nav: "rgba(244,244,248,0.90)",
    card: "rgba(255,255,255,0.72)",
    cardH: "rgba(255,255,255,0.92)",
    cardA: "rgba(255,255,255,1)",
    glass: "rgba(255,255,255,0.55)",
    sheet: "rgba(255,255,255,0.97)",
    b: "rgba(0,0,0,0.07)",
    bH: "rgba(161,98,7,0.40)",
    bCard: "rgba(0,0,0,0.05)",
    t1: "#0f172a",
    t2: "rgba(15,23,42,0.58)",
    t3: "rgba(15,23,42,0.32)",
    acc: "#a16207",
    acc2: "#ca8a04",
    accG: "linear-gradient(135deg,#92400e,#b45309,#d97706)",
    accGBtn: "linear-gradient(135deg,#a16207,#ca8a04)",
    iconBg: "rgba(161,98,7,0.09)",
    iconGlow: "rgba(161,98,7,0.04)",
    glow: "0 1px 3px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)",
    glowH: "0 0 0 1px rgba(161,98,7,0.22), 0 20px 50px -12px rgba(161,98,7,0.10)",
    avatarRing: "0 0 0 2px #f4f4f8, 0 0 0 3.5px #a16207",
    addShadow: "0 6px 24px rgba(161,98,7,0.25)",
    spot: "radial-gradient(300px circle at var(--mx) var(--my),rgba(161,98,7,0.06),transparent 65%)",
    topBar: "linear-gradient(90deg,#a16207,#ca8a04)",
    adminBg: "rgba(120,53,15,0.08)",
    adminT: "#78350f",
    pull: "rgba(0,0,0,0.10)",
    logoutB: "rgba(220,38,38,0.14)",
    logoutT: "#dc2626",
    logoutH: "rgba(220,38,38,0.06)",
    dot: "#f4f4f8",
    neu: "6px 6px 14px rgba(0,0,0,0.06), -4px -4px 10px rgba(255,255,255,0.80)",
    neuH: "8px 8px 18px rgba(0,0,0,0.08), -5px -5px 12px rgba(255,255,255,0.90)",
    orbA: "rgba(161,98,7,0.04)",
    orbB: "rgba(202,138,4,0.03)",
    orbC: "rgba(217,119,6,0.03)",
    gridO: 0.2,
  },
};

/* ═══════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════ */

function normalizePerms(input) {
  const base = {
    recent: true, add: true, calander: true, pending: true,
    sitting: false, tracker: false, trash: true,
    screensCreate: true, screensView: true, screens: true,
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

const ICONS = {
  recent: "📋", add: "➕", meeting: "📋", diksha: "🪔", pending: "⏸️",
  sitting: "🪑", trash: "🗑️", tracker: "📍",
  screensCreate: "🖥️", screensView: "👁️",
  usercreate: "👤", usermanage: "⚙️",
};

const NAV_KEYS = ["recent", "add", "meeting", "pending"];

/* ═══════════════════════════════════════════════
   CalanderTile — Special tile that renders both buttons
   ═══════════════════════════════════════════════ */

function CalanderTile({ c, isLight, role, idx }) {
  return (
    <div
      className="relative text-left"
      style={{
        borderRadius: isLight ? 22 : 24,
        border: `1px solid ${c.bCard}`,
        background: c.card,
        boxShadow: isLight ? c.neu : c.glow,
        color: c.t1,
        overflow: "hidden",
        animationDelay: `${idx * 50}ms`,
      }}
    >
      {/* Inner content */}
      <div className="relative z-[1] w-full p-6 max-md:p-4">
        {/* Icon + Title */}
        <div className="flex items-start justify-between mb-4">
          <div
            className="relative flex items-center justify-center rounded-2xl"
            style={{
              width: 56, height: 56,
              background: c.iconBg,
              fontSize: 28,
            }}
          >
            📅
            <div
              className="absolute -inset-1 rounded-2xl"
              style={{ background: c.iconGlow }}
            />
          </div>
          <div
            className="hidden md:block w-2 h-2 rounded-full"
            style={{
              background: "#22c55e",
              boxShadow: "0 0 6px rgba(34,197,94,0.6)",
              animation: "pulse2 2s ease-in-out infinite",
            }}
          />
        </div>

        <div
          className="text-[10.5px] font-bold uppercase tracking-[0.8px] mb-1.5"
          style={{ color: c.t3 }}
        >
          Containers
        </div>
        <div
          className="text-[20px] max-md:text-[15px] font-extrabold tracking-[-0.4px] leading-tight mb-4"
          style={{ color: c.t1 }}
        >
          Calander
        </div>

        {/* Two buttons side by side */}
        <div className="flex gap-3">
          <MeetingCalander role={role} />
          <DikshaCalander role={role} />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Background — GPU Composited Only
   ═══════════════════════════════════════════════ */

function BgLayer({ c, isLight }) {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden>
      <div
        className="absolute will-change-transform"
        style={{
          width: 550, height: 550, top: -180, left: -100,
          borderRadius: "50%",
          background: c.orbA,
          transform: "translateZ(0)",
          animation: "orb1 22s ease-in-out infinite",
        }}
      />
      <div
        className="absolute will-change-transform"
        style={{
          width: 420, height: 420, top: "40%", right: -140,
          borderRadius: "50%",
          background: c.orbB,
          transform: "translateZ(0)",
          animation: "orb2 28s ease-in-out infinite",
          animationDelay: "-6s",
        }}
      />
      <div
        className="absolute will-change-transform"
        style={{
          width: 360, height: 360, bottom: -100, left: "30%",
          borderRadius: "50%",
          background: c.orbC,
          transform: "translateZ(0)",
          animation: "orb3 32s ease-in-out infinite",
          animationDelay: "-14s",
        }}
      />
      <div
        className="fixed inset-0"
        style={{
          backgroundImage: `linear-gradient(${c.b} 1px,transparent 1px),linear-gradient(90deg,${c.b} 1px,transparent 1px)`,
          backgroundSize: "64px 64px",
          opacity: c.gridO,
          maskImage: "radial-gradient(ellipse at center,black 15%,transparent 65%)",
          WebkitMaskImage: "radial-gradient(ellipse at center,black 15%,transparent 65%)",
        }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════
   TileCard — Neumorphism + Glass + Neon Edge + Spotlight
   ═══════════════════════════════════════════════ */

function TileCard({ tile, onClick, c, isLight, idx }) {
  const ref = useRef(null);
  const raf = useRef(null);

  const onMove = useCallback((e) => {
    if (raf.current) return;
    raf.current = requestAnimationFrame(() => {
      if (!ref.current) { raf.current = null; return; }
      const r = ref.current.getBoundingClientRect();
      ref.current.style.setProperty("--mx", `${e.clientX - r.left}px`);
      ref.current.style.setProperty("--my", `${e.clientY - r.top}px`);
      raf.current = null;
    });
  }, []);

  useEffect(() => () => { if (raf.current) cancelAnimationFrame(raf.current); }, []);

  return (
    <button
      ref={ref}
      onClick={onClick}
      onMouseMove={onMove}
      type="button"
      className="group relative text-left outline-none transition-transform duration-200 ease-out flex"
      style={{
        "--mx": "50%", "--my": "50%",
        borderRadius: isLight ? 22 : 24,
        border: `1px solid ${c.bCard}`,
        background: c.card,
        boxShadow: isLight ? c.neu : c.glow,
        color: c.t1,
        padding: 0,
        overflow: "hidden",
        animationDelay: `${idx * 50}ms`,
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.transform = "translateY(-6px) scale(1.015)";
        el.style.boxShadow = isLight ? c.neuH : c.glowH;
        el.style.borderColor = c.bH;
        el.style.background = c.cardH;
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.transform = "";
        el.style.boxShadow = isLight ? c.neu : c.glow;
        el.style.borderColor = c.bCard;
        el.style.background = c.card;
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = "translateY(-2px) scale(0.985)";
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = "translateY(-6px) scale(1.015)";
      }}
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none"
        style={{
          background: c.spot,
          borderRadius: "inherit",
          transition: "opacity 0.2s",
        }}
      />
      <div
        className="absolute top-0 left-[10%] right-[10%] h-[2px] opacity-0 group-hover:opacity-100"
        style={{
          background: c.topBar,
          borderRadius: "0 0 2px 2px",
          transition: "opacity 0.25s",
        }}
      />
      <div className="relative z-[1] w-full flex flex-col p-6 md:p-6 max-md:flex-row max-md:items-center max-md:gap-3 max-md:p-4">
        <div className="flex items-start justify-between mb-4 max-md:mb-0 max-md:shrink-0">
          <div
            className="relative flex items-center justify-center rounded-2xl max-md:rounded-xl"
            style={{
              width: 56, height: 56,
              background: c.iconBg,
              fontSize: 28,
            }}
          >
            {ICONS[tile.key] || "📦"}
            <div
              className="absolute -inset-1 rounded-2xl max-md:rounded-xl"
              style={{ background: c.iconGlow }}
            />
          </div>
          <div
            className="hidden md:block w-2 h-2 rounded-full"
            style={{
              background: "#22c55e",
              boxShadow: "0 0 6px rgba(34,197,94,0.6)",
              animation: "pulse2 2s ease-in-out infinite",
            }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div
            className="text-[10.5px] font-bold uppercase tracking-[0.8px] mb-1.5 max-md:mb-0.5"
            style={{ color: c.t3 }}
          >
            {tile.sub}
          </div>
          <div
            className="text-[20px] max-md:text-[15px] font-extrabold tracking-[-0.4px] leading-tight"
            style={{ color: c.t1 }}
          >
            {tile.title}
          </div>
        </div>
        <div className="hidden md:flex items-center justify-between mt-5">
          <span
            className="text-[12px] font-semibold flex items-center gap-1.5"
            style={{ color: c.t3 }}
          >
            Open
            <span
              className="inline-block transition-transform duration-200 group-hover:translate-x-2"
              style={{ color: c.acc }}
            >
              →
            </span>
          </span>
          {tile.isAdmin && (
            <span
              className="text-[9px] font-bold uppercase px-2.5 py-1 rounded-full tracking-wide"
              style={{ background: c.adminBg, color: c.adminT }}
            >
              🔒 Admin
            </span>
          )}
        </div>
        <div
          className="md:hidden shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-200"
          style={{ background: c.glass, color: c.t3, fontSize: 16 }}
        >
          <span className="group-hover:translate-x-0.5 inline-block transition-transform duration-200">
            ›
          </span>
        </div>
      </div>
    </button>
  );
}

/* ═══════════════════════════════════════════════
   MoreSheet (Mobile)
   ═══════════════════════════════════════════════ */

function MoreSheet({ open, tiles, onSelect, onClose, c }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" style={{ backdropFilter: "blur(6px)" }} />
      <div
        className="absolute bottom-[72px] left-0 right-0 overflow-hidden"
        style={{
          background: c.sheet,
          borderTop: `1px solid ${c.b}`,
          borderRadius: "28px 28px 0 0",
          maxHeight: "60vh",
          animation: "sheetUp 0.28s cubic-bezier(0.32,1.2,0.6,1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: c.pull }} />
        </div>
        <div className="px-5 pb-1.5">
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: c.t3 }}>
            All Modules
          </span>
        </div>
        <div className="px-3 pb-5 overflow-y-auto" style={{ maxHeight: "calc(60vh - 56px)" }}>
          {tiles.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => onSelect(t.key)}
              className="w-full flex items-center gap-3.5 px-3 py-3 rounded-2xl text-left transition-colors duration-150"
              style={{ color: c.t1 }}
              onMouseEnter={(e) => { e.currentTarget.style.background = c.glass; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
                style={{ background: c.iconBg }}
              >
                {ICONS[t.key] || "📦"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-bold">{t.title}</div>
                <div className="text-[11px]" style={{ color: c.t3 }}>{t.sub}</div>
              </div>
              <span style={{ color: c.t3, fontSize: 18 }}>›</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MobileBottomNav
   ═══════════════════════════════════════════════ */

function MobileNav({ tiles, onOpen, c }) {
  const [more, setMore] = useState(false);
  const pinned = useMemo(() => NAV_KEYS.map((k) => tiles.find((t) => t.key === k)).filter(Boolean), [tiles]);

  const tap = (k) => { if (k === "__more__") setMore(true); else { setMore(false); onOpen(k); } };

  return (
    <>
      <MoreSheet open={more} tiles={tiles} onSelect={(k) => { setMore(false); onOpen(k); }} onClose={() => setMore(false)} c={c} />
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-[80] flex justify-around items-center h-[70px] border-t"
        style={{
          background: c.nav,
          borderColor: c.b,
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
          paddingBottom: "env(safe-area-inset-bottom,0)",
        }}
      >
        {pinned.map((t) => {
          const isAdd = t.key === "add";
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => tap(t.key)}
              className="flex flex-col items-center gap-0.5 text-[10px] font-semibold px-2 py-1 relative"
              style={{ color: c.t3, background: "none", border: "none" }}
            >
              {isAdd ? (
                <span
                  className="flex items-center justify-center w-[50px] h-[50px] -mt-7 rounded-full text-white text-xl"
                  style={{ background: c.accGBtn, boxShadow: c.addShadow }}
                >
                  ➕
                </span>
              ) : (
                <span className="text-[20px]">{ICONS[t.key]}</span>
              )}
              <span className={isAdd ? "-mt-0.5" : ""}>{t.title.split(" ")[0]}</span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => tap("__more__")}
          className="flex flex-col items-center gap-0.5 text-[10px] font-semibold px-2 py-1 relative"
          style={{ color: more ? c.acc : c.t3, background: "none", border: "none" }}
        >
          <span className="text-[20px]">☰</span>
          <span>More</span>
          {more && (
            <span
              className="absolute -top-px left-1/2 -translate-x-1/2 w-5 h-[3px] rounded-b"
              style={{ background: c.acc }}
            />
          )}
        </button>
      </nav>
    </>
  );
}

/* ═══════════════════════════════════════════════
   MAIN SHELL
   ═══════════════════════════════════════════════ */

export default function DashboardShell({ session }) {
  const themeApi = useTheme();
  const isLight = themeApi?.theme === "light";
  const isAdmin = session.role === "ADMIN";
  const c = isLight ? T.light : T.dark;

  const perms = useMemo(() => normalizePerms(session.permissions), [session.permissions]);
  const can = useCallback((k) => {
    if (isAdmin) return true;
    if (k === "screensCreate") return !!(perms.screensCreate || perms.screens);
    if (k === "screensView") return !!(perms.screensView || perms.screens);
    return !!perms[k];
  }, [isAdmin, perms]);

  const tiles = useMemo(() => {
    const t = [];
    if (can("recent")) t.push({ key: "recent", title: "Recent", sub: "Today DB", C: RecentCustomer });
    if (can("add")) t.push({ key: "add", title: "Add Aspirant", sub: "Manual → Recent", C: AddCustomer });
    // ─── Calander is now a special tile (no C / no modal) ───
    if (can("calander")) t.push({ key: "calander", title: "Calander", sub: "Containers", special: true });
    if (can("pending")) t.push({ key: "pending", title: "Pending", sub: "Paused", C: Pending });
    if (can("sitting")) t.push({ key: "sitting", title: "Sitting", sub: "ACTIVE", C: SittingData });
    if (can("trash")) t.push({ key: "trash", title: "Trash", sub: "Rejected Cards", C: Trash });
    if (can("tracker")) t.push({ key: "tracker", title: "Tracker", sub: "Where is customer now?", C: CustomerLocationTracker });
    if (can("screensCreate")) t.push({ key: "screensCreate", title: "Screens Create", sub: "Create / Manage screens", C: ScreensCreate });
    if (can("screensView")) t.push({ key: "screensView", title: "Screens View", sub: "View by 5-char code", C: ScreensViewer });
    if (isAdmin) t.push({ key: "usercreate", title: "User Create", sub: "Create employee", C: UserCreate, isAdmin: true });
    if (isAdmin) t.push({ key: "usermanage", title: "User Manage", sub: "Permissions", C: UserManage, isAdmin: true });
    return t;
  }, [isAdmin, can]);

  // ─── For mobile nav, map "meeting" key to calander tile ───
  const mobileNavTiles = useMemo(() => {
    return tiles.map((t) => {
      if (t.key === "calander") return { ...t, key: "meeting", title: "Meeting" };
      return t;
    });
  }, [tiles]);

  const [openKey, setOpenKey] = useState(null);
  const active = tiles.find((t) => t.key === openKey && !t.special);
  const ActiveComp = active?.C;
  const greeting = useMemo(() => getGreeting(), []);

  // ─── Mobile nav handler: "meeting" opens meeting calander modal directly ───
  function handleMobileNavOpen(key) {
    if (key === "meeting") {
      // On mobile nav tap "Meeting", we don't open LayerModal
      // Instead the MeetingCalander button inside CalanderTile handles it
      // So we just scroll to the calander tile or do nothing special
      // But for better UX, let's not set openKey for special tiles
      return;
    }
    setOpenKey(key);
  }

  return (
    <div className="min-h-screen relative" style={{ background: c.page, color: c.t1 }}>
      <BgLayer c={c} isLight={isLight} />

      {/* ═══ DESKTOP TOPBAR ═══ */}
      <header
        className="hidden md:block sticky top-0 z-40 border-b transition-colors duration-300"
        style={{
          borderColor: c.b,
          background: c.topbar,
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
        }}
      >
        <div className="max-w-[1320px] mx-auto px-7 h-[66px] flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-[9.5px] uppercase tracking-[2.5px] font-bold" style={{ color: c.t3 }}>
              SHREE HARIVANSH
            </span>
            <span
              className="text-[19px] font-black tracking-tight"
              style={
                isLight
                  ? { color: c.acc }
                  : {
                      background: c.accG,
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundSize: "200% 200%",
                      animation: "grad 4s ease infinite",
                    }
              }
            >
              ⚡ DIKSHA RKK
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right mr-1">
              <div className="text-[13px] font-bold" style={{ color: c.t1 }}>{session.username}</div>
              <div
                className="text-[9.5px] uppercase tracking-[0.5px] font-bold"
                style={{ color: session.role === "ADMIN" ? "#f59e0b" : c.t3 }}
              >
                {session.role}
              </div>
            </div>

            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-[14px] font-black text-white relative"
              style={{ background: c.accGBtn, boxShadow: c.avatarRing }}
            >
              {session.username?.[0]?.toUpperCase() || "U"}
              <div
                className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full"
                style={{
                  background: "#22c55e",
                  border: `2.5px solid ${c.dot}`,
                  animation: "pulse2 2s ease-in-out infinite",
                }}
              />
            </div>

            <ThemeToggle />

            <button
              className="px-4 py-2 rounded-2xl text-[12px] font-bold border transition-all duration-200"
              style={{ borderColor: c.logoutB, color: c.logoutT, background: "transparent" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = c.logoutH; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
                window.location.href = "/login";
              }}
              type="button"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* ═══ MOBILE HEADER ═══ */}
      <header
        className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 border-b"
        style={{
          borderColor: c.b,
          background: c.topbar,
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-black text-white relative"
            style={{ background: c.accGBtn }}
          >
            {session.username?.[0]?.toUpperCase() || "U"}
            <div
              className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full"
              style={{ background: "#22c55e", border: `2px solid ${c.dot}` }}
            />
          </div>
          <div>
            <div className="text-[13px] font-extrabold" style={{ color: c.t1 }}>{session.username}</div>
            <div className="text-[9px] uppercase tracking-[0.5px] font-bold" style={{ color: session.role === "ADMIN" ? "#f59e0b" : c.t3 }}>
              {session.role}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            className="w-9 h-9 rounded-full flex items-center justify-center text-base border transition-all duration-200"
            style={{ borderColor: c.b, background: c.glass, color: c.logoutT }}
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
              window.location.href = "/login";
            }}
            type="button"
          >
            🚪
          </button>
        </div>
      </header>

      {/* ═══ MAIN ═══ */}
      <main className="relative z-[1] max-w-[1320px] mx-auto px-7 max-md:px-4 py-8 max-md:py-5 pb-28 max-md:pb-[110px]">
        {/* Greeting */}
        <div className="mb-9 max-md:mb-5">
          <div className="text-[13px] max-md:text-[12px] font-medium mb-1" style={{ color: c.t3 }}>
            {greeting}, {session.username} Sakhi
          </div>
          <div
            className="text-[32px] max-md:text-[22px] font-black tracking-[-0.5px] flex items-center gap-3 flex-wrap"
            style={{ color: c.t1 }}
          >
            Dashboard
            <span
              className="text-[10px] px-3 py-1 rounded-full text-white font-bold uppercase tracking-[0.5px]"
              style={{ background: c.accGBtn }}
            >
              DIKSHA
            </span>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-md:gap-3">
          {tiles.map((t, i) =>
            t.special ? (
              <CalanderTile
                key={t.key}
                c={c}
                isLight={isLight}
                role={session.role}
                idx={i}
              />
            ) : (
              <TileCard
                key={t.key}
                tile={t}
                idx={i}
                c={c}
                isLight={isLight}
                onClick={() => setOpenKey(t.key)}
              />
            )
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="hidden md:block relative z-[1] text-center py-8 text-[11px]" style={{ color: c.t3 }}>
        ⚡ DIKSHA RKK · Seva Sabse Pehle🙏
      </footer>

      {/* Mobile Nav */}
      <MobileNav tiles={mobileNavTiles} onOpen={handleMobileNavOpen} c={c} />

      {/* LayerModal — only for non-special tiles */}
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

      {/* ═══ KEYFRAMES ═══ */}
      <style jsx global>{`
        @keyframes orb1 {
          0%,100%{transform:translate3d(0,0,0) scale(1)}
          33%{transform:translate3d(50px,-35px,0) scale(1.06)}
          66%{transform:translate3d(-25px,40px,0) scale(0.94)}
        }
        @keyframes orb2 {
          0%,100%{transform:translate3d(0,0,0) scale(1)}
          50%{transform:translate3d(-40px,30px,0) scale(1.05)}
        }
        @keyframes orb3 {
          0%,100%{transform:translate3d(0,0,0) scale(1)}
          50%{transform:translate3d(45px,-25px,0) scale(1.08)}
        }
        @keyframes grad {
          0%,100%{background-position:0% 50%}
          50%{background-position:100% 50%}
        }
        @keyframes pulse2 {
          0%,100%{opacity:1;transform:scale(1)}
          50%{opacity:0.6;transform:scale(1.3)}
        }
        @keyframes sheetUp {
          from{transform:translate3d(0,100%,0)}
          to{transform:translate3d(0,0,0)}
        }
      `}</style>
    </div>
  );
}

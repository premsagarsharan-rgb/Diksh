// app/api/users/route.js
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";

const PERM_KEYS = [
  "recent",
  "add",
  "calander",
  "pending",
  "sitting",
  "tracker",
  "screensCreate",
  "screensView",
  "screens",
];

async function ensureUserIndexes(db) {
  try {
    await db.collection("users").createIndex({ username: 1 }, { unique: true });
  } catch {}
}

function normalizePermissionsForSave(input) {
  const raw = { ...(input || {}) };
  if (typeof raw.screens === "boolean") {
    if (typeof raw.screensCreate !== "boolean") raw.screensCreate = raw.screens;
    if (typeof raw.screensView !== "boolean") raw.screensView = raw.screens;
  }
  if (typeof raw.screensCreate === "boolean" || typeof raw.screensView === "boolean") {
    raw.screens = !!(raw.screensCreate || raw.screensView);
  }
  const clean = {};
  for (const k of PERM_KEYS) {
    if (typeof raw?.[k] === "boolean") clean[k] = raw[k];
  }
  return clean;
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const db = await getDb();
  await ensureUserIndexes(db);

  const users = await db
    .collection("users")
    .find({})
    .sort({ createdAt: -1 })
    .project({ passwordHash: 0 })
    .toArray();

  // ✅ Clean session data — don't expose tokenHash to frontend
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const items = users.map((u) => {
    const sessions = Array.isArray(u.activeSessions) ? u.activeSessions : [];
    const validSessions = sessions.filter(
      (s) => s.createdAt && new Date(s.createdAt) > sevenDaysAgo
    );

    return {
      ...u,
      _id: String(u._id),
      maxDevices: u.maxDevices || 1,
      activeSessionCount: validSessions.length,
      activeSessions: validSessions.map((s) => ({
        deviceLabel: s.deviceLabel || "Unknown",
        ip: s.ip || "unknown",
        createdAt: s.createdAt,
      })),
    };
  });

  return NextResponse.json({ items });
}

export async function POST(req) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const { username, password, role, permissions } = body || {};

  const uname = String(username || "").trim();
  const pass = String(password || "");

  if (!uname) return NextResponse.json({ error: "Username required" }, { status: 400 });
  if (!pass || pass.length < 4) {
    return NextResponse.json({ error: "Password required (min 4)" }, { status: 400 });
  }
  if (!["ADMIN", "USER"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const db = await getDb();
  await ensureUserIndexes(db);

  const doc = {
    username: uname,
    passwordHash: await bcrypt.hash(pass, 12),
    role,
    active: true,
    maxDevices: 1,
    activeSessions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  if (role === "USER") {
    const defaults = {
      recent: true,
      add: true,
      calander: true,
      pending: true,
      sitting: false,
      tracker: false,
      screensCreate: false,
      screensView: false,
    };
    doc.permissions = normalizePermissionsForSave({ ...defaults, ...(permissions || {}) });
  } else {
    doc.permissions = null;
  }

  try {
    const r = await db.collection("users").insertOne(doc);
    return NextResponse.json({ ok: true, id: String(r.insertedId) });
  } catch (e) {
    if (String(e?.code) === "11000") {
      return NextResponse.json({ error: "Username already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Create user failed" }, { status: 500 });
  }
}

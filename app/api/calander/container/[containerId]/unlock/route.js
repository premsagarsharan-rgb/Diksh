// app/api/calander/container/[containerId]/unlock/route.js
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";

function clampMinutes(n) {
  if (!Number.isFinite(n)) return null;
  if (n < 1) return null;
  // safety cap: max 24 hours
  if (n > 24 * 60) return 24 * 60;
  return n;
}

export async function POST(req, { params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // For now: only ADMIN can unlock (MOD permission system later)
  if (session.role !== "ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const { containerId } = await params;
  if (!containerId) return NextResponse.json({ error: "Missing containerId" }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const minutesRaw = body?.minutes;

  const minutes = clampMinutes(parseInt(minutesRaw, 10));
  if (!minutes) {
    return NextResponse.json({ error: "INVALID_MINUTES" }, { status: 400 });
  }

  const db = await getDb();
  const ctnId = new ObjectId(containerId);
  const now = new Date();
  const unlockExpiresAt = new Date(now.getTime() + minutes * 60 * 1000);

  const container = await db.collection("calendarContainers").findOne({ _id: ctnId });
  if (!container) return NextResponse.json({ error: "Container not found" }, { status: 404 });

  await db.collection("calendarContainers").updateOne(
    { _id: ctnId },
    {
      $set: {
        unlockExpiresAt,
        unlockedAt: now,
        unlockedByUserId: session.userId,
        unlockedByLabel: `${session.role}:${session.username}`,
        updatedAt: now,
      },
    }
  );

  return NextResponse.json({
    ok: true,
    containerId: String(ctnId),
    unlockExpiresAt,
    minutes,
  });
}

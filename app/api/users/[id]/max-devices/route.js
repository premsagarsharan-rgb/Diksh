// app/api/users/[userId]/max-devices/route.js
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";

export async function PATCH(req, { params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.role !== "ADMIN") {
    return NextResponse.json({ error: "Only ADMIN can change device limits" }, { status: 403 });
  }

  const p = await params;
  // Handle both [userId] and [id] folder naming
  const userId = p.userId || p.id;
  const body = await req.json().catch(() => ({}));
  const { maxDevices } = body;

  if (!Number.isInteger(maxDevices) || maxDevices < 1 || maxDevices > 10) {
    return NextResponse.json(
      { error: "maxDevices must be between 1 and 10" },
      { status: 400 }
    );
  }

  const db = await getDb();
  const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // If reducing maxDevices below current active count, warn but allow
  const activeSessions = Array.isArray(user.activeSessions) ? user.activeSessions : [];
  const willKickExtra = activeSessions.length > maxDevices;

  await db.collection("users").updateOne(
    { _id: new ObjectId(userId) },
    {
      $set: {
        maxDevices,
        updatedAt: new Date(),
      },
    }
  );

  return NextResponse.json({
    success: true,
    userId,
    username: user.username,
    maxDevices,
    note: willKickExtra
      ? `Warning: ${activeSessions.length} sessions active but limit set to ${maxDevices}. Extra sessions will be blocked on next check.`
      : null,
  });
}

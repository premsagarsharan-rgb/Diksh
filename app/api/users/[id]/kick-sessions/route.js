// app/api/users/[userId]/kick-sessions/route.js
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(req, { params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.role !== "ADMIN") {
    return NextResponse.json({ error: "Only ADMIN can kick sessions" }, { status: 403 });
  }

  const p = await params;
  const userId = p.userId || p.id;
  const db = await getDb();

  const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const previousCount = Array.isArray(user.activeSessions) ? user.activeSessions.length : 0;

  // Clear ALL sessions
  await db.collection("users").updateOne(
    { _id: new ObjectId(userId) },
    {
      $set: {
        activeSessions: [],
        activeSessionTokenHash: null,
        lastKickedAt: new Date(),
        lastKickedByUserId: session.userId,
      },
    }
  );

  return NextResponse.json({
    success: true,
    userId,
    username: user.username,
    sessionsKicked: previousCount,
  });
}

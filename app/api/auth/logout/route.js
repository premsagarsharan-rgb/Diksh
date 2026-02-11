// app/api/auth/logout/route.js
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import crypto from "crypto";
import { getDb } from "@/lib/mongodb";
import { getSession, clearSessionCookie } from "@/lib/session";

function sha256(s) {
  return crypto.createHash("sha256").update(String(s || "")).digest("hex");
}

export async function POST() {
  try {
    const session = await getSession();

    if (session && session.userId && session.sessionToken) {
      const db = await getDb();
      const tokenHash = sha256(session.sessionToken);

      // Remove ONLY this session from activeSessions array
      await db.collection("users").updateOne(
        { _id: new ObjectId(session.userId) },
        {
          $pull: { activeSessions: { tokenHash } },
          $set: { lastLogoutAt: new Date() },
        }
      );

      // Update activeSessionTokenHash to latest remaining
      const user = await db.collection("users").findOne(
        { _id: new ObjectId(session.userId) },
        { projection: { activeSessions: 1 } }
      );

      const remaining = Array.isArray(user?.activeSessions) ? user.activeSessions : [];
      await db.collection("users").updateOne(
        { _id: new ObjectId(session.userId) },
        {
          $set: {
            activeSessionTokenHash: remaining.length > 0
              ? remaining[remaining.length - 1].tokenHash
              : null,
          },
        }
      );
    }

    await clearSessionCookie();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    try { await clearSessionCookie(); } catch {}
    return NextResponse.json({ success: true });
  }
}

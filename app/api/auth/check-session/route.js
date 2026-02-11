// app/api/auth/check-session/route.js
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";
import crypto from "crypto";
import { getDb } from "@/lib/mongodb";
import { getSession, clearSessionCookie } from "@/lib/session";

function sha256(s) {
  return crypto.createHash("sha256").update(String(s || "")).digest("hex");
}

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getSession();

    if (session && session.userId) {
      return NextResponse.json({
        valid: true,
        username: session.username,
        role: session.role,
      });
    }

    // Session invalid — clean up this specific dead session
    try {
      const cookieStore = await cookies();
      const raw = cookieStore.get("session")?.value;
      if (raw) {
        const data = JSON.parse(raw);
        if (data.userId && data.sessionToken) {
          const db = await getDb();
          const tokenHash = sha256(data.sessionToken);

          // Remove this dead session from array
          await db.collection("users").updateOne(
            { _id: new ObjectId(data.userId) },
            { $pull: { activeSessions: { tokenHash } } }
          );

          // If no sessions left, clear activeSessionTokenHash
          const user = await db.collection("users").findOne(
            { _id: new ObjectId(data.userId) },
            { projection: { activeSessions: 1 } }
          );
          const remaining = Array.isArray(user?.activeSessions) ? user.activeSessions : [];
          if (remaining.length === 0) {
            await db.collection("users").updateOne(
              { _id: new ObjectId(data.userId) },
              { $set: { activeSessionTokenHash: null } }
            );
          }
        }
      }
    } catch (e) {
      console.error("Session cleanup failed:", e);
    }

    await clearSessionCookie();
    return NextResponse.json({
      valid: false,
      reason: "NO_SESSION",
      message: "Session expired or invalid",
    });
  } catch (error) {
    console.error("Check session error:", error);
    try { await clearSessionCookie(); } catch {}
    return NextResponse.json({
      valid: false,
      reason: "ERROR",
      message: "Session check failed",
    });
  }
}

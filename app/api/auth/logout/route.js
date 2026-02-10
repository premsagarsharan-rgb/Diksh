// app/api/auth/logout/route.js
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { getSession, clearSessionCookie } from "@/lib/session";

export async function POST() {
  try {
    const session = await getSession();

    if (session && session.userId) {
      const db = await getDb();
      // activeSessionTokenHash clear karo — taaki doosra device login kar sake
      await db.collection("users").updateOne(
        { _id: new ObjectId(session.userId) },
        { $set: { activeSessionTokenHash: null } }
      );
    }

    await clearSessionCookie();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    // Cookie toh clear karo chahe kuch bhi ho
    try {
      await clearSessionCookie();
    } catch {}
    return NextResponse.json({ success: true });
  }
}

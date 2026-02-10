// app/api/auth/check-session/route.js
import { NextResponse } from "next/server";
import { getSession, clearSessionCookie } from "@/lib/session";

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

    // Route Handler me cookie clear ALLOWED hai
    await clearSessionCookie();
    return NextResponse.json({
      valid: false,
      reason: "NO_SESSION",
      message: "Session expired or invalid",
    });
  } catch (error) {
    console.error("Check session error:", error);
    try {
      await clearSessionCookie();
    } catch (e) {
      console.error("Cookie clear bhi fail:", e);
    }
    return NextResponse.json({
      valid: false,
      reason: "ERROR",
      message: "Session check failed",
    });
  }
}

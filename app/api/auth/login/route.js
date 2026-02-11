// app/api/auth/login/route.js
import { NextResponse } from "next/server";
import crypto from "crypto";
import bcryptjs from "bcryptjs";
import { getDb } from "@/lib/mongodb";
import { createSessionCookie } from "@/lib/session";

function sha256(s) {
  return crypto.createHash("sha256").update(String(s || "")).digest("hex");
}

export async function POST(req) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username aur password dono chahiye" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const user = await db.collection("users").findOne({
      username: username.trim(),
      active: true,
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    // Password check — bcrypt
    const passwordMatch = await bcryptjs.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    // ✅ MULTI-DEVICE CHECK
    const maxDevices = user.maxDevices || 1;
    const activeSessions = Array.isArray(user.activeSessions) ? user.activeSessions : [];

    // Clean expired sessions (older than 7 days)
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const validSessions = activeSessions.filter(
      (s) => s.createdAt && new Date(s.createdAt) > sevenDaysAgo
    );

    // Check if max devices reached
    if (validSessions.length >= maxDevices) {
      return NextResponse.json(
        {
          error: "ALREADY_LOGGED_IN",
          message: `Maximum ${maxDevices} device${maxDevices > 1 ? "s" : ""} allowed. ${validSessions.length} already active.`,
          message2: "Contact your senior to resolve this.",
          maxDevices,
          activeCount: validSessions.length,
        },
        { status: 409 }
      );
    }

    // Generate new session
    const sessionToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = sha256(sessionToken);

    // Detect device info
    const ua = req.headers.get("user-agent") || "Unknown";
    const deviceLabel = ua.length > 150 ? ua.slice(0, 150) + "..." : ua;

    const newSession = {
      tokenHash,
      createdAt: now,
      deviceLabel,
      ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
    };

    const updatedSessions = [...validSessions, newSession];

    // Save to DB
    await db.collection("users").updateOne(
      { _id: user._id },
      {
        $set: {
          activeSessions: updatedSessions,
          activeSessionTokenHash: tokenHash,
          lastLoginAt: now,
        },
      }
    );

    // Set cookie
    await createSessionCookie({
      userId: String(user._id),
      sessionToken,
    });

    return NextResponse.json({
      success: true,
      username: user.username,
      role: user.role,
      activeDevices: updatedSessions.length,
      maxDevices,
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Server error. Try again." },
      { status: 500 }
    );
  }
}

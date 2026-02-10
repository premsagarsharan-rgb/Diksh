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

    // ✅ Password check — bcrypt compare (DB me bcrypt hash stored hai)
    const passwordMatch = await bcryptjs.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    // ✅ SINGLE DEVICE CHECK — Agar pehle se login hai toh BLOCK karo
    if (user.activeSessionTokenHash) {
      return NextResponse.json(
        {
          error: "ALREADY_LOGGED_IN",
          message: "Someone is already logged in using this account.",
          message2: "Contact your senior to resolve this.",
        },
        { status: 409 }
      );
    }

    // Naya session token generate karo
    const sessionToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = sha256(sessionToken);

    // DB me hash save karo
    await db.collection("users").updateOne(
      { _id: user._id },
      {
        $set: {
          activeSessionTokenHash: tokenHash,
          lastLoginAt: new Date(),
        },
      }
    );

    // Cookie set karo
    await createSessionCookie({
      userId: String(user._id),
      sessionToken,
    });

    return NextResponse.json({
      success: true,
      username: user.username,
      role: user.role,
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Server error. Try again." },
      { status: 500 }
    );
  }
}

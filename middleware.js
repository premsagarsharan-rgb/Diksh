// middleware.js
import { NextResponse } from "next/server";

function isSessionCookieStructurallyValid(cookieValue) {
  if (!cookieValue) return false;
  try {
    const data = JSON.parse(cookieValue);
    if (data.userId && data.sessionToken) return true;
    return false;
  } catch {
    return false;
  }
}

function clearCookieAndRedirectToLogin(req) {
  const url = new URL("/login", req.url);
  const res = NextResponse.redirect(url);
  res.cookies.set("session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}

export function middleware(req) {
  const { pathname } = req.nextUrl;
  const sessionCookie = req.cookies.get("session")?.value || null;

  const isDashboard = pathname.startsWith("/dashboard");
  const isLogin = pathname === "/login";

  // === DASHBOARD ===
  if (isDashboard) {
    if (!sessionCookie) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    if (!isSessionCookieStructurallyValid(sessionCookie)) {
      return clearCookieAndRedirectToLogin(req);
    }

    // Cookie structurally valid — page me DB check hoga
    // Agar DB check fail hoga → page redirect karega /login
    // Middleware /login pe NextResponse.next() karega → loop nahi banega
    return NextResponse.next();
  }

  // === LOGIN — KABHI REDIRECT MAT KARO ===
  if (isLogin) {
    // Ye line hi poora loop tod rahi hai
    // Chahe cookie ho ya na ho — login page HAMESHA accessible
    return NextResponse.next();
  }

  // === ROOT "/" ===
  if (pathname === "/") {
    if (sessionCookie && isSessionCookieStructurallyValid(sessionCookie)) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    if (sessionCookie) {
      return clearCookieAndRedirectToLogin(req);
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/"],
};

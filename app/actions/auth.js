// app/actions/auth.js
"use server";

import { redirect } from "next/navigation";
import { clearSessionCookie } from "@/lib/session";

export async function clearSessionAndRedirect() {
  await clearSessionCookie();
  redirect("/login");
}

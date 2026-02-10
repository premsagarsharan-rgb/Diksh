// app/dashboard/page.js
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import DashboardShell from "@/components/DashboardShell";
import DashboardBackGuard from "@/components/DashboardBackGuard";
import SessionGuard from "@/components/SessionGuard";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    // Server Component me cookie clear NAHI kar sakte Next 16 me
    // Middleware malformed cookie already handle karta hai
    // DB hash mismatch case me — cookie structurally valid hai
    // but DB me match nahi karta — toh /login pe bhejo
    // check-session API ya next visit pe middleware cookie clear karega
    redirect("/login");
  }

  return (
    <>
      <DashboardBackGuard />
      <SessionGuard />
      <DashboardShell session={session} />
    </>
  );
}

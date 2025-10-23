import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { BottomNav } from "@/components/user/bottom-nav";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function UserLayout({ children }: { children: ReactNode }) {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    redirect("/login?from=beranda");
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-16 top-8 h-56 w-56 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-60 w-60 rounded-full bg-sky-500/15 blur-3xl" />
        <div className="absolute -bottom-20 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-rose-500/10 blur-3xl" />
      </div>
      <main className="relative mx-auto min-h-screen w-full max-w-6xl pb-24">{children}</main>
      <BottomNav />
    </div>
  );
}

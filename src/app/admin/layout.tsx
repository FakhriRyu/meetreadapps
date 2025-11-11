import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { getSessionUser } from "@/lib/session";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const sessionUser = await getSessionUser();

  if (!sessionUser || sessionUser.role !== "ADMIN") {
    redirect("/loginadmin");
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f5f7ff] text-slate-900">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-indigo-200/40 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-80 w-80 rounded-full bg-violet-200/35 blur-3xl" />
        <div className="absolute -bottom-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-emerald-200/30 blur-3xl" />
      </div>
      <main className="relative mx-auto flex min-h-screen w-full max-w-6xl px-4 pb-16 pt-16 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}

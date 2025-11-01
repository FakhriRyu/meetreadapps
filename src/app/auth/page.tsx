import { Suspense } from "react";

import { AuthPanel } from "@/components/auth/auth-panel";

type AuthPageProps = {
  searchParams: Promise<{ mode?: string }>;
};

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const params = await searchParams;
  const defaultMode = params.mode === "register" ? "register" : "login";

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f5f7ff] text-slate-900">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-indigo-200/40 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-80 w-80 rounded-full bg-sky-200/35 blur-3xl" />
        <div className="absolute -bottom-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-emerald-200/30 blur-3xl" />
      </div>
      <main className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-6 py-16">
        <Suspense fallback={null}>
          <AuthPanel defaultMode={defaultMode} />
        </Suspense>
      </main>
    </div>
  );
}

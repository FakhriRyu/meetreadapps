const CARD_PLACEHOLDERS = Array.from({ length: 4 });

export function PinjamSkeleton() {
  return (
    <div className="relative min-h-screen bg-[#f5f7ff] px-6 pb-24 pt-10 text-slate-900">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-indigo-200/30 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-80 w-80 rounded-full bg-sky-200/30 blur-3xl" />
        <div className="absolute -bottom-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-emerald-200/20 blur-3xl" />
      </div>

      <div className="relative space-y-6">
        <div className="animate-pulse rounded-3xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-100">
          <div className="h-3 w-1/2 rounded-full bg-slate-200" />
          <div className="mt-3 h-3 w-3/4 rounded-full bg-slate-100" />
        </div>

        <div className="relative">
          <div className="animate-pulse rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm shadow-slate-100">
            <div className="h-4 w-full rounded-full bg-slate-100" />
          </div>
          <div className="absolute inset-y-0 right-3 flex items-center gap-2">
            <div className="h-6 w-12 rounded-full bg-slate-100" />
            <div className="h-6 w-20 rounded-full bg-slate-100" />
          </div>
        </div>

        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-2">
            <div className="h-3 w-40 rounded-full bg-slate-100" />
            <div className="h-4 w-48 rounded-full bg-slate-200" />
          </div>
          <div className="h-3 w-56 rounded-full bg-slate-100" />
        </header>

        <div className="space-y-3">
          {CARD_PLACEHOLDERS.map((_, index) => (
            <div
              key={`pinjam-skeleton-${index}`}
              className="grid animate-pulse grid-cols-[5rem_1fr] gap-4 rounded-3xl border border-slate-200 bg-white p-4 text-slate-900 shadow-sm shadow-slate-100 sm:grid-cols-[6rem_1fr]"
            >
              <div className="h-28 w-full rounded-2xl bg-slate-100 sm:h-32" />
              <div className="flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="h-4 w-3/5 rounded-full bg-slate-200" />
                  <div className="h-3 w-24 rounded-full bg-indigo-100" />
                  <div className="h-3 w-40 rounded-full bg-slate-100" />
                  <div className="h-3 w-11/12 rounded-full bg-slate-100" />
                  <div className="h-3 w-1/3 rounded-full bg-slate-100" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="h-3 w-32 rounded-full bg-slate-100" />
                  <div className="h-7 w-28 rounded-full bg-indigo-100" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex animate-pulse flex-wrap items-center justify-center gap-2 pt-2">
          <div className="h-7 w-20 rounded-full bg-slate-100" />
          <div className="h-7 w-10 rounded-full bg-slate-200" />
          <div  className="h-7 w-10 rounded-full bg-slate-100" />
          <div className="h-7 w-10 rounded-full bg-slate-100" />
          <div className="h-7 w-20 rounded-full bg-slate-100" />
        </div>
      </div>
    </div>
  );
}

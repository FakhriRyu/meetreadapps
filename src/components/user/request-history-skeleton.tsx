const HISTORY_PLACEHOLDERS = Array.from({ length: 3 });

export function RequestHistorySkeleton() {
  return (
    <div className="min-h-screen bg-[#f5f7ff] px-6 pb-28 pt-10 text-slate-900">
      <header className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-3 w-52 rounded-full bg-slate-200" />
          <div className="h-4 w-64 rounded-full bg-slate-200" />
          <div className="h-3 w-72 rounded-full bg-slate-100" />
        </div>
        <div className="h-9 w-36 rounded-full border border-slate-200 bg-white shadow-sm shadow-slate-100" />
      </header>

      <section className="mx-auto mt-8 grid w-full max-w-5xl gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={`stat-skeleton-${index}`}
            className="h-24 animate-pulse rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-100"
          />
        ))}
      </section>

      <section className="mx-auto mt-8 w-full max-w-5xl space-y-4">
        {HISTORY_PLACEHOLDERS.map((_, index) => (
          <div
            key={`history-skeleton-${index}`}
            className="animate-pulse rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-sm shadow-slate-100"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="h-16 w-12 rounded-xl bg-slate-100" />
                <div className="space-y-2">
                  <div className="h-4 w-48 rounded-full bg-slate-200" />
                  <div className="h-3 w-32 rounded-full bg-slate-100" />
                </div>
              </div>
              <div className="h-7 w-32 rounded-full bg-slate-100" />
            </div>

            <div className="mt-4 grid gap-4 text-xs text-slate-600 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="h-3 w-20 rounded-full bg-slate-200" />
                <div className="mt-3 h-4 w-32 rounded-full bg-slate-100" />
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="h-3 w-24 rounded-full bg-slate-200" />
                <div className="mt-3 h-4 w-28 rounded-full bg-slate-100" />
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {Array.from({ length: 3 }).map((__, idx) => (
                <div key={`timeline-skeleton-${index}-${idx}`} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="h-5 w-5 rounded-full bg-slate-200" />
                    {idx < 2 && <div className="mt-1 h-8 w-px bg-slate-200" />}
                  </div>
                  <div className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div className="h-3 w-28 rounded-full bg-slate-200" />
                      <div className="h-3 w-24 rounded-full bg-slate-100" />
                    </div>
                    <div className="mt-2 h-3 w-11/12 rounded-full bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <div className="h-9 w-28 rounded-full border border-slate-200 bg-white" />
              <div className="h-9 w-36 rounded-full bg-indigo-100" />
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

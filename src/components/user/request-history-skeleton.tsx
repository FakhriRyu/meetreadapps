const HISTORY_PLACEHOLDERS = Array.from({ length: 3 });

export function RequestHistorySkeleton() {
  return (
    <div className="relative min-h-screen px-6 pb-28 pt-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-3 w-52 rounded-full bg-white/10" />
          <div className="h-4 w-64 rounded-full bg-white/15" />
          <div className="h-3 w-72 rounded-full bg-white/10" />
        </div>
        <div className="h-9 w-36 rounded-full border border-white/15 bg-white/5" />
      </header>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={`stat-skeleton-${index}`}
            className="h-24 animate-pulse rounded-3xl border border-white/10 bg-white/10"
          />
        ))}
      </section>

      <section className="mt-8 space-y-4">
        {HISTORY_PLACEHOLDERS.map((_, index) => (
          <div
            key={`history-skeleton-${index}`}
            className="animate-pulse rounded-3xl border border-white/10 bg-white/5 p-6 text-white shadow-lg shadow-black/20"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="h-16 w-12 rounded-xl bg-white/10" />
                <div className="space-y-2">
                  <div className="h-4 w-48 rounded-full bg-white/15" />
                  <div className="h-3 w-32 rounded-full bg-white/10" />
                </div>
              </div>
              <div className="h-7 w-32 rounded-full bg-white/10" />
            </div>

            <div className="mt-4 grid gap-4 text-xs text-white/70 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="h-3 w-20 rounded-full bg-white/10" />
                <div className="mt-3 h-4 w-32 rounded-full bg-white/15" />
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="h-3 w-24 rounded-full bg-white/10" />
                <div className="mt-3 h-4 w-28 rounded-full bg-white/15" />
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {Array.from({ length: 3 }).map((__, idx) => (
                <div key={`timeline-skeleton-${index}-${idx}`} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="h-5 w-5 rounded-full bg-white/10" />
                    {idx < 2 && <div className="mt-1 h-8 w-px bg-white/10" />}
                  </div>
                  <div className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div className="h-3 w-28 rounded-full bg-white/15" />
                      <div className="h-3 w-24 rounded-full bg-white/10" />
                    </div>
                    <div className="mt-2 h-3 w-11/12 rounded-full bg-white/10" />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <div className="h-9 w-28 rounded-full border border-white/15 bg-white/5" />
              <div className="h-9 w-36 rounded-full bg-emerald-400/30" />
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

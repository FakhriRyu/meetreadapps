export default function KoleksikuLoading() {
  return (
    <div className="min-h-screen bg-[#f5f7ff] px-6 pb-28 pt-10 text-slate-900">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
        {/* Header Skeleton */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-7 w-32 animate-pulse rounded-full bg-slate-300" />
            <div className="h-4 w-64 animate-pulse rounded-full bg-slate-200" />
          </div>
          <div className="h-10 w-40 animate-pulse rounded-full bg-slate-200" />
        </header>

        {/* Requests Section Skeleton */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-2">
              <div className="h-3 w-40 animate-pulse rounded-full bg-slate-200" />
              <div className="h-6 w-48 animate-pulse rounded-full bg-slate-300" />
            </div>
            <div className="h-7 w-32 animate-pulse rounded-full bg-slate-200" />
          </div>

          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div
                key={i}
                className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-100"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2 flex-1">
                    <div className="h-5 w-48 animate-pulse rounded-full bg-slate-300" />
                    <div className="h-3 w-32 animate-pulse rounded-full bg-slate-200" />
                  </div>
                  <div className="h-7 w-32 animate-pulse rounded-full bg-slate-200" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="space-y-1">
                      <div className="h-3 w-16 animate-pulse rounded-full bg-slate-200" />
                      <div className="h-4 w-32 animate-pulse rounded-full bg-slate-200" />
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <div className="h-9 w-24 flex-1 animate-pulse rounded-full bg-slate-200 sm:flex-none" />
                  <div className="h-9 w-24 flex-1 animate-pulse rounded-full bg-slate-200 sm:flex-none" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Collections Section Skeleton */}
        <section className="space-y-4">
          <div className="h-6 w-40 animate-pulse rounded-full bg-slate-300" />
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="flex gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-100"
              >
                <div className="h-28 w-20 flex-shrink-0 animate-pulse rounded-2xl bg-slate-100" />
                <div className="flex flex-1 flex-col justify-between">
                  <div className="space-y-2">
                    <div className="h-5 w-full animate-pulse rounded-full bg-slate-300" />
                    <div className="h-3 w-32 animate-pulse rounded-full bg-slate-200" />
                  </div>
                  <div className="flex gap-2">
                    <div className="h-7 w-20 animate-pulse rounded-full bg-slate-200" />
                    <div className="h-7 w-16 animate-pulse rounded-full bg-slate-200" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}


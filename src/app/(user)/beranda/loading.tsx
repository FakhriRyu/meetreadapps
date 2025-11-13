export default function BerandaLoading() {
  return (
    <div className="min-h-screen bg-[#f5f7ff] text-slate-900">
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 pb-24 pt-10">
        {/* Header Skeleton */}
        <header className="flex items-start justify-between gap-6">
          <div className="space-y-2 flex-1">
            <div className="h-4 w-32 animate-pulse rounded-full bg-slate-200" />
            <div className="h-7 w-64 animate-pulse rounded-full bg-slate-300" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 animate-pulse rounded-full bg-slate-200" />
            <div className="h-11 w-11 animate-pulse rounded-full bg-slate-200" />
          </div>
        </header>

        {/* Search Box Skeleton */}
        <section className="mt-8 space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-100">
            <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
          </div>

          {/* Categories Skeleton */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-9 w-24 animate-pulse rounded-full bg-slate-200" />
            ))}
          </div>
        </section>

        {/* Fresh Arrivals Skeleton */}
        <section className="mt-10 space-y-4">
          <div className="h-6 w-40 animate-pulse rounded-full bg-slate-300" />
          <div className="flex gap-5 overflow-x-auto pb-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-40 flex-shrink-0 space-y-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-100"
              >
                <div className="h-44 w-full animate-pulse rounded-2xl bg-slate-100" />
                <div className="h-4 w-full animate-pulse rounded-full bg-slate-200" />
                <div className="h-3 w-16 animate-pulse rounded-full bg-slate-200" />
              </div>
            ))}
          </div>
        </section>

        {/* Top Reads Skeleton */}
        <section className="mt-10 space-y-4">
          <div className="h-6 w-36 animate-pulse rounded-full bg-slate-300" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="flex gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-100"
              >
                <div className="h-20 w-16 flex-shrink-0 animate-pulse rounded-2xl bg-slate-100" />
                <div className="flex flex-1 flex-col justify-between">
                  <div className="space-y-2">
                    <div className="h-4 w-full animate-pulse rounded-full bg-slate-200" />
                    <div className="h-3 w-24 animate-pulse rounded-full bg-slate-200" />
                  </div>
                  <div className="flex gap-3">
                    <div className="h-3 w-20 animate-pulse rounded-full bg-slate-200" />
                    <div className="h-3 w-16 animate-pulse rounded-full bg-slate-200" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}


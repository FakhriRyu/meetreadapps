export default function ProfilLoading() {
  return (
    <div className="min-h-screen bg-[#f5f7ff] px-6 pb-24 pt-10 text-slate-900">
      <div className="mx-auto w-full max-w-2xl space-y-8">
        {/* Profile Card Skeleton */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-100">
          <div className="flex flex-col items-center gap-6">
            <div className="h-24 w-24 animate-pulse rounded-full bg-slate-200" />
            <div className="space-y-2 text-center">
              <div className="mx-auto h-6 w-40 animate-pulse rounded-full bg-slate-300" />
              <div className="mx-auto h-4 w-56 animate-pulse rounded-full bg-slate-200" />
            </div>
          </div>
        </div>

        {/* Stats Card Skeleton */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-100">
          <div className="space-y-4">
            <div className="h-5 w-32 animate-pulse rounded-full bg-slate-300" />
            <div className="grid gap-4 sm:grid-cols-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-3 w-24 animate-pulse rounded-full bg-slate-200" />
                  <div className="h-5 w-16 animate-pulse rounded-full bg-slate-300" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions Card Skeleton */}
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-100"
            >
              <div className="h-5 w-48 animate-pulse rounded-full bg-slate-200" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


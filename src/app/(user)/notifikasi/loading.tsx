export default function NotifikasiLoading() {
  return (
    <div className="min-h-screen bg-[#f5f7ff] px-6 pb-24 pt-10 text-slate-900">
      <div className="mx-auto w-full max-w-3xl space-y-8">
        {/* Header Skeleton */}
        <header className="space-y-2">
          <div className="h-7 w-32 animate-pulse rounded-full bg-slate-300" />
          <div className="h-4 w-64 animate-pulse rounded-full bg-slate-200" />
        </header>

        {/* Notifications List Skeleton */}
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="flex gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-100"
            >
              <div className="h-10 w-10 flex-shrink-0 animate-pulse rounded-full bg-slate-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-full animate-pulse rounded-full bg-slate-300" />
                <div className="h-3 w-3/4 animate-pulse rounded-full bg-slate-200" />
                <div className="h-3 w-24 animate-pulse rounded-full bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


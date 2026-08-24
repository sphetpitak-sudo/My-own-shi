"use client";

export function SkeletonSummary() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="glass-card-static p-6 text-center">
          <div className="shimmer h-4 w-4 rounded-xl mx-auto mb-3" />
          <div className="shimmer h-3 w-24 mx-auto mb-2" />
          <div className="shimmer h-7 w-32 mx-auto" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[1, 2].map((i) => (
        <div key={i} className="glass-card-static p-6">
          <div className="shimmer h-4 w-28 mb-4" />
          <div className="shimmer h-[240px] w-full rounded-xl" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonList() {
  return (
    <div className="glass-card-static p-6">
      <div className="shimmer h-5 w-36 mb-4" />
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white/30 dark:bg-slate-800/30">
            <div className="shimmer h-10 w-10 rounded-xl" />
            <div className="flex-1">
              <div className="shimmer h-4 w-24 mb-2" />
              <div className="shimmer h-3 w-16" />
            </div>
            <div className="shimmer h-5 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonForm() {
  return (
    <div className="glass-card-static p-6 space-y-4">
      <div className="shimmer h-5 w-32" />
      <div className="flex gap-3">
        <div className="shimmer h-12 flex-1 rounded-xl" />
        <div className="shimmer h-12 flex-1 rounded-xl" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="shimmer h-12 rounded-xl" />
        <div className="shimmer h-12 rounded-xl" />
      </div>
      <div className="shimmer h-12 rounded-xl" />
      <div className="shimmer h-12 rounded-xl" />
      <div className="shimmer h-12 rounded-xl" />
    </div>
  );
}

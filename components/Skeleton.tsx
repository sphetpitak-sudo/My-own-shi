"use client";

export function SkeletonSummary() {
  return (
    <div className="grid-stats">
      {[1, 2, 3].map((i) => (
        <div key={i} className="stat-card">
          <div className="shimmer h-9 w-9 rounded-[10px] mb-3" />
          <div className="shimmer h-3 w-20 mb-2" />
          <div className="shimmer h-7 w-28" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="grid-charts">
      {[1, 2].map((i) => (
        <div key={i} className="card p-5">
          <div className="shimmer h-4 w-24 mb-4" />
          <div className="shimmer h-[220px] w-full rounded-xl" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonList() {
  return (
    <div className="card">
      <div className="px-5 pt-4 pb-2"><div className="shimmer h-4 w-32" /></div>
      <div className="px-3 pb-3 space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="list-item">
            <div className="shimmer h-10 w-10 rounded-xl" />
            <div className="flex-1">
              <div className="shimmer h-3.5 w-24 mb-2" />
              <div className="shimmer h-2.5 w-16" />
            </div>
            <div className="shimmer h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonForm() {
  return (
    <div className="card p-5 space-y-3">
      <div className="shimmer h-4 w-32" />
      <div className="flex gap-2">
        <div className="shimmer h-10 flex-1 rounded-xl" />
        <div className="shimmer h-10 flex-1 rounded-xl" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="shimmer h-10 rounded-xl" />
        <div className="shimmer h-10 rounded-xl" />
      </div>
      <div className="shimmer h-10 rounded-xl" />
      <div className="shimmer h-10 rounded-xl" />
      <div className="shimmer h-10 rounded-xl" />
    </div>
  );
}
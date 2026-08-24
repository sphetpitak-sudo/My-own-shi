"use client";

export function SkeletonSummary() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="card p-5">
          <div className="shimmer h-3 w-20 mb-3" />
          <div className="shimmer h-6 w-28 mb-3" />
          <div className="shimmer h-1.5 w-full rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="grid-2">
      {[1, 2].map((i) => (
        <div key={i} className="card p-5">
          <div className="shimmer h-4 w-24 mb-3" />
          <div className="shimmer h-[220px] w-full rounded-xl" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonList() {
  return (
    <div className="card p-5">
      <div className="shimmer h-4 w-32 mb-3" />
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ border: "1px solid var(--border)" }}>
            <div className="shimmer h-8 w-8 rounded-lg" />
            <div className="flex-1">
              <div className="shimmer h-3.5 w-20 mb-1.5" />
              <div className="shimmer h-2.5 w-14" />
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
      <div className="shimmer h-4 w-28" />
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

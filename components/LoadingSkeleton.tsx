"use client";

interface Props {
  variant: "card" | "list" | "stats" | "full";
}

export default function LoadingSkeleton({ variant }: Props) {
  if (variant === "full") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "var(--border)", borderTopColor: "transparent" }}
          />
          <p className="text-[13px] font-medium" style={{ color: "var(--text-muted)" }}>
            กำลังโหลด...
          </p>
        </div>
      </div>
    );
  }

  if (variant === "stats") {
    return (
      <div className="tab-content animate-in">
        <div className="shimmer h-8 w-48 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="stat-card">
              <div className="shimmer w-9 h-9 rounded-xl mb-3" />
              <div className="shimmer h-3 w-20 mb-2" />
              <div className="shimmer h-7 w-16" />
            </div>
          ))}
        </div>
        <div className="card p-5">
          <div className="shimmer h-5 w-32 mb-4" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 py-3">
              <div className="shimmer w-10 h-10 rounded-xl" />
              <div className="flex-1">
                <div className="shimmer h-3 w-32 mb-1.5" />
                <div className="shimmer h-2.5 w-48" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === "list") {
    return (
      <div className="tab-content animate-in">
        <div className="shimmer h-8 w-40 mb-6" />
        <div className="shimmer h-10 w-full mb-5" />
        <div className="card">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex items-center gap-3 p-4">
              <div className="shimmer w-10 h-10 rounded-xl" />
              <div className="flex-1">
                <div className="shimmer h-3.5 w-28 mb-1.5" />
                <div className="shimmer h-2.5 w-44" />
              </div>
              <div className="shimmer h-6 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // card variant
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="card p-4">
          <div className="shimmer aspect-[2/3] rounded-xl mb-3" />
          <div className="shimmer h-3.5 w-3/4 mb-1.5" />
          <div className="shimmer h-2.5 w-1/2" />
        </div>
      ))}
    </div>
  );
}

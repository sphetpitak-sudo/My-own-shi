"use client";

import { useLang } from "@/lib/i18n";

export function SkeletonSummary() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="pixel-card-sm text-center">
          <div className="shimmer h-4 w-24 mx-auto mb-2" />
          <div className="shimmer h-6 w-32 mx-auto" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="pixel-card">
        <div className="shimmer h-4 w-28 mb-4" />
        <div className="shimmer h-[220px] w-full" />
      </div>
      <div className="pixel-card">
        <div className="shimmer h-4 w-28 mb-4" />
        <div className="shimmer h-[220px] w-full" />
      </div>
    </div>
  );
}

export function SkeletonList() {
  return (
    <div className="pixel-card">
      <div className="shimmer h-5 w-36 mb-4" />
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center justify-between px-4 py-3 border-2 border-pixel-100 dark:border-pixel-800">
            <div className="flex items-center gap-3">
              <div className="shimmer h-6 w-6" />
              <div className="shimmer h-4 w-24" />
            </div>
            <div className="shimmer h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonForm() {
  return (
    <div className="pixel-card space-y-4">
      <div className="shimmer h-5 w-32" />
      <div className="flex gap-2">
        <div className="shimmer h-12 flex-1" />
        <div className="shimmer h-12 flex-1" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="shimmer h-12" />
        <div className="shimmer h-12" />
      </div>
      <div className="shimmer h-12" />
      <div className="shimmer h-12" />
      <div className="shimmer h-12 w-full" />
    </div>
  );
}

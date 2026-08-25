"use client";

import dynamic from "next/dynamic";
import type { Assignment } from "@/lib/types";

const StudyChartsInner = dynamic(() => import("./StudyChartsInner"), {
  ssr: false,
  loading: () => <div className="card p-6 h-64 animate-pulse" />,
});

export default function StudyCharts({ assignments }: { assignments: Assignment[] }) {
  return <StudyChartsInner assignments={assignments} />;
}

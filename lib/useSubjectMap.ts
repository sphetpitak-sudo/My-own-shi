import { useMemo } from "react";
import type { Subject } from "./types";

export function useSubjectMap(subjects: Subject[]) {
  return useMemo(() => Object.fromEntries(subjects.map(s => [s.id, s])), [subjects]);
}

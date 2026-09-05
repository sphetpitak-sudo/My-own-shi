// Safe persistence over Supabase PostgREST builders.
//
// PostgREST query builders are thenable (`.then` works with await) but do
// NOT implement `.catch` — calling `builder.catch()` throws
// "TypeError: ... .catch is not a function" (was SEALO-2: oracle history
// silently never persisted + unhandled rejection + stuck loading UI).
// Always await builders inside try/catch; never chain `.catch` on them.

interface PersistClient {
  from: (table: string) => {
    update: (values: Record<string, unknown>) => {
      eq: (col: string, val: string) => PromiseLike<{ error: unknown }>;
    };
  };
}

/**
 * Persist an interpretation onto a readings row.
 * Returns true on success, false on any failure (never throws).
 */
export async function persistReadingInterpretation(
  supabase: PersistClient,
  readingId: string,
  interpretation: string
): Promise<boolean> {
  try {
    const res = await supabase
      .from("readings")
      .update({ interpretation })
      .eq("id", readingId);
    if (res?.error) return false;
    return true;
  } catch {
    return false;
  }
}

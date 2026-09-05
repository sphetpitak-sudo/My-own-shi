// Phase 6 — Concurrency smoke test (no external deps, no spends).
// Fires N concurrent INVALID reading requests: they fail request validation
// before any DB/AI call, so this is safe against any environment (local,
// preview, even production — zero side effects).
// Asserts: every response is 400, every x-request-id echoes back unique,
// zero 5xx, zero connection errors.
// Usage: node scripts/load-smoke.mjs [baseUrl] (default http://localhost:3100)
const base = (process.argv[2] || "http://localhost:3100").replace(/\/$/, "");
const N = 50;

const results = await Promise.all(
  Array.from({ length: N }, (_, i) => {
    const rid = `smoke-${Date.now()}-${i}`;
    return fetch(`${base}/api/reading`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-request-id": rid },
      body: JSON.stringify({ spreadType: "nope", cards: [] }),
    })
      .then(async (r) => ({ status: r.status, rid: r.headers.get("x-request-id"), sent: rid }))
      .catch((e) => ({ status: 0, error: String(e).slice(0, 120) }));
  })
);

const badStatus = results.filter((r) => r.status !== 400);
const badEcho = results.filter((r) => r.rid !== r.sent);
const serverErrors = results.filter((r) => r.status >= 500 || r.status === 0);
const dupes = new Set(results.map((r) => r.rid)).size !== N;

console.log(`smoke: ${N} concurrent invalid POSTs ->`, {
  non400: badStatus.length,
  echoMismatch: badEcho.length,
  serverErrors: serverErrors.length,
  duplicateIds: dupes,
});

if (badStatus.length || badEcho.length || serverErrors.length || dupes) {
  console.log(JSON.stringify(results.slice(0, 5)));
  process.exit(1);
}
console.log("smoke: PASS");

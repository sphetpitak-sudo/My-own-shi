# Sealo Runbook — Rollback, Backup, Alerts (Phase 6)

## Rollback: bad deploy
1. Vercel → Deployments → previous Ready build → **Promote to Production** (instant, no rebuild).
2. If the bad deploy already wrote data: check `v_orphan_expired` and `v_refund_rate_24h`
   in Supabase SQL Editor; the sweeper refunds orphans automatically.
3. Never roll back `supabase/setup.sql` — it is append-only and re-runnable
   (`IF NOT EXISTS` / `OR REPLACE`); re-running an older copy is a no-op for
   existing objects, never destructive.

## Rollback: bad SQL run
- `setup.sql` has no DROP TABLE / destructive statements — re-run is safe.
- If a single RPC misbehaves, redeploy the previous `main` (code never depends
  on unreleased SQL except: breaker RPCs §24, sweeper RPCs §25 — both degrade
  gracefully: breaker fail-open, sweeper cron 500s and retries).

## Stop the world (incident)
- Freeze writes: Admin → Settings → enable **db_migration_lock** (blocks every
  spend via RPC + chat/saju/followup writes via route guard, 503).
- Freeze pages: enable **announcement_mode** (landing only, in-flight AI drains).
- Freeze schedulers: GitHub Actions → disable `sweep-generating` / `reconcile-ledger`
  workflows (or rotate `CRON_SECRET` to instantly invalidate scheduled calls).

## Backup
- Database: Supabase managed backups + Point-in-Time Recovery (dashboard →
  Settings → Backups). Verify restore drill quarterly.
- Code: git (`main` is always deployable — CI gates test+tsc+lint+build+smoke).

## Alerts (Sentry, EU project `sealo`)
- 502 AI-fail spike → check Typhoon status, breaker trips automatically at
  10 fails/60s (tune `BREAKER_DEFAULTS` in `lib/ai.ts` from dashboard p95).
- 503 DB-busy spike → check Supabase load / connection pooling.
- `refund rate > 5%/h` (`v_refund_rate_24h`) → investigate AI/DB flakiness.
- `reconcile-ledger` drift alert → never auto-fix; reconcile manually.

## Deploy order (must not swap)
1. Run `supabase/setup.sql` + `supabase/observability_metrics.sql` FIRST
   (creates RPCs/views the code calls).
2. Then Create Deployment branch `main` (git auto-deploy is unreliable —
   see history; prefer manual Create Deployment or Deploy Hook).
3. `NEXT_PUBLIC_*` envs bake at build time — any env change needs a rebuild.

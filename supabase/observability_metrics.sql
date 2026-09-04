-- ============================================
-- Sealo Observability Metrics — Phase 0.3
-- Run in Supabase SQL Editor (safe to re-run).
-- Provides 3 views for the admin dashboard + alerting:
--   1. v_refund_rate_24h     — refund rate per hour (alert if > 5%)
--   2. v_rate_limit_hits_24h  — rate-limit hits per endpoint per hour
--   3. v_orphan_generating    — rows stuck in __generating__ (Phase 2 sweeper reads this)
-- Note: p95 AI latency is NOT in Postgres — read it from Vercel log
-- drains by parsing [obs] JSON lines (latencyMs grouped by endpoint).
-- ============================================

-- 1. Refund rate per hour (last 24h)
CREATE OR REPLACE VIEW v_refund_rate_24h AS
SELECT
  date_trunc('hour', created_at) AS hour,
  COUNT(*) FILTER (WHERE type = 'reading_purchase') AS purchases,
  COUNT(*) FILTER (WHERE type = 'refund') AS refunds,
  CASE
    WHEN COUNT(*) FILTER (WHERE type = 'reading_purchase') = 0 THEN 0
    ELSE ROUND(
      100.0 * COUNT(*) FILTER (WHERE type = 'refund')
      / COUNT(*) FILTER (WHERE type = 'reading_purchase'), 2)
  END AS refund_pct
FROM point_transactions
WHERE created_at >= now() - interval '24 hours'
GROUP BY 1
ORDER BY 1 DESC;

-- 2. Rate-limit hits per endpoint per hour (last 24h)
-- check_rate_limit() only inserts on ALLOW, so hits are inferred from
-- application [obs] logs (outcome=rate_limited). This view shows ALLOW
-- volume per endpoint for capacity planning.
CREATE OR REPLACE VIEW v_rate_limit_allow_24h AS
SELECT
  endpoint,
  date_trunc('hour', created_at) AS hour,
  COUNT(*) AS allows
FROM api_rate_limits
WHERE created_at >= now() - interval '24 hours'
GROUP BY 1, 2
ORDER BY 2 DESC, 3 DESC;

-- 3. Orphan __generating__ rows (consumed by Phase 2 sweeper + alerts)
-- TTL is per-endpoint = route maxDuration + buffer (locked in plan review).
-- Coverage audit (verified by grepping __generating__ across app/api):
--   readings:          POST /api/reading (maxDuration 90s)          -> 180s
--   reading_followups: POST /api/reading/followup (maxDuration 60s) -> 120s
-- Deliberately ABSENT (no __generating__ marker exists there):
--   oracle (90s):     no marker row at all — payment is ledger-only, and its
--                     AI-failure paths currently lack refund RPCs (pre-existing
--                     bug, tracked for Phase 1 refund wiring, NOT the sweeper).
--   saju (30s):       free, best-effort insert, no marker, nothing to refund.
--   birthchart/zodiac/daily/chat: insert final content (or fallback), no marker.
-- If a marker is ever added to another table, extend this view + sweeper.
-- A row older than its TTL cannot still be running (the platform kills the
-- invocation at maxDuration), so the sweeper may refund it with no
-- false-refund risk.
CREATE OR REPLACE VIEW v_orphan_generating AS
SELECT id, user_id, spread_type, points_spent, created_at,
  'reading'::text AS source_endpoint,
  EXTRACT(EPOCH FROM (now() - created_at))::int AS age_seconds,
  180 AS threshold_seconds,
  (EXTRACT(EPOCH FROM (now() - created_at))::int > 180) AS is_expired
FROM readings
WHERE interpretation = '__generating__'
UNION ALL
SELECT id, user_id, NULL AS spread_type, 0 AS points_spent, created_at,
  'followup'::text AS source_endpoint,
  EXTRACT(EPOCH FROM (now() - created_at))::int AS age_seconds,
  120 AS threshold_seconds,
  (EXTRACT(EPOCH FROM (now() - created_at))::int > 120) AS is_expired
FROM reading_followups
WHERE answer = '__generating__'
ORDER BY created_at ASC;

-- Expired-only subset: the Phase 2 sweeper reads THIS view.
CREATE OR REPLACE VIEW v_orphan_expired AS
SELECT * FROM v_orphan_generating WHERE is_expired
ORDER BY created_at ASC;

import { createClient } from "@supabase/supabase-js";

// Service-role client for system jobs (cron sweeper / reconcile).
// Bypasses RLS — ONLY usable server-side with SUPABASE_SERVICE_ROLE_KEY.
// Never import this in client components or user-facing logic.
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing service env (URL / SUPABASE_SERVICE_ROLE_KEY)");
  return createClient(url, key, { auth: { persistSession: false } });
}

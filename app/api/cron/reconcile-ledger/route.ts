import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { checkCronAuth } from "@/lib/cron";
import { startObs, endObs, obsHeaders } from "@/lib/observability";
import { reportError } from "@/lib/sentry";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

// Report-only: surfaces profile-vs-ledger drift, never auto-fixes.
export async function GET(request: Request) {
  const obs = startObs("reconcile-ledger", request);
  try {
    const denied = checkCronAuth(request);
    if (denied) {
      endObs(obs, denied.status === 401 ? "unauthorized" : "db_error", {
        status: denied.status,
        reason: "cron_auth",
      });
      return denied;
    }

    const supabase = createServiceClient();
    const { data, error } = (await supabase.rpc("reconcile_ledger_mismatches", {
      p_limit: 20,
    })) as unknown as {
      data: { checked_users: number; mismatch_count: number; sample: unknown } | null;
      error: { message?: string } | null;
    };
    if (error) throw new Error(error.message || "reconcile RPC failed");

    const result = data ?? { checked_users: 0, mismatch_count: 0, sample: [] };
    if (result.mismatch_count > 0) {
      // Alert (page on-call per Phase 0 runbook); no auto-fix by design.
      reportError(new Error("Ledger drift detected"), {
        requestId: obs.requestId,
        endpoint: "reconcile-ledger",
        mismatch_count: result.mismatch_count,
      });
    }
    endObs(obs, "ok", {
      status: 200,
      checked_users: result.checked_users,
      mismatch_count: result.mismatch_count,
    });
    return NextResponse.json(result, { headers: obsHeaders(obs) });
  } catch (e: unknown) {
    reportError(e, { requestId: obs.requestId, endpoint: "reconcile-ledger" });
    endObs(obs, "db_error", { status: 500, reason: "unhandled" });
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500, headers: obsHeaders(obs) }
    );
  }
}

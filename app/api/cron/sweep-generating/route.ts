import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { checkCronAuth } from "@/lib/cron";
import { startObs, endObs, obsHeaders } from "@/lib/observability";
import { reportError } from "@/lib/sentry";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const SWEEP_LIMIT = 50;

export async function GET(request: Request) {
  const obs = startObs("sweep-generating", request);
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
    const { data, error } = (await supabase.rpc("sweep_expired_generating", {
      p_limit: SWEEP_LIMIT,
    })) as unknown as {
      data: { readings_swept: number; followups_swept: number; points_refunded: number } | null;
      error: { message?: string } | null;
    };
    if (error) throw new Error(error.message || "sweep RPC failed");

    const result = data ?? { readings_swept: 0, followups_swept: 0, points_refunded: 0 };
    endObs(obs, "ok", { status: 200, ...result });
    return NextResponse.json(result, { headers: obsHeaders(obs) });
  } catch (e: unknown) {
    reportError(e, { requestId: obs.requestId, endpoint: "sweep-generating" });
    endObs(obs, "db_error", { status: 500, reason: "unhandled" });
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500, headers: obsHeaders(obs) }
    );
  }
}

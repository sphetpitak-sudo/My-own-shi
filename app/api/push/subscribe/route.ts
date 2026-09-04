import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { startObs, setObsUser, endObs, obsHeaders } from "@/lib/observability";

export async function POST(request: Request) {
  const obs = startObs("push-subscribe", request);
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      endObs(obs, "unauthorized", { status: 401 });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: obsHeaders(obs) });
    }
    setObsUser(obs, user.id);
    const body = await request.json().catch(()=> ({})) as { endpoint?: string; p256dh?: string; auth?: string };
    const endpoint = (body.endpoint || "").slice(0, 500);
    const p256dh = (body.p256dh || "mock").slice(0, 500);
    const auth = (body.auth || "mock").slice(0, 500);
    if (!endpoint) {
      endObs(obs, "validation_error", { status: 400, reason: "missing_endpoint" });
      return NextResponse.json({ error: "Missing endpoint" }, { status: 400, headers: obsHeaders(obs) });
    }
    const { error } = await supabase.from("push_subscriptions").upsert({ user_id: user.id, endpoint, p256dh, auth }, { onConflict: "endpoint" });
    if (error) {
      endObs(obs, "db_error", { status: 500, reason: "upsert_failed" });
      return NextResponse.json({ error: error.message }, { status: 500, headers: obsHeaders(obs) });
    }
    endObs(obs, "ok", { status: 200 });
    return NextResponse.json({ success: true }, { headers: obsHeaders(obs) });
  } catch (e: unknown) {
    endObs(obs, "db_error", { status: 500, reason: "unhandled" });
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500, headers: obsHeaders(obs) });
  }
}

export async function DELETE(request: Request) {
  const obs = startObs("push-subscribe", request);
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      endObs(obs, "unauthorized", { status: 401 });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: obsHeaders(obs) });
    }
    setObsUser(obs, user.id);
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get("endpoint");
    if (endpoint) {
      await supabase.from("push_subscriptions").delete().eq("user_id", user.id).eq("endpoint", endpoint);
    } else {
      await supabase.from("push_subscriptions").delete().eq("user_id", user.id);
    }
    endObs(obs, "ok", { status: 200 });
    return NextResponse.json({ success: true }, { headers: obsHeaders(obs) });
  } catch (e: unknown) {
    endObs(obs, "db_error", { status: 500, reason: "unhandled" });
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500, headers: obsHeaders(obs) });
  }
}

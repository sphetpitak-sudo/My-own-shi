import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { startObs, setObsUser, endObs, obsHeaders } from "@/lib/observability";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const obs = startObs("chat-conversations", request);
  try {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    endObs(obs, "unauthorized", { status: 401 });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: obsHeaders(obs) });
  }
  setObsUser(obs, user.id);

  const { data, error } = await supabase
    .from("chat_conversations")
    .select("id, title, updated_at, created_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) {
    // PGRST205 = table not found (migration not yet run) — return empty, don't 500
    if ((error as { code?: string }).code === "PGRST205") {
      endObs(obs, "ok", { status: 200, empty: true, reason: "table_missing" });
      return NextResponse.json({ conversations: [] }, { headers: obsHeaders(obs) });
    }
    endObs(obs, "db_error", { status: 500, reason: "load_failed" });
    return NextResponse.json({ error: "Failed to load" }, { status: 500, headers: obsHeaders(obs) });
  }
  endObs(obs, "ok", { status: 200 });
  return NextResponse.json({ conversations: data || [] }, { headers: obsHeaders(obs) });
  } catch (e: unknown) {
    endObs(obs, "db_error", { status: 500, reason: "unhandled" });
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500, headers: obsHeaders(obs) });
  }
}

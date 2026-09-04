import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { startObs, setObsUser, endObs, obsHeaders } from "@/lib/observability";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const obs = startObs("chat-messages", request);
  try {
  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get("conversationId");
  if (!conversationId) {
    endObs(obs, "validation_error", { status: 400, reason: "missing_conversation_id" });
    return NextResponse.json({ error: "Missing conversationId" }, { status: 400, headers: obsHeaders(obs) });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    endObs(obs, "unauthorized", { status: 401 });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: obsHeaders(obs) });
  }
  setObsUser(obs, user.id);

  // Ensure ownership — if tables missing, return empty. Treat ephemeral tmp-* / invalid UUID as empty (no persist)
  if (conversationId.startsWith("tmp-") || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(conversationId)) {
    endObs(obs, "ok", { status: 200, empty: true, ephemeral: true });
    return NextResponse.json({ messages: [] }, { headers: obsHeaders(obs) });
  }
  const { data: conv, error: convErr } = await supabase.from("chat_conversations").select("id").eq("id", conversationId).eq("user_id", user.id).single();
  const c = (convErr as { code?: string } | null)?.code;
  if (c === "PGRST205") {
    endObs(obs, "ok", { status: 200, empty: true, reason: "table_missing" });
    return NextResponse.json({ messages: [] }, { headers: obsHeaders(obs) });
  }
  if (c === "22P02") {
    endObs(obs, "validation_error", { status: 404, reason: "not_found" });
    return NextResponse.json({ error: "Not found" }, { status: 404, headers: obsHeaders(obs) });
  }
  if (!conv) {
    endObs(obs, "validation_error", { status: 404, reason: "not_found" });
    return NextResponse.json({ error: "Not found" }, { status: 404, headers: obsHeaders(obs) });
  }

  const { data, error } = await supabase
    .from("chat_messages")
    .select("id, role, content, tool_data, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(100);

  if (error) {
    if ((error as { code?: string }).code === "PGRST205") {
      endObs(obs, "ok", { status: 200, empty: true, reason: "table_missing" });
      return NextResponse.json({ messages: [] }, { headers: obsHeaders(obs) });
    }
    endObs(obs, "db_error", { status: 500, reason: "load_failed" });
    return NextResponse.json({ error: "Failed to load" }, { status: 500, headers: obsHeaders(obs) });
  }
  endObs(obs, "ok", { status: 200 });
  return NextResponse.json({ messages: data || [] }, { headers: obsHeaders(obs) });
  } catch (e: unknown) {
    endObs(obs, "db_error", { status: 500, reason: "unhandled" });
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500, headers: obsHeaders(obs) });
  }
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { startObs, setObsUser, endObs, obsHeaders } from "@/lib/observability";

export const dynamic = "force-dynamic";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const obs = startObs("chat-conversation-delete", request);
  try {
  const { id } = await params;
  if (!id) {
    endObs(obs, "validation_error", { status: 400, reason: "missing_id" });
    return NextResponse.json({ error: "Missing id" }, { status: 400, headers: obsHeaders(obs) });
  }
  // Ephemeral tmp-* or invalid UUID: treat as already deleted
  if (id.startsWith("tmp-") || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    endObs(obs, "ok", { status: 200, ephemeral: true });
    return NextResponse.json({ ok: true }, { headers: obsHeaders(obs) });
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

  const { error } = await supabase.from("chat_conversations").delete().eq("id", id).eq("user_id", user.id);
  if (error) {
    const code = (error as { code?: string }).code;
    if (code === "PGRST205" || code === "22P02") {
      endObs(obs, "ok", { status: 200, empty: true, reason: code });
      return NextResponse.json({ ok: true }, { headers: obsHeaders(obs) });
    }
    endObs(obs, "db_error", { status: 500, reason: "delete_failed" });
    return NextResponse.json({ error: "Failed to delete" }, { status: 500, headers: obsHeaders(obs) });
  }
  endObs(obs, "ok", { status: 200 });
  return NextResponse.json({ ok: true }, { headers: obsHeaders(obs) });
  } catch (e: unknown) {
    endObs(obs, "db_error", { status: 500, reason: "unhandled" });
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500, headers: obsHeaders(obs) });
  }
}

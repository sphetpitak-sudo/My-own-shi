import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get("conversationId");
  if (!conversationId) return NextResponse.json({ error: "Missing conversationId" }, { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Ensure ownership — if tables missing, return empty
  const { data: conv, error: convErr } = await supabase.from("chat_conversations").select("id").eq("id", conversationId).eq("user_id", user.id).single();
  if (convErr && (convErr as { code?: string }).code === "PGRST205") return NextResponse.json({ messages: [] });
  if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data, error } = await supabase
    .from("chat_messages")
    .select("id, role, content, tool_data, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(100);

  if (error) {
    if ((error as { code?: string }).code === "PGRST205") return NextResponse.json({ messages: [] });
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
  return NextResponse.json({ messages: data || [] });
}

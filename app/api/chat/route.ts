import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOpenAI, AI_MODEL, AI_PARAMS } from "@/lib/ai";
import { CHAT_SYSTEM_PROMPT, PROMPT_VERSION, buildChatUserPrompt } from "@/lib/prompts";
import { detectToolsNeeded, executeTool } from "@/lib/chat/tools";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const rawLen = request.headers.get("content-length");
    if (rawLen && parseInt(rawLen, 10) > 8000) return NextResponse.json({ error: "Payload too large" }, { status: 413 });

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const { message, conversationId } = body as { message?: string; conversationId?: string };
    const trimmed = (message || "").trim();
    if (!trimmed) return NextResponse.json({ error: "Message required" }, { status: 400 });
    if (trimmed.length > 2000) return NextResponse.json({ error: "Message too long (max 2000)" }, { status: 400 });

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: rateOk } = await supabase.rpc("check_rate_limit", { p_endpoint: "chat", p_limit: 20, p_window_seconds: 60 });
    if (rateOk === false) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

    // Resolve or create conversation
    let convId: string | null = conversationId || null;
    let isNew = false;
    if (convId) {
      const { data: conv } = await supabase.from("chat_conversations").select("id").eq("id", convId).eq("user_id", user.id).single();
      if (!conv) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    } else {
      const title = trimmed.slice(0, 40) || "สนทนาใหม่";
      const { data: conv, error } = await supabase.from("chat_conversations").insert({ user_id: user.id, title }).select("id").single();
      if (error || !conv) return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });
      convId = (conv as { id: string }).id;
      isNew = true;
    }

    // Save user message
    const { error: msgErr } = await supabase.from("chat_messages").insert({ conversation_id: convId!, user_id: user.id, role: "user", content: trimmed });
    if (msgErr) return NextResponse.json({ error: "Failed to save message" }, { status: 500 });

    // Load recent history (last 6)
    const { data: historyRows } = await supabase
      .from("chat_messages")
      .select("role, content")
      .eq("conversation_id", convId!)
      .order("created_at", { ascending: true })
      .limit(20);
    const history = (historyRows || []).slice(-6).map((r: { role: string; content: string }) => ({ role: r.role, content: r.content }));

    // Detect and execute tools (whitelisted, read-only, navigation only)
    const needed = detectToolsNeeded(trimmed);
    let toolContext = "";
    const toolWidgets: Array<{ type: string; props: unknown }> = [];
    for (const toolName of needed.slice(0, 3)) {
      const res = await executeTool(toolName, user.id, trimmed);
      if (res) {
        toolContext += `\n[${toolName}]\n${JSON.stringify(res.data).slice(0, 1500)}\n`;
        if (res.widget) toolWidgets.push(res.widget);
      }
    }

    const userPrompt = buildChatUserPrompt({ message: trimmed, toolContext: toolContext || undefined, history: history.slice(0, -1) });

    const params = AI_PARAMS.chat;

    const abortController = new AbortController();
    const onClientAbort = () => {
      try {
        abortController.abort();
      } catch {}
    };
    if (request.signal) {
      if (request.signal.aborted) abortController.abort();
      else request.signal.addEventListener("abort", onClientAbort, { once: true });
    }
    const timeoutId = setTimeout(() => {
      try {
        abortController.abort();
      } catch {}
    }, params.timeoutMs);

    let stream: Awaited<ReturnType<typeof getOpenAI extends () => infer R ? R extends { chat: { completions: { create: (...a: unknown[]) => Promise<infer S> } } } ? () => Promise<S> : never : never>> | null = null;
    try {
      const p = getOpenAI().chat.completions.create(
        {
          model: AI_MODEL,
          messages: [
            { role: "system", content: CHAT_SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
          temperature: params.temperature,
          max_tokens: params.max_tokens,
          stream: true,
        },
        { timeout: params.timeoutMs, maxRetries: 0, signal: abortController.signal } as unknown as Record<string, unknown>
      );
      const timeoutPromise = new Promise<never>((_, reject) => setTimeout(() => reject(new Error("AI_CREATE_TIMEOUT")), params.timeoutMs + 3000));
      const s = await Promise.race([p, timeoutPromise]);
      stream = s as unknown as typeof stream;
    } catch (err) {
      clearTimeout(timeoutId);
      if (request.signal) request.signal.removeEventListener("abort", onClientAbort);
      console.error("[chat] promptVersion", PROMPT_VERSION, err);
      return NextResponse.json({ error: "AI ไม่ตอบสนอง กรุณาลองใหม่" }, { status: 502 });
    }

    if (!stream) {
      clearTimeout(timeoutId);
      if (request.signal) request.signal.removeEventListener("abort", onClientAbort);
      return NextResponse.json({ error: "AI unavailable" }, { status: 502 });
    }

    const encoder = new TextEncoder();
    let fullText = "";
    let firstTokenTimeout: ReturnType<typeof setTimeout> | null = setTimeout(() => {
      try {
        abortController.abort();
      } catch {}
    }, params.firstTokenMs);

    const readable = new ReadableStream({
      async start(controller) {
        try {
          // Send conversationId first for new conversations
          if (isNew && convId) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ conversationId: convId })}\n\n`));
          }
          // Send widgets if any
          if (toolWidgets.length > 0) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ widgets: toolWidgets })}\n\n`));
          }
          for await (const chunk of stream as unknown as AsyncIterable<{ choices: Array<{ delta?: { content?: string } }> }>) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              if (firstTokenTimeout) {
                clearTimeout(firstTokenTimeout);
                firstTokenTimeout = null;
              }
              if (fullText.length < 6000) fullText += content.slice(0, 6000 - fullText.length);
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
            }
          }
          if (firstTokenTimeout) {
            clearTimeout(firstTokenTimeout);
            firstTokenTimeout = null;
          }
          clearTimeout(timeoutId);
          if (request.signal) request.signal.removeEventListener("abort", onClientAbort);
          // Persist assistant message
          if (fullText.trim()) {
            const toSave = fullText.trim().slice(0, 6000);
            const widgetData = toolWidgets.length ? { widgets: toolWidgets } : null;
            await supabase.from("chat_messages").insert({ conversation_id: convId!, user_id: user.id, role: "assistant", content: toSave, tool_data: widgetData as unknown as never });
            // Update conversation title if first message and title still default
            if (history.length <= 1) {
              const newTitle = trimmed.slice(0, 40);
              await supabase.from("chat_conversations").update({ title: newTitle } as never).eq("id", convId!);
            }
          }
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        } catch (err) {
          if (firstTokenTimeout) clearTimeout(firstTokenTimeout);
          clearTimeout(timeoutId);
          if (request.signal) request.signal.removeEventListener("abort", onClientAbort);
          console.error("[chat] stream failed", err);
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "สตรีมขัดข้อง กรุณาลองใหม่" })}\n\n`));
          } catch {}
          try {
            controller.error(new Error("stream failed"));
          } catch {}
        }
      },
      cancel() {
        try {
          abortController.abort();
        } catch {}
        if (firstTokenTimeout) clearTimeout(firstTokenTimeout);
        clearTimeout(timeoutId);
        if (request.signal) request.signal.removeEventListener("abort", onClientAbort);
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
        "X-Prompt-Version": PROMPT_VERSION,
      },
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}

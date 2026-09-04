import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOpenAI, AI_MODEL, AI_PARAMS, createAiStream, armFirstTokenGuard, isBreakerOpen, recordBreakerFailure } from "@/lib/ai";
import { CHAT_SYSTEM_PROMPT, PROMPT_VERSION, buildChatUserPrompt } from "@/lib/prompts";
import { detectToolsNeeded, executeTool } from "@/lib/chat/tools";
import { startObs, setObsUser, endObs, logObs, logPromptVersion, obsHeaders } from "@/lib/observability";
import { checkRateLimitPolicy } from "@/lib/ratelimit";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const obs = startObs("chat", request);
  try {
    const rawLen = request.headers.get("content-length");
    if (rawLen && parseInt(rawLen, 10) > 8000) {
      endObs(obs, "validation_error", { status: 413, reason: "payload_too_large" });
      return NextResponse.json({ error: "Payload too large" }, { status: 413, headers: obsHeaders(obs) });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      endObs(obs, "validation_error", { status: 400, reason: "invalid_json" });
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers: obsHeaders(obs) });
    }
    const { message, conversationId } = body as { message?: string; conversationId?: string };
    const trimmed = (message || "").trim();
    if (!trimmed) {
      endObs(obs, "validation_error", { status: 400, reason: "message_required" });
      return NextResponse.json({ error: "Message required" }, { status: 400, headers: obsHeaders(obs) });
    }
    if (trimmed.length > 2000) {
      endObs(obs, "validation_error", { status: 400, reason: "message_too_long" });
      return NextResponse.json({ error: "Message too long (max 2000)" }, { status: 400, headers: obsHeaders(obs) });
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

    // Single policy: limit BEFORE work, fail-closed on DB errors.
    const rl = await checkRateLimitPolicy(supabase, "chat");
    if (!rl.allowed) {
      if (rl.reason === "db_unavailable") {
        endObs(obs, "db_error", { status: 503, reason: "rate_limit_unavailable" });
        return NextResponse.json({ error: "Database busy, please retry" }, { status: 503, headers: obsHeaders(obs) });
      }
      endObs(obs, "rate_limited", { status: 429 });
      return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: obsHeaders(obs) });
    }

    // Resolve or create conversation — with fallback if tables not yet migrated
    const isValidUUID = (v: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
    let convId: string | null = conversationId || null;
    // Treat ephemeral tmp-* or invalid UUID as "create new" (prevents 22P02 invalid input syntax)
    if (convId && (convId.startsWith("tmp-") || !isValidUUID(convId))) {
      convId = null;
    }
    let isNew = false;
    let dbAvailable = true;
    if (convId) {
      try {
        const { data: conv, error: convErr } = await supabase.from("chat_conversations").select("id").eq("id", convId).eq("user_id", user.id).single();
        const code = (convErr as { code?: string } | null)?.code;
        if (code === "PGRST205" || code === "22P02") dbAvailable = false;
        else if (convErr || !conv) {
          endObs(obs, "validation_error", { status: 404, reason: "conversation_not_found" });
          return NextResponse.json({ error: "Conversation not found" }, { status: 404, headers: obsHeaders(obs) });
        }
      } catch {
        dbAvailable = false;
      }
    } else {
      try {
        const title = trimmed.slice(0, 40) || "สนทนาใหม่";
        const { data: conv, error } = await supabase.from("chat_conversations").insert({ user_id: user.id, title }).select("id").single();
        if (error) {
          if ((error as { code?: string }).code === "PGRST205") {
            dbAvailable = false;
            // Fallback ephemeral ID
            convId = globalThis.crypto?.randomUUID?.() ?? `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
            isNew = true;
          } else {
            endObs(obs, "db_error", { status: 500, reason: "create_conversation_failed" });
            return NextResponse.json({ error: "Failed to create conversation" }, { status: 500, headers: obsHeaders(obs) });
          }
        } else if (conv) {
          convId = (conv as { id: string }).id;
          isNew = true;
        }
      } catch {
        dbAvailable = false;
        convId = globalThis.crypto?.randomUUID?.() ?? `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        isNew = true;
      }
    }
    // Ensure convId exists for ephemeral fallback
    if (!convId) {
      convId = globalThis.crypto?.randomUUID?.() ?? `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      isNew = true;
      dbAvailable = false;
    }

    // Save user message — best-effort if DB missing
    if (dbAvailable) {
      try {
        const { error: msgErr } = await supabase.from("chat_messages").insert({ conversation_id: convId!, user_id: user.id, role: "user", content: trimmed });
        const mCode = (msgErr as { code?: string } | null)?.code;
        if (mCode === "PGRST205" || mCode === "22P02") dbAvailable = false;
        else if (msgErr) console.warn("[chat] save user msg failed", msgErr);
      } catch {}
    }

    // Load recent history (last 6) — fallback empty
    let history: Array<{ role: string; content: string }> = [];
    if (dbAvailable) {
      try {
        const { data: historyRows } = await supabase
          .from("chat_messages")
          .select("role, content")
          .eq("conversation_id", convId!)
          .order("created_at", { ascending: true })
          .limit(20);
        history = (historyRows || []).slice(-6).map((r: { role: string; content: string }) => ({ role: r.role, content: r.content }));
      } catch {}
    }

    // Detect and execute tools (whitelisted, read-only, navigation only) — parallel for latency
    const needed = detectToolsNeeded(trimmed);
    let toolContext = "";
    const toolWidgets: Array<{ type: string; props: unknown }> = [];
    const toRun = needed.slice(0, 3);
    if (toRun.length > 0) {
      const results = await Promise.all(toRun.map((n) => executeTool(n, user.id, trimmed)));
      for (let i = 0; i < toRun.length; i++) {
        const res = results[i];
        if (res) {
          toolContext += `\n[${toRun[i]}]\n${JSON.stringify(res.data).slice(0, 1500)}\n`;
          if (res.widget) toolWidgets.push(res.widget);
        }
      }
    }

    const userPrompt = buildChatUserPrompt({ message: trimmed, toolContext: toolContext || undefined, history: history.slice(0, -1) });

    const params = AI_PARAMS.chat;
    logPromptVersion(obs, PROMPT_VERSION);

    // Circuit breaker (shared store): skip the AI call when Typhoon is
    // failing globally instead of adding retry load. Fail-open on RPC error.
    // Free endpoint — no spend/refund.
    if (await isBreakerOpen(supabase, "chat")) {
      endObs(obs, "breaker_open", { status: 503, reason: "ai_breaker_open" });
      return NextResponse.json({ error: "AI กำลังหนาแน่น กรุณาลองใหม่ในครู่" }, { status: 503, headers: obsHeaders(obs) });
    }

    type ChatChunk = { choices: Array<{ delta?: { content?: string }; finish_reason?: string }>; finish_reason?: string };
    let handle: Awaited<ReturnType<typeof createAiStream<AsyncIterable<ChatChunk>>>> | null = null;
    try {
      // Centralized pre-stream setup: client-abort forwarding + create
      // timeout + ONE safe retry (pre-stream only — see lib/ai.ts).
      handle = await createAiStream<AsyncIterable<ChatChunk>>({
        create: (signal) =>
          getOpenAI().chat.completions.create(
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
            { timeout: params.timeoutMs, maxRetries: 0, signal } as unknown as Record<string, unknown>
          ) as unknown as Promise<AsyncIterable<ChatChunk>>,
        requestSignal: request.signal,
        timeoutMs: params.timeoutMs,
        onRetry: (err, attempt) => logObs(obs, "ai_retry", { attempt }),
      });
    } catch (err) {
      handle?.detach();
      await recordBreakerFailure(supabase, "chat");
      console.error("[chat] promptVersion", PROMPT_VERSION, err);
      endObs(obs, "ai_error", { status: 502, reason: "ai_create_failed" });
      return NextResponse.json({ error: "AI ไม่ตอบสนอง กรุณาลองใหม่" }, { status: 502, headers: obsHeaders(obs) });
    }

    if (!handle) {
      await recordBreakerFailure(supabase, "chat");
      endObs(obs, "ai_error", { status: 502, reason: "no_stream" });
      return NextResponse.json({ error: "AI unavailable" }, { status: 502, headers: obsHeaders(obs) });
    }
    const stream = handle.stream;

    const encoder = new TextEncoder();
    let fullText = "";
    let truncated = false;
    const clearFirstTokenGuard = armFirstTokenGuard(() => {
      try {
        handle?.abort();
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
          for await (const chunk of stream) {
            const c = chunk as { choices: Array<{ delta?: { content?: string }; finish_reason?: string }>; finish_reason?: string };
            const content = c.choices[0]?.delta?.content || "";
            const finishReason = (c.choices[0] as { finish_reason?: string })?.finish_reason || c.finish_reason;
            if (finishReason === "length") truncated = true;
            if (content) {
              clearFirstTokenGuard();
              if (fullText.length < 6000) {
                fullText += content.slice(0, 6000 - fullText.length);
                if (fullText.length >= 6000) truncated = true;
              } else {
                truncated = true;
              }
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
            }
          }
          clearFirstTokenGuard();
          handle?.detach();
          if (truncated) {
            try {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ warning: "truncated" })}\n\n`));
            } catch {}
          }
          // Persist assistant message — best-effort if DB available
          if (fullText.trim() && dbAvailable) {
            try {
              const toSave = fullText.trim().slice(0, 6000);
              const widgetData = toolWidgets.length ? { widgets: toolWidgets } : null;
              await supabase.from("chat_messages").insert({ conversation_id: convId!, user_id: user.id, role: "assistant", content: toSave, tool_data: widgetData as unknown as never });
              if (history.length <= 1) {
                const newTitle = trimmed.slice(0, 40);
                await supabase.from("chat_conversations").update({ title: newTitle, updated_at: new Date().toISOString() } as never).eq("id", convId!);
              }
            } catch {}
          }
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          endObs(obs, "ok", { status: 200, chars: fullText.length, truncated });
          controller.close();
        } catch (err) {
          clearFirstTokenGuard();
          handle?.detach();
          console.error("[chat] stream failed", err);
          await recordBreakerFailure(supabase, "chat");
          endObs(obs, "ai_error", { status: 502, reason: "stream_failed" });
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
          handle?.abort();
        } catch {}
        clearFirstTokenGuard();
        handle?.detach();
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
        "X-Prompt-Version": PROMPT_VERSION,
        "x-request-id": obs.requestId,
      },
    });
  } catch (e: unknown) {
    endObs(obs, "db_error", { status: 500, reason: "unhandled" });
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500, headers: obsHeaders(obs) });
  }
}

"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useShell } from "@/components/DashboardShell";
import { ALL_CARDS } from "@/lib/cards";
import TarotCard from "@/components/TarotCard";
import { Send, Sparkles, Trash2, MessageCircle, Sun, Clock, Layers, BookOpen, Heart, ArrowLeft, Loader2 } from "lucide-react";

interface Conversation { id: string; title: string; updated_at: string; created_at: string; }
interface Message { id: string; role: "user" | "assistant"; content: string; tool_data?: { widgets?: Array<{ type: string; props: unknown }> } | null; created_at: string; }

const QUICK_ACTIONS = [
  { label: "ดูดวงวันนี้", icon: Sun, prompt: "ดูดวงวันนี้ให้หน่อย" },
  { label: "ดูไพ่ล่าสุด", icon: Clock, prompt: "ไพ่ล่าสุดของฉันคืออะไร" },
  { label: "ถามเรื่องความรัก", icon: Heart, prompt: "ช่วยคิดเรื่องความรักให้หน่อย" },
  { label: "ช่วยคิดเรื่องนี้", icon: Sparkles, prompt: "ช่วยฉันคิดเรื่องที่กำลังกังวลอยู่" },
  { label: "เปิดไพ่ใหม่", icon: Layers, prompt: "ฉันควรเปิดไพ่แบบไหนดี" },
];

export default function ChatPage() {
  const { profile } = useShell();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [convId, setConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState("");
  const [showList, setShowList] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchConversations = useCallback(async () => {
    const res = await fetch("/api/chat/conversations");
    if (res.ok) {
      const j = await res.json();
      setConversations(j.conversations || []);
      if (!convId && j.conversations?.[0]) setConvId(j.conversations[0].id);
    }
  }, [convId]);

  const fetchMessages = useCallback(async (id: string) => {
    const res = await fetch(`/api/chat/messages?conversationId=${id}`);
    if (res.ok) {
      const j = await res.json();
      setMessages(j.messages || []);
    }
  }, []);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);
  useEffect(() => { if (convId) fetchMessages(convId); else setMessages([]); }, [convId, fetchMessages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  const handleNewChat = () => {
    setConvId(null);
    setMessages([]);
    setInput("");
    setError("");
    setShowList(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("ลบการสนทนานี้?")) return;
    await fetch(`/api/chat/conversations/${id}`, { method: "DELETE" });
    setConversations((p) => p.filter((c) => c.id !== id));
    if (convId === id) { setConvId(null); setMessages([]); }
  };

  const send = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || streaming) return;
    setInput("");
    setError("");
    // eslint-disable-next-line react-hooks/purity
    const tmpId = `tmp-${Date.now()}`;
    // eslint-disable-next-line react-hooks/purity
    const assistantId = `ast-${Date.now() + 1}`;
    // snapshot for rollback
    let snapshot: Message[] = [];
    setMessages((p) => {
      snapshot = [...p];
      return [...p, { id: tmpId, role: "user", content: msg, created_at: new Date().toISOString() }];
    });
    setStreaming(true);
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    let didCreateAssistant = false;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, conversationId: convId }),
        signal: ac.signal,
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "ส่งไม่สำเร็จ");
      }
      if (!res.body) throw new Error("ไม่มีการตอบกลับ");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let acc = "";
      let widgets: Array<{ type: string; props: unknown }> | null = null;
      let newConvId: string | null = null;
      // placeholder assistant message
      didCreateAssistant = true;
      setMessages((p) => [...p, { id: assistantId, role: "assistant", content: "", tool_data: null, created_at: new Date().toISOString() }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          // flush remaining buffer tail (when stream ends without trailing newline)
          if (buffer.trim().startsWith("data: ")) {
            const d = buffer.trim().slice(6);
            if (d && d !== "[DONE]") {
              try {
                const parsed = JSON.parse(d);
                if (parsed.conversationId) newConvId = parsed.conversationId;
                // eslint-disable-next-line react-hooks/immutability
                if (parsed.widgets) widgets = parsed.widgets;
                if (parsed.content) {
                  // eslint-disable-next-line react-hooks/immutability
                  acc += parsed.content;
                  setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: acc, tool_data: widgets ? { widgets } : null } : m)));
                }
                if (parsed.error) setError(parsed.error);
              } catch {}
            }
          }
          break;
        }
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const raw of lines) {
          const line = raw.replace(/\r$/, "");
          if (!line.startsWith("data: ")) continue;
          const d = line.slice(6);
          if (d === "[DONE]") { buffer = ""; break; }
          try {
            const parsed = JSON.parse(d);
            if (parsed.conversationId) newConvId = parsed.conversationId;
            if (parsed.widgets) widgets = parsed.widgets;
            if (parsed.content) {
              acc += parsed.content;
              setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: acc, tool_data: widgets ? { widgets } : null } : m)));
            }
            if (parsed.warning === "truncated") setError("คำตอบถูกตัดให้สั้นลงเนื่องจากความยาวเกินกำหนด");
            if (parsed.error) setError(parsed.error);
          } catch {}
        }
      }
      // if acc still empty but widgets arrived, ensure widget renders
      if (widgets && acc === "") {
        setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, tool_data: { widgets } } : m)));
      }
      // remove empty placeholder if nothing streamed
      if (acc === "" && didCreateAssistant) {
        setMessages((prev) => prev.filter((m) => !(m.id === assistantId && m.content === "")));
      }
      if (newConvId && !convId) {
        setConvId(newConvId);
        fetchConversations();
      } else if (convId) {
        fetchConversations();
      } else if (newConvId) {
        // ephemeral fallback produced id but convId was null
        setConvId(newConvId);
        fetchConversations();
      }
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setError(e instanceof Error ? e.message : "ผิดพลาด");
      // rollback: remove optimistic tmp and placeholder assistant, restore snapshot
      setMessages((p) => {
        const withoutTmp = p.filter((m) => m.id !== tmpId && m.id !== assistantId);
        // if we already removed, ensure at least snapshot is preserved without tmp
        // if stream had started and acc has content, keep it; else revert to snapshot
        const hasContent = p.some((m) => m.id === assistantId && m.content.trim().length > 0);
        return hasContent ? withoutTmp : snapshot;
      });
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-[ calc(100vh-64px)] lg:h-[calc(100vh-64px)] max-h-[900px] bg-[var(--bg)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b shrink-0" style={{ background: "linear-gradient(135deg, #1a1025 0%, #2a1a4a 100%)", borderColor: "rgba(255,255,255,0.06)" }}>
        <Link href="/dashboard" className="w-8 h-8 rounded-full grid place-items-center bg-white/10 hover:bg-white/15 text-white">
          <ArrowLeft size={16} />
        </Link>
        <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 relative" style={{ boxShadow: "0 0 12px rgba(167,139,250,0.4)" }}>
          <Image src="/logo-192.webp" alt="Sealo" width={40} height={40} className="w-full h-full object-cover" />
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#1a1025]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-extrabold text-white flex items-center gap-1.5">Sealo <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" /></div>
          <div className="text-[11px] text-white/60">เพื่อน AI ของคุณ • ออนไลน์</div>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-[11px] px-2.5 py-1.5 rounded-full" style={{ background: "rgba(212,175,55,0.15)", color: "#f6c944", border: "1px solid rgba(212,175,55,0.25)" }}>
          <span className="w-2 h-2 rounded-full bg-[#f6c944]" /> {profile ? `${profile.points.toLocaleString()} แต้ม` : "…"}
        </div>
        <button onClick={() => setShowList((v) => !v)} className="lg:hidden w-8 h-8 rounded-full bg-white/10 text-white grid place-items-center">
          <MessageCircle size={16} />
        </button>
        <button onClick={handleNewChat} className="hidden sm:inline-flex items-center gap-1.5 text-[12px] font-bold px-3 py-1.5 rounded-full bg-white text-[#1a1025] hover:bg-white/90">
          <Sparkles size={12} /> แชตใหม่
        </button>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Conversation list - desktop */}
        <div className={`hidden lg:flex w-[260px] shrink-0 border-r flex-col ${showList ? "flex" : ""}`} style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
          <div className="p-3 flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>ประวัติแชต</span>
            <button onClick={handleNewChat} className="text-[11px] font-bold px-2 py-1 rounded-full" style={{ background: "var(--primary-soft)", color: "var(--primary)" }}>+ ใหม่</button>
          </div>
          <div ref={listRef} className="flex-1 overflow-y-auto px-2 pb-2 space-y-1">
            {conversations.length === 0 && <p className="text-[12px] text-center py-8" style={{ color: "var(--text-muted)" }}>ยังไม่มีบทสนทนา</p>}
            {conversations.map((c) => (
              <div key={c.id} className={`group flex items-center gap-2 p-2.5 rounded-xl cursor-pointer ${convId === c.id ? "bg-[var(--primary-soft)] border border-[var(--primary)]/20" : "hover:bg-[var(--bg)] border border-transparent"}`} onClick={() => setConvId(c.id)}>
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 grid place-items-center text-white shrink-0"><MessageCircle size={12} /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold truncate" style={{ color: convId === c.id ? "var(--primary)" : "var(--text)" }}>{c.title}</div>
                  <div className="text-[11px] truncate" style={{ color: "var(--text-muted)" }}>{new Date(c.updated_at).toLocaleDateString("th-TH")}</div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }} aria-label={`ลบแชท ${c.title}`} className="touch-hit chat-del opacity-0 group-hover:opacity-100 focus-visible:opacity-100 w-6 h-6 grid place-items-center rounded-full hover:bg-red-50 text-[var(--text-muted)] hover:text-red-500"><Trash2 size={12} aria-hidden /></button>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile drawer */}
        {showList && (
          <div className="lg:hidden fixed inset-0 z-40 flex">
            <div className="flex-1 bg-black/40" onClick={() => setShowList(false)} />
            <div className="w-[280px] bg-[var(--bg-card)] flex flex-col">
              <div className="p-3 flex items-center justify-between border-b" style={{ borderColor: "var(--border)" }}>
                <span className="text-[12px] font-bold">ประวัติแชต</span>
                <button onClick={() => setShowList(false)} className="w-8 h-8 grid place-items-center">✕</button>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {conversations.map((c) => (
                  <div key={c.id} className={`p-2.5 rounded-xl ${convId === c.id ? "bg-[var(--primary-soft)]" : "hover:bg-[var(--bg)]"}`} onClick={() => { setConvId(c.id); setShowList(false); }}>
                    <div className="text-[13px] font-semibold truncate">{c.title}</div>
                    <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>{new Date(c.updated_at).toLocaleDateString("th-TH")}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main chat */}
        <div className="flex-1 flex flex-col min-w-0 relative" style={{ background: "radial-gradient(600px 400px at 20% 0%, rgba(167,139,250,0.08), transparent), radial-gradient(500px 300px at 90% 20%, rgba(212,175,55,0.06), transparent), var(--bg)" }}>
          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
            {isEmpty ? (
              <div className="max-w-[560px] mx-auto text-center py-8">
                <div className="w-16 h-16 mx-auto rounded-2xl grid place-items-center mb-4" style={{ background: "linear-gradient(135deg, #a78bfa, #7c3aed)", boxShadow: "0 8px 24px rgba(124,58,237,0.25)" }}>
                  <Sparkles size={28} className="text-white" />
                </div>
                <h2 className="text-[18px] font-extrabold" style={{ color: "var(--text)" }}>สวัสดี 👋</h2>
                <p className="text-[13px] mt-1" style={{ color: "var(--text-secondary)" }}>วันนี้อยากคุยเรื่องอะไรกับ Sealo?</p>
                <div className="flex flex-wrap gap-2 justify-center mt-5">
                  {QUICK_ACTIONS.map((a) => (
                    <button key={a.label} onClick={() => send(a.prompt)} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[12px] font-semibold border hover:brightness-105" style={{ background: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text)" }}>
                      <a.icon size={14} style={{ color: "var(--primary)" }} /> {a.label}
                    </button>
                  ))}
                </div>
                <div className="mt-6 grid grid-cols-2 gap-2 text-left max-w-[400px] mx-auto">
                  <Link href="/dashboard/reading" className="card p-3 flex items-center gap-2 hover:border-[var(--primary)]/30">
                    <Layers size={16} style={{ color: "var(--primary)" }} /><span className="text-[12px] font-semibold">เปิดไพ่ใหม่</span>
                  </Link>
                  <Link href="/dashboard/daily" className="card p-3 flex items-center gap-2 hover:border-[var(--primary)]/30">
                    <Sun size={16} style={{ color: "#f6c944" }} /><span className="text-[12px] font-semibold">ดวงวันนี้</span>
                  </Link>
                </div>
              </div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[82%] sm:max-w-[72%] rounded-2xl px-4 py-3 text-[14px] leading-[1.75] whitespace-pre-wrap break-words ${m.role === "user" ? "bg-[var(--primary)] text-white rounded-br-sm shadow-sm" : "bg-[var(--bg-card)] border shadow-sm rounded-bl-sm"}`} style={m.role === "assistant" ? { borderColor: "var(--border)", color: "var(--text)" } : {}}>
                    {m.content || (streaming && m.role === "assistant" ? "…" : "")}
                    {/* Widgets */}
                    {m.tool_data?.widgets && (
                      <div className="mt-3 space-y-2">
                        {(m.tool_data.widgets as Array<{ type: string; props: unknown }>).map((w, i) => (
                          <Widget key={i} widget={w} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            {streaming && (
              <div className="flex justify-start">
                <div className="bg-[var(--bg-card)] border rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2 text-[13px] font-medium shadow-sm" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
                  <Loader2 size={14} className="animate-spin" style={{ color: "var(--primary)" }} /> Sealo กำลังพิมพ์...
                </div>
              </div>
            )}
            {error && (
              <div className="max-w-[560px] mx-auto p-3 rounded-xl flex items-center gap-2 text-[12px]" style={{ background: "var(--red-soft)", color: "var(--red)" }}>
                {error} <button onClick={() => setError("")} className="ml-auto underline">ปิด</button>
              </div>
            )}
          </div>

          {/* Quick actions when has messages but not streaming */}
          {!isEmpty && !streaming && (
            <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-none scroll-row-touch-lg">
              {QUICK_ACTIONS.slice(0, 4).map((a) => (
                <button key={a.label} onClick={() => send(a.prompt)} className="touch-hit shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold border" style={{ background: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text-secondary)" }}>
                  {a.label}
                </button>
              ))}
            </div>
          )}

          {/* Composer */}
          <div className="p-3 sm:p-4 border-t shrink-0" style={{ background: "var(--bg-card)", borderColor: "var(--border)", paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
            <div className="max-w-[720px] mx-auto flex gap-2 items-end">
              <div className="flex-1 relative">
                <label htmlFor="sealo-chat-input" className="sr-only">
                  พิมพ์ข้อความคุยกับ Sealo (Enter เพื่อส่ง, Shift+Enter ขึ้นบรรทัดใหม่)
                </label>
                <textarea
                  id="sealo-chat-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                  placeholder="พิมพ์ข้อความ..."
                  rows={1}
                  className="w-full resize-none rounded-2xl pl-4 pr-12 py-3 text-[14px] border focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                  style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)", maxHeight: 120 }}
                  onInput={(e) => { const t = e.target as HTMLTextAreaElement; t.style.height = "auto"; t.style.height = Math.min(t.scrollHeight, 120) + "px"; }}
                />
                <button
                  onClick={() => send()}
                  disabled={!input.trim() || streaming}
                  aria-label={streaming ? "Sealo กำลังตอบ กรุณารอ" : "ส่งข้อความ"}
                  className="touch-hit absolute right-1.5 bottom-1.5 w-8 h-8 rounded-full grid place-items-center text-white disabled:opacity-40"
                  style={{ background: streaming ? "var(--text-muted)" : "var(--primary)" }}
                >
                  {streaming ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Send size={16} aria-hidden />}
                </button>
              </div>
            </div>
            <p className="text-[10px] text-center mt-2" style={{ color: "var(--text-muted)" }}>Sealo ให้คำแนะนำเชิงสัญลักษณ์ ไม่ใช่คำทำนายที่การันตี</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Widget({ widget }: { widget: { type: string; props: unknown } }) {
  const p = widget.props as Record<string, unknown>;
  if (widget.type === "daily_card") {
    const card = p.card as { nameTh: string; imageFile: string } | undefined;
    return (
      <div className="rounded-xl p-3 flex gap-3" style={{ background: "linear-gradient(135deg, rgba(167,139,250,0.08), rgba(212,175,55,0.08))", border: "1px solid rgba(167,139,250,0.15)" }}>
        {card && <div className="w-12 h-[72px] rounded-lg overflow-hidden shrink-0 border" style={{ borderColor: "rgba(0,0,0,0.06)" }}><Image src={`/Taro/${card.imageFile}`.replace(".jpg",".webp")} alt={card.nameTh} width={48} height={72} className="w-full h-full object-cover" unoptimized /></div>}
        <div className="flex-1 min-w-0">
          <div className="text-[12px] font-bold" style={{ color: "var(--primary)" }}>ไพ่ประจำวัน</div>
          <div className="text-[13px] font-semibold">{card?.nameTh as string}</div>
          <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>{p.theme as string}</div>
          <Link href="/dashboard/daily" className="text-[11px] font-bold underline" style={{ color: "var(--primary)" }}>ดูดวงวันนี้ →</Link>
        </div>
      </div>
    );
  }
  if (widget.type === "recent_readings") {
    const readings = (p.readings as Array<{ id: string; spread_type: string; question: string; created_at: string }>) || [];
    if (readings.length === 0) return <div className="text-[12px] p-2 rounded-xl bg-[var(--bg)]">ยังไม่มีประวัติ</div>;
    return (
      <div className="space-y-1.5">
        {readings.map((r) => (
          <Link key={r.id} href={`/dashboard/history?r=${r.id}`} className="flex items-center gap-2 p-2 rounded-xl hover:bg-[var(--bg)] border" style={{ borderColor: "var(--border-subtle)" }}>
            <BookOpen size={14} style={{ color: "var(--primary)" }} />
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-semibold truncate">{r.question || "ไม่มีคำถาม"}</div>
              <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>{new Date(r.created_at).toLocaleDateString("th-TH")} • {r.spread_type}</div>
            </div>
          </Link>
        ))}
      </div>
    );
  }
  if (widget.type === "card") {
    const card = p.card as { nameTh: string; name: string; imageFile: string; uprightTh: string } | undefined;
    if (!card) return null;
    const tarot = ALL_CARDS.find((c) => c.nameTh === card.nameTh);
    return (
      <div className="rounded-xl p-3 flex gap-3" style={{ background: "var(--bg)", border: "1px solid var(--border-subtle)" }}>
        {tarot && <div className="w-14 h-[84px] rounded-lg overflow-hidden shrink-0"><TarotCard card={tarot} size="sm" flipped /></div>}
        <div>
          <div className="text-[13px] font-bold">{card.nameTh} <span className="text-[11px] font-normal" style={{ color: "var(--text-muted)" }}>({card.name})</span></div>
          <div className="text-[12px] mt-1" style={{ color: "var(--text-secondary)" }}>{card.uprightTh.slice(0, 120)}</div>
        </div>
      </div>
    );
  }
  if (widget.type === "collection") {
    return (
      <div className="rounded-xl p-3 text-center" style={{ background: "var(--bg)", border: "1px solid var(--border-subtle)" }}>
        <div className="text-[12px] font-bold">คอลเลกชัน</div>
        <div className="text-[14px] font-extrabold" style={{ color: "var(--primary)" }}>{String(p.collected)} / {String(p.total)}</div>
        <Link href="/dashboard/collection" className="text-[11px] underline" style={{ color: "var(--primary)" }}>ดูคอลเลกชัน →</Link>
      </div>
    );
  }
  if (widget.type === "drawn_cards") {
    const cards = (p.cards as Array<{ id: number; nameTh: string; name: string; imageFile: string; reversed: boolean; position: string; uprightTh: string; reversedTh: string }>) || [];
    if (cards.length === 0) return null;
    return (
      <div className="rounded-xl p-3" style={{ background: "linear-gradient(135deg, rgba(167,139,250,0.06), rgba(212,175,55,0.05))", border: "1px solid rgba(167,139,250,0.12)" }}>
        <div className="text-[11px] font-bold tracking-widest uppercase mb-2" style={{ color: "var(--primary)" }}>ไพ่ที่เปิดในแชต • {cards.length} ใบ {cards.length === 1 ? "(ฟรี)" : ""}</div>
        <div className={`grid gap-2 ${cards.length === 1 ? "grid-cols-1 place-items-center" : "grid-cols-3"}`}>
          {cards.map((c) => {
            const tarot = ALL_CARDS.find((x) => x.id === c.id);
            if (!tarot) return null;
            return (
              <div key={c.id} className="flex flex-col items-center gap-1.5">
                <TarotCard card={tarot} reversed={c.reversed} flipped size={cards.length === 1 ? "md" : "sm"} showLabel={false} />
                <span className="text-[10px] font-bold tracking-widest uppercase text-center" style={{ color: "var(--primary)" }}>{c.position}</span>
                <span className="text-[11px] font-semibold text-center leading-tight">{c.nameTh}{c.reversed ? " · กลับหัว" : ""}</span>
              </div>
            );
          })}
        </div>
        <p className="text-[11px] text-center mt-2" style={{ color: "var(--text-muted)" }}>อยากได้คำทำนายเต็มๆ? <Link href="/dashboard/reading" className="underline" style={{ color: "var(--primary)" }}>ไปเปิดไพ่พยากรณ์</Link> (5/15/50 แต้ม)</p>
      </div>
    );
  }
  return null;
}

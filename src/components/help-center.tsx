import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  MessageCircle, X, Send, ChevronLeft, CheckCheck,
  Clock, Headphones, Loader2, PlusCircle, History,
} from "lucide-react";

const TOPICS = [
  "I can't log in to my account",
  "My payment was not approved",
  "My withdrawal is delayed",
  "Tasks not showing in my dashboard",
  "I have a question about my package",
  "Something else",
];

function timeAgo(ts: string) {
  const diff = (Date.now() - new Date(ts).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(ts).toLocaleDateString();
}

export function HelpCenter({ userId }: { userId?: string }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"picker" | "chat" | "history">("picker");
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [topic, setTopic] = useState("");
  const [customTopic, setCustomTopic] = useState("");
  const [msgInput, setMsgInput] = useState("");
  const [sending, setSending] = useState(false);
  const [starting, setStarting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  const { data: openChats } = useQuery({
    queryKey: ["my-support-chats", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from("support_chats")
        .select("*")
        .eq("user_id", userId!)
        .order("updated_at", { ascending: false });
      return data ?? [];
    },
    refetchInterval: open ? 5000 : false,
  });

  const activeChat = openChats?.find((c: any) => c.status === "open") ?? null;

  const { data: messages } = useQuery({
    queryKey: ["support-messages", activeChatId],
    enabled: !!activeChatId,
    queryFn: async () => {
      const { data } = await supabase
        .from("support_messages")
        .select("*")
        .eq("chat_id", activeChatId!)
        .order("created_at", { ascending: true });
      return data ?? [];
    },
    refetchInterval: false,
  });

  const unreadCount = messages?.filter((m: any) => m.is_admin && !m.read_at).length ?? 0;

  const totalUnread = (openChats ?? []).reduce((_: number, chat: any) => {
    if (chat.id !== activeChatId) return _;
    return _ + unreadCount;
  }, unreadCount > 0 ? unreadCount : 0);

  useEffect(() => {
    if (!activeChatId || !userId) return;
    const channel = supabase
      .channel(`support-msgs-${activeChatId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "support_messages",
        filter: `chat_id=eq.${activeChatId}`,
      }, () => {
        qc.invalidateQueries({ queryKey: ["support-messages", activeChatId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeChatId, userId, qc]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages?.length]);

  useEffect(() => {
    if (!open) return;
    if (activeChat) {
      setActiveChatId(activeChat.id);
      setView("chat");
    } else {
      setView("picker");
      setActiveChatId(null);
    }
  }, [open, activeChat?.id]);

  useEffect(() => {
    if (!open || !activeChatId || !messages) return;
    const unread = messages.filter((m: any) => m.is_admin && !m.read_at).map((m: any) => m.id);
    if (!unread.length) return;
    supabase.from("support_messages").update({ read_at: new Date().toISOString() }).in("id", unread).then(() => {
      qc.invalidateQueries({ queryKey: ["support-messages", activeChatId] });
    });
  }, [open, activeChatId, messages, qc]);

  async function startChat() {
    if (!userId) return;
    const subject = topic === "Something else" ? (customTopic.trim() || "General question") : topic;
    if (!subject) return;
    setStarting(true);
    const { data: chat, error } = await supabase
      .from("support_chats")
      .insert({ user_id: userId, subject })
      .select()
      .single();
    if (error || !chat) { setStarting(false); return; }
    setActiveChatId(chat.id);
    setView("chat");
    setStarting(false);
    qc.invalidateQueries({ queryKey: ["my-support-chats", userId] });
  }

  async function sendMessage() {
    if (!msgInput.trim() || !activeChatId || !userId) return;
    setSending(true);
    await supabase.from("support_messages").insert({
      chat_id: activeChatId,
      sender_id: userId,
      is_admin: false,
      body: msgInput.trim(),
    });
    setMsgInput("");
    setSending(false);
    qc.invalidateQueries({ queryKey: ["support-messages", activeChatId] });
  }

  async function closeMyChat() {
    if (!activeChatId || !userId) return;
    await supabase.from("support_messages").insert({
      chat_id: activeChatId,
      sender_id: userId,
      is_admin: false,
      body: "__sys:ended_by_user__",
    });
    await supabase.from("support_chats")
      .update({ status: "closed", closed_at: new Date().toISOString() })
      .eq("id", activeChatId);
    qc.invalidateQueries({ queryKey: ["support-messages", activeChatId] });
    qc.invalidateQueries({ queryKey: ["my-support-chats", userId] });
    setActiveChatId(null);
    setView("picker");
  }

  const closedChats = (openChats ?? []).filter((c: any) => c.status === "closed");

  if (!userId) return null;

  return (
    <>
      {/* ── Floating button ────────────────────────────────── */}
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "fixed z-50 bottom-20 right-4 lg:bottom-6 lg:right-6",
          "h-14 w-14 rounded-2xl shadow-2xl",
          "bg-gradient-to-br from-violet-600 to-indigo-700 text-white",
          "flex items-center justify-center transition-transform active:scale-95 hover:scale-105",
        )}
        aria-label="Help Center"
      >
        <Headphones className="h-6 w-6" />
        {totalUnread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500 text-white text-[10px] font-bold grid place-items-center animate-pulse">
            {totalUnread > 9 ? "9+" : totalUnread}
          </span>
        )}
      </button>

      {/* ── Overlay ────────────────────────────────────────── */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end sm:justify-end p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className={cn(
            "relative w-full sm:w-[400px] flex flex-col rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl",
            "bg-background border border-border/60",
            "max-h-[90vh] sm:max-h-[600px]",
          )}>

            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b bg-gradient-to-r from-violet-600 to-indigo-700 text-white shrink-0">
              <div className="h-9 w-9 rounded-xl bg-white/20 grid place-items-center">
                <Headphones className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm">Help Center</div>
                <div className="text-[11px] opacity-75 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400 inline-block" />
                  Support team · usually replies in minutes
                </div>
              </div>
              <div className="flex items-center gap-1">
                {closedChats.length > 0 && (
                  <button
                    onClick={() => setView(view === "history" ? (activeChat ? "chat" : "picker") : "history")}
                    className="h-8 w-8 rounded-xl bg-white/15 hover:bg-white/25 grid place-items-center transition-colors"
                    title="Chat history"
                  >
                    <History className="h-4 w-4" />
                  </button>
                )}
                {view === "chat" && !activeChat && (
                  <button
                    onClick={() => setView("picker")}
                    className="h-8 w-8 rounded-xl bg-white/15 hover:bg-white/25 grid place-items-center"
                  >
                    <PlusCircle className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="h-8 w-8 rounded-xl bg-white/15 hover:bg-white/25 grid place-items-center transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* ── VIEW: Topic Picker ────────────────────────── */}
            {view === "picker" && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="text-center py-2">
                  <div className="text-sm font-semibold">What do you need help with?</div>
                  <div className="text-xs text-muted-foreground mt-1">Choose a topic to start a conversation</div>
                </div>
                <div className="grid gap-2">
                  {TOPICS.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTopic(t)}
                      className={cn(
                        "w-full text-left px-4 py-3 rounded-2xl border text-sm font-medium transition-all",
                        topic === t
                          ? "border-violet-500 bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300"
                          : "border-border hover:border-violet-300 hover:bg-muted/60",
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                {topic === "Something else" && (
                  <Textarea
                    placeholder="Briefly describe your issue…"
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    className="resize-none text-sm"
                    rows={2}
                  />
                )}
                <Button
                  onClick={startChat}
                  disabled={!topic || starting || (topic === "Something else" && !customTopic.trim())}
                  className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold gap-2"
                >
                  {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
                  Start conversation
                </Button>
              </div>
            )}

            {/* ── VIEW: Chat ───────────────────────────────── */}
            {view === "chat" && activeChatId && (
              <>
                {/* Chat info bar */}
                <div className="flex items-center gap-2 px-4 py-2 border-b bg-muted/30 text-xs text-muted-foreground shrink-0">
                  <span className="flex-1 font-medium truncate">{activeChat?.subject ?? "Support chat"}</span>
                  {activeChat ? (
                    <button onClick={closeMyChat} className="text-rose-500 hover:text-rose-600 font-medium flex items-center gap-1 shrink-0">
                      <X className="h-3 w-3" /> End chat
                    </button>
                  ) : (
                    <span className="text-muted-foreground/60">Closed</span>
                  )}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {(!messages || messages.length === 0) && (
                    <div className="text-center py-8 text-xs text-muted-foreground">
                      <Clock className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      Your message was sent. Our team will reply shortly.
                    </div>
                  )}
                  {(messages ?? []).map((msg: any) => (
                    <MessageBubble key={msg.id} msg={msg} />
                  ))}
                  <div ref={bottomRef} />
                </div>

                {/* Input */}
                {activeChat ? (
                  <div className="flex gap-2 p-3 border-t shrink-0">
                    <Textarea
                      value={msgInput}
                      onChange={(e) => setMsgInput(e.target.value)}
                      placeholder="Type your message…"
                      className="resize-none text-sm min-h-[40px] max-h-[100px]"
                      rows={1}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                      }}
                    />
                    <Button
                      size="icon"
                      onClick={sendMessage}
                      disabled={sending || !msgInput.trim()}
                      className="h-10 w-10 shrink-0 bg-gradient-to-br from-violet-600 to-indigo-600"
                    >
                      {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </div>
                ) : (
                  <div className="p-3 border-t text-center">
                    <p className="text-xs text-muted-foreground mb-2">This chat is closed.</p>
                    <Button size="sm" variant="outline" onClick={() => { setView("picker"); setTopic(""); }}>
                      <PlusCircle className="h-3.5 w-3.5 mr-1.5" /> Start new conversation
                    </Button>
                  </div>
                )}
              </>
            )}

            {/* ── VIEW: History ─────────────────────────────── */}
            {view === "history" && (
              <div className="flex-1 overflow-y-auto">
                <button
                  onClick={() => setView(activeChat ? "chat" : "picker")}
                  className="flex items-center gap-1.5 px-4 py-3 text-xs font-medium text-primary border-b w-full hover:bg-muted/40"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Back
                </button>
                <div className="p-3 space-y-2">
                  <p className="text-xs text-muted-foreground px-1 mb-3 font-medium uppercase tracking-wide">Past conversations</p>
                  {closedChats.map((chat: any) => (
                    <button
                      key={chat.id}
                      onClick={() => { setActiveChatId(chat.id); setView("chat"); }}
                      className="w-full text-left px-3 py-3 rounded-2xl border hover:bg-muted/60 transition-colors"
                    >
                      <div className="text-sm font-medium truncate">{chat.subject}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 inline-block" /> Closed · {timeAgo(chat.closed_at ?? chat.updated_at)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

const SYS_LABELS: Record<string, { icon: string; text: string; color: string }> = {
  "__sys:ended_by_user__":  { icon: "👤", text: "Chat ended by you",    color: "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800" },
  "__sys:ended_by_admin__": { icon: "🛡️", text: "Chat ended by support", color: "bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-800" },
  "__sys:reopened__":       { icon: "🔄", text: "Chat reopened by support", color: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800" },
};

function MessageBubble({ msg }: { msg: any }) {
  const sys = SYS_LABELS[msg.body];
  if (sys) {
    return (
      <div className="flex justify-center my-1">
        <span className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-semibold", sys.color)}>
          <span>{sys.icon}</span> {sys.text}
          <span className="opacity-50 font-normal">· {timeAgo(msg.created_at)}</span>
        </span>
      </div>
    );
  }

  const isAdmin = msg.is_admin;
  return (
    <div className={cn("flex gap-2 max-w-[85%]", isAdmin ? "self-start" : "self-end ml-auto flex-row-reverse")}>
      {isAdmin && (
        <Avatar className="h-7 w-7 shrink-0 mt-0.5">
          <AvatarFallback className="text-[10px] bg-violet-100 text-violet-700 font-bold">ES</AvatarFallback>
        </Avatar>
      )}
      <div className={cn(
        "px-3 py-2 rounded-2xl text-sm leading-relaxed",
        isAdmin
          ? "bg-muted rounded-tl-sm"
          : "bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-tr-sm",
      )}>
        <p>{msg.body}</p>
        <div className={cn("flex items-center gap-1 mt-1", isAdmin ? "justify-start" : "justify-end")}>
          <span className={cn("text-[10px]", isAdmin ? "text-muted-foreground" : "text-white/60")}>
            {timeAgo(msg.created_at)}
          </span>
          {!isAdmin && msg.read_at && (
            <CheckCheck className="h-3 w-3 text-white/60" />
          )}
        </div>
      </div>
    </div>
  );
}

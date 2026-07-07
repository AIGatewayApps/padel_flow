"use client";
import { useState, useEffect, useRef, useTransition } from "react";
import Image from "next/image";
import { sendMessage } from "@/lib/actions/message.actions";
import { getSupabaseClient } from "@/lib/supabase-realtime";

type Msg = { id: string; body: string; senderId: string; senderName: string; senderAvatar: string | null; createdAt: string };

export default function RealtimeChatBox({
  conversationId, initialMessages, currentUserId
}: { conversationId: string; initialMessages: Msg[]; currentUserId: string }) {
  const [messages, setMessages] = useState<Msg[]>(initialMessages);
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Supabase Realtime — subscribe to new messages in this conversation
  useEffect(() => {
    const supabase = getSupabaseClient();
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "Message", filter: `conversationId=eq.${conversationId}` },
        (payload) => {
          const row = payload.new as { id: string; body: string; senderId: string; createdAt: string };
          // Only add if not already in list (avoids duplicate from optimistic)
          setMessages(prev => prev.some(m => m.id === row.id) ? prev : [
            ...prev,
            { id: row.id, body: row.body, senderId: row.senderId, senderName: "...", senderAvatar: null, createdAt: row.createdAt },
          ]);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [conversationId]);

  function action(formData: FormData) {
    if (!formData.get("body")?.toString().trim()) return;
    startTransition(async () => {
      await sendMessage(conversationId, formData);
      formRef.current?.reset();
    });
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1 pb-2">
        {messages.map(m => (
          <div key={m.id} className={`flex items-end gap-2 ${m.senderId === currentUserId ? "flex-row-reverse" : ""}`}>
            {m.senderAvatar
              ? <Image src={m.senderAvatar} alt={m.senderName} width={28} height={28} className="rounded-full shrink-0" />
              : <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold shrink-0">{m.senderName[0]}</div>}
            <div className={`max-w-[75%] sm:max-w-xs px-4 py-2 rounded-2xl text-sm leading-relaxed ${
              m.senderId === currentUserId
                ? "bg-green-600 text-white rounded-br-sm"
                : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-bl-sm"
            }`}>
              {m.body}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form ref={formRef} action={action} className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-700 shrink-0">
        <input name="body" required placeholder="Type a message..."
          className="flex-1 border rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:border-gray-700" />
        <button type="submit" disabled={isPending}
          className="bg-green-600 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors shrink-0">
          {isPending ? "..." : "Send"}
        </button>
      </form>
    </div>
  );
}

"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";

type Msg = { id: string; body: string; senderId: string; senderName: string; senderAvatar: string | null; createdAt: string };

export default function ChatBox({ conversationId, initialMessages, currentUserId }: { conversationId: string; initialMessages: Msg[]; currentUserId: string }) {
  const [messages, setMessages] = useState<Msg[]>(initialMessages);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // ponytail: polling every 3s — replace with Pusher when scaling
  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch(`/api/conversations/${conversationId}/messages`);
      if (res.ok) setMessages(await res.json());
    }, 3000);
    return () => clearInterval(interval);
  }, [conversationId]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    const res = await fetch(`/api/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    if (res.ok) { const msg = await res.json(); setMessages(p => [...p, msg]); setBody(""); }
    setSending(false);
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1">
        {messages.map(m => (
          <div key={m.id} className={`flex items-end gap-2 ${m.senderId === currentUserId ? "flex-row-reverse" : ""}`}>
            {m.senderAvatar && <Image src={m.senderAvatar} alt={m.senderName} width={28} height={28} className="rounded-full" />}
            <div className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${m.senderId === currentUserId ? "bg-green-600 text-white rounded-br-sm" : "bg-white dark:bg-gray-800 border rounded-bl-sm"}`}>
              {m.body}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={send} className="flex gap-2 pt-4 border-t">
        <input value={body} onChange={e => setBody(e.target.value)} placeholder="Type a message..."
          className="flex-1 border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
        <button type="submit" disabled={sending || !body.trim()}
          className="bg-green-600 text-white px-5 py-2 rounded-full text-sm hover:bg-green-700 disabled:opacity-50">
          Send
        </button>
      </form>
    </>
  );
}

"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewConversation({ currentUserId }: { currentUserId: string }) {
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
    if (res.ok) { const { id } = await res.json(); router.push(`/messages/${id}`); }
    else { setLoading(false); alert("User not found"); }
  }

  if (!open) return <button onClick={() => setOpen(true)} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700">+ New message</button>;

  return (
    <form onSubmit={create} className="flex gap-2">
      <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Username..."
        className="border rounded-lg px-3 py-2 text-sm" />
      <button type="submit" disabled={loading} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50">{loading ? "..." : "Start"}</button>
      <button type="button" onClick={() => setOpen(false)} className="px-3 py-2 border rounded-lg text-sm">Cancel</button>
    </form>
  );
}

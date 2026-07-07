"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

type Result = { id: string; username: string; displayName: string; avatarUrl: string | null };

export default function PlayerSearch({ currentUserId }: { currentUserId: string }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [sending, setSending] = useState<string | null>(null);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    const res = await fetch(`/api/players/search?q=${encodeURIComponent(q)}`);
    setResults(await res.json());
  }

  async function sendRequest(toId: string) {
    setSending(toId);
    await fetch("/api/friends", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ receiverId: toId }) });
    setSending(null);
    setResults(prev => prev.filter(r => r.id !== toId));
  }

  return (
    <div className="bg-white dark:bg-gray-900 border rounded-xl p-4 flex flex-col gap-3">
      <form onSubmit={search} className="flex gap-2">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search players by username or name..."
          className="flex-1 border rounded-lg px-4 py-2 text-sm" />
        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700">Search</button>
      </form>
      {results.length > 0 && (
        <ul className="flex flex-col gap-2">
          {results.filter(r => r.id !== currentUserId).map(r => (
            <li key={r.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {r.avatarUrl && <Image src={r.avatarUrl} alt={r.displayName} width={28} height={28} className="rounded-full" />}
                <Link href={`/players/${r.username}`} className="text-sm font-medium hover:text-green-600">{r.displayName} <span className="text-gray-400">@{r.username}</span></Link>
              </div>
              <button onClick={() => sendRequest(r.id)} disabled={sending === r.id}
                className="text-xs bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 disabled:opacity-50">
                {sending === r.id ? "..." : "Add friend"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

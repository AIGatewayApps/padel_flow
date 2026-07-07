"use client";
import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { sendFriendRequest } from "@/lib/actions/friend.actions";

type Result = { id: string; username: string; displayName: string; avatarUrl: string | null };

export default function PlayerSearch() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [searching, setSearching] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (q.trim().length < 2) return;
    setSearching(true);
    const res = await fetch(`/api/players/search?q=${encodeURIComponent(q)}`);
    setResults(await res.json());
    setSearching(false);
  }

  function addFriend(receiverId: string) {
    startTransition(async () => {
      await sendFriendRequest(receiverId);
      setResults(prev => prev.filter(r => r.id !== receiverId));
    });
  }

  return (
    <div className="bg-white dark:bg-gray-900 border rounded-2xl p-4 flex flex-col gap-3">
      <form onSubmit={search} className="flex gap-2">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search players..."
          className="flex-1 border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
        <button type="submit" disabled={searching}
          className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-50">Search</button>
      </form>
      {results.length > 0 && (
        <ul className="flex flex-col gap-2">
          {results.map(r => (
            <li key={r.id} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                {r.avatarUrl
                  ? <Image src={r.avatarUrl} alt={r.displayName} width={28} height={28} className="rounded-full shrink-0" />
                  : <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold shrink-0">{r.displayName[0]}</div>}
                <Link href={`/players/${r.username}`} className="text-sm font-medium hover:text-green-600 truncate">
                  {r.displayName} <span className="text-gray-400">@{r.username}</span>
                </Link>
              </div>
              <button onClick={() => addFriend(r.id)} disabled={isPending}
                className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-50 shrink-0">
                Add
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

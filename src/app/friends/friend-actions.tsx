"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function FriendActions({ friendshipId, action }: { friendshipId: string; action: "respond" | "remove" }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handle(status: "ACCEPTED" | "BLOCKED" | "remove") {
    setLoading(true);
    await fetch(`/api/friends/${friendshipId}`, {
      method: status === "remove" ? "DELETE" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: status !== "remove" ? JSON.stringify({ status }) : undefined,
    });
    setLoading(false);
    router.refresh();
  }

  if (action === "respond") return (
    <div className="flex gap-2">
      <button onClick={() => handle("ACCEPTED")} disabled={loading} className="text-xs bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 disabled:opacity-50">Accept</button>
      <button onClick={() => handle("BLOCKED")} disabled={loading} className="text-xs border px-3 py-1 rounded-lg hover:bg-gray-50 disabled:opacity-50">Decline</button>
    </div>
  );

  return <button onClick={() => handle("remove")} disabled={loading} className="text-xs text-red-500 hover:underline disabled:opacity-50">Remove</button>;
}

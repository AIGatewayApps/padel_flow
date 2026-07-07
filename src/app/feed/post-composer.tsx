"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PostComposer() {
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setLoading(true);
    await fetch("/api/posts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body }) });
    setBody("");
    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="bg-white dark:bg-gray-900 border rounded-xl p-4 flex flex-col gap-3">
      <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="What's happening on the court?"
        rows={3} maxLength={1000} className="resize-none border rounded-lg p-3 w-full text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-400">{body.length}/1000</span>
        <button type="submit" disabled={loading || !body.trim()}
          className="bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
          {loading ? "Posting..." : "Post"}
        </button>
      </div>
    </form>
  );
}

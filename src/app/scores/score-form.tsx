"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ScoreForm() {
  const router = useRouter();
  const [sets, setSets] = useState([{ player: 0, opponent: 0 }]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const result = fd.get("result") as string;
    const res = await fetch("/api/scores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sets, result }),
    });
    if (res.ok) router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="border rounded-xl p-6 flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Log a match</h2>
      {sets.map((set, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-sm text-gray-500 w-12">Set {i + 1}</span>
          <input type="number" min={0} max={7} value={set.player}
            onChange={e => setSets(prev => prev.map((s, j) => j === i ? { ...s, player: +e.target.value } : s))}
            className="border rounded-lg px-3 py-2 w-16 text-center" />
          <span>–</span>
          <input type="number" min={0} max={7} value={set.opponent}
            onChange={e => setSets(prev => prev.map((s, j) => j === i ? { ...s, opponent: +e.target.value } : s))}
            className="border rounded-lg px-3 py-2 w-16 text-center" />
        </div>
      ))}
      <button type="button" onClick={() => setSets(prev => [...prev, { player: 0, opponent: 0 }])}
        className="text-sm text-green-600 hover:underline self-start">+ Add set</button>
      <select name="result" className="border rounded-lg px-4 py-2">
        <option value="WIN">Win</option>
        <option value="LOSS">Loss</option>
        <option value="DRAW">Draw</option>
      </select>
      <button type="submit" className="bg-green-600 text-white rounded-lg px-4 py-2 hover:bg-green-700">Save match</button>
    </form>
  );
}

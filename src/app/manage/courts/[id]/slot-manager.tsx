"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Slot = { id: string; startsAt: Date; endsAt: Date; available: boolean };

export default function SlotManager({ courtId, slots }: { courtId: string; slots: Slot[] }) {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function addSlot(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch(`/api/manage/courts/${courtId}/slots`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startsAt: start, endsAt: end }),
    });
    setStart(""); setEnd(""); setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Available slots</h2>
      <form onSubmit={addSlot} className="flex items-end gap-3 flex-wrap">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Start</label>
          <input type="datetime-local" value={start} onChange={e => setStart(e.target.value)} required className="border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">End</label>
          <input type="datetime-local" value={end} onChange={e => setEnd(e.target.value)} required className="border rounded-lg px-3 py-2 text-sm" />
        </div>
        <button type="submit" disabled={loading} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50">
          {loading ? "Adding..." : "Add slot"}
        </button>
      </form>
      {slots.length === 0 && <p className="text-gray-400 text-sm">No upcoming slots.</p>}
      <ul className="flex flex-col gap-2">
        {slots.map(s => (
          <li key={s.id} className="flex items-center justify-between border rounded-lg px-4 py-2 text-sm">
            <span>{new Date(s.startsAt).toLocaleString()} – {new Date(s.endsAt).toLocaleTimeString()}</span>
            <span className={s.available ? "text-green-600" : "text-gray-400"}>{s.available ? "Available" : "Booked"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

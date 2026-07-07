"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HireButton({ coachId, pricePerHour }: { coachId: string; pricePerHour: number }) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function hire() {
    if (!date) return;
    setLoading(true);
    const res = await fetch("/api/coaches/hire", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coachId, scheduledAt: date }),
    });
    if (res.ok) { const { checkoutUrl } = await res.json(); router.push(checkoutUrl); }
    else setLoading(false);
  }

  if (!open) return (
    <button onClick={() => setOpen(true)} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 w-full">
      Book session · ${pricePerHour}/hr
    </button>
  );

  return (
    <div className="flex flex-col gap-2">
      <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)}
        className="border rounded-lg px-3 py-2 text-sm" />
      <div className="flex gap-2">
        <button onClick={hire} disabled={loading || !date} className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50">
          {loading ? "..." : "Confirm & Pay"}
        </button>
        <button onClick={() => setOpen(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Cancel</button>
      </div>
    </div>
  );
}

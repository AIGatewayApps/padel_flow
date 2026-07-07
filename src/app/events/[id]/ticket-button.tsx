"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function TicketButton({ eventId, price }: { eventId: string; price: number }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function buy() {
    setLoading(true);
    const res = await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.checkoutUrl) router.push(data.checkoutUrl);
      else router.refresh();
    } else setLoading(false);
  }

  return (
    <button onClick={buy} disabled={loading}
      className="bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50">
      {loading ? "..." : price === 0 ? "Get free ticket" : `Buy ticket · $${price}`}
    </button>
  );
}

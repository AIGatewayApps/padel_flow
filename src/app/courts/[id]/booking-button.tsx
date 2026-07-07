"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function BookingButton({ courtId, slotId, pricePerHour }: { courtId: string; slotId: string; pricePerHour: number }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function book() {
    setLoading(true);
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courtId, slotId }),
    });
    if (res.ok) {
      const { checkoutUrl } = await res.json();
      router.push(checkoutUrl);
    } else {
      alert("Could not book this slot. It may have been taken.");
      setLoading(false);
    }
  }

  return (
    <button onClick={book} disabled={loading}
      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium">
      {loading ? "..." : `Book · $${pricePerHour}`}
    </button>
  );
}

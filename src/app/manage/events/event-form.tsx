"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Event = { id: string; title: string; description: string | null; location: string; startsAt: Date; endsAt: Date; ticketPrice: number; capacity: number | null };

export default function EventForm({ event }: { event?: Event }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const payload = {
      title: fd.get("title"), description: fd.get("description"), location: fd.get("location"),
      startsAt: new Date(fd.get("startsAt") as string).toISOString(),
      endsAt: new Date(fd.get("endsAt") as string).toISOString(),
      ticketPrice: Number(fd.get("ticketPrice")),
      capacity: fd.get("capacity") ? Number(fd.get("capacity")) : undefined,
    };
    const res = await fetch(event ? `/api/manage/events/${event.id}` : "/api/manage/events", {
      method: event ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) router.push("/manage/events");
    else setLoading(false);
  }

  const fmt = (d: Date) => new Date(d).toISOString().slice(0, 16);

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <input name="title" required defaultValue={event?.title} placeholder="Event title" className="border rounded-lg px-4 py-2" />
      <textarea name="description" defaultValue={event?.description ?? ""} placeholder="Description" rows={4} className="border rounded-lg px-4 py-2 resize-none" />
      <input name="location" required defaultValue={event?.location} placeholder="Location" className="border rounded-lg px-4 py-2" />
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Starts</label>
          <input name="startsAt" type="datetime-local" required defaultValue={event ? fmt(event.startsAt) : ""} className="border rounded-lg px-4 py-2" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Ends</label>
          <input name="endsAt" type="datetime-local" required defaultValue={event ? fmt(event.endsAt) : ""} className="border rounded-lg px-4 py-2" />
        </div>
      </div>
      <input name="ticketPrice" type="number" min="0" step="0.01" defaultValue={event?.ticketPrice ?? 0} placeholder="Ticket price (0 = free)" className="border rounded-lg px-4 py-2" />
      <input name="capacity" type="number" min="1" defaultValue={event?.capacity ?? ""} placeholder="Capacity (leave blank for unlimited)" className="border rounded-lg px-4 py-2" />
      <button type="submit" disabled={loading} className="bg-green-600 text-white rounded-lg px-4 py-3 font-semibold hover:bg-green-700 disabled:opacity-50">
        {loading ? "Saving..." : event ? "Save changes" : "Create event"}
      </button>
    </form>
  );
}

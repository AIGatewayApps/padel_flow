import { upsertEvent } from "@/lib/actions/event.actions";

type Event = { id: string; title: string; description: string | null; location: string; startsAt: Date; endsAt: Date; ticketPrice: number; capacity: number | null };

const fmt = (d: Date) => new Date(d).toISOString().slice(0, 16);

export default function EventForm({ orgId, event }: { orgId: string; event?: Event }) {
  const action = upsertEvent.bind(null, orgId, event?.id ?? null);
  return (
    <form action={action} className="flex flex-col gap-4">
      <input name="title" required defaultValue={event?.title} placeholder="Event title"
        className="border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
      <textarea name="description" defaultValue={event?.description ?? ""} placeholder="Description" rows={4}
        className="border rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500" />
      <input name="location" required defaultValue={event?.location} placeholder="Location"
        className="border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Starts</label>
          <input name="startsAt" type="datetime-local" required defaultValue={event ? fmt(event.startsAt) : ""}
            className="border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Ends</label>
          <input name="endsAt" type="datetime-local" required defaultValue={event ? fmt(event.endsAt) : ""}
            className="border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
        </div>
      </div>
      <input name="ticketPrice" type="number" min="0" step="0.01" defaultValue={event?.ticketPrice ?? 0}
        placeholder="Ticket price (0 = free)"
        className="border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
      <input name="capacity" type="number" min="1" defaultValue={event?.capacity ?? ""}
        placeholder="Capacity (leave blank = unlimited)"
        className="border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
      <button type="submit"
        className="bg-green-600 text-white rounded-xl px-4 py-3 font-semibold hover:bg-green-700 transition-colors">
        {event ? "Save changes" : "Create event"}
      </button>
    </form>
  );
}

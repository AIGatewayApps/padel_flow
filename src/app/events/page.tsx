import { db } from "@/lib/db";
import Link from "next/link";
import Image from "next/image";

export const metadata = { title: "Events" };

export default async function EventsPage() {
  const events = await db.event.findMany({
    where: { startsAt: { gte: new Date() } },
    orderBy: { startsAt: "asc" },
    take: 50,
  });

  return (
    <main className="max-w-5xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Upcoming Events</h1>
      {events.length === 0 && <p className="text-gray-500">No upcoming events.</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map(ev => (
          <Link key={ev.id} href={`/events/${ev.id}`}
            className="border rounded-xl overflow-hidden hover:shadow-md transition">
            {ev.imageUrl && <Image src={ev.imageUrl} alt={ev.title} width={400} height={200} className="w-full h-40 object-cover" />}
            <div className="p-4">
              <h2 className="font-semibold text-lg">{ev.title}</h2>
              <p className="text-gray-500 text-sm">{ev.location}</p>
              <p className="text-sm mt-1">{new Date(ev.startsAt).toLocaleDateString()}</p>
              <p className="text-green-600 font-medium mt-2">{ev.ticketPrice === 0 ? "Free" : `$${ev.ticketPrice}`}</p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}

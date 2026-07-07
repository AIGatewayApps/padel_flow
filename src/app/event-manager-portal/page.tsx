import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import Image from "next/image";

export const metadata = { title: "Event Manager Portal" };

export default async function EventManagerPortalPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const manager = await db.eventManagerProfile.findUnique({
    where: { userId },
    include: {
      events: {
        include: { _count: { select: { tickets: true } } },
        orderBy: { startsAt: "desc" },
      },
    },
  });

  if (!manager) redirect("/onboarding");

  const now = new Date();
  const upcoming = manager.events.filter(e => e.startsAt >= now);
  const past = manager.events.filter(e => e.startsAt < now);
  const totalTickets = manager.events.reduce((s, e) => s + e._count.tickets, 0);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-0 flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Event Manager Portal</h1>
          <p className="text-gray-500 text-sm mt-1">{manager.companyName}</p>
        </div>
        <Link href="/manage/events/new" className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-700 transition-colors text-center">
          + Create event
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: "Total events", value: manager.events.length, color: "text-green-600" },
          { label: "Upcoming", value: upcoming.length, color: "text-blue-600" },
          { label: "Tickets sold", value: totalTickets, color: "text-green-600" },
        ].map(stat => (
          <div key={stat.label} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 text-center">
            <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <section>
        <h2 className="text-base font-semibold mb-3">Upcoming events</h2>
        {upcoming.length === 0 && <p className="text-gray-400 text-sm">No upcoming events.</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {upcoming.map(event => (
            <Link key={event.id} href={`/events/${event.id}`}
              className="border rounded-2xl p-4 bg-white dark:bg-gray-900 hover:border-green-400 transition-colors">
              {event.imageUrl
                ? <Image src={event.imageUrl} alt={event.title} width={40} height={40} className="rounded-lg object-cover mb-3" />
                : <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-xl mb-3">EVT</div>}
              <p className="font-semibold truncate">{event.title}</p>
              <p className="text-xs text-gray-400">{event.location}</p>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-gray-400">{new Date(event.startsAt).toLocaleDateString()}</p>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{event._count.tickets} tickets</span>
              </div>
              <Link href={`/manage/events/${event.id}/scan`}
                className="block mt-2 text-xs bg-blue-50 text-blue-600 text-center py-1.5 rounded-lg hover:bg-blue-100">
                Scan tickets
              </Link>
            </Link>
          ))}
        </div>
      </section>

      {past.length > 0 && (
        <section>
          <h2 className="text-base font-semibold mb-3 text-gray-400">Past events</h2>
          <div className="flex flex-col gap-2">
            {past.map(event => (
              <div key={event.id} className="flex items-center justify-between border rounded-xl px-4 py-3 bg-gray-50 dark:bg-gray-900/50">
                <p className="text-sm font-medium">{event.title}</p>
                <span className="text-xs text-gray-400">{event._count.tickets} tickets</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

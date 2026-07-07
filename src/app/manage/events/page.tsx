import { requireRole } from "@/lib/auth";
import { getDbUser } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";

export const metadata = { title: "Manage Events" };

export default async function ManageEventsPage() {
  await requireRole("EVENT_MANAGER", "ADMIN");
  const me = await getDbUser();
  if (!me) return null;

  const profile = await db.eventManagerProfile.findUnique({ where: { userId: me.id }, include: { events: { orderBy: { startsAt: "desc" } } } });

  return (
    <main className="max-w-4xl mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Events</h1>
        <Link href="/manage/events/new" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">+ Add event</Link>
      </div>
      {profile?.events.length === 0 && <p className="text-gray-500">No events yet.</p>}
      <ul className="flex flex-col gap-4">
        {profile?.events.map(ev => (
          <li key={ev.id} className="border rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold">{ev.title}</p>
              <p className="text-gray-500 text-sm">{ev.location} · {new Date(ev.startsAt).toLocaleDateString()}</p>
            </div>
            <Link href={`/manage/events/${ev.id}`} className="text-green-600 text-sm hover:underline">Edit</Link>
          </li>
        ))}
      </ul>
    </main>
  );
}

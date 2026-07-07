import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireOrgRole } from "@/lib/permissions";
import Link from "next/link";

export const metadata = { title: "Manage Events" };

export default async function ManageEventsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const membership = await db.orgMember.findFirst({
    where: { user: { clerkId: userId }, role: "ORG_ADMIN" },
    select: { orgId: true },
  });
  if (!membership) redirect("/dashboard");

  await requireOrgRole(userId, membership.orgId, ["ORG_ADMIN"]);

  const events = await db.event.findMany({
    where: { orgId: membership.orgId },
    orderBy: { startsAt: "desc" },
  });

  return (
    <main className="max-w-4xl mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Events</h1>
        <Link href="/manage/events/new" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">+ Add event</Link>
      </div>
      {events.length === 0 && <p className="text-gray-500">No events yet.</p>}
      <ul className="flex flex-col gap-4">
        {events.map(ev => (
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

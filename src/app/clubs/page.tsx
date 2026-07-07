import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import Image from "next/image";
import { createClub } from "@/lib/actions/club.actions";

export const metadata = { title: "Clubs" };

export default async function ClubsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const myClubs = await db.clubMember.findMany({
    where: { userId },
    include: {
      club: {
        select: { id: true, name: true, imageUrl: true, city: true, inviteCode: true, _count: { select: { members: true } } },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-0 flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Clubs</h1>
      </div>

      {myClubs.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">My clubs</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {myClubs.map(({ club }) => (
              <Link key={club.id} href={`/clubs/${club.id}`}
                className="border rounded-2xl p-4 bg-white dark:bg-gray-900 hover:border-green-400 transition-colors flex items-center gap-4">
                {club.imageUrl
                  ? <Image src={club.imageUrl} alt={club.name} width={48} height={48} className="rounded-xl object-cover" />
                  : <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-xl">🎾</div>}
                <div className="min-w-0">
                  <p className="font-semibold truncate">{club.name}</p>
                  <p className="text-xs text-gray-400">{club._count.members} members{club.city ? ` · ${club.city}` : ""}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Create club */}
        <div className="border rounded-2xl p-6 bg-white dark:bg-gray-900">
          <h2 className="font-semibold mb-4">Create a club</h2>
          <form action={createClub} className="flex flex-col gap-3">
            <input name="name" required placeholder="Club name" className="border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            <input name="city" placeholder="City (optional)" className="border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            <textarea name="description" placeholder="Description (optional)" rows={2} className="border rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500" />
            <button type="submit" className="bg-green-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-green-700 transition-colors">
              Create club
            </button>
          </form>
        </div>

        {/* Join by invite */}
        <div className="border rounded-2xl p-6 bg-white dark:bg-gray-900">
          <h2 className="font-semibold mb-4">Join with invite code</h2>
          <form action={async (fd) => { "use server"; const { joinClub } = await import("@/lib/actions/club.actions"); await joinClub(fd.get("inviteCode") as string); }} className="flex flex-col gap-3">
            <input name="inviteCode" required placeholder="Invite code" className="border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            <button type="submit" className="bg-gray-800 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-gray-700 transition-colors">
              Join club
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

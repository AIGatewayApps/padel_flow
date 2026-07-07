import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Image from "next/image";
import Link from "next/link";
import { respondToChallenge } from "@/lib/actions/challenge.actions";

export const metadata = { title: "Challenges" };

export default async function ChallengesPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [received, sent] = await Promise.all([
    db.matchChallenge.findMany({
      where: { challengedId: userId, status: "PENDING" },
      include: { challenger: { select: { displayName: true, username: true, avatarUrl: true, eloRating: true } } },
      orderBy: { createdAt: "desc" },
    }),
    db.matchChallenge.findMany({
      where: { challengerId: userId },
      include: { challenged: { select: { displayName: true, username: true, avatarUrl: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-0 flex flex-col gap-8">
      <h1 className="text-2xl font-bold">Challenges</h1>

      {received.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Received ({received.length})</h2>
          <div className="flex flex-col gap-3">
            {received.map(c => (
              <div key={c.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  {c.challenger.avatarUrl
                    ? <Image src={c.challenger.avatarUrl} alt={c.challenger.displayName} width={40} height={40} className="rounded-full" />
                    : <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center font-bold text-green-700">{c.challenger.displayName[0]}</div>}
                  <div>
                    <Link href={`/players/${c.challenger.username}`} className="font-semibold hover:text-green-600">{c.challenger.displayName}</Link>
                    <p className="text-xs text-gray-400">Elo {c.challenger.eloRating} · {new Date(c.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                {c.message && <p className="text-sm text-gray-600 dark:text-gray-400 italic mb-3">"{c.message}"</p>}
                <div className="flex gap-2">
                  <form action={respondToChallenge.bind(null, c.id, true)} className="flex-1">
                    <button className="w-full bg-green-600 text-white py-2 rounded-xl text-sm font-medium hover:bg-green-700">Accept</button>
                  </form>
                  <form action={respondToChallenge.bind(null, c.id, false)} className="flex-1">
                    <button className="w-full border py-2 rounded-xl text-sm hover:bg-gray-50">Decline</button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Sent challenges</h2>
        {sent.length === 0 && <p className="text-gray-400 text-sm">No challenges sent yet. Challenge a friend from their profile.</p>}
        <div className="flex flex-col gap-2">
          {sent.map(c => (
            <div key={c.id} className="flex items-center justify-between border rounded-2xl px-4 py-3 bg-white dark:bg-gray-900">
              <Link href={`/players/${c.challenged.username}`} className="font-medium hover:text-green-600 text-sm">{c.challenged.displayName}</Link>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                c.status === "ACCEPTED" ? "bg-green-100 text-green-700" :
                c.status === "DECLINED" ? "bg-red-100 text-red-600" :
                c.status === "COMPLETED" ? "bg-gray-100 text-gray-600" :
                "bg-yellow-100 text-yellow-700"
              }`}>{c.status.toLowerCase()}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

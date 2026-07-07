import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Image from "next/image";
import Link from "next/link";
import { sendChallenge } from "@/lib/actions/challenge.actions";

export const metadata = { title: "AI Match Suggestions" };

export default async function AISuggestPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const me = await db.user.findUnique({
    where: { id: userId },
    select: { eloRating: true, city: true, subscription: true },
  });
  if (!me) redirect("/sign-in");

  const ELO_RANGE = 100;
  const suggestions = await db.user.findMany({
    where: {
      id: { not: userId },
      eloRating: { gte: me.eloRating - ELO_RANGE, lte: me.eloRating + ELO_RANGE },
      city: me.city ?? undefined,
      settings: { profilePublic: true },
    },
    select: { id: true, displayName: true, username: true, avatarUrl: true, eloRating: true, city: true },
    orderBy: { eloRating: "desc" },
    take: 20,
  });

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-0">
      <div className="flex items-center gap-3 mb-2">
        <h1 className="text-2xl font-bold">AI Match Suggestions</h1>
        {me.subscription !== "PRO" && (
          <Link href="/pro" className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-semibold hover:bg-yellow-200">👑 Pro</Link>
        )}
      </div>
      <p className="text-gray-500 text-sm mb-8">Players near your Elo ({me.eloRating}) in {me.city ?? "your area"}</p>

      {suggestions.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🎾</p>
          <p>No suggestions found. Try updating your city in settings.</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {suggestions.map(p => {
          const eloDiff = p.eloRating - me.eloRating;
          return (
            <div key={p.id} className="border rounded-2xl p-4 bg-white dark:bg-gray-900 flex items-center gap-4">
              {p.avatarUrl
                ? <Image src={p.avatarUrl} alt={p.displayName} width={44} height={44} className="rounded-full" />
                : <div className="w-11 h-11 rounded-full bg-green-100 flex items-center justify-center font-bold text-green-700">{p.displayName[0]}</div>}
              <div className="flex-1 min-w-0">
                <Link href={`/players/${p.username}`} className="font-semibold hover:text-green-600">{p.displayName}</Link>
                <p className="text-xs text-gray-400">
                  {p.eloRating} Elo ·{" "}
                  <span className={eloDiff > 0 ? "text-red-500" : eloDiff < 0 ? "text-green-600" : "text-gray-400"}>
                    {eloDiff > 0 ? `+${eloDiff}` : eloDiff} vs you
                  </span>
                </p>
              </div>
              <form action={sendChallenge}>
                <input type="hidden" name="challengedId" value={p.id} />
                <button type="submit" className="bg-green-600 text-white px-3 py-2 rounded-xl text-xs font-semibold hover:bg-green-700">
                  Challenge
                </button>
              </form>
            </div>
          );
        })}
      </div>
    </div>
  );
}

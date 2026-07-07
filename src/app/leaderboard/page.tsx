import { db } from "@/lib/db";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";

export const metadata = { title: "Leaderboard" };

export default async function LeaderboardPage() {
  const { userId } = await auth();

  const [byElo, byWins, byStreak] = await Promise.all([
    db.user.findMany({
      where: { settings: { profilePublic: true } },
      select: { id: true, displayName: true, username: true, avatarUrl: true, eloRating: true, city: true },
      orderBy: { eloRating: "desc" }, take: 50,
    }),
    db.playerProfile.findMany({
      include: { user: { select: { id: true, displayName: true, username: true, avatarUrl: true } } },
      orderBy: { totalWins: "desc" }, take: 20,
    }),
    db.user.findMany({
      where: { streak: { gt: 0 } },
      select: { id: true, displayName: true, username: true, avatarUrl: true, streak: true },
      orderBy: { streak: "desc" }, take: 20,
    }),
  ]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-0">
      <h1 className="text-2xl font-bold mb-8">Leaderboard</h1>

      {byElo.length >= 3 && (
        <div className="flex justify-center gap-4 mb-10">
          {[byElo[1], byElo[0], byElo[2]].map((player, idx) => (
            <Link key={player.id} href={`/players/${player.username}`}
              className={`flex flex-col items-center gap-2 ${ idx === 1 ? "-mt-4" : "" }`}>
              <div className={`text-2xl ${ idx === 1 ? "text-4xl" : "" }`}>{["2nd", "1st", "3rd"][idx]}</div>
              {player.avatarUrl
                ? <Image src={player.avatarUrl} alt={player.displayName} width={idx === 1 ? 56 : 44} height={idx === 1 ? 56 : 44} className="rounded-full" />
                : <div className={`rounded-full bg-green-100 flex items-center justify-center font-bold text-green-700 ${ idx === 1 ? "w-14 h-14 text-xl" : "w-11 h-11" }`}>{player.displayName[0]}</div>}
              <p className="text-xs font-semibold text-center">{player.displayName}</p>
              <p className="text-xs text-green-600 font-bold">{player.eloRating}</p>
            </Link>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Elo rankings</h2>
        {byElo.map((player, i) => (
          <Link key={player.id} href={`/players/${player.username}`}
            className={`flex items-center gap-4 border rounded-2xl px-4 py-3 hover:border-green-400 transition-colors ${
              player.id === userId ? "bg-green-50 dark:bg-green-900/20 border-green-300" : "bg-white dark:bg-gray-900"
            }`}>
            <span className={`w-7 text-center font-bold text-sm ${ i < 3 ? "text-green-600" : "text-gray-400" }`}>{i + 1}</span>
            {player.avatarUrl
              ? <Image src={player.avatarUrl} alt={player.displayName} width={36} height={36} className="rounded-full" />
              : <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center font-bold text-sm">{player.displayName[0]}</div>}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{player.displayName} {player.id === userId && <span className="text-green-600">(you)</span>}</p>
              {player.city && <p className="text-xs text-gray-400">{player.city}</p>}
            </div>
            <span className="text-green-600 font-bold text-sm shrink-0">{player.eloRating}</span>
          </Link>
        ))}
      </div>

      {byStreak.length > 0 && (
        <div className="flex flex-col gap-2 mt-8">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Activity streaks</h2>
          {byStreak.map((player, i) => (
            <Link key={player.id} href={`/players/${player.username}`}
              className="flex items-center gap-4 border rounded-2xl px-4 py-3 hover:border-green-400 transition-colors bg-white dark:bg-gray-900">
              <span className={`w-7 text-center font-bold text-sm ${ i < 3 ? "text-orange-500" : "text-gray-400" }`}>{i + 1}</span>
              {player.avatarUrl
                ? <Image src={player.avatarUrl} alt={player.displayName} width={36} height={36} className="rounded-full" />
                : <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center font-bold text-sm">{player.displayName[0]}</div>}
              <p className="font-medium text-sm flex-1 truncate">{player.displayName}</p>
              <span className="text-orange-500 font-bold text-sm shrink-0">streak {player.streak}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

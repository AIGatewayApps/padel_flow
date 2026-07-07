import { db } from "@/lib/db";
import Image from "next/image";
import Link from "next/link";

export const metadata = { title: "Leaderboard" };

export default async function LeaderboardPage() {
  const players = await db.playerProfile.findMany({
    where: { user: { settings: { profilePublic: true } } },
    include: { user: true },
    orderBy: { totalWins: "desc" },
    take: 100,
  });

  return (
    <main className="max-w-3xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Leaderboard</h1>
      <ol className="flex flex-col gap-3">
        {players.map((p, i) => (
          <li key={p.id} className="flex items-center gap-4 border rounded-xl px-4 py-3">
            <span className="text-2xl font-bold text-gray-300 w-8">{i + 1}</span>
            {p.user.avatarUrl && (
              <Image src={p.user.avatarUrl} alt={p.user.displayName} width={40} height={40} className="rounded-full" />
            )}
            <Link href={`/players/${p.user.username}`} className="flex-1 font-medium hover:text-green-600">
              {p.user.displayName} <span className="text-gray-400 text-sm">@{p.user.username}</span>
            </Link>
            <span className="text-sm text-gray-500">{p.totalWins}W / {p.totalLosses}L</span>
          </li>
        ))}
      </ol>
    </main>
  );
}

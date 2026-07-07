import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import Image from "next/image";
import Link from "next/link";

export default async function PlayerProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const { userId } = await auth();

  const player = await db.user.findUnique({
    where: { username },
    include: { profile: true, settings: true },
  });
  if (!player || (!player.settings?.profilePublic && player.id !== userId)) notFound();

  const isMe = player.id === userId;
  const friendship = userId && !isMe ? await db.friendship.findFirst({
    where: { OR: [{ initiatorId: userId, receiverId: player.id }, { initiatorId: player.id, receiverId: userId }] },
  }) : null;

  const recentScores = await db.score.findMany({ where: { userId: player.id }, orderBy: { playedAt: "desc" }, take: 5 });

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <div className="bg-white dark:bg-gray-900 border rounded-xl p-6 flex items-center gap-5">
        {player.avatarUrl && <Image src={player.avatarUrl} alt={player.displayName} width={72} height={72} className="rounded-full" />}
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{player.displayName}</h1>
          <p className="text-gray-500">@{player.username}</p>
          {player.settings?.showLocation && player.city && <p className="text-sm text-gray-400 mt-1">{player.city}</p>}
          {player.bio && <p className="text-sm mt-2">{player.bio}</p>}
        </div>
        {!isMe && userId && (
          <div>
            {!friendship && (
              <form action={async () => { "use server"; await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/friends`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ receiverId: player.id }) }); }}>
                <button className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700">Add friend</button>
              </form>
            )}
            {friendship?.status === "ACCEPTED" && <span className="text-sm text-green-600 font-medium">Friends ✓</span>}
            {friendship?.status === "PENDING" && <span className="text-sm text-gray-400">Request sent</span>}
          </div>
        )}
        {isMe && <Link href="/settings" className="text-sm text-green-600 hover:underline">Edit profile</Link>}
      </div>

      {player.settings?.showLevel && player.profile && (
        <div className="bg-white dark:bg-gray-900 border rounded-xl p-5">
          <h2 className="font-semibold mb-3">Stats</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div><p className="text-2xl font-bold text-green-600">{player.profile.totalWins}</p><p className="text-xs text-gray-500">Wins</p></div>
            <div><p className="text-2xl font-bold text-red-500">{player.profile.totalLosses}</p><p className="text-xs text-gray-500">Losses</p></div>
            <div><p className="text-2xl font-bold text-gray-500">{player.profile.totalDraws}</p><p className="text-xs text-gray-500">Draws</p></div>
          </div>
        </div>
      )}

      {recentScores.length > 0 && (
        <div className="bg-white dark:bg-gray-900 border rounded-xl p-5">
          <h2 className="font-semibold mb-3">Recent matches</h2>
          <ul className="flex flex-col gap-2">
            {recentScores.map(s => {
              const sets = s.sets as { player: number; opponent: number }[];
              return (
                <li key={s.id} className="flex justify-between text-sm">
                  <span>{sets.map(set => `${set.player}–${set.opponent}`).join(" | ")}</span>
                  <span className={s.result === "WIN" ? "text-green-600" : s.result === "LOSS" ? "text-red-500" : "text-gray-400"}>{s.result}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Image from "next/image";
import Link from "next/link";
import { respondToFriendRequest, removeFriend } from "@/lib/actions/friend.actions";
import PlayerSearch from "./player-search";

export const metadata = { title: "Friends" };

export default async function FriendsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [friends, pending, sent] = await Promise.all([
    db.friendship.findMany({
      where: { status: "ACCEPTED", OR: [{ initiatorId: userId }, { receiverId: userId }] },
      include: { initiator: { select: { id: true, displayName: true, avatarUrl: true, username: true } }, receiver: { select: { id: true, displayName: true, avatarUrl: true, username: true } } },
    }),
    db.friendship.findMany({
      where: { receiverId: userId, status: "PENDING" },
      include: { initiator: { select: { id: true, displayName: true, avatarUrl: true, username: true } } },
    }),
    db.friendship.findMany({
      where: { initiatorId: userId, status: "PENDING" },
      include: { receiver: { select: { id: true, displayName: true, username: true } } },
    }),
  ]);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-0 flex flex-col gap-8">
      <h1 className="text-2xl font-bold">Friends</h1>
      <PlayerSearch />

      {pending.length > 0 && (
        <section>
          <h2 className="text-base font-semibold mb-3 text-gray-500 uppercase tracking-wide text-xs">Requests ({pending.length})</h2>
          <ul className="flex flex-col gap-2">
            {pending.map(f => (
              <li key={f.id} className="flex items-center justify-between bg-white dark:bg-gray-900 border rounded-2xl px-4 py-3 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {f.initiator.avatarUrl
                    ? <Image src={f.initiator.avatarUrl} alt={f.initiator.displayName} width={36} height={36} className="rounded-full shrink-0" />
                    : <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm shrink-0">{f.initiator.displayName[0]}</div>}
                  <Link href={`/players/${f.initiator.username}`} className="font-medium hover:text-green-600 truncate">{f.initiator.displayName}</Link>
                </div>
                <div className="flex gap-2 shrink-0">
                  <form action={respondToFriendRequest.bind(null, f.id, "ACCEPTED")}>
                    <button className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-700">Accept</button>
                  </form>
                  <form action={respondToFriendRequest.bind(null, f.id, "BLOCKED")}>
                    <button className="border px-3 py-1.5 rounded-lg text-xs hover:bg-gray-50">Decline</button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="text-base font-semibold mb-3 text-gray-500 uppercase tracking-wide text-xs">Friends ({friends.length})</h2>
        {friends.length === 0 && <p className="text-gray-400 text-sm py-4">No friends yet — search for players above.</p>}
        <ul className="flex flex-col gap-2">
          {friends.map(f => {
            const other = f.initiatorId === userId ? f.receiver : f.initiator;
            return (
              <li key={f.id} className="flex items-center justify-between bg-white dark:bg-gray-900 border rounded-2xl px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  {other.avatarUrl
                    ? <Image src={other.avatarUrl} alt={other.displayName} width={36} height={36} className="rounded-full shrink-0" />
                    : <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-sm shrink-0">{other.displayName[0]}</div>}
                  <Link href={`/players/${other.username}`} className="font-medium hover:text-green-600 truncate">{other.displayName}</Link>
                </div>
                <form action={removeFriend.bind(null, f.id)}>
                  <button className="text-xs text-red-400 hover:text-red-600 transition-colors">Remove</button>
                </form>
              </li>
            );
          })}
        </ul>
      </section>

      {sent.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold mb-2 text-gray-500 uppercase tracking-wide">Sent</h2>
          <ul className="flex flex-col gap-1.5">
            {sent.map(f => (
              <li key={f.id} className="text-sm text-gray-500 flex items-center gap-2">
                <Link href={`/players/${f.receiver.username}`} className="hover:text-green-600">{f.receiver.displayName}</Link>
                <span className="text-gray-300">· pending</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Image from "next/image";
import Link from "next/link";
import FriendActions from "./friend-actions";
import PlayerSearch from "./player-search";

export const metadata = { title: "Friends" };

export default async function FriendsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [friends, pending, sent] = await Promise.all([
    db.friendship.findMany({
      where: { status: "ACCEPTED", OR: [{ initiatorId: userId }, { receiverId: userId }] },
      include: { initiator: true, receiver: true },
    }),
    db.friendship.findMany({
      where: { receiverId: userId, status: "PENDING" },
      include: { initiator: true },
    }),
    db.friendship.findMany({
      where: { initiatorId: userId, status: "PENDING" },
      include: { receiver: true },
    }),
  ]);

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-8">
      <h1 className="text-2xl font-bold">Friends</h1>
      <PlayerSearch currentUserId={userId} />

      {pending.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">Pending requests ({pending.length})</h2>
          <ul className="flex flex-col gap-3">
            {pending.map(f => (
              <li key={f.id} className="flex items-center justify-between bg-white dark:bg-gray-900 border rounded-xl px-4 py-3">
                <div className="flex items-center gap-3">
                  {f.initiator.avatarUrl && <Image src={f.initiator.avatarUrl} alt={f.initiator.displayName} width={36} height={36} className="rounded-full" />}
                  <Link href={`/players/${f.initiator.username}`} className="font-medium hover:text-green-600">{f.initiator.displayName}</Link>
                </div>
                <FriendActions friendshipId={f.id} action="respond" />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-3">My friends ({friends.length})</h2>
        {friends.length === 0 && <p className="text-gray-500">No friends yet. Search for players above.</p>}
        <ul className="flex flex-col gap-3">
          {friends.map(f => {
            const other = f.initiatorId === userId ? f.receiver : f.initiator;
            return (
              <li key={f.id} className="flex items-center justify-between bg-white dark:bg-gray-900 border rounded-xl px-4 py-3">
                <div className="flex items-center gap-3">
                  {other.avatarUrl && <Image src={other.avatarUrl} alt={other.displayName} width={36} height={36} className="rounded-full" />}
                  <Link href={`/players/${other.username}`} className="font-medium hover:text-green-600">{other.displayName}</Link>
                </div>
                <FriendActions friendshipId={f.id} action="remove" />
              </li>
            );
          })}
        </ul>
      </section>

      {sent.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">Sent requests</h2>
          <ul className="flex flex-col gap-2">
            {sent.map(f => (
              <li key={f.id} className="text-sm text-gray-500 flex items-center gap-2">
                <Link href={`/players/${f.receiver.username}`} className="hover:text-green-600">{f.receiver.displayName}</Link>
                <span>— pending</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

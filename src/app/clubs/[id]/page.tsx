import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import Image from "next/image";
import Link from "next/link";
import { postToClub } from "@/lib/actions/club.actions";

export default async function ClubPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const club = await db.club.findUnique({
    where: { id },
    include: {
      members: {
        include: { user: { select: { id: true, displayName: true, avatarUrl: true, username: true, eloRating: true } } },
        take: 20,
      },
      posts: { orderBy: { createdAt: "desc" }, take: 30 },
      _count: { select: { members: true } },
    },
  });
  if (!club) notFound();

  const isMember = club.members.some(m => m.userId === userId);
  const isOwner = club.ownerId === userId;
  const rankedMembers = [...club.members].sort((a, b) => b.user.eloRating - a.user.eloRating).slice(0, 10);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          {club.imageUrl
            ? <Image src={club.imageUrl} alt={club.name} width={64} height={64} className="rounded-2xl object-cover" />
            : <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center text-3xl">Club</div>}
          <div>
            <h1 className="text-2xl font-bold">{club.name}</h1>
            <p className="text-gray-500 text-sm">{club._count.members} members{club.city ? ` - ${club.city}` : ""}</p>
          </div>
        </div>
        {isOwner && (
          <div className="flex items-center gap-2 text-sm text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2">
            <span>Invite code:</span>
            <code className="font-mono font-bold text-green-600">{club.inviteCode}</code>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="sm:col-span-2 flex flex-col gap-4">
          {isMember && (
            <form action={postToClub.bind(null, id)} className="border rounded-2xl p-4 bg-white dark:bg-gray-900">
              <textarea name="body" required placeholder="Share with your club..." rows={3}
                className="w-full text-sm resize-none focus:outline-none" />
              <div className="flex justify-end mt-2">
                <button type="submit" className="bg-green-600 text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-green-700">Post</button>
              </div>
            </form>
          )}
          {club.posts.length === 0 && <p className="text-gray-400 text-sm text-center py-8">No posts yet. Be the first!</p>}
          {club.posts.map(post => (
            <div key={post.id} className="border rounded-2xl p-4 bg-white dark:bg-gray-900">
              <p className="text-sm">{post.body}</p>
              <p className="text-xs text-gray-400 mt-2">{new Date(post.createdAt).toLocaleDateString()}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Club leaderboard</h2>
            {rankedMembers.map((m, i) => (
              <Link key={m.id} href={`/players/${m.user.username}`} className="flex items-center gap-3 hover:opacity-80">
                <span className={`w-5 text-xs font-bold ${ i < 3 ? "text-green-600" : "text-gray-400" }`}>{i + 1}</span>
                {m.user.avatarUrl
                  ? <Image src={m.user.avatarUrl} alt={m.user.displayName} width={28} height={28} className="rounded-full" />
                  : <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold">{m.user.displayName[0]}</div>}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate">{m.user.displayName}</p>
                </div>
                <span className="text-xs text-green-600 font-bold">{m.user.eloRating}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

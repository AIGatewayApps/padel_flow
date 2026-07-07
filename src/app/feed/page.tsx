import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Image from "next/image";
import Link from "next/link";
import PostComposer from "./post-composer";
import LikeButton from "./like-button";

export const metadata = { title: "Feed" };

export default async function FeedPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // Friends + self feed
  const friendIds = await db.friendship.findMany({
    where: { status: "ACCEPTED", OR: [{ initiatorId: userId }, { receiverId: userId }] },
    select: { initiatorId: true, receiverId: true },
  });
  const ids = [userId, ...friendIds.map(f => f.initiatorId === userId ? f.receiverId : f.initiatorId)];

  const posts = await db.post.findMany({
    where: { authorId: { in: ids } },
    include: { author: true, likes: true, comments: { include: { author: true }, take: 3, orderBy: { createdAt: "asc" } } },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Feed</h1>
      <PostComposer />
      {posts.length === 0 && <p className="text-gray-500 text-center py-12">No posts yet. Add friends to see their posts.</p>}
      {posts.map(post => (
        <article key={post.id} className="bg-white dark:bg-gray-900 border rounded-xl p-5 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            {post.author.avatarUrl && <Image src={post.author.avatarUrl} alt={post.author.displayName} width={36} height={36} className="rounded-full" />}
            <div>
              <Link href={`/players/${post.author.username}`} className="font-semibold hover:text-green-600">{post.author.displayName}</Link>
              <p className="text-xs text-gray-400">{new Date(post.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{post.body}</p>
          {post.imageUrl && <Image src={post.imageUrl} alt="Post image" width={600} height={400} className="rounded-lg w-full object-cover" />}
          <div className="flex items-center gap-4 pt-1 border-t">
            <LikeButton postId={post.id} liked={post.likes.some(l => l.userId === userId)} count={post.likes.length} />
            <span className="text-sm text-gray-400">{post.comments.length} comment{post.comments.length !== 1 ? "s" : ""}</span>
          </div>
          {post.comments.length > 0 && (
            <ul className="flex flex-col gap-2">
              {post.comments.map(c => (
                <li key={c.id} className="text-sm">
                  <Link href={`/players/${c.author.username}`} className="font-medium hover:text-green-600">{c.author.displayName}</Link>
                  <span className="text-gray-600 dark:text-gray-400 ml-1">{c.body}</span>
                </li>
              ))}
            </ul>
          )}
        </article>
      ))}
    </div>
  );
}

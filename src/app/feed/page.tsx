import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Suspense } from "react";
import PostComposer from "./post-composer";
import PostCard from "./post-card";

export const metadata = { title: "Feed" };

async function getFeedPosts(userId: string) {
  const friendIds = await db.friendship.findMany({
    where: { status: "ACCEPTED", OR: [{ initiatorId: userId }, { receiverId: userId }] },
    select: { initiatorId: true, receiverId: true },
  });
  const ids = [userId, ...friendIds.map(f => f.initiatorId === userId ? f.receiverId : f.initiatorId)];
  return db.post.findMany({
    where: { authorId: { in: ids } },
    include: {
      author: { select: { id: true, displayName: true, username: true, avatarUrl: true } },
      _count: { select: { likes: true, comments: true } },
      likes: { where: { userId }, select: { id: true } }, // only current user's like
      comments: { include: { author: { select: { displayName: true, username: true } } }, take: 3, orderBy: { createdAt: "asc" } },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
}

export default async function FeedPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const posts = await getFeedPosts(userId);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-0 flex flex-col gap-5">
      <h1 className="text-2xl font-bold">Feed</h1>
      <PostComposer />
      {posts.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🎾</p>
          <p className="font-medium">No posts yet</p>
          <p className="text-sm">Add friends to see their posts here</p>
        </div>
      )}
      <Suspense fallback={null}>
        {posts.map(post => (
          <PostCard key={post.id} post={{
            ...post,
            likedByMe: post.likes.length > 0,
            likeCount: post._count.likes,
            commentCount: post._count.comments,
          }} currentUserId={userId} />
        ))}
      </Suspense>
    </div>
  );
}

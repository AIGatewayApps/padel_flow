"use client";
import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toggleLike } from "@/lib/actions/post.actions";

type Comment = { id: string; body: string; author: { displayName: string; username: string } };
type PostCardProps = {
  post: {
    id: string; body: string; imageUrl?: string | null; createdAt: Date;
    author: { id: string; displayName: string; username: string; avatarUrl?: string | null };
    likedByMe: boolean; likeCount: number; commentCount: number;
    comments: Comment[];
  };
  currentUserId: string;
};

export default function PostCard({ post, currentUserId }: PostCardProps) {
  const [liked, setLiked] = useState(post.likedByMe);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [isPending, startTransition] = useTransition();

  function handleLike() {
    setLiked(p => !p);
    setLikeCount(p => liked ? p - 1 : p + 1);
    startTransition(() => toggleLike(post.id));
  }

  return (
    <article className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 sm:p-5">
      <div className="flex items-center gap-3 mb-3">
        {post.author.avatarUrl
          ? <Image src={post.author.avatarUrl} alt={post.author.displayName} width={36} height={36} className="rounded-full w-9 h-9 object-cover" />
          : <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm">{post.author.displayName[0]}</div>
        }
        <div className="flex-1 min-w-0">
          <Link href={`/players/${post.author.username}`} className="font-semibold hover:text-green-600 transition-colors text-sm sm:text-base">{post.author.displayName}</Link>
          <p className="text-xs text-gray-400">{new Date(post.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
        </div>
      </div>
      <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap text-sm sm:text-base leading-relaxed">{post.body}</p>
      {post.imageUrl && (
        <div className="mt-3 rounded-xl overflow-hidden">
          <Image src={post.imageUrl} alt="Post" width={600} height={400} className="w-full object-cover max-h-80" />
        </div>
      )}
      <div className="flex items-center gap-5 mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
        <button onClick={handleLike} disabled={isPending}
          className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${liked ? "text-green-600" : "text-gray-400 hover:text-green-600"}`}>
          <span className="text-base">{liked ? "♥" : "♡"}</span> {likeCount}
        </button>
        <span className="flex items-center gap-1.5 text-sm text-gray-400">
          <span className="text-base">💬</span> {post.commentCount}
        </span>
      </div>
      {post.comments.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1.5">
          {post.comments.map(c => (
            <li key={c.id} className="text-sm">
              <Link href={`/players/${c.author.username}`} className="font-medium hover:text-green-600 transition-colors">{c.author.displayName}</Link>
              <span className="text-gray-500 dark:text-gray-400 ml-1.5">{c.body}</span>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

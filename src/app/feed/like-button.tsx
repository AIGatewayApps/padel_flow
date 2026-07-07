"use client";
import { useState } from "react";

export default function LikeButton({ postId, liked, count }: { postId: string; liked: boolean; count: number }) {
  const [isLiked, setIsLiked] = useState(liked);
  const [likes, setLikes] = useState(count);

  async function toggle() {
    setIsLiked(p => !p);
    setLikes(p => isLiked ? p - 1 : p + 1);
    await fetch(`/api/posts/${postId}/like`, { method: "POST" });
  }

  return (
    <button onClick={toggle} className={`flex items-center gap-1 text-sm transition ${isLiked ? "text-green-600 font-semibold" : "text-gray-400 hover:text-green-600"}`}>
      <span>{isLiked ? "♥" : "♡"}</span>
      <span>{likes}</span>
    </button>
  );
}

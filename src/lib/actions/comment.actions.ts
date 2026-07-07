"use server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { z } from "zod";

const CommentSchema = z.object({
  postId: z.string().cuid(),
  body: z.string().min(1).max(500),
  parentId: z.string().cuid().optional(),
});

// Simple in-memory rate limit: max 10 comments per user per minute
const commentRateLimit = new Map<string, { count: number; resetAt: number }>();

export async function createComment(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Rate limit check
  const now = Date.now();
  const rl = commentRateLimit.get(userId);
  if (rl && now < rl.resetAt) {
    if (rl.count >= 10) throw new Error("Too many comments. Please slow down.");
    rl.count++;
  } else {
    commentRateLimit.set(userId, { count: 1, resetAt: now + 60_000 });
  }

  const parsed = CommentSchema.parse({
    postId: formData.get("postId"),
    body: formData.get("body"),
    parentId: formData.get("parentId") || undefined,
  });

  await db.postComment.create({
    data: {
      postId: parsed.postId,
      authorId: userId,
      body: parsed.body,
      parentId: parsed.parentId ?? null,
    },
  });

  const post = await db.post.findUnique({ where: { id: parsed.postId }, select: { authorId: true } });
  if (post && post.authorId !== userId) {
    await db.notification.create({
      data: { userId: post.authorId, type: "comment", body: "Someone commented on your post", href: "/feed" },
    });
  }
  revalidatePath("/feed");
}

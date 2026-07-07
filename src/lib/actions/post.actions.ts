"use server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { z } from "zod";

const PostSchema = z.object({
  body: z.string().min(1).max(1000),
  imageUrl: z.string().url().optional(),
});

// Rate limit: max 5 posts per user per minute
const postRateLimit = new Map<string, { count: number; resetAt: number }>();

export async function createPost(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const now = Date.now();
  const rl = postRateLimit.get(userId);
  if (rl && now < rl.resetAt) {
    if (rl.count >= 5) throw new Error("Too many posts. Please slow down.");
    rl.count++;
  } else {
    postRateLimit.set(userId, { count: 1, resetAt: now + 60_000 });
  }

  const parsed = PostSchema.parse({
    body: formData.get("body"),
    imageUrl: formData.get("imageUrl") || undefined,
  });

  await db.post.create({
    data: { authorId: userId, body: parsed.body, imageUrl: parsed.imageUrl },
  });
  revalidatePath("/feed");
}

export async function deletePost(postId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const post = await db.post.findUnique({ where: { id: postId }, select: { authorId: true } });
  if (!post || post.authorId !== userId) throw new Error("Forbidden");
  await db.post.delete({ where: { id: postId } });
  revalidatePath("/feed");
}

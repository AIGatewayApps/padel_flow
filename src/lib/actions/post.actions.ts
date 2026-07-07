"use server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { z } from "zod";

const PostSchema = z.object({ body: z.string().min(1).max(1000), imageUrl: z.string().url().optional() });

export async function createPost(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const parsed = PostSchema.parse({ body: formData.get("body"), imageUrl: formData.get("imageUrl") || undefined });
  await db.post.create({ data: { authorId: userId, ...parsed } });
  revalidatePath("/feed");
}

export async function toggleLike(postId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const existing = await db.postLike.findUnique({ where: { postId_userId: { postId, userId } } });
  if (existing) {
    await db.postLike.delete({ where: { id: existing.id } });
  } else {
    await db.postLike.create({ data: { postId, userId } });
  }
  revalidatePath("/feed");
}

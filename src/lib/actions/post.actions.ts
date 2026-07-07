"use server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { postRatelimit } from "@/lib/ratelimit";
import { postSchema } from "@/lib/validations";

export async function createPost(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Rate limit via Upstash Redis — works across all serverless instances
  if (postRatelimit) {
    const { success } = await postRatelimit.limit(userId);
    if (!success) throw new Error("Too many posts. Please slow down.");
  }

  const parsed = postSchema.parse({
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

"use server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { postRatelimit } from "@/lib/ratelimit";
import { postSchema } from "@/lib/validations";
import type { ActionResult } from "@/lib/types";

export async function createPost(formData: FormData): Promise<ActionResult> {
  const { userId: clerkId } = await auth();
  if (!clerkId) return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" };

  if (postRatelimit) {
    const { success } = await postRatelimit.limit(clerkId);
    if (!success)
      return { success: false, error: "Too many posts. Please slow down.", code: "RATE_LIMITED" };
  }

  const parseResult = postSchema.safeParse({
    body: formData.get("body"),
    imageUrl: formData.get("imageUrl") || undefined,
  });
  if (!parseResult.success)
    return {
      success: false,
      error: parseResult.error.errors[0]?.message ?? "Invalid input",
      code: "VALIDATION_ERROR",
    };

  const dbUser = await db.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });
  if (!dbUser) return { success: false, error: "User not found", code: "NOT_FOUND" };

  await db.post.create({
    data: { authorId: dbUser.id, body: parseResult.data.body, imageUrl: parseResult.data.imageUrl },
  });
  revalidatePath("/feed");
  return { success: true, data: undefined };
}

export async function deletePost(postId: string): Promise<ActionResult> {
  const { userId: clerkId } = await auth();
  if (!clerkId) return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" };

  const dbUser = await db.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });
  if (!dbUser) return { success: false, error: "User not found", code: "NOT_FOUND" };

  const post = await db.post.findUnique({ where: { id: postId }, select: { authorId: true } });
  if (!post || post.authorId !== dbUser.id)
    return { success: false, error: "Forbidden", code: "FORBIDDEN" };

  await db.post.delete({ where: { id: postId } });
  revalidatePath("/feed");
  return { success: true, data: undefined };
}

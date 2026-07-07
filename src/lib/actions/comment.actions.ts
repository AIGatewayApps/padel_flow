"use server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { postRatelimit } from "@/lib/ratelimit";
import { z } from "zod";

const CommentSchema = z.object({
  postId: z.string().cuid(),
  body: z.string().min(1).max(500),
  parentId: z.string().cuid().optional(),
});

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

export async function createComment(
  formData: FormData
): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId)
    return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" };

  // Rate limit via Upstash Redis (works across all serverless instances)
  if (postRatelimit) {
    const { success } = await postRatelimit.limit(userId);
    if (!success)
      return {
        success: false,
        error: "Too many comments. Please slow down.",
        code: "RATE_LIMITED",
      };
  }

  const result = CommentSchema.safeParse({
    postId: formData.get("postId"),
    body: formData.get("body"),
    parentId: formData.get("parentId") || undefined,
  });

  if (!result.success)
    return {
      success: false,
      error: result.error.errors[0]?.message ?? "Invalid input",
      code: "VALIDATION_ERROR",
    };

  const parsed = result.data;

  await db.postComment.create({
    data: {
      postId: parsed.postId,
      authorId: userId,
      body: parsed.body,
      parentId: parsed.parentId ?? null,
    },
  });

  const post = await db.post.findUnique({
    where: { id: parsed.postId },
    select: { authorId: true },
  });

  if (post && post.authorId !== userId) {
    await db.notification.create({
      data: {
        userId: post.authorId,
        type: "comment",
        // i18n-ready: use a key, resolve to text in the notification renderer
        body: "notification.comment.on_post",
        href: `/feed/${parsed.postId}`,
      },
    });
  }

  // Narrow cache invalidation to the specific post instead of the entire feed
  revalidatePath(`/feed/${parsed.postId}`);
  revalidatePath("/feed");

  return { success: true, data: undefined };
}

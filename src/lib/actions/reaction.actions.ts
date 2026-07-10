"use server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import type { ActionResult } from "@/lib/types";

const ALLOWED_EMOJIS = new Set(["🎾", "🔥", "💪", "🏆", "😂"]);

export async function toggleReaction(
  postId: string,
  emoji: string
): Promise<ActionResult> {
  if (!ALLOWED_EMOJIS.has(emoji))
    return { success: false, error: "Invalid emoji", code: "VALIDATION_ERROR" };

  const { userId: clerkId } = await auth();
  if (!clerkId)
    return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" };

  const dbUser = await db.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });
  if (!dbUser)
    return { success: false, error: "User not found", code: "NOT_FOUND" };

  const existing = await db.postReaction.findUnique({
    where: { postId_userId_emoji: { postId, userId: dbUser.id, emoji } },
  });

  if (existing) {
    await db.postReaction.delete({ where: { id: existing.id } });
  } else {
    const post = await db.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });
    if (!post)
      return { success: false, error: "Post not found", code: "NOT_FOUND" };

    await db.$transaction([
      db.postReaction.create({ data: { postId, userId: dbUser.id, emoji } }),
      ...(post.authorId !== dbUser.id
        ? [
            db.notification.create({
              data: {
                userId: post.authorId,
                type: "reaction",
                body: `Someone reacted ${emoji} to your post`,
                href: "/feed",
              },
            }),
          ]
        : []),
    ]);
  }

  revalidatePath("/feed");
  return { success: true, data: undefined };
}

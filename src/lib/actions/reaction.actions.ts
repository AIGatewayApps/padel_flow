"use server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

const ALLOWED_EMOJIS = ["🎾", "🔥", "💪", "🏆", "😂"];

export async function toggleReaction(postId: string, emoji: string) {
  if (!ALLOWED_EMOJIS.includes(emoji)) throw new Error("Invalid emoji");
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const existing = await db.postReaction.findUnique({
    where: { postId_userId_emoji: { postId, userId, emoji } },
  });

  if (existing) {
    await db.postReaction.delete({ where: { id: existing.id } });
  } else {
    await db.postReaction.create({ data: { postId, userId, emoji } });
    // Notify post author
    const post = await db.post.findUnique({ where: { id: postId }, select: { authorId: true } });
    if (post && post.authorId !== userId) {
      await db.notification.create({
        data: { userId: post.authorId, type: "reaction", body: `Someone reacted ${emoji} to your post`, href: "/feed" },
      });
    }
  }
  revalidatePath("/feed");
}

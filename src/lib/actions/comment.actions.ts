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

export async function createComment(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const parsed = CommentSchema.parse({
    postId: formData.get("postId"),
    body: formData.get("body"),
    parentId: formData.get("parentId") || undefined,
  });

  await db.postComment.create({ data: { postId: parsed.postId, authorId: userId, body: parsed.body } });

  const post = await db.post.findUnique({ where: { id: parsed.postId }, select: { authorId: true } });
  if (post && post.authorId !== userId) {
    await db.notification.create({
      data: { userId: post.authorId, type: "comment", body: "Someone commented on your post", href: "/feed" },
    });
  }
  revalidatePath("/feed");
}

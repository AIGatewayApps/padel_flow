"use server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { z } from "zod";
import type { ActionResult } from "@/lib/types";

const MsgSchema = z.object({ body: z.string().min(1).max(2000) });

export async function sendMessage(
  conversationId: string,
  formData: FormData
): Promise<ActionResult> {
  const { userId: clerkId } = await auth();
  if (!clerkId)
    return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" };

  const dbUser = await db.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });
  if (!dbUser)
    return { success: false, error: "User not found", code: "NOT_FOUND" };

  const member = await db.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId, userId: dbUser.id } },
  });
  if (!member)
    return { success: false, error: "Forbidden", code: "FORBIDDEN" };

  const result = MsgSchema.safeParse({ body: formData.get("body") });
  if (!result.success)
    return {
      success: false,
      error: result.error.errors[0]?.message ?? "Invalid input",
      code: "VALIDATION_ERROR",
    };

  await db.message.create({
    data: { conversationId, senderId: dbUser.id, body: result.data.body },
  });

  revalidatePath(`/messages/${conversationId}`);
  return { success: true, data: undefined };
}

export async function startConversation(
  username: string
): Promise<ActionResult<string>> {
  const { userId: clerkId } = await auth();
  if (!clerkId)
    return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" };

  const [dbUser, other] = await Promise.all([
    db.user.findUnique({ where: { clerkId }, select: { id: true } }),
    db.user.findUnique({ where: { username }, select: { id: true } }),
  ]);

  if (!dbUser)
    return { success: false, error: "User not found", code: "NOT_FOUND" };
  if (!other)
    return { success: false, error: "Recipient not found", code: "NOT_FOUND" };
  if (dbUser.id === other.id)
    return { success: false, error: "Cannot message yourself", code: "VALIDATION_ERROR" };

  const existing = await db.conversationMember.findFirst({
    where: {
      userId: dbUser.id,
      conversation: { members: { some: { userId: other.id } } },
    },
    select: { conversationId: true },
  });
  if (existing) return { success: true, data: existing.conversationId };

  const convo = await db.conversation.create({
    data: { members: { create: [{ userId: dbUser.id }, { userId: other.id }] } },
  });
  return { success: true, data: convo.id };
}

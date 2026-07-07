"use server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { z } from "zod";

const MsgSchema = z.object({ body: z.string().min(1).max(2000) });

export async function sendMessage(conversationId: string, formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const member = await db.conversationMember.findUnique({ where: { conversationId_userId: { conversationId, userId } } });
  if (!member) throw new Error("Forbidden");
  const { body } = MsgSchema.parse({ body: formData.get("body") });
  await db.message.create({ data: { conversationId, senderId: userId, body } });
  revalidatePath(`/messages/${conversationId}`);
}

export async function startConversation(username: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const other = await db.user.findUnique({ where: { username } });
  if (!other) throw new Error("User not found");
  const existing = await db.conversationMember.findFirst({
    where: { userId, conversation: { members: { some: { userId: other.id } } } },
    select: { conversationId: true },
  });
  if (existing) return existing.conversationId;
  const convo = await db.conversation.create({
    data: { members: { create: [{ userId }, { userId: other.id }] } },
  });
  return convo.id;
}

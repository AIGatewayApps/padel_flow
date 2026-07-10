"use server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import type { ActionResult } from "@/lib/types";

export async function sendFriendRequest(
  receiverClerkId: string
): Promise<ActionResult> {
  const { userId: clerkId } = await auth();
  if (!clerkId)
    return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" };
  if (receiverClerkId === clerkId)
    return { success: false, error: "Cannot add yourself", code: "VALIDATION_ERROR" };

  const [dbUser, receiver] = await Promise.all([
    db.user.findUnique({ where: { clerkId }, select: { id: true } }),
    db.user.findUnique({ where: { clerkId: receiverClerkId }, select: { id: true } }),
  ]);
  if (!dbUser)
    return { success: false, error: "User not found", code: "NOT_FOUND" };
  if (!receiver)
    return { success: false, error: "Recipient not found", code: "NOT_FOUND" };

  // Prevent re-requesting if already PENDING or BLOCKED in either direction
  const existing = await db.friendship.findFirst({
    where: {
      OR: [
        { initiatorId: dbUser.id, receiverId: receiver.id },
        { initiatorId: receiver.id, receiverId: dbUser.id },
      ],
    },
    select: { status: true },
  });
  if (existing?.status === "PENDING")
    return { success: false, error: "Request already sent", code: "CONFLICT" };
  if (existing?.status === "BLOCKED")
    return { success: false, error: "Action not allowed", code: "FORBIDDEN" };

  await db.$transaction([
    db.friendship.upsert({
      where: { initiatorId_receiverId: { initiatorId: dbUser.id, receiverId: receiver.id } },
      create: { initiatorId: dbUser.id, receiverId: receiver.id, status: "PENDING" },
      update: { status: "PENDING" },
    }),
    db.notification.create({
      data: {
        userId: receiver.id,
        type: "friend_request",
        body: "Someone sent you a friend request.",
        href: "/friends",
      },
    }),
  ]);

  revalidatePath("/friends");
  return { success: true, data: undefined };
}

export async function respondToFriendRequest(
  friendshipId: string,
  status: "ACCEPTED" | "BLOCKED"
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

  const f = await db.friendship.findUnique({ where: { id: friendshipId } });
  if (!f || f.receiverId !== dbUser.id)
    return { success: false, error: "Forbidden", code: "FORBIDDEN" };

  await db.friendship.update({ where: { id: friendshipId }, data: { status } });
  revalidatePath("/friends");
  return { success: true, data: undefined };
}

export async function removeFriend(friendshipId: string): Promise<ActionResult> {
  const { userId: clerkId } = await auth();
  if (!clerkId)
    return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" };

  const dbUser = await db.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });
  if (!dbUser)
    return { success: false, error: "User not found", code: "NOT_FOUND" };

  const f = await db.friendship.findUnique({ where: { id: friendshipId } });
  if (!f || (f.initiatorId !== dbUser.id && f.receiverId !== dbUser.id))
    return { success: false, error: "Forbidden", code: "FORBIDDEN" };

  await db.friendship.delete({ where: { id: friendshipId } });
  revalidatePath("/friends");
  return { success: true, data: undefined };
}

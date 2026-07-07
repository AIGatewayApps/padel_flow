"use server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { z } from "zod";

export async function sendFriendRequest(receiverId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  if (receiverId === userId) throw new Error("Cannot add yourself");
  await db.friendship.upsert({
    where: { initiatorId_receiverId: { initiatorId: userId, receiverId } },
    create: { initiatorId: userId, receiverId, status: "PENDING" },
    update: {},
  });
  await db.notification.create({
    data: { userId: receiverId, type: "friend_request", body: "Someone sent you a friend request.", href: "/friends" },
  });
  revalidatePath("/friends");
}

export async function respondToFriendRequest(friendshipId: string, status: "ACCEPTED" | "BLOCKED") {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const f = await db.friendship.findUnique({ where: { id: friendshipId } });
  if (!f || f.receiverId !== userId) throw new Error("Forbidden");
  await db.friendship.update({ where: { id: friendshipId }, data: { status } });
  revalidatePath("/friends");
}

export async function removeFriend(friendshipId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const f = await db.friendship.findUnique({ where: { id: friendshipId } });
  if (!f || (f.initiatorId !== userId && f.receiverId !== userId)) throw new Error("Forbidden");
  await db.friendship.delete({ where: { id: friendshipId } });
  revalidatePath("/friends");
}

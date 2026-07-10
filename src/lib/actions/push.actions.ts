"use server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import type { ActionResult } from "@/lib/types";

export async function savePushSubscription(sub: {
  endpoint: string;
  p256dh: string;
  auth: string;
}): Promise<ActionResult> {
  const { userId: clerkId } = await auth();
  if (!clerkId)
    return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" };

  const dbUser = await db.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });
  if (!dbUser)
    return { success: false, error: "User not found", code: "NOT_FOUND" };

  await db.pushSubscription.upsert({
    where: { endpoint: sub.endpoint },
    create: { userId: dbUser.id, endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
    update: { userId: dbUser.id },
  });
  return { success: true, data: undefined };
}

export async function removePushSubscription(
  endpoint: string
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

  await db.pushSubscription.deleteMany({ where: { endpoint, userId: dbUser.id } });
  return { success: true, data: undefined };
}

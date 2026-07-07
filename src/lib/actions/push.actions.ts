"use server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function savePushSubscription(sub: { endpoint: string; p256dh: string; auth: string }) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  await db.pushSubscription.upsert({
    where: { endpoint: sub.endpoint },
    create: { userId, endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
    update: { userId },
  });
}

export async function removePushSubscription(endpoint: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  await db.pushSubscription.deleteMany({ where: { endpoint, userId } });
}

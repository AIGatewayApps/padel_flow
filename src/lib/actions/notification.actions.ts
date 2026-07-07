"use server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

export async function markAllNotificationsRead() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  await db.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
  // Revalidate both the notifications page and the layout-level unread badge
  revalidatePath("/notifications");
  revalidatePath("/", "layout");
}

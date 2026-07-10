"use server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import type { ActionResult } from "@/lib/types";

export async function markAllNotificationsRead(): Promise<ActionResult> {
  const { userId: clerkId } = await auth();
  if (!clerkId)
    return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" };

  const dbUser = await db.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });
  if (!dbUser)
    return { success: false, error: "User not found", code: "NOT_FOUND" };

  await db.notification.updateMany({
    where: { userId: dbUser.id, read: false },
    data: { read: true },
  });

  revalidatePath("/notifications");
  revalidatePath("/", "layout");
  return { success: true, data: undefined };
}

"use server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

export async function checkProStatus(userId: string) {
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const subData = user.privateMetadata as { pro?: boolean; plan?: string };
  return subData?.pro === true || subData?.plan === "pro";
}

export async function syncSubscriptionFromClerk(userId: string, isPro: boolean) {
  await db.user.update({
    where: { id: userId },
    data: { subscription: isPro ? "PRO" : "FREE" },
  });
  revalidatePath("/pro");
  revalidatePath("/dashboard");
}

export async function getCurrentUserProStatus() {
  const { userId } = await auth();
  if (!userId) return false;
  return checkProStatus(userId);
}

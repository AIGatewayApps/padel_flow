"use server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import type { ActionResult } from "@/lib/types";

/**
 * Check whether a Clerk user (by clerkId) has Pro status in Clerk metadata.
 * NOTE: Clerk metadata is the source of truth only as a cache — always verify
 * against Stripe for billing-critical decisions.
 */
export async function checkProStatus(clerkId: string): Promise<boolean> {
  const client = await clerkClient();
  const user = await client.users.getUser(clerkId);
  const meta = user.privateMetadata as { pro?: boolean; plan?: string };
  return meta?.pro === true || meta?.plan === "pro";
}

/**
 * Sync subscription status from a verified Clerk webhook or Stripe webhook.
 * @param clerkId - The user's Clerk ID (NOT internal User.id)
 */
export async function syncSubscriptionFromClerk(
  clerkId: string,
  isPro: boolean
): Promise<ActionResult> {
  // Only callable from trusted server contexts (webhooks).
  // Callers must validate the webhook signature before calling this.
  const dbUser = await db.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });
  if (!dbUser) return { success: false, error: "User not found", code: "NOT_FOUND" };

  await db.user.update({
    where: { id: dbUser.id },
    data: { subscription: isPro ? "PRO" : "FREE" },
  });
  revalidatePath("/pro");
  revalidatePath("/dashboard");
  return { success: true, data: undefined };
}

export async function getCurrentUserProStatus(): Promise<boolean> {
  const { userId: clerkId } = await auth();
  if (!clerkId) return false;
  return checkProStatus(clerkId);
}

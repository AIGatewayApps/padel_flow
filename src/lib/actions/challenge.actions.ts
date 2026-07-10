"use server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { challengeRatelimit } from "@/lib/ratelimit";
import { z } from "zod";
import type { ActionResult } from "@/lib/types";

const ChallengeSchema = z.object({
  challengedId: z.string().cuid(),
  message: z.string().max(200).optional(),
});

export async function sendChallenge(
  formData: FormData
): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId)
    return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" };

  if (challengeRatelimit) {
    const { success } = await challengeRatelimit.limit(userId);
    if (!success)
      return {
        success: false,
        error: "Too many challenges sent. Please wait.",
        code: "RATE_LIMITED",
      };
  }

  const result = ChallengeSchema.safeParse({
    challengedId: formData.get("challengedId"),
    message: formData.get("message") || undefined,
  });

  if (!result.success)
    return {
      success: false,
      error: result.error.errors[0]?.message ?? "Invalid input",
      code: "VALIDATION_ERROR",
    };

  const parsed = result.data;

  // Resolve internal DB user to ensure FK integrity on MatchChallenge.challengerId
  const dbUser = await db.user.findUnique({ where: { clerkId: userId }, select: { id: true } });
  if (!dbUser)
    return { success: false, error: "User not found", code: "NOT_FOUND" };

  if (parsed.challengedId === dbUser.id)
    return {
      success: false,
      error: "Cannot challenge yourself",
      code: "SELF_CHALLENGE",
    };

  await db.matchChallenge.create({
    data: {
      challengerId: dbUser.id,
      challengedId: parsed.challengedId,
      message: parsed.message ?? null,
    },
  });

  await db.notification.create({
    data: {
      userId: parsed.challengedId,
      type: "challenge",
      body: "notification.challenge.received",
      href: "/challenges",
    },
  });

  revalidatePath("/challenges");
  return { success: true, data: undefined };
}

export async function respondToChallenge(
  challengeId: string,
  accept: boolean
): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId)
    return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" };

  // Resolve internal id for ownership check
  const dbUser = await db.user.findUnique({ where: { clerkId: userId }, select: { id: true } });
  if (!dbUser)
    return { success: false, error: "User not found", code: "NOT_FOUND" };

  const challenge = await db.matchChallenge.findUnique({
    where: { id: challengeId },
  });

  if (!challenge)
    return { success: false, error: "Challenge not found", code: "NOT_FOUND" };

  if (challenge.challengedId !== dbUser.id)
    return { success: false, error: "Forbidden", code: "FORBIDDEN" };

  if (challenge.status !== "PENDING")
    return {
      success: false,
      error: "Challenge has already been resolved",
      code: "ALREADY_RESOLVED",
    };

  await db.matchChallenge.update({
    where: { id: challengeId },
    data: { status: accept ? "ACCEPTED" : "DECLINED" },
  });

  revalidatePath("/challenges");
  return { success: true, data: undefined };
}

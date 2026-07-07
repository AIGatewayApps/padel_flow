"use server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { challengeRatelimit } from "@/lib/ratelimit";
import { z } from "zod";

const ChallengeSchema = z.object({
  challengedId: z.string().cuid(),
  message: z.string().max(200).optional(),
});

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

export async function sendChallenge(
  formData: FormData
): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId)
    return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" };

  // Rate limit challenges
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

  if (parsed.challengedId === userId)
    return {
      success: false,
      error: "Cannot challenge yourself",
      code: "SELF_CHALLENGE",
    };

  await db.matchChallenge.create({
    data: {
      challengerId: userId,
      challengedId: parsed.challengedId,
      message: parsed.message ?? null,
    },
  });

  await db.notification.create({
    data: {
      userId: parsed.challengedId,
      type: "challenge",
      // i18n-ready: resolve key in notification renderer
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

  const challenge = await db.matchChallenge.findUnique({
    where: { id: challengeId },
  });

  if (!challenge)
    return { success: false, error: "Challenge not found", code: "NOT_FOUND" };

  if (challenge.challengedId !== userId)
    return { success: false, error: "Forbidden", code: "FORBIDDEN" };

  // Guard against double-resolve
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

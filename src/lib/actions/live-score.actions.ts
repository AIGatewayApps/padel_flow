"use server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { liveScoreRatelimit } from "@/lib/ratelimit";
import { z } from "zod";
import type { ActionResult } from "@/lib/types";

const SetSchema = z.object({
  p1: z.number().int().min(0).max(10),
  p2: z.number().int().min(0).max(10),
});

const SetsSchema = z.array(SetSchema).min(1).max(5);

export async function startLiveScore(
  courtId?: string
): Promise<ActionResult<string>> {
  const { userId: clerkId } = await auth();
  if (!clerkId)
    return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" };

  const dbUser = await db.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });
  if (!dbUser)
    return { success: false, error: "User not found", code: "NOT_FOUND" };

  const live = await db.liveScore.create({
    data: { player1Id: dbUser.id, courtId: courtId ?? null, sets: [], isLive: true },
  });
  return { success: true, data: live.id };
}

export async function updateLiveScore(
  liveScoreId: string,
  sets: { p1: number; p2: number }[]
): Promise<ActionResult> {
  const { userId: clerkId } = await auth();
  if (!clerkId)
    return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" };

  if (liveScoreRatelimit) {
    const { success } = await liveScoreRatelimit.limit(clerkId);
    if (!success)
      return { success: false, error: "Too many updates. Slow down.", code: "RATE_LIMITED" };
  }

  const parsed = SetsSchema.safeParse(sets);
  if (!parsed.success)
    return {
      success: false,
      error: parsed.error.errors[0]?.message ?? "Invalid sets",
      code: "VALIDATION_ERROR",
    };

  const dbUser = await db.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });
  if (!dbUser)
    return { success: false, error: "User not found", code: "NOT_FOUND" };

  const live = await db.liveScore.findUnique({ where: { id: liveScoreId } });
  if (!live || live.player1Id !== dbUser.id)
    return { success: false, error: "Forbidden", code: "FORBIDDEN" };

  await db.liveScore.update({ where: { id: liveScoreId }, data: { sets: parsed.data } });
  revalidatePath(`/live/${liveScoreId}`);
  return { success: true, data: undefined };
}

export async function endLiveScore(liveScoreId: string): Promise<ActionResult> {
  const { userId: clerkId } = await auth();
  if (!clerkId)
    return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" };

  const dbUser = await db.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });
  if (!dbUser)
    return { success: false, error: "User not found", code: "NOT_FOUND" };

  const live = await db.liveScore.findUnique({ where: { id: liveScoreId } });
  if (!live || live.player1Id !== dbUser.id)
    return { success: false, error: "Forbidden", code: "FORBIDDEN" };

  await db.liveScore.update({
    where: { id: liveScoreId },
    data: { isLive: false, endedAt: new Date() },
  });
  revalidatePath(`/live/${liveScoreId}`);
  return { success: true, data: undefined };
}

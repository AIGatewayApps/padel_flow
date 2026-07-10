"use server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { scoreSchema } from "@/lib/validations";
import { calcElo } from "@/lib/elo";
import type { ActionResult } from "@/lib/types";

export async function submitScore(formData: FormData): Promise<ActionResult> {
  const { userId: clerkId } = await auth();
  if (!clerkId) return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" };

  const setsRaw = formData.get("sets")?.toString();
  const parseResult = scoreSchema.safeParse({
    // opponentId is an internal User.id (cuid), NOT a clerkId
    opponentId: formData.get("opponentId") || undefined,
    sets: setsRaw ? JSON.parse(setsRaw) : [],
    result: formData.get("result"),
    courtId: formData.get("courtId") || undefined,
    playedAt: formData.get("playedAt") || undefined,
  });

  if (!parseResult.success)
    return {
      success: false,
      error: parseResult.error.errors[0]?.message ?? "Invalid input",
      code: "VALIDATION_ERROR",
    };

  const parsed = parseResult.data;
  const playedAt = parsed.playedAt ? new Date(parsed.playedAt) : new Date();

  const dbUser = await db.user.findUnique({
    where: { clerkId },
    select: {
      id: true,
      eloRating: true,
      lastPlayedAt: true,
      streak: true,
      profile: { select: { totalWins: true, totalLosses: true, totalDraws: true } },
    },
  });
  if (!dbUser) return { success: false, error: "Player not found", code: "NOT_FOUND" };

  // opponentId is a User.id — look up by id directly
  const opponent = parsed.opponentId
    ? await db.user.findUnique({
        where: { id: parsed.opponentId },
        select: { eloRating: true },
      })
    : null;

  const gamesPlayed =
    (dbUser.profile?.totalWins ?? 0) +
    (dbUser.profile?.totalLosses ?? 0) +
    (dbUser.profile?.totalDraws ?? 0);
  const opponentElo = opponent?.eloRating ?? 1200;
  const newElo = calcElo(dbUser.eloRating, opponentElo, parsed.result, gamesPlayed);

  const today = new Date();
  const daysSinceLast = dbUser.lastPlayedAt
    ? Math.floor((today.getTime() - dbUser.lastPlayedAt.getTime()) / 86400000)
    : null;
  const newStreak =
    daysSinceLast === null || daysSinceLast > 1 ? 1 : dbUser.streak + 1;

  await db.$transaction([
    db.score.create({
      data: { userId: dbUser.id, ...parsed, playedAt },
    }),
    db.playerProfile.upsert({
      where: { userId: dbUser.id },
      create: {
        userId: dbUser.id,
        totalWins: parsed.result === "WIN" ? 1 : 0,
        totalLosses: parsed.result === "LOSS" ? 1 : 0,
        totalDraws: parsed.result === "DRAW" ? 1 : 0,
      },
      update: {
        totalWins: parsed.result === "WIN" ? { increment: 1 } : undefined,
        totalLosses: parsed.result === "LOSS" ? { increment: 1 } : undefined,
        totalDraws: parsed.result === "DRAW" ? { increment: 1 } : undefined,
      },
    }),
    db.user.update({
      where: { id: dbUser.id },
      data: { eloRating: newElo, lastPlayedAt: today, streak: newStreak },
    }),
  ]);

  revalidatePath("/scores");
  revalidatePath("/leaderboard");
  return { success: true, data: undefined };
}

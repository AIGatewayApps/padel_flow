"use server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { scoreSchema } from "@/lib/validations";
import { calcElo } from "@/lib/elo";
import type { ActionResult } from "@/lib/types";

export async function submitScore(formData: FormData): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" };

  const setsRaw = formData.get("sets")?.toString();
  const parseResult = scoreSchema.safeParse({
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

  const [player, opponent] = await Promise.all([
    db.user.findUnique({
      where: { clerkId: userId },
      select: {
        id: true,
        eloRating: true,
        lastPlayedAt: true,
        streak: true,
        profile: { select: { totalWins: true, totalLosses: true, totalDraws: true } },
      },
    }),
    parsed.opponentId
      ? db.user.findUnique({
          where: { clerkId: parsed.opponentId },
          select: { eloRating: true },
        })
      : null,
  ]);

  if (!player) return { success: false, error: "Player not found", code: "NOT_FOUND" };

  const gamesPlayed =
    (player.profile?.totalWins ?? 0) +
    (player.profile?.totalLosses ?? 0) +
    (player.profile?.totalDraws ?? 0);
  const opponentElo = opponent?.eloRating ?? 1200;
  const newElo = calcElo(player.eloRating, opponentElo, parsed.result, gamesPlayed);

  const today = new Date();
  const daysSinceLast = player.lastPlayedAt
    ? Math.floor((today.getTime() - player.lastPlayedAt.getTime()) / 86400000)
    : null;
  const newStreak =
    daysSinceLast === null || daysSinceLast > 1 ? 1 : player.streak + 1;

  await db.$transaction([
    db.score.create({
      data: { userId: player.id, ...parsed, playedAt },
    }),
    db.playerProfile.upsert({
      where: { userId: player.id },
      create: {
        userId: player.id,
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
      where: { id: player.id },
      data: { eloRating: newElo, lastPlayedAt: today, streak: newStreak },
    }),
  ]);

  revalidatePath("/scores");
  revalidatePath("/leaderboard");
  return { success: true, data: undefined };
}

"use server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { scoreSchema } from "@/lib/validations";
import { calcElo } from "@/lib/elo";

export async function submitScore(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const setsRaw = formData.get("sets")?.toString();
  const parsed = scoreSchema.parse({
    opponentId: formData.get("opponentId") || undefined,
    sets: setsRaw ? JSON.parse(setsRaw) : [],
    result: formData.get("result"),
    courtId: formData.get("courtId") || undefined,
    playedAt: formData.get("playedAt") || undefined,
  });

  await db.score.create({
    data: { userId, ...parsed, playedAt: parsed.playedAt ? new Date(parsed.playedAt) : new Date() },
  });

  // Update player stats
  await db.playerProfile.upsert({
    where: { userId },
    create: {
      userId,
      totalWins: parsed.result === "WIN" ? 1 : 0,
      totalLosses: parsed.result === "LOSS" ? 1 : 0,
      totalDraws: parsed.result === "DRAW" ? 1 : 0,
    },
    update: {
      totalWins: parsed.result === "WIN" ? { increment: 1 } : undefined,
      totalLosses: parsed.result === "LOSS" ? { increment: 1 } : undefined,
      totalDraws: parsed.result === "DRAW" ? { increment: 1 } : undefined,
    },
  });

  // Update Elo — fetch current ratings
  const [player, opponent] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { eloRating: true, profile: { select: { totalWins: true, totalLosses: true, totalDraws: true } } } }),
    parsed.opponentId ? db.user.findUnique({ where: { id: parsed.opponentId }, select: { eloRating: true, profile: { select: { totalWins: true, totalLosses: true, totalDraws: true } } } }) : null,
  ]);

  if (player) {
    const gamesPlayed = (player.profile?.totalWins ?? 0) + (player.profile?.totalLosses ?? 0) + (player.profile?.totalDraws ?? 0);
    const opponentElo = opponent?.eloRating ?? 1200;
    const newElo = calcElo(player.eloRating, opponentElo, parsed.result, gamesPlayed);
    await db.user.update({ where: { id: userId }, data: { eloRating: newElo } });

    // Update streak
    const today = new Date();
    const lastPlayed = player ? await db.user.findUnique({ where: { id: userId }, select: { lastPlayedAt: true, streak: true } }) : null;
    const daysSinceLast = lastPlayed?.lastPlayedAt
      ? Math.floor((today.getTime() - lastPlayed.lastPlayedAt.getTime()) / 86400000)
      : null;
    const newStreak = daysSinceLast === null || daysSinceLast > 1 ? 1 : (lastPlayed!.streak + 1);
    await db.user.update({ where: { id: userId }, data: { lastPlayedAt: today, streak: newStreak } });
  }

  revalidatePath("/scores");
  revalidatePath("/leaderboard");
}

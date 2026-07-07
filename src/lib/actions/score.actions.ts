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

  const playedAt = parsed.playedAt ? new Date(parsed.playedAt) : new Date();

  // Fetch player + opponent in parallel before the transaction
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

  if (!player) throw new Error("Player not found");

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

  // Single atomic transaction — all writes succeed or all roll back
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
}

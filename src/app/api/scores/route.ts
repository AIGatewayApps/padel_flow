import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scoreSchema } from "@/lib/validations";
import { calcElo } from "@/lib/elo";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = scoreSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { sets, result, opponentId, courtId, playedAt } = parsed.data;

  const score = await db.score.create({
    data: {
      userId,
      sets,
      result,
      opponentId,
      courtId,
      playedAt: playedAt ? new Date(playedAt) : undefined,
    },
  });

  // Update win/loss counters + last played timestamp
  const profile = await db.playerProfile.upsert({
    where: { userId },
    create: {
      userId,
      totalWins: result === "WIN" ? 1 : 0,
      totalLosses: result === "LOSS" ? 1 : 0,
      totalDraws: result === "DRAW" ? 1 : 0,
      eloRating: 1000,
      gamesPlayed: 1,
    },
    update: {
      totalWins: result === "WIN" ? { increment: 1 } : undefined,
      totalLosses: result === "LOSS" ? { increment: 1 } : undefined,
      totalDraws: result === "DRAW" ? { increment: 1 } : undefined,
      gamesPlayed: { increment: 1 },
    },
  });

  // ELO update
  if (opponentId) {
    const opponentProfile = await db.playerProfile.findUnique({ where: { userId: opponentId } });
    const opponentRating = opponentProfile?.eloRating ?? 1000;
    const opponentGames = opponentProfile?.gamesPlayed ?? 0;

    const newPlayerElo = calcElo(profile.eloRating, opponentRating, result, profile.gamesPlayed);
    const opponentResult = result === "WIN" ? "LOSS" : result === "LOSS" ? "WIN" : "DRAW";
    const newOpponentElo = calcElo(opponentRating, profile.eloRating, opponentResult, opponentGames);

    await Promise.all([
      db.playerProfile.update({ where: { userId }, data: { eloRating: newPlayerElo } }),
      db.playerProfile.upsert({
        where: { userId: opponentId },
        create: { userId: opponentId, eloRating: newOpponentElo, gamesPlayed: 1 },
        update: { eloRating: newOpponentElo },
      }),
    ]);
  }

  return NextResponse.json(score);
}

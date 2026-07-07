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

  const score = await db.$transaction(async (tx) => {
    const s = await tx.score.create({
      data: {
        userId,
        sets,
        result,
        opponentId,
        courtId,
        playedAt: playedAt ? new Date(playedAt) : undefined,
      },
    });

    const profile = await tx.playerProfile.upsert({
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

    if (opponentId) {
      const opponentProfile = await tx.playerProfile.findUnique({ where: { userId: opponentId } });
      const opponentRating = opponentProfile?.eloRating ?? 1000;
      const opponentGames = opponentProfile?.gamesPlayed ?? 0;

      const newPlayerElo = calcElo(profile.eloRating, opponentRating, result, profile.gamesPlayed);
      const opponentResult = result === "WIN" ? "LOSS" : result === "LOSS" ? "WIN" : "DRAW";
      const newOpponentElo = calcElo(opponentRating, profile.eloRating, opponentResult, opponentGames);

      await tx.playerProfile.update({ where: { userId }, data: { eloRating: newPlayerElo } });
      await tx.playerProfile.upsert({
        where: { userId: opponentId },
        create: { userId: opponentId, eloRating: newOpponentElo, gamesPlayed: 1 },
        update: { eloRating: newOpponentElo },
      });
    }

    return s;
  });

  return NextResponse.json(score);
}

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scoreSchema } from "@/lib/validations";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = scoreSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { sets, result, opponentId, courtId, playedAt } = parsed.data;

  const score = await db.score.create({
    data: { userId, sets, result, opponentId, courtId, playedAt: playedAt ? new Date(playedAt) : undefined },
  });

  // Update win/loss counters on player profile
  await db.playerProfile.upsert({
    where: { userId },
    create: { userId, totalWins: result === "WIN" ? 1 : 0, totalLosses: result === "LOSS" ? 1 : 0, totalDraws: result === "DRAW" ? 1 : 0 },
    update: {
      totalWins: result === "WIN" ? { increment: 1 } : undefined,
      totalLosses: result === "LOSS" ? { increment: 1 } : undefined,
      totalDraws: result === "DRAW" ? { increment: 1 } : undefined,
    },
  });

  return NextResponse.json(score);
}

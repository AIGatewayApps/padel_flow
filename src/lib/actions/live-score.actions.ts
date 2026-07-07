"use server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

export async function startLiveScore(courtId?: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const live = await db.liveScore.create({
    data: { player1Id: userId, courtId: courtId || null, sets: [], isLive: true },
  });
  return live.id;
}

export async function updateLiveScore(liveScoreId: string, sets: { p1: number; p2: number }[]) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const live = await db.liveScore.findUnique({ where: { id: liveScoreId } });
  if (!live || live.player1Id !== userId) throw new Error("Forbidden");
  await db.liveScore.update({ where: { id: liveScoreId }, data: { sets } });
  revalidatePath(`/live/${liveScoreId}`);
}

export async function endLiveScore(liveScoreId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const live = await db.liveScore.findUnique({ where: { id: liveScoreId } });
  if (!live || live.player1Id !== userId) throw new Error("Forbidden");
  await db.liveScore.update({ where: { id: liveScoreId }, data: { isLive: false, endedAt: new Date() } });
  revalidatePath(`/live/${liveScoreId}`);
}

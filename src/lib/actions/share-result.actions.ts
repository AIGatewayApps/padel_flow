"use server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

export async function shareResultToFeed(scoreId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const score = await db.score.findUnique({ where: { id: scoreId } });
  if (!score || score.userId !== userId) throw new Error("Forbidden");

  const sets = score.sets as { player: number; opponent: number }[];
  const setSummary = sets.map(s => `${s.player}-${s.opponent}`).join(", ");
  const resultEmoji = score.result === "WIN" ? "WIN" : score.result === "LOSS" ? "LOSS" : "DRAW";
  const body = `Match result: ${setSummary} - ${resultEmoji}`;

  await db.post.create({ data: { authorId: userId, body } });
  revalidatePath("/feed");
}

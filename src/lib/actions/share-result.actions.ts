"use server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import type { ActionResult } from "@/lib/types";

export async function shareResultToFeed(
  scoreId: string
): Promise<ActionResult> {
  const { userId: clerkId } = await auth();
  if (!clerkId)
    return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" };

  const dbUser = await db.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });
  if (!dbUser)
    return { success: false, error: "User not found", code: "NOT_FOUND" };

  const score = await db.score.findUnique({ where: { id: scoreId } });
  if (!score || score.userId !== dbUser.id)
    return { success: false, error: "Forbidden", code: "FORBIDDEN" };

  const sets = score.sets as { player: number; opponent: number }[];
  const setSummary = sets.map((s) => `${s.player}-${s.opponent}`).join(", ");
  const resultLabel =
    score.result === "WIN" ? "WIN 🏆" :
    score.result === "LOSS" ? "LOSS" : "DRAW";
  const body = `Match result: ${setSummary} — ${resultLabel}`;

  await db.post.create({ data: { authorId: dbUser.id, body } });
  revalidatePath("/feed");
  return { success: true, data: undefined };
}

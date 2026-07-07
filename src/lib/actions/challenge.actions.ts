"use server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { z } from "zod";

const ChallengeSchema = z.object({
  challengedId: z.string().cuid(),
  message: z.string().max(200).optional(),
});

export async function sendChallenge(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const parsed = ChallengeSchema.parse({
    challengedId: formData.get("challengedId"),
    message: formData.get("message") || undefined,
  });
  if (parsed.challengedId === userId) throw new Error("Cannot challenge yourself");
  await db.matchChallenge.create({
    data: { challengerId: userId, challengedId: parsed.challengedId, message: parsed.message ?? null },
  });
  await db.notification.create({
    data: { userId: parsed.challengedId, type: "challenge", body: "You have a new match challenge!", href: "/challenges" },
  });
  revalidatePath("/challenges");
}

export async function respondToChallenge(challengeId: string, accept: boolean) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const challenge = await db.matchChallenge.findUnique({ where: { id: challengeId } });
  if (!challenge || challenge.challengedId !== userId) throw new Error("Forbidden");
  await db.matchChallenge.update({
    where: { id: challengeId },
    data: { status: accept ? "ACCEPTED" : "DECLINED" },
  });
  revalidatePath("/challenges");
}

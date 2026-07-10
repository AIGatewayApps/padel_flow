"use server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/lib/types";

const BaseSchema = z.object({
  city: z.string().optional(),
  country: z.string().optional(),
});

const PlayerSchema = BaseSchema.extend({
  racket: z.string().optional(),
  hand: z.enum(["left", "right"]).optional(),
  position: z.string().optional(),
});

const CoachSchema = BaseSchema.extend({
  bio: z.string().max(1000).optional(),
  pricePerHour: z.coerce.number().positive().default(50),
  certifications: z.string().optional(),
});

export async function completeOnboarding(
  data: Record<string, string>,
  role: string
): Promise<ActionResult> {
  const { userId: clerkId } = await auth();
  if (!clerkId) return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" };

  const baseResult = BaseSchema.safeParse(data);
  if (!baseResult.success)
    return {
      success: false,
      error: baseResult.error.errors[0]?.message ?? "Invalid input",
      code: "VALIDATION_ERROR",
    };

  const dbUser = await db.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });
  if (!dbUser) return { success: false, error: "User not found", code: "NOT_FOUND" };

  const client = await clerkClient();

  await db.user.update({
    where: { id: dbUser.id },
    data: {
      city: baseResult.data.city || undefined,
      country: baseResult.data.country || undefined,
      onboarded: true,
    },
  });

  await client.users.updateUser(clerkId, {
    privateMetadata: { onboarded: true },
  });

  if (role === "PLAYER") {
    const r = PlayerSchema.safeParse(data);
    if (!r.success)
      return {
        success: false,
        error: r.error.errors[0]?.message ?? "Invalid player data",
        code: "VALIDATION_ERROR",
      };
    await db.playerProfile.upsert({
      where: { userId: dbUser.id },
      create: {
        userId: dbUser.id,
        racket: r.data.racket ?? null,
        hand: r.data.hand ?? null,
        position: r.data.position ?? null,
      },
      update: {
        racket: r.data.racket ?? null,
        hand: r.data.hand ?? null,
        position: r.data.position ?? null,
      },
    });
  }

  if (role === "COACH") {
    const r = CoachSchema.safeParse(data);
    if (!r.success)
      return {
        success: false,
        error: r.error.errors[0]?.message ?? "Invalid coach data",
        code: "VALIDATION_ERROR",
      };
    await db.coach.upsert({
      where: { userId: dbUser.id },
      create: {
        userId: dbUser.id,
        bio: r.data.bio ?? null,
        pricePerHour: r.data.pricePerHour,
        certifications: r.data.certifications ?? null,
        specialties: [],
        languages: [],
      },
      update: {
        bio: r.data.bio ?? null,
        pricePerHour: r.data.pricePerHour,
        certifications: r.data.certifications ?? null,
      },
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/onboarding");
  return { success: true, data: undefined };
}

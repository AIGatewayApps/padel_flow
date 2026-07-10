"use server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

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

export async function completeOnboarding(data: Record<string, string>, role: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const client = await clerkClient();
  const base = BaseSchema.parse(data);

  // Resolve internal DB user — all profile FKs reference User.id, not clerkId
  const dbUser = await db.user.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!dbUser) throw new Error("User not found in database");

  await db.user.update({
    where: { id: dbUser.id },
    data: {
      city: base.city || undefined,
      country: base.country || undefined,
      onboarded: true,
    },
  });

  await client.users.updateUser(userId, {
    privateMetadata: { onboarded: true },
  });

  if (role === "PLAYER") {
    const d = PlayerSchema.parse(data);
    await db.playerProfile.upsert({
      where: { userId: dbUser.id },
      create: { userId: dbUser.id, racket: d.racket ?? null, hand: d.hand ?? null, position: d.position ?? null },
      update: { racket: d.racket ?? null, hand: d.hand ?? null, position: d.position ?? null },
    });
  }

  if (role === "COACH") {
    const d = CoachSchema.parse(data);
    await db.coach.upsert({
      where: { userId: dbUser.id },
      create: {
        userId: dbUser.id,
        bio: d.bio ?? null,
        pricePerHour: d.pricePerHour,
        certifications: d.certifications ?? null,
        specialties: [],
        languages: [],
      },
      update: {
        bio: d.bio ?? null,
        pricePerHour: d.pricePerHour,
        certifications: d.certifications ?? null,
      },
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/onboarding");
}

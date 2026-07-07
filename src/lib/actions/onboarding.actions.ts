"use server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function completeOnboarding(data: Record<string, string>, role: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await db.user.update({
    where: { id: userId },
    data: {
      city: data.city || undefined,
      country: data.country || undefined,
      onboarded: true,
    },
  });

  if (role === "PLAYER") {
    await db.playerProfile.upsert({
      where: { userId },
      create: { userId, racket: data.racket || null, hand: data.hand || null, position: data.position || null },
      update: { racket: data.racket || null, hand: data.hand || null, position: data.position || null },
    });
  }

  if (role === "COACH") {
    await db.coach.upsert({
      where: { userId },
      create: {
        userId,
        bio: data.bio || null,
        pricePerHour: parseFloat(data.pricePerHour) || 50,
        certifications: data.certifications || null,
        specialties: [],
        languages: [],
      },
      update: {
        bio: data.bio || null,
        pricePerHour: parseFloat(data.pricePerHour) || 50,
        certifications: data.certifications || null,
      },
    });
  }
}

"use server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function completeOnboarding(data: Record<string, string>, role: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const client = await clerkClient();

  await db.user.update({
    where: { id: userId },
    data: {
      city: data.city || undefined,
      country: data.country || undefined,
      onboarded: true,
    },
  });

  await client.users.updateUser(userId, {
    privateMetadata: { onboarded: true },
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

  if (role === "COURT_MANAGER") {
    const manager = await db.courtManagerProfile.upsert({
      where: { userId },
      create: { userId, companyName: data.companyName || "My Courts", taxId: data.taxId || null },
      update: { companyName: data.companyName || undefined, taxId: data.taxId || null },
    });

    if (data.courtName) {
      await db.court.create({
        data: {
          managerId: manager.id,
          name: data.courtName,
          address: data.address || "TBD",
          city: data.city || "TBD",
          country: data.country || "TBD",
          pricePerHour: parseFloat(data.pricePerHour) || 25,
          surface: data.surface || null,
        },
      });
    }
  }

  if (role === "EVENT_MANAGER") {
    const manager = await db.eventManagerProfile.upsert({
      where: { userId },
      create: { userId, companyName: data.companyName || "My Events", taxId: data.taxId || null },
      update: { companyName: data.companyName || undefined, taxId: data.taxId || null },
    });

    if (data.eventTitle) {
      await db.event.create({
        data: {
          managerId: manager.id,
          title: data.eventTitle,
          location: data.location || "TBD",
          startsAt: new Date(Date.now() + 7 * 86400000),
          endsAt: new Date(Date.now() + 7 * 86400000 + 4 * 3600000),
          ticketPrice: parseFloat(data.ticketPrice) || 0,
        },
      });
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/onboarding");
}

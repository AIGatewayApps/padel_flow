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

const CourtManagerSchema = BaseSchema.extend({
  companyName: z.string().default("My Courts"),
  taxId: z.string().optional(),
  courtName: z.string().optional(),
  address: z.string().optional(),
  pricePerHour: z.coerce.number().positive().default(25),
  surface: z.string().optional(),
});

const EventManagerSchema = BaseSchema.extend({
  companyName: z.string().default("My Events"),
  taxId: z.string().optional(),
  eventTitle: z.string().optional(),
  location: z.string().optional(),
  ticketPrice: z.coerce.number().min(0).default(0),
});

export async function completeOnboarding(data: Record<string, string>, role: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const client = await clerkClient();

  const base = BaseSchema.parse(data);

  await db.user.update({
    where: { clerkId: userId },
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
      where: { userId },
      create: { userId, racket: d.racket ?? null, hand: d.hand ?? null, position: d.position ?? null },
      update: { racket: d.racket ?? null, hand: d.hand ?? null, position: d.position ?? null },
    });
  }

  if (role === "COACH") {
    const d = CoachSchema.parse(data);
    await db.coach.upsert({
      where: { userId },
      create: {
        userId,
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

  if (role === "COURT_MANAGER") {
    const d = CourtManagerSchema.parse(data);
    const manager = await db.courtManagerProfile.upsert({
      where: { userId },
      create: { userId, companyName: d.companyName, taxId: d.taxId ?? null },
      update: { companyName: d.companyName, taxId: d.taxId ?? null },
    });

    if (d.courtName) {
      await db.court.create({
        data: {
          managerId: manager.id,
          name: d.courtName,
          address: d.address ?? "TBD",
          city: d.city ?? "TBD",
          country: d.country ?? "TBD",
          pricePerHour: d.pricePerHour,
          surface: d.surface ?? null,
        },
      });
    }
  }

  if (role === "EVENT_MANAGER") {
    const d = EventManagerSchema.parse(data);
    const manager = await db.eventManagerProfile.upsert({
      where: { userId },
      create: { userId, companyName: d.companyName, taxId: d.taxId ?? null },
      update: { companyName: d.companyName, taxId: d.taxId ?? null },
    });

    if (d.eventTitle) {
      await db.event.create({
        data: {
          managerId: manager.id,
          title: d.eventTitle,
          location: d.location ?? "TBD",
          startsAt: new Date(Date.now() + 7 * 86400000),
          endsAt: new Date(Date.now() + 7 * 86400000 + 4 * 3600000),
          ticketPrice: d.ticketPrice,
        },
      });
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/onboarding");
}

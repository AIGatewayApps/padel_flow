"use server";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { z } from "zod";
import type { ActionResult } from "@/lib/types";

const CoachProfileSchema = z.object({
  bio: z.string().max(1000).nullish(),
  pricePerHour: z.coerce.number().min(1).max(9999).default(50),
  certifications: z.string().max(500).nullish(),
  active: z.boolean().optional(),
});

export async function updateCoachProfile(
  formData: FormData
): Promise<ActionResult> {
  const { userId: clerkId } = await auth();
  if (!clerkId)
    return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" };

  const coach = await db.coach.findUnique({ where: { userId: clerkId } });
  if (!coach)
    return { success: false, error: "No coach profile", code: "NOT_FOUND" };

  const result = CoachProfileSchema.safeParse({
    bio: formData.get("bio")?.toString() || null,
    pricePerHour: formData.get("pricePerHour"),
    certifications: formData.get("certifications")?.toString() || null,
    active: formData.has("active"),
  });

  if (!result.success)
    return {
      success: false,
      error: result.error.errors[0]?.message ?? "Invalid input",
      code: "VALIDATION_ERROR",
    };

  await db.coach.update({
    where: { userId: clerkId },
    data: {
      bio: result.data.bio ?? null,
      pricePerHour: result.data.pricePerHour,
      certifications: result.data.certifications ?? null,
      active: result.data.active ?? false,
    },
  });

  revalidatePath("/coach-portal");
  redirect("/coach-portal");
}

const AvailSchema = z.array(
  z.object({
    dayOfWeek: z.number().int().min(0).max(6),
    startHour: z.number().int().min(0).max(23),
    endHour: z.number().int().min(1).max(24),
  })
);

export async function upsertAvailability(
  coachId: string,
  slots: { dayOfWeek: number; startHour: number; endHour: number }[]
): Promise<ActionResult> {
  const { userId: clerkId } = await auth();
  if (!clerkId)
    return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" };

  const coach = await db.coach.findUnique({ where: { id: coachId } });
  if (!coach || coach.userId !== clerkId)
    return { success: false, error: "Forbidden", code: "FORBIDDEN" };

  const result = AvailSchema.safeParse(slots);
  if (!result.success)
    return {
      success: false,
      error: result.error.errors[0]?.message ?? "Invalid slots",
      code: "VALIDATION_ERROR",
    };

  await db.$transaction([
    db.coachAvailability.deleteMany({ where: { coachId } }),
    ...(result.data.length > 0
      ? [
          db.coachAvailability.createMany({
            data: result.data.map((s) => ({ coachId, ...s })),
          }),
        ]
      : []),
  ]);

  revalidatePath("/coach-portal/availability");
  revalidatePath("/coach-portal");
  return { success: true, data: undefined };
}

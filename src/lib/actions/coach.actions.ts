"use server";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { z } from "zod";

export async function updateCoachProfile(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const coach = await db.coach.findUnique({ where: { userId } });
  if (!coach) throw new Error("No coach profile");
  await db.coach.update({
    where: { userId },
    data: {
      bio: formData.get("bio")?.toString() || null,
      pricePerHour: parseFloat(formData.get("pricePerHour")?.toString() ?? "50") || 50,
      certifications: formData.get("certifications")?.toString() || null,
      active: formData.has("active"),
    },
  });
  revalidatePath("/coach-portal");
  redirect("/coach-portal");
}

const AvailSchema = z.array(z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startHour: z.number().int().min(0).max(23),
  endHour: z.number().int().min(1).max(24),
}));

export async function upsertAvailability(
  coachId: string,
  slots: { dayOfWeek: number; startHour: number; endHour: number }[]
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const coach = await db.coach.findUnique({ where: { id: coachId } });
  if (!coach || coach.userId !== userId) throw new Error("Forbidden");
  const parsed = AvailSchema.parse(slots);
  await db.coachAvailability.deleteMany({ where: { coachId } });
  if (parsed.length > 0) {
    await db.coachAvailability.createMany({ data: parsed.map(s => ({ coachId, ...s })) });
  }
  revalidatePath("/coach-portal/availability");
  revalidatePath("/coach-portal");
}

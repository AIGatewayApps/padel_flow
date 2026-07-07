"use server";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { courtSchema } from "@/lib/validations";
import { z } from "zod";

const SlotSchema = z.object({ startsAt: z.string().datetime(), endsAt: z.string().datetime() });

export async function upsertCourt(courtId: string | null, formData: FormData) {
  await requireRole("COURT_MANAGER", "ADMIN");
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const raw = {
    name: formData.get("name"), description: formData.get("description") || null,
    address: formData.get("address"), city: formData.get("city"),
    country: formData.get("country"), pricePerHour: Number(formData.get("pricePerHour")),
    surface: formData.get("surface") || null, indoor: formData.has("indoor"),
  };
  const parsed = courtSchema.parse(raw);
  const profile = await db.courtManagerProfile.findUnique({ where: { userId } });
  if (!profile) throw new Error("No court manager profile");
  if (courtId) {
    const court = await db.court.findUnique({ where: { id: courtId } });
    if (!court || court.managerId !== profile.id) throw new Error("Forbidden");
    await db.court.update({ where: { id: courtId }, data: parsed });
  } else {
    await db.court.create({ data: { ...parsed, managerId: profile.id } });
  }
  revalidatePath("/manage/courts");
  redirect("/manage/courts");
}

export async function addCourtSlot(courtId: string, formData: FormData) {
  await requireRole("COURT_MANAGER", "ADMIN");
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const profile = await db.courtManagerProfile.findUnique({ where: { userId } });
  const court = await db.court.findUnique({ where: { id: courtId } });
  if (!court || court.managerId !== profile?.id) throw new Error("Forbidden");
  const { startsAt, endsAt } = SlotSchema.parse({ startsAt: formData.get("startsAt"), endsAt: formData.get("endsAt") });
  await db.courtSlot.create({ data: { courtId, startsAt: new Date(startsAt), endsAt: new Date(endsAt) } });
  revalidatePath(`/manage/courts/${courtId}`);
}

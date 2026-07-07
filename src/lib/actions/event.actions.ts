"use server";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { eventSchema } from "@/lib/validations";

export async function upsertEvent(eventId: string | null, formData: FormData) {
  await requireRole("EVENT_MANAGER", "ADMIN");
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const raw = {
    title: formData.get("title"), description: formData.get("description") || null,
    location: formData.get("location"),
    startsAt: formData.get("startsAt"), endsAt: formData.get("endsAt"),
    ticketPrice: Number(formData.get("ticketPrice")),
    capacity: formData.get("capacity") ? Number(formData.get("capacity")) : null,
  };
  const parsed = eventSchema.parse(raw);
  const profile = await db.eventManagerProfile.findUnique({ where: { userId } });
  if (!profile) throw new Error("No event manager profile");
  if (eventId) {
    const event = await db.event.findUnique({ where: { id: eventId } });
    if (!event || event.managerId !== profile.id) throw new Error("Forbidden");
    await db.event.update({ where: { id: eventId }, data: { ...parsed, startsAt: new Date(parsed.startsAt), endsAt: new Date(parsed.endsAt) } });
  } else {
    await db.event.create({ data: { ...parsed, managerId: profile.id, startsAt: new Date(parsed.startsAt), endsAt: new Date(parsed.endsAt) } });
  }
  revalidatePath("/manage/events");
  redirect("/manage/events");
}

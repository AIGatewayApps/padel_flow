"use server";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOrgRole } from "@/lib/permissions";
import { eventSchema } from "@/lib/validations";

export async function upsertEvent(orgId: string, eventId: string | null, formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Only ORG_ADMIN members of this org (or SUPER_ADMIN) may manage events
  await requireOrgRole(userId, orgId, ["ORG_ADMIN"]);

  const raw = {
    title: formData.get("title"),
    description: formData.get("description") || null,
    location: formData.get("location"),
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
    ticketPrice: Number(formData.get("ticketPrice")),
    capacity: formData.get("capacity") ? Number(formData.get("capacity")) : null,
  };
  const parsed = eventSchema.parse(raw);

  if (eventId) {
    const event = await db.event.findUnique({ where: { id: eventId } });
    if (!event || event.orgId !== orgId) throw new Error("Forbidden");
    await db.event.update({
      where: { id: eventId },
      data: { ...parsed, startsAt: new Date(parsed.startsAt), endsAt: new Date(parsed.endsAt) },
    });
  } else {
    await db.event.create({
      data: { ...parsed, orgId, startsAt: new Date(parsed.startsAt), endsAt: new Date(parsed.endsAt) },
    });
  }

  revalidatePath(`/orgs/${orgId}/events`);
  redirect(`/orgs/${orgId}/events`);
}

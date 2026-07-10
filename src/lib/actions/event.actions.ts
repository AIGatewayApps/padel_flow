"use server";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOrgRole } from "@/lib/permissions";
import { eventSchema } from "@/lib/validations";
import type { ActionResult } from "@/lib/types";

export async function upsertEvent(
  orgId: string,
  eventId: string | null,
  formData: FormData
): Promise<ActionResult> {
  const { userId: clerkId } = await auth();
  if (!clerkId) return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" };

  await requireOrgRole(clerkId, orgId, ["ORG_ADMIN"]);

  // Field names aligned with eventSchema
  const raw = {
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    imageUrl: formData.get("imageUrl") || undefined,
    location: formData.get("location"),
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
    ticketPrice: formData.get("ticketPrice") ? Number(formData.get("ticketPrice")) : undefined,
    capacity: formData.get("capacity") ? Number(formData.get("capacity")) : undefined,
  };

  const result = eventSchema.safeParse(raw);
  if (!result.success)
    return {
      success: false,
      error: result.error.errors[0]?.message ?? "Invalid input",
      code: "VALIDATION_ERROR",
    };

  const parsed = result.data;
  const startsAt = new Date(parsed.startsAt);
  const endsAt = new Date(parsed.endsAt);

  if (startsAt >= endsAt)
    return { success: false, error: "Start time must be before end time", code: "VALIDATION_ERROR" };

  if (eventId) {
    const event = await db.event.findUnique({ where: { id: eventId } });
    if (!event || event.orgId !== orgId)
      return { success: false, error: "Forbidden", code: "FORBIDDEN" };
    await db.event.update({
      where: { id: eventId },
      data: { ...parsed, startsAt, endsAt },
    });
  } else {
    await db.event.create({
      data: { ...parsed, orgId, startsAt, endsAt },
    });
  }

  revalidatePath(`/orgs/${orgId}/events`);
  redirect(`/orgs/${orgId}/events`);
}

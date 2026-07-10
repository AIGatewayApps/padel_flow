"use server";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOrgRole } from "@/lib/permissions";
import { courtSchema } from "@/lib/validations";
import { z } from "zod";
import type { ActionResult } from "@/lib/types";

const SlotSchema = z.object({
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
});

export async function upsertCourt(
  orgId: string,
  courtId: string | null,
  formData: FormData
): Promise<ActionResult> {
  const { userId: clerkId } = await auth();
  if (!clerkId) return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" };

  await requireOrgRole(clerkId, orgId, ["ORG_ADMIN"]);

  const raw = {
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    address: formData.get("address"),
    city: formData.get("city"),
    country: formData.get("country"),
    pricePerHour: Number(formData.get("pricePerHour")),
    surface: formData.get("surface") || undefined,
    // field name aligned with courtSchema
    isIndoor: formData.has("indoor"),
  };

  const result = courtSchema.safeParse(raw);
  if (!result.success)
    return {
      success: false,
      error: result.error.errors[0]?.message ?? "Invalid input",
      code: "VALIDATION_ERROR",
    };

  if (courtId) {
    const court = await db.court.findUnique({ where: { id: courtId } });
    if (!court || court.orgId !== orgId)
      return { success: false, error: "Forbidden", code: "FORBIDDEN" };
    await db.court.update({ where: { id: courtId }, data: result.data });
  } else {
    await db.court.create({ data: { ...result.data, orgId } });
  }

  revalidatePath(`/orgs/${orgId}/courts`);
  redirect(`/orgs/${orgId}/courts`);
}

export async function addCourtSlot(
  orgId: string,
  courtId: string,
  formData: FormData
): Promise<ActionResult> {
  const { userId: clerkId } = await auth();
  if (!clerkId) return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" };

  await requireOrgRole(clerkId, orgId, ["ORG_ADMIN"]);

  const court = await db.court.findUnique({ where: { id: courtId } });
  if (!court || court.orgId !== orgId)
    return { success: false, error: "Forbidden", code: "FORBIDDEN" };

  const result = SlotSchema.safeParse({
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
  });
  if (!result.success)
    return {
      success: false,
      error: result.error.errors[0]?.message ?? "Invalid slot times",
      code: "VALIDATION_ERROR",
    };

  const startsAt = new Date(result.data.startsAt);
  const endsAt = new Date(result.data.endsAt);

  if (startsAt >= endsAt)
    return { success: false, error: "Start time must be before end time", code: "VALIDATION_ERROR" };
  if (startsAt < new Date())
    return { success: false, error: "Slot must be in the future", code: "VALIDATION_ERROR" };

  await db.courtSlot.create({ data: { courtId, startsAt, endsAt } });
  revalidatePath(`/orgs/${orgId}/courts/${courtId}`);
  return { success: true, data: undefined };
}

"use server";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOrgRole } from "@/lib/permissions";
import { courtSchema } from "@/lib/validations";
import { z } from "zod";

const SlotSchema = z.object({
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
});

export async function upsertCourt(orgId: string, courtId: string | null, formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Only ORG_ADMIN members of this org (or SUPER_ADMIN) may manage courts
  await requireOrgRole(userId, orgId, ["ORG_ADMIN"]);

  const raw = {
    name: formData.get("name"),
    description: formData.get("description") || null,
    address: formData.get("address"),
    city: formData.get("city"),
    country: formData.get("country"),
    pricePerHour: Number(formData.get("pricePerHour")),
    surface: formData.get("surface") || null,
    indoor: formData.has("indoor"),
  };
  const parsed = courtSchema.parse(raw);

  if (courtId) {
    const court = await db.court.findUnique({ where: { id: courtId } });
    if (!court || court.orgId !== orgId) throw new Error("Forbidden");
    await db.court.update({ where: { id: courtId }, data: parsed });
  } else {
    await db.court.create({ data: { ...parsed, orgId } });
  }

  revalidatePath(`/orgs/${orgId}/courts`);
  redirect(`/orgs/${orgId}/courts`);
}

export async function addCourtSlot(orgId: string, courtId: string, formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await requireOrgRole(userId, orgId, ["ORG_ADMIN"]);

  const court = await db.court.findUnique({ where: { id: courtId } });
  if (!court || court.orgId !== orgId) throw new Error("Forbidden");

  const { startsAt, endsAt } = SlotSchema.parse({
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
  });

  await db.courtSlot.create({
    data: { courtId, startsAt: new Date(startsAt), endsAt: new Date(endsAt) },
  });

  revalidatePath(`/orgs/${orgId}/courts/${courtId}`);
}

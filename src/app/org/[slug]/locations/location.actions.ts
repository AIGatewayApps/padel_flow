"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { canUserInOrg } from "@/lib/permissions";
import { auth } from "@clerk/nextjs/server";

export async function createLocation(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const orgId = formData.get("orgId") as string;

  const canManage = await canUserInOrg(orgId, "courts.manage");
  if (!canManage) throw new Error("Forbidden");

  const org = await db.organization.findUnique({ where: { id: orgId }, select: { slug: true } });
  await db.orgLocation.create({
    data: {
      orgId,
      name: formData.get("name") as string,
      address: formData.get("address") as string,
      city: formData.get("city") as string,
      country: formData.get("country") as string,
      lat: formData.get("lat") ? parseFloat(formData.get("lat") as string) : null,
      lng: formData.get("lng") ? parseFloat(formData.get("lng") as string) : null,
    },
  });
  revalidatePath(`/org/${org?.slug}/locations`);
}

export async function toggleLocation(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const locationId = formData.get("locationId") as string;
  const active = formData.get("active") === "true";

  const location = await db.orgLocation.findUnique({ where: { id: locationId }, select: { orgId: true, org: { select: { slug: true } } } });
  if (!location) throw new Error("Not found");

  const canManage = await canUserInOrg(location.orgId, "courts.manage");
  if (!canManage) throw new Error("Forbidden");

  await db.orgLocation.update({ where: { id: locationId }, data: { active } });
  revalidatePath(`/org/${location.org.slug}/locations`);
}

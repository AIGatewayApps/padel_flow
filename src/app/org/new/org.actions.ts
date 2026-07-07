"use server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { auditLog } from "@/lib/audit";

export async function createOrg(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  const slug = formData.get("slug") as string;

  const existing = await db.organization.findUnique({ where: { slug } });
  if (existing) throw new Error("Slug already taken");

  const org = await db.organization.create({
    data: {
      name,
      slug,
      ownerId: userId,
      members: {
        create: { userId, role: "OWNER", permissions: {} },
      },
    },
  });

  await auditLog(userId, "ORG_CREATED", "Organization", org.id, { name, slug });
  return { slug: org.slug };
}

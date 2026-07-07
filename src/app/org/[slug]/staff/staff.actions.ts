"use server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { canUserInOrg } from "@/lib/permissions";
import { auditLog } from "@/lib/audit";

export async function inviteStaff(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const orgId = formData.get("orgId") as string;
  const email = formData.get("email") as string;
  const role = formData.get("role") as string;

  const canManage = await canUserInOrg(orgId, "staff.manage");
  if (!canManage) throw new Error("Forbidden");

  const target = await db.user.findUnique({ where: { email } });
  if (!target) throw new Error("No user found with that email");

  await db.orgMember.upsert({
    where: { orgId_userId: { orgId, userId: target.id } },
    update: { role: role as "MANAGER" | "STAFF" | "VIEWER" },
    create: { orgId, userId: target.id, role: role as "MANAGER" | "STAFF" | "VIEWER" },
  });

  await db.notification.create({
    data: { userId: target.id, type: "org_invite", body: `You've been added to an organization`, href: `/org` },
  });

  const org = await db.organization.findUnique({ where: { id: orgId }, select: { slug: true } });
  await auditLog(userId, "STAFF_INVITED", "OrgMember", target.id, { email, role });
  revalidatePath(`/org/${org?.slug}/staff`);
}

export async function removeStaff(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const memberId = formData.get("memberId") as string;

  const member = await db.orgMember.findUnique({ where: { id: memberId } });
  if (!member) throw new Error("Not found");

  const canManage = await canUserInOrg(member.orgId, "staff.manage");
  if (!canManage) throw new Error("Forbidden");

  await db.orgMember.delete({ where: { id: memberId } });
  await auditLog(userId, "STAFF_REMOVED", "OrgMember", memberId);
  const org = await db.organization.findUnique({ where: { id: member.orgId }, select: { slug: true } });
  revalidatePath(`/org/${org?.slug}/staff`);
}

export async function updateStaffPermissions(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const memberId = formData.get("memberId") as string;
  const permissions = JSON.parse(formData.get("permissions") as string);
  const locationIds = JSON.parse(formData.get("locationIds") as string);

  const member = await db.orgMember.findUnique({ where: { id: memberId } });
  if (!member) throw new Error("Not found");

  const canManage = await canUserInOrg(member.orgId, "staff.manage");
  if (!canManage) throw new Error("Forbidden");

  await db.orgMember.update({ where: { id: memberId }, data: { permissions, locationIds } });
  const org = await db.organization.findUnique({ where: { id: member.orgId }, select: { slug: true } });
  revalidatePath(`/org/${org?.slug}/staff`);
}

import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export type Permission =
  | "courts.manage"
  | "courts.view_bookings"
  | "slots.manage"
  | "bookings.refund"
  | "events.manage"
  | "tickets.scan"
  | "reports.view"
  | "staff.manage"
  | "ads.manage"
  | "shop.manage"
  | "org.settings";

// Full permission set by org role
const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  OWNER: [
    "courts.manage", "courts.view_bookings", "slots.manage", "bookings.refund",
    "events.manage", "tickets.scan", "reports.view", "staff.manage",
    "ads.manage", "shop.manage", "org.settings",
  ],
  MANAGER: [
    "courts.manage", "courts.view_bookings", "slots.manage", "bookings.refund",
    "events.manage", "tickets.scan", "reports.view", "staff.manage", "ads.manage",
  ],
  STAFF: [
    "courts.view_bookings", "slots.manage", "tickets.scan",
  ],
  VIEWER: [
    "courts.view_bookings", "reports.view",
  ],
};

/** Check if the current user has a permission within an org. */
export async function canUserInOrg(
  orgId: string,
  permission: Permission,
  locationId?: string
): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;

  // Platform ADMIN always has all permissions
  const user = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role === "ADMIN") return true;

  const member = await db.orgMember.findUnique({
    where: { orgId_userId: { orgId, userId } },
  });
  if (!member) return false;

  // Check location scope
  if (locationId && member.locationIds.length > 0 && !member.locationIds.includes(locationId)) {
    return false;
  }

  // Check granular permission override first
  const overrides = member.permissions as Record<string, boolean>;
  if (typeof overrides[permission] === "boolean") return overrides[permission];

  // Fall back to role defaults
  return ROLE_PERMISSIONS[member.role]?.includes(permission) ?? false;
}

/** Get org membership for the current user */
export async function getOrgMembership(orgId: string) {
  const { userId } = await auth();
  if (!userId) return null;
  return db.orgMember.findUnique({
    where: { orgId_userId: { orgId, userId } },
    include: { org: { select: { name: true, slug: true, logoUrl: true } } },
  });
}

/** Get all orgs the current user belongs to */
export async function getMyOrgs() {
  const { userId } = await auth();
  if (!userId) return [];
  return db.orgMember.findMany({
    where: { userId },
    include: { org: { select: { id: true, name: true, slug: true, logoUrl: true, plan: true } } },
  });
}

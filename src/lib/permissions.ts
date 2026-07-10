import { db } from '@/lib/db';
import { redirect } from 'next/navigation';

type Role = 'PLAYER' | 'COACH' | 'ORG_ADMIN' | 'VENDOR' | 'SUPER_ADMIN';

/** Platform-level guard — only SUPER_ADMIN may proceed. All other roles redirected. */
export async function requireSuperAdmin(clerkId: string) {
  const user = await db.user.findUnique({ where: { clerkId } });
  if (!user || user.role !== 'SUPER_ADMIN') redirect('/dashboard');
  return user;
}

/** Single role guard (use sparingly — prefer requireOrgRole for org-scoped resources). */
export async function requireRole(clerkId: string, role: Role) {
  const user = await db.user.findUnique({ where: { clerkId } });
  if (!user || user.role !== role) redirect('/dashboard');
  return user;
}

/**
 * Org-scoped role guard.
 * SUPER_ADMIN always passes. Everyone else must hold one of the given roles
 * as an OrgMember of the specified org.
 */
export async function requireOrgRole(clerkId: string, orgId: string, roles: Role[]) {
  const user = await db.user.findUnique({ where: { clerkId } });
  if (!user) redirect('/sign-in');

  if (user.role === 'SUPER_ADMIN') return user;

  const membership = await db.orgMember.findUnique({
    where: { userId_orgId: { userId: user.id, orgId } },
  });

  if (!membership || !roles.includes(membership.role as Role)) redirect('/org');
  return user;
}

export async function hasOrgAccess(clerkId: string, orgId: string): Promise<boolean> {
  const user = await db.user.findUnique({ where: { clerkId } });
  if (!user) return false;
  if (user.role === 'SUPER_ADMIN') return true;

  const membership = await db.orgMember.findFirst({
    where: { userId: user.id, orgId },
  });
  return !!membership;
}

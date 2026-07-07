import { db as prisma } from '@/lib/db'
import { redirect } from 'next/navigation'

type Role = 'PLAYER' | 'COACH' | 'ORG_ADMIN' | 'VENDOR' | 'SUPER_ADMIN'

export async function requireRole(clerkId: string, role: Role) {
  const user = await prisma.user.findUnique({ where: { clerkId } })
  if (!user || user.role !== role) redirect('/dashboard')
  return user
}

export async function requireOrgRole(clerkId: string, orgId: string, roles: Role[]) {
  const user = await prisma.user.findUnique({ where: { clerkId } })
  if (!user) redirect('/sign-in')

  // Super admin bypasses org role check
  if (user.role === 'SUPER_ADMIN') return user

  const membership = await prisma.orgMember.findUnique({
    where: { userId_orgId: { userId: user.id, orgId } },
  })

  if (!membership || !roles.includes(membership.role as Role)) redirect('/org')
  return user
}

export async function hasOrgAccess(clerkId: string, orgId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { clerkId } })
  if (!user) return false
  if (user.role === 'SUPER_ADMIN') return true

  const membership = await prisma.orgMember.findFirst({
    where: { userId: user.id, orgId },
  })
  return !!membership
}

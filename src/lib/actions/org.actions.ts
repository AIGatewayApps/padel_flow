'use server'

import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { hasOrgAccess } from '@/lib/permissions'
import type { ActionResult } from '@/lib/types'

/** Resolve authenticated user's internal DB id from Clerk session. */
async function resolveDbUser() {
  const { userId } = await auth()
  if (!userId) return null
  return db.user.findUnique({ where: { clerkId: userId }, select: { id: true } })
}

export async function getUserOrgs(): Promise<ActionResult<Awaited<ReturnType<typeof db.org.findMany>>>> {
  const { userId } = await auth()
  if (!userId) return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' }
  const memberships = await db.orgMember.findMany({
    where: { user: { clerkId: userId } },
    include: { org: true },
  })
  return { success: true, data: memberships.map((m) => m.org) }
}

export async function getOrgById(orgId: string): Promise<ActionResult> {
  const { userId } = await auth()
  if (!userId) return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' }
  const ok = await hasOrgAccess(userId, orgId)
  if (!ok) return { success: false, error: 'Forbidden', code: 'FORBIDDEN' }

  const org = await db.org.findUnique({
    where: { id: orgId },
    include: { _count: { select: { members: true, courts: true, events: true } } },
  })
  return { success: true, data: org }
}

export async function getOrgMembers(orgId: string): Promise<ActionResult> {
  const { userId } = await auth()
  if (!userId) return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' }
  const ok = await hasOrgAccess(userId, orgId)
  if (!ok) return { success: false, error: 'Forbidden', code: 'FORBIDDEN' }

  const members = await db.orgMember.findMany({
    where: { orgId },
    include: { user: { select: { name: true, email: true, avatarUrl: true } } },
    orderBy: { joinedAt: 'asc' },
  })
  return { success: true, data: members }
}

export async function getOrgCourts(orgId: string): Promise<ActionResult> {
  const { userId } = await auth()
  if (!userId) return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' }
  const ok = await hasOrgAccess(userId, orgId)
  if (!ok) return { success: false, error: 'Forbidden', code: 'FORBIDDEN' }

  const courts = await db.court.findMany({ where: { orgId }, orderBy: { name: 'asc' } })
  return { success: true, data: courts }
}

export async function getOrgRevenue(orgId: string): Promise<ActionResult> {
  const { userId } = await auth()
  if (!userId) return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' }
  const ok = await hasOrgAccess(userId, orgId)
  if (!ok) return { success: false, error: 'Forbidden', code: 'FORBIDDEN' }

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const bookings = await db.booking.findMany({
    where: { court: { orgId }, status: 'COMPLETED' },
    select: { totalCost: true, createdAt: true },
  })
  const total = bookings.reduce((sum, b) => sum + b.totalCost, 0)
  const thisMonth = bookings
    .filter((b) => b.createdAt >= startOfMonth)
    .reduce((sum, b) => sum + b.totalCost, 0)

  return { success: true, data: { total, thisMonth, bookingCount: bookings.length } }
}

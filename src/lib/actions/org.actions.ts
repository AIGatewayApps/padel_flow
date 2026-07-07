'use server'

import { prisma } from '@/lib/prisma'

export async function getUserOrgs(userId: string) {
  const memberships = await prisma.orgMember.findMany({
    where: { user: { clerkId: userId } },
    include: { org: true },
  })
  return memberships.map((m) => m.org)
}

export async function getOrgById(orgId: string) {
  return prisma.org.findUnique({
    where: { id: orgId },
    include: {
      _count: { select: { members: true, courts: true, events: true } },
    },
  })
}

export async function getOrgMembers(orgId: string) {
  return prisma.orgMember.findMany({
    where: { orgId },
    include: { user: { select: { name: true, email: true, avatarUrl: true } } },
    orderBy: { joinedAt: 'asc' },
  })
}

export async function getOrgCourts(orgId: string) {
  return prisma.court.findMany({
    where: { orgId },
    orderBy: { name: 'asc' },
  })
}

export async function getOrgRevenue(orgId: string) {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const bookings = await prisma.booking.findMany({
    where: { court: { orgId }, status: 'COMPLETED' },
    select: { totalCost: true, createdAt: true },
  })

  const total = bookings.reduce((sum, b) => sum + b.totalCost, 0)
  const thisMonth = bookings
    .filter((b) => b.createdAt >= startOfMonth)
    .reduce((sum, b) => sum + b.totalCost, 0)

  return { total, thisMonth, bookingCount: bookings.length }
}

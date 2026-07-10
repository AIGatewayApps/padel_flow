'use server'

import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { requireSuperAdmin } from '@/lib/permissions'
import type { ActionResult } from '@/lib/types'

/**
 * Read ads.
 * - SUPER_ADMIN: all ads, optionally filtered by status.
 * - VENDOR: only their own ads.
 * - Other roles: only ACTIVE ads (public-facing).
 */
export async function getAds(
  filters?: { status?: string }
): Promise<ActionResult<Awaited<ReturnType<typeof db.ad.findMany>>>> {
  const { userId: clerkId } = await auth()
  if (!clerkId) return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' }

  const dbUser = await db.user.findUnique({
    where: { clerkId },
    select: { id: true, role: true },
  })
  if (!dbUser) return { success: false, error: 'User not found', code: 'NOT_FOUND' }

  // Build where clause based on role
  let where: Parameters<typeof db.ad.findMany>[0]['where'] = {}

  if (dbUser.role === 'SUPER_ADMIN') {
    // Admin sees all; optional status filter
    if (filters?.status) where = { status: filters.status as 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ENDED' }
  } else if (dbUser.role === 'VENDOR') {
    // Vendors only see their own ads
    const vendor = await db.vendor.findFirst({ where: { userId: dbUser.id }, select: { id: true } })
    if (!vendor) return { success: false, error: 'Vendor profile not found', code: 'NOT_FOUND' }
    where = {
      vendorId: vendor.id,
      ...(filters?.status ? { status: filters.status as 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ENDED' } : {}),
    }
  } else {
    // All other roles: only active ads
    where = { status: 'ACTIVE' }
  }

  return {
    success: true,
    data: await db.ad.findMany({
      where,
      include: {
        vendor: { select: { storeName: true } },
        impressions: { select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
  }
}

/** Create ad — caller must be SUPER_ADMIN or the vendor who owns the ad. */
export async function createAd(
  vendorId: string,
  data: {
    title: string
    imageUrl?: string
    linkUrl?: string
    placement?: string
    budget?: number
    startDate?: Date
    endDate?: Date
  }
): Promise<ActionResult> {
  const { userId: clerkId } = await auth()
  if (!clerkId) return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' }

  const dbUser = await db.user.findUnique({ where: { clerkId }, select: { id: true, role: true } })
  if (!dbUser) return { success: false, error: 'User not found', code: 'NOT_FOUND' }

  if (dbUser.role !== 'SUPER_ADMIN') {
    const vendor = await db.vendor.findUnique({ where: { id: vendorId } })
    if (!vendor || vendor.userId !== dbUser.id)
      return { success: false, error: 'Forbidden', code: 'FORBIDDEN' }
  }

  await db.ad.create({ data: { ...data, vendorId } })
  return { success: true, data: undefined }
}

/** Update ad status — SUPER_ADMIN or owning vendor only. */
export async function updateAdStatus(
  adId: string,
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ENDED'
): Promise<ActionResult> {
  const { userId: clerkId } = await auth()
  if (!clerkId) return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' }

  const dbUser = await db.user.findUnique({ where: { clerkId }, select: { id: true, role: true } })
  if (!dbUser) return { success: false, error: 'User not found', code: 'NOT_FOUND' }

  if (dbUser.role !== 'SUPER_ADMIN') {
    const ad = await db.ad.findUnique({
      where: { id: adId },
      include: { vendor: { select: { userId: true } } },
    })
    if (!ad || ad.vendor.userId !== dbUser.id)
      return { success: false, error: 'Forbidden', code: 'FORBIDDEN' }
  }

  await db.ad.update({ where: { id: adId }, data: { status } })
  return { success: true, data: undefined }
}

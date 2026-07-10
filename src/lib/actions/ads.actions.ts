'use server'

import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { hasOrgAccess, requireSuperAdmin } from '@/lib/permissions'
import type { ActionResult } from '@/lib/types'

/** Read: any authenticated user may fetch active ads (public-facing). Admins can filter by status. */
export async function getAds(filters?: { status?: string }): Promise<ActionResult<Awaited<ReturnType<typeof db.ad.findMany>>>> {
  const { userId } = await auth()
  if (!userId) return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' }

  return {
    success: true,
    data: await db.ad.findMany({
      where: filters?.status ? { status: filters.status as 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ENDED' } : undefined,
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
  const { userId } = await auth()
  if (!userId) return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' }

  // Only the owning vendor or a SUPER_ADMIN may create ads
  const dbUser = await db.user.findUnique({ where: { clerkId: userId }, select: { id: true, role: true } })
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
  const { userId } = await auth()
  if (!userId) return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' }

  const dbUser = await db.user.findUnique({ where: { clerkId: userId }, select: { id: true, role: true } })
  if (!dbUser) return { success: false, error: 'User not found', code: 'NOT_FOUND' }

  if (dbUser.role !== 'SUPER_ADMIN') {
    const ad = await db.ad.findUnique({ where: { id: adId }, include: { vendor: { select: { userId: true } } } })
    if (!ad || ad.vendor.userId !== dbUser.id)
      return { success: false, error: 'Forbidden', code: 'FORBIDDEN' }
  }

  await db.ad.update({ where: { id: adId }, data: { status } })
  return { success: true, data: undefined }
}

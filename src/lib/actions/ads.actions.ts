'use server'

import { prisma } from '@/lib/prisma'

export async function getAds(filters?: { status?: string }) {
  return prisma.ad.findMany({
    where: filters?.status ? { status: filters.status as any } : undefined,
    include: {
      vendor: { select: { storeName: true } },
      impressions: { select: { id: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function createAd(vendorId: string, data: {
  title: string
  imageUrl?: string
  linkUrl?: string
  placement?: string
  budget?: number
  startDate?: Date
  endDate?: Date
}) {
  return prisma.ad.create({
    data: { ...data, vendorId },
  })
}

export async function updateAdStatus(adId: string, status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ENDED') {
  return prisma.ad.update({
    where: { id: adId },
    data: { status },
  })
}

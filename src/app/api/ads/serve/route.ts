import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const placement = req.nextUrl.searchParams.get('placement') ?? 'banner'

  const ad = await prisma.ad.findFirst({
    where: {
      status: 'ACTIVE',
      placement,
      OR: [
        { endDate: null },
        { endDate: { gte: new Date() } },
      ],
    },
    include: { vendor: { select: { storeName: true } } },
    orderBy: { createdAt: 'desc' },
  })

  if (!ad) return NextResponse.json(null)
  return NextResponse.json(ad)
}

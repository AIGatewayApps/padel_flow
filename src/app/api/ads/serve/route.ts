import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const placement = req.nextUrl.searchParams.get('placement') ?? 'banner'

  const ad = await db.ad.findFirst({
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

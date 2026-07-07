import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const { adId, clicked, userId } = await req.json()
  await prisma.adImpression.create({
    data: { adId, clicked: clicked ?? false, userId: userId ?? null },
  })
  return NextResponse.json({ ok: true })
}

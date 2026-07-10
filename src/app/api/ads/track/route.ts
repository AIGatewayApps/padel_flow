import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  const { adId, clicked, userId } = await req.json()
  await db.adImpression.create({
    data: { adId, clicked: clicked ?? false, userId: userId ?? null },
  })
  return NextResponse.json({ ok: true })
}

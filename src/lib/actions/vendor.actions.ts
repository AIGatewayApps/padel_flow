'use server'

import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import type { ActionResult } from '@/lib/types'

/** Internal helper — resolves vendor by clerkId derived from auth(). Never exposed directly. */
async function getVendorFromAuth() {
  const { userId } = await auth()
  if (!userId) return null
  return db.vendor.findFirst({ where: { user: { clerkId: userId } } })
}

export async function getVendorProfile(): Promise<ActionResult<Awaited<ReturnType<typeof db.vendor.findFirst>>>> {
  const { userId } = await auth()
  if (!userId) return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' }
  const vendor = await db.vendor.findFirst({ where: { user: { clerkId: userId } } })
  return { success: true, data: vendor }
}

export async function getVendorProducts(): Promise<ActionResult<Awaited<ReturnType<typeof db.product.findMany>>>> {
  const vendor = await getVendorFromAuth()
  if (!vendor) return { success: false, error: 'Unauthorized or vendor not found', code: 'UNAUTHORIZED' }
  const products = await db.product.findMany({
    where: { vendorId: vendor.id },
    orderBy: { createdAt: 'desc' },
  })
  return { success: true, data: products }
}

export async function createProduct(data: {
  name: string
  description?: string
  price: number
  stock?: number
  imageUrl?: string
  category?: string
}): Promise<ActionResult> {
  const vendor = await getVendorFromAuth()
  if (!vendor) return { success: false, error: 'Vendor profile not found', code: 'NOT_FOUND' }
  await db.product.create({ data: { ...data, vendorId: vendor.id } })
  return { success: true, data: undefined }
}

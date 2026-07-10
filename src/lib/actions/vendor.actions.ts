'use server'

import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import type { ActionResult } from '@/lib/types'

const ProductSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  price: z.number().positive(),
  stock: z.number().int().min(0).optional().default(0),
  imageUrl: z.string().url().optional(),
  category: z.string().max(100).optional(),
})

/** Internal helper — resolves vendor by clerkId derived from auth(). */
async function getVendorFromAuth() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return null
  return db.vendor.findFirst({ where: { user: { clerkId } } })
}

export async function getVendorProfile(): Promise<ActionResult<Awaited<ReturnType<typeof db.vendor.findFirst>>>> {
  const { userId: clerkId } = await auth()
  if (!clerkId) return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' }
  const vendor = await db.vendor.findFirst({ where: { user: { clerkId } } })
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

  const result = ProductSchema.safeParse(data)
  if (!result.success)
    return {
      success: false,
      error: result.error.errors[0]?.message ?? 'Invalid product data',
      code: 'VALIDATION_ERROR',
    }

  await db.product.create({ data: { ...result.data, vendorId: vendor.id } })
  return { success: true, data: undefined }
}

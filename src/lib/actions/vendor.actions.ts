'use server'

import { prisma } from '@/lib/prisma'

export async function getVendorProfile(clerkId: string) {
  return prisma.vendor.findFirst({
    where: { user: { clerkId } },
  })
}

export async function getVendorProducts(clerkId: string) {
  const vendor = await getVendorProfile(clerkId)
  if (!vendor) return []
  return prisma.product.findMany({
    where: { vendorId: vendor.id },
    orderBy: { createdAt: 'desc' },
  })
}

export async function createProduct(clerkId: string, data: {
  name: string
  description?: string
  price: number
  stock?: number
  imageUrl?: string
  category?: string
}) {
  const vendor = await getVendorProfile(clerkId)
  if (!vendor) throw new Error('Vendor profile not found')
  return prisma.product.create({
    data: { ...data, vendorId: vendor.id },
  })
}

"use server";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/permissions";
import { z } from "zod";
import type { ActionResult } from "@/lib/types";

const ProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.coerce.number().positive(),
  stock: z.coerce.number().int().min(0),
  category: z.string().nullable().optional(),
});

export async function upsertProduct(
  productId: string | null,
  formData: FormData
): Promise<ActionResult> {
  const { userId: clerkId } = await auth();
  if (!clerkId) return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" };

  await requireRole(clerkId, "SUPER_ADMIN");

  const raw = {
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    price: formData.get("price"),
    stock: formData.get("stock"),
    category: formData.get("category") || null,
  };

  const result = ProductSchema.safeParse(raw);
  if (!result.success)
    return {
      success: false,
      error: result.error.errors[0]?.message ?? "Invalid input",
      code: "VALIDATION_ERROR",
    };

  if (productId) {
    await db.product.update({ where: { id: productId }, data: result.data });
  } else {
    await db.product.create({ data: result.data });
  }

  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export async function toggleProductActive(productId: string): Promise<ActionResult> {
  const { userId: clerkId } = await auth();
  if (!clerkId) return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" };

  await requireRole(clerkId, "SUPER_ADMIN");

  const product = await db.product.findUnique({
    where: { id: productId },
    select: { active: true },
  });
  if (!product) return { success: false, error: "Product not found", code: "NOT_FOUND" };

  await db.product.update({
    where: { id: productId },
    data: { active: !product.active },
  });
  revalidatePath("/admin/products");
  return { success: true, data: undefined };
}

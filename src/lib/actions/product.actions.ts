"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { z } from "zod";

const ProductSchema = z.object({
  name: z.string().min(1), description: z.string().optional(),
  price: z.coerce.number().positive(), stock: z.coerce.number().int().min(0),
  category: z.string().nullable().optional(),
});

export async function upsertProduct(productId: string | null, formData: FormData) {
  await requireRole("ADMIN");
  const raw = {
    name: formData.get("name"), description: formData.get("description") || undefined,
    price: formData.get("price"), stock: formData.get("stock"),
    category: formData.get("category") || null,
  };
  const parsed = ProductSchema.parse(raw);
  if (productId) {
    await db.product.update({ where: { id: productId }, data: parsed });
  } else {
    await db.product.create({ data: parsed });
  }
  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export async function toggleProductActive(productId: string) {
  await requireRole("ADMIN");
  const product = await db.product.findUnique({ where: { id: productId }, select: { active: true } });
  if (!product) throw new Error("Not found");
  await db.product.update({ where: { id: productId }, data: { active: !product.active } });
  revalidatePath("/admin/products");
}

"use server";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/permissions";
import { z } from "zod";

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
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");
  await requireRole(clerkId, "SUPER_ADMIN");

  const raw = {
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    price: formData.get("price"),
    stock: formData.get("stock"),
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
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");
  await requireRole(clerkId, "SUPER_ADMIN");

  const product = await db.product.findUnique({
    where: { id: productId },
    select: { active: true },
  });
  if (!product) throw new Error("Not found");

  await db.product.update({
    where: { id: productId },
    data: { active: !product.active },
  });
  revalidatePath("/admin/products");
}

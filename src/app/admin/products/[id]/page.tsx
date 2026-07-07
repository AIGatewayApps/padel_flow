import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import ProductForm from "../product-form";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("ADMIN");
  const { id } = await params;
  const product = await db.product.findUnique({ where: { id } });
  if (!product) notFound();
  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Edit product</h1>
      <ProductForm product={product} />
    </div>
  );
}

import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import ProductActions from "./product-actions";

export const metadata = { title: "Admin — Products" };

export default async function AdminProductsPage() {
  await requireRole("ADMIN");
  const products = await db.product.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-700">← Admin</Link>
          <h1 className="text-2xl font-bold">Products</h1>
        </div>
        <Link href="/admin/products/new" className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700">+ Add product</Link>
      </div>
      {products.length === 0 && <p className="text-gray-500">No products yet.</p>}
      <div className="flex flex-col gap-3">
        {products.map(p => (
          <div key={p.id} className="flex items-center justify-between border rounded-xl px-4 py-3 bg-white dark:bg-gray-900">
            <div>
              <p className="font-medium">{p.name}</p>
              <p className="text-sm text-gray-500">${p.price} · Stock: {p.stock} · {p.category ?? "uncategorized"} · {p.active ? "Active" : "Inactive"}</p>
            </div>
            <ProductActions productId={p.id} active={p.active} />
          </div>
        ))}
      </div>
    </div>
  );
}

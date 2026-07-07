"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Product = { id: string; name: string; description: string | null; price: number; stock: number; category: string | null };

export default function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: fd.get("name"), description: fd.get("description"),
      price: Number(fd.get("price")), stock: Number(fd.get("stock")),
      category: fd.get("category") || null,
    };
    const res = await fetch(product ? `/api/admin/products/${product.id}` : "/api/admin/products", {
      method: product ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) router.push("/admin/products");
    else setLoading(false);
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <input name="name" required defaultValue={product?.name} placeholder="Product name" className="border rounded-lg px-4 py-2" />
      <textarea name="description" defaultValue={product?.description ?? ""} placeholder="Description" rows={3} className="border rounded-lg px-4 py-2 resize-none" />
      <div className="grid grid-cols-2 gap-4">
        <input name="price" type="number" min="0" step="0.01" required defaultValue={product?.price} placeholder="Price ($)" className="border rounded-lg px-4 py-2" />
        <input name="stock" type="number" min="0" required defaultValue={product?.stock ?? 0} placeholder="Stock" className="border rounded-lg px-4 py-2" />
      </div>
      <select name="category" defaultValue={product?.category ?? ""} className="border rounded-lg px-4 py-2">
        <option value="">No category</option>
        <option value="racket">Racket</option>
        <option value="ball">Ball</option>
        <option value="clothing">Clothing</option>
        <option value="accessories">Accessories</option>
      </select>
      <button type="submit" disabled={loading} className="bg-green-600 text-white rounded-lg px-4 py-3 font-semibold hover:bg-green-700 disabled:opacity-50">
        {loading ? "Saving..." : product ? "Save changes" : "Create product"}
      </button>
    </form>
  );
}

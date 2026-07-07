import { upsertProduct } from "@/lib/actions/product.actions";

type Product = { id: string; name: string; description: string | null; price: number; stock: number; category: string | null };

export default function ProductForm({ product }: { product?: Product }) {
  const action = upsertProduct.bind(null, product?.id ?? null);
  return (
    <form action={action} className="flex flex-col gap-4">
      <input name="name" required defaultValue={product?.name} placeholder="Product name"
        className="border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
      <textarea name="description" defaultValue={product?.description ?? ""} placeholder="Description" rows={3}
        className="border rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500" />
      <div className="grid grid-cols-2 gap-4">
        <input name="price" type="number" min="0" step="0.01" required defaultValue={product?.price}
          placeholder="Price ($)" className="border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
        <input name="stock" type="number" min="0" required defaultValue={product?.stock ?? 0}
          placeholder="Stock" className="border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
      </div>
      <select name="category" defaultValue={product?.category ?? ""}
        className="border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
        <option value="">No category</option>
        <option value="racket">Racket</option>
        <option value="ball">Ball</option>
        <option value="clothing">Clothing</option>
        <option value="accessories">Accessories</option>
      </select>
      <button type="submit"
        className="bg-green-600 text-white rounded-xl px-4 py-3 font-semibold hover:bg-green-700 transition-colors">
        {product ? "Save changes" : "Create product"}
      </button>
    </form>
  );
}

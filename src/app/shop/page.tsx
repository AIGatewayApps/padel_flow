import { db } from "@/lib/db";
import Image from "next/image";
import AddToCartButton from "./add-to-cart-button";
import CartCheckout from "./cart-checkout";

export const metadata = { title: "Shop" };

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const products = await db.product.findMany({
    where: { active: true, ...(category ? { category } : {}) },
    orderBy: { createdAt: "desc" },
  });

  const categories = ["racket", "ball", "clothing", "accessories"];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Shop</h1>
        <CartCheckout />
      </div>
      <div className="flex gap-2 mb-6 flex-wrap">
        <a href="/shop" className={`px-4 py-1.5 rounded-full text-sm border ${!category ? "bg-green-600 text-white border-green-600" : "hover:bg-gray-50"}`}>All</a>
        {categories.map(c => (
          <a key={c} href={`/shop?category=${c}`} className={`px-4 py-1.5 rounded-full text-sm border capitalize ${category === c ? "bg-green-600 text-white border-green-600" : "hover:bg-gray-50"}`}>{c}</a>
        ))}
      </div>
      {products.length === 0 && <p className="text-gray-500">No products available yet.</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map(p => (
          <div key={p.id} className="bg-white dark:bg-gray-900 border rounded-xl overflow-hidden flex flex-col">
            {p.imageUrl && <Image src={p.imageUrl} alt={p.name} width={300} height={200} className="w-full h-40 object-cover" />}
            <div className="p-4 flex flex-col gap-2 flex-1">
              <h2 className="font-semibold">{p.name}</h2>
              {p.description && <p className="text-sm text-gray-500 flex-1">{p.description}</p>}
              <div className="flex items-center justify-between mt-2">
                <span className="text-green-600 font-bold">${p.price}</span>
                <span className="text-xs text-gray-400">{p.stock > 0 ? `${p.stock} left` : "Out of stock"}</span>
              </div>
              <AddToCartButton productId={p.id} name={p.name} price={p.price} inStock={p.stock > 0} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

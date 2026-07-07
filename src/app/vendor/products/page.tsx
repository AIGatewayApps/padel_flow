import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getVendorProducts } from '@/lib/actions/vendor.actions'

export default async function VendorProductsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const products = await getVendorProducts(userId)

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-6">Products</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product) => (
          <div key={product.id} className="border rounded-xl p-4 bg-white shadow-sm">
            <h2 className="font-semibold">{product.name}</h2>
            <p className="text-sm text-gray-500">{product.category ?? 'Uncategorized'}</p>
            <p className="mt-2 font-bold">${product.price.toFixed(2)}</p>
            <p className="text-xs text-gray-400">Stock: {product.stock}</p>
          </div>
        ))}
        {products.length === 0 && (
          <p className="col-span-full text-center text-gray-400 py-12">No products yet.</p>
        )}
      </div>
    </main>
  )
}

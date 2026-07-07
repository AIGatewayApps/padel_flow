import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getVendorProfile } from '@/lib/actions/vendor.actions'
import Link from 'next/link'

export default async function VendorPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const vendor = await getVendorProfile(userId)
  if (!vendor) redirect('/vendor/onboarding')

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-2">{vendor.storeName}</h1>
      <p className="text-gray-500 mb-6">{vendor.description ?? 'No description yet.'}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/vendor/products" className="border rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
          <h2 className="font-semibold">Products</h2>
          <p className="text-sm text-gray-400">Manage your inventory</p>
        </Link>
        <Link href="/ads" className="border rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
          <h2 className="font-semibold">Ads</h2>
          <p className="text-sm text-gray-400">View your campaigns</p>
        </Link>
      </div>
    </main>
  )
}

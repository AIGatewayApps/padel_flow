import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getAds } from '@/lib/actions/ads.actions'
import { requireRole } from '@/lib/permissions'

export default async function AdminAdsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')
  await requireRole(userId, 'SUPER_ADMIN')

  const ads = await getAds()

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-6">Ad Management</h1>
      <div className="grid gap-4">
        {ads.map((ad) => (
          <div key={ad.id} className="border rounded-lg p-4 bg-white shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold">{ad.title}</h2>
                <p className="text-sm text-gray-500">{ad.vendor.storeName} · {ad.status}</p>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                ad.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                ad.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-700' :
                'bg-gray-100 text-gray-600'
              }`}>{ad.status}</span>
            </div>
            <div className="mt-2 text-sm text-gray-400">
              Impressions: {ad.impressions.length}
            </div>
          </div>
        ))}
        {ads.length === 0 && (
          <p className="text-gray-400 text-center py-12">No ads yet.</p>
        )}
      </div>
    </main>
  )
}

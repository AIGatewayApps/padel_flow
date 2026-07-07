import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getAds } from '@/lib/actions/ads.actions'
import AdBanner from '@/components/ad-banner'

export default async function AdsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const ads = await getAds({ status: 'ACTIVE' })

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-6">Sponsored</h1>
      <div className="grid gap-6">
        {ads.map((ad) => (
          <AdBanner key={ad.id} ad={ad} />
        ))}
        {ads.length === 0 && (
          <p className="text-gray-400 text-center py-12">No active ads.</p>
        )}
      </div>
    </main>
  )
}

'use client'

import { useEffect } from 'react'

interface Ad {
  id: string
  title: string
  imageUrl: string | null
  linkUrl: string | null
  vendor: { storeName: string }
}

export default function AdBanner({ ad }: { ad: Ad }) {
  useEffect(() => {
    fetch('/api/ads/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adId: ad.id, clicked: false }),
    }).catch(() => {})
  }, [ad.id])

  const handleClick = async () => {
    await fetch('/api/ads/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adId: ad.id, clicked: true }),
    }).catch(() => {})
    if (ad.linkUrl) window.open(ad.linkUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div
      onClick={handleClick}
      className="relative rounded-xl overflow-hidden border bg-white shadow-sm cursor-pointer hover:shadow-md transition-shadow"
    >
      {ad.imageUrl && (
        <img src={ad.imageUrl} alt={ad.title} className="w-full h-40 object-cover" />
      )}
      <div className="p-3">
        <p className="font-semibold">{ad.title}</p>
        <p className="text-xs text-gray-400">{ad.vendor.storeName}</p>
      </div>
      <span className="absolute top-2 right-2 text-xs bg-black/40 text-white rounded px-1.5 py-0.5">Ad</span>
    </div>
  )
}

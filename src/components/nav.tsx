'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'

const links = [
  { href: '/dashboard', label: 'Home' },
  { href: '/events', label: 'Events' },
  { href: '/coaches', label: 'Coaches' },
  { href: '/messages', label: 'Messages' },
  { href: '/notifications', label: 'Notifications' },
  { href: '/org', label: 'Orgs' },
  { href: '/vendor', label: 'Vendor' },
]

export default function Nav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t flex items-center justify-around px-2 py-2 sm:relative sm:border-t-0 sm:border-r sm:flex-col sm:justify-start sm:w-56 sm:min-h-screen sm:p-4 sm:gap-1 z-50">
      {links.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={`flex flex-col items-center text-xs sm:flex-row sm:gap-2 sm:text-sm sm:w-full sm:px-3 sm:py-2 sm:rounded-lg transition-colors ${
            pathname.startsWith(href)
              ? 'text-teal-600 font-semibold sm:bg-teal-50'
              : 'text-gray-500 hover:text-gray-800 sm:hover:bg-gray-100'
          }`}
        >
          {label}
        </Link>
      ))}
      <div className="sm:mt-auto">
        <UserButton afterSignOutUrl="/" />
      </div>
    </nav>
  )
}

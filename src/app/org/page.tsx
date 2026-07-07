import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getUserOrgs } from '@/lib/actions/org.actions'
import Link from 'next/link'

export default async function OrgPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const orgs = await getUserOrgs(userId)

  return (
    <main className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Organisations</h1>
      </div>
      <div className="grid gap-4">
        {orgs.map((org) => (
          <Link
            key={org.id}
            href={`/org/${org.id}/dashboard`}
            className="block border rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition-shadow"
          >
            <h2 className="font-semibold">{org.name}</h2>
            <p className="text-sm text-gray-400">@{org.slug}</p>
          </Link>
        ))}
        {orgs.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg mb-2">No organisations yet</p>
            <p className="text-sm">Create or join an organisation to get started.</p>
          </div>
        )}
      </div>
    </main>
  )
}

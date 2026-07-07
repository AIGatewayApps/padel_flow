import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getOrgById } from '@/lib/actions/org.actions'
import { requireOrgRole } from '@/lib/permissions'

interface Props {
  params: { orgId: string }
}

export default async function OrgDashboardPage({ params }: Props) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const org = await getOrgById(params.orgId)
  if (!org) redirect('/org')

  await requireOrgRole(userId, params.orgId, ['ORG_ADMIN', 'SUPER_ADMIN'])

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-2">{org.name} — Dashboard</h1>
      <p className="text-gray-500 mb-6">Manage your organisation</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="border rounded-xl p-4 bg-white shadow-sm">
          <p className="text-sm text-gray-400">Members</p>
          <p className="text-3xl font-bold">{org._count?.members ?? 0}</p>
        </div>
        <div className="border rounded-xl p-4 bg-white shadow-sm">
          <p className="text-sm text-gray-400">Courts</p>
          <p className="text-3xl font-bold">{org._count?.courts ?? 0}</p>
        </div>
        <div className="border rounded-xl p-4 bg-white shadow-sm">
          <p className="text-sm text-gray-400">Events</p>
          <p className="text-3xl font-bold">{org._count?.events ?? 0}</p>
        </div>
      </div>
    </main>
  )
}

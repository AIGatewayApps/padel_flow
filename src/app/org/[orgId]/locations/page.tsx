import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getOrgCourts } from '@/lib/actions/org.actions'
import { requireOrgRole } from '@/lib/permissions'

interface Props {
  params: { orgId: string }
}

export default async function OrgLocationsPage({ params }: Props) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')
  await requireOrgRole(userId, params.orgId, ['ORG_ADMIN', 'SUPER_ADMIN'])

  const courts = await getOrgCourts(params.orgId)

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-6">Locations & Courts</h1>
      <div className="grid gap-4">
        {courts.map((court) => (
          <div key={court.id} className="border rounded-xl p-4 bg-white shadow-sm flex justify-between items-center">
            <div>
              <h2 className="font-semibold">{court.name}</h2>
              <p className="text-sm text-gray-500">{court.isIndoor ? 'Indoor' : 'Outdoor'} · ${court.pricePerHour}/hr</p>
            </div>
          </div>
        ))}
        {courts.length === 0 && (
          <p className="text-center text-gray-400 py-12">No courts added yet.</p>
        )}
      </div>
    </main>
  )
}

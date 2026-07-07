import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getOrgRevenue } from '@/lib/actions/org.actions'
import { requireOrgRole } from '@/lib/permissions'

interface Props {
  params: { orgId: string }
}

export default async function OrgRevenuePage({ params }: Props) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')
  await requireOrgRole(userId, params.orgId, ['ORG_ADMIN', 'SUPER_ADMIN'])

  const revenue = await getOrgRevenue(params.orgId)

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-6">Revenue</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="border rounded-xl p-4 bg-white shadow-sm">
          <p className="text-sm text-gray-400">Total Revenue</p>
          <p className="text-3xl font-bold">${revenue.total.toFixed(2)}</p>
        </div>
        <div className="border rounded-xl p-4 bg-white shadow-sm">
          <p className="text-sm text-gray-400">This Month</p>
          <p className="text-3xl font-bold">${revenue.thisMonth.toFixed(2)}</p>
        </div>
        <div className="border rounded-xl p-4 bg-white shadow-sm">
          <p className="text-sm text-gray-400">Bookings</p>
          <p className="text-3xl font-bold">{revenue.bookingCount}</p>
        </div>
      </div>
    </main>
  )
}

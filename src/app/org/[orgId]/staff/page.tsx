import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getOrgMembers } from '@/lib/actions/org.actions'
import { requireOrgRole } from '@/lib/permissions'

interface Props {
  params: { orgId: string }
}

export default async function OrgStaffPage({ params }: Props) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')
  await requireOrgRole(userId, params.orgId, ['ORG_ADMIN', 'SUPER_ADMIN'])

  const members = await getOrgMembers(params.orgId)

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-6">Staff & Members</h1>
      <div className="grid gap-3">
        {members.map((member) => (
          <div key={member.id} className="flex items-center justify-between border rounded-xl p-4 bg-white shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-500">
                {member.user.name?.[0] ?? '?'}
              </div>
              <div>
                <p className="font-medium">{member.user.name ?? 'Unnamed'}</p>
                <p className="text-sm text-gray-400">{member.user.email}</p>
              </div>
            </div>
            <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">{member.role}</span>
          </div>
        ))}
        {members.length === 0 && (
          <p className="text-center text-gray-400 py-12">No members yet.</p>
        )}
      </div>
    </main>
  )
}

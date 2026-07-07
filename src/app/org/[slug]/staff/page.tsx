import { redirect, notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { canUserInOrg } from "@/lib/permissions";
import StaffManager from "./staff-manager";

type Props = { params: { slug: string } };

export const metadata = { title: "Staff Management" };

export default async function StaffPage({ params }: Props) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const org = await db.organization.findUnique({
    where: { slug: params.slug, deletedAt: null },
    include: {
      members: {
        include: { user: { select: { id: true, displayName: true, email: true, avatarUrl: true } } },
        orderBy: { invitedAt: "asc" },
      },
      locations: { select: { id: true, name: true } },
    },
  });
  if (!org) notFound();

  const canManage = await canUserInOrg(org.id, "staff.manage");
  if (!canManage) redirect(`/org/${params.slug}`);

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Staff</h1>
      <p className="text-gray-500 text-sm mb-8">{org.members.length} team members</p>
      <StaffManager org={org} currentUserId={userId} />
    </main>
  );
}

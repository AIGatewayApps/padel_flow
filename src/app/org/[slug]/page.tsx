import { redirect, notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { canUserInOrg } from "@/lib/permissions";
import Link from "next/link";
import type { Metadata } from "next";

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const org = await db.organization.findUnique({ where: { slug: params.slug }, select: { name: true } });
  return { title: org?.name ?? "Organization" };
}

export default async function OrgDashboard({ params }: Props) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const org = await db.organization.findUnique({
    where: { slug: params.slug, deletedAt: null },
    include: {
      members: { include: { user: { select: { displayName: true, avatarUrl: true, email: true } } } },
      locations: { where: { active: true } },
      _count: { select: { members: true, locations: true } },
    },
  });
  if (!org) notFound();

  const canViewReports = await canUserInOrg(org.id, "reports.view");
  const canManageStaff = await canUserInOrg(org.id, "staff.manage");
  const canManageCourts = await canUserInOrg(org.id, "courts.manage");
  const canManageAds = await canUserInOrg(org.id, "ads.manage");

  const cards = [
    { href: `/org/${params.slug}/locations`, label: "Locations", icon: "📍", count: org._count.locations, show: canManageCourts },
    { href: `/org/${params.slug}/staff`, label: "Staff", icon: "👥", count: org._count.members, show: canManageStaff },
    { href: `/org/${params.slug}/courts`, label: "Courts", icon: "🎾", show: canManageCourts },
    { href: `/org/${params.slug}/bookings`, label: "Bookings", icon: "📅", show: canViewReports },
    { href: `/org/${params.slug}/revenue`, label: "Revenue", icon: "💰", show: canViewReports },
    { href: `/org/${params.slug}/ads`, label: "Ads Manager", icon: "📢", show: canManageAds },
    { href: `/org/${params.slug}/settings`, label: "Settings", icon: "⚙️", show: org.ownerId === userId },
  ].filter(c => c.show);

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        {org.logoUrl && <img src={org.logoUrl} alt={org.name} className="w-14 h-14 rounded-2xl object-cover" />}
        <div>
          <h1 className="text-2xl font-bold">{org.name}</h1>
          <p className="text-sm text-gray-500 capitalize">{org.plan} plan · {org._count.members} members</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {cards.map(card => (
          <Link key={card.href} href={card.href}
            className="border rounded-2xl p-5 hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors flex flex-col gap-2">
            <span className="text-2xl">{card.icon}</span>
            <p className="font-semibold">{card.label}</p>
            {card.count !== undefined && <p className="text-xs text-gray-400">{card.count} total</p>}
          </Link>
        ))}
      </div>
    </main>
  );
}

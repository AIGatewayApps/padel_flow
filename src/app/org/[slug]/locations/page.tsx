import { redirect, notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { canUserInOrg } from "@/lib/permissions";
import LocationManager from "./location-manager";

type Props = { params: { slug: string } };
export const metadata = { title: "Locations" };

export default async function LocationsPage({ params }: Props) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const org = await db.organization.findUnique({
    where: { slug: params.slug, deletedAt: null },
    include: { locations: { orderBy: { createdAt: "asc" } } },
  });
  if (!org) notFound();

  const canManage = await canUserInOrg(org.id, "courts.manage");
  if (!canManage) redirect(`/org/${params.slug}`);

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Locations</h1>
      <p className="text-sm text-gray-500 mb-8">{org.locations.length} locations</p>
      <LocationManager orgId={org.id} orgSlug={params.slug} locations={org.locations} />
    </main>
  );
}

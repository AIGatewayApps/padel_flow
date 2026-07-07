import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireOrgRole } from "@/lib/permissions";
import { notFound } from "next/navigation";
import CourtForm from "../court-form";
import SlotManager from "./slot-manager";

export const metadata = { title: "Edit Court" };

export default async function EditCourtPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const membership = await db.orgMember.findFirst({
    where: { user: { clerkId: userId }, role: "ORG_ADMIN" },
    select: { orgId: true },
  });
  if (!membership) redirect("/dashboard");

  await requireOrgRole(userId, membership.orgId, ["ORG_ADMIN"]);

  const { id } = await params;
  const court = await db.court.findUnique({
    where: { id },
    include: { slots: { where: { startsAt: { gte: new Date() } }, orderBy: { startsAt: "asc" }, take: 20 } },
  });
  if (!court || court.orgId !== membership.orgId) notFound();

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-8">
      <h1 className="text-2xl font-bold">Edit court</h1>
      <CourtForm orgId={membership.orgId} court={court} />
      <SlotManager courtId={court.id} slots={court.slots} />
    </div>
  );
}

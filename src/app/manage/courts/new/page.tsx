import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireOrgRole } from "@/lib/permissions";
import CourtForm from "../court-form";

export const metadata = { title: "Add Court" };

export default async function NewCourtPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const membership = await db.orgMember.findFirst({
    where: { user: { clerkId: userId }, role: "ORG_ADMIN" },
    select: { orgId: true },
  });
  if (!membership) redirect("/dashboard");

  await requireOrgRole(userId, membership.orgId, ["ORG_ADMIN"]);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Add a court</h1>
      <CourtForm orgId={membership.orgId} />
    </div>
  );
}

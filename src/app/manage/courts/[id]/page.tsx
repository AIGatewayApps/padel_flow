import { requireRole, getDbUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import CourtForm from "../court-form";
import SlotManager from "./slot-manager";

export const metadata = { title: "Edit Court" };

export default async function EditCourtPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("COURT_MANAGER", "ADMIN");
  const { id } = await params;
  const me = await getDbUser();
  const court = await db.court.findUnique({
    where: { id },
    include: { slots: { where: { startsAt: { gte: new Date() } }, orderBy: { startsAt: "asc" }, take: 20 } },
  });
  if (!court) notFound();
  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-8">
      <h1 className="text-2xl font-bold">Edit court</h1>
      <CourtForm court={court} />
      <SlotManager courtId={court.id} slots={court.slots} />
    </div>
  );
}

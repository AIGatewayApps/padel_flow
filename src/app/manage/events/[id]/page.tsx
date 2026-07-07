import { requireRole, getDbUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import EventForm from "../event-form";

export const metadata = { title: "Edit Event" };

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("EVENT_MANAGER", "ADMIN");
  const { id } = await params;
  const event = await db.event.findUnique({ where: { id } });
  if (!event) notFound();
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Edit event</h1>
      <EventForm event={event} />
    </div>
  );
}

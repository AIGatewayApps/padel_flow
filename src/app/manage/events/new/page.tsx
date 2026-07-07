import { requireRole } from "@/lib/auth";
import EventForm from "../event-form";

export const metadata = { title: "Create Event" };

export default async function NewEventPage() {
  await requireRole("EVENT_MANAGER", "ADMIN");
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Create an event</h1>
      <EventForm />
    </div>
  );
}

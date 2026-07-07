import { requireRole } from "@/lib/auth";
import CourtForm from "../court-form";

export const metadata = { title: "Add Court" };

export default async function NewCourtPage() {
  await requireRole("COURT_MANAGER", "ADMIN");
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Add a court</h1>
      <CourtForm />
    </div>
  );
}

import { upsertCourt } from "@/lib/actions/court.actions";

type Court = { id: string; name: string; description: string | null; address: string; city: string; country: string; pricePerHour: number; surface: string | null; indoor: boolean };

export default function CourtForm({ court }: { court?: Court }) {
  const action = upsertCourt.bind(null, court?.id ?? null);
  return (
    <form action={action} className="flex flex-col gap-4">
      <input name="name" required defaultValue={court?.name} placeholder="Court name"
        className="border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
      <textarea name="description" defaultValue={court?.description ?? ""} placeholder="Description (optional)" rows={3}
        className="border rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500" />
      <input name="address" required defaultValue={court?.address} placeholder="Address"
        className="border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <input name="city" required defaultValue={court?.city} placeholder="City"
          className="border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
        <input name="country" required defaultValue={court?.country} placeholder="Country"
          className="border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
      </div>
      <input name="pricePerHour" type="number" min="0" step="0.01" required defaultValue={court?.pricePerHour}
        placeholder="Price per hour ($)"
        className="border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
      <select name="surface" defaultValue={court?.surface ?? ""}
        className="border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
        <option value="">Surface (optional)</option>
        <option value="crystal">Crystal</option>
        <option value="artificial_grass">Artificial grass</option>
        <option value="concrete">Concrete</option>
      </select>
      <label className="flex items-center gap-3 text-sm cursor-pointer">
        <input type="checkbox" name="indoor" defaultChecked={court?.indoor} className="w-4 h-4 accent-green-600" />
        Indoor court
      </label>
      <button type="submit"
        className="bg-green-600 text-white rounded-xl px-4 py-3 font-semibold hover:bg-green-700 transition-colors">
        {court ? "Save changes" : "Create court"}
      </button>
    </form>
  );
}

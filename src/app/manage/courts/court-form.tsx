"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Court = { id: string; name: string; description: string | null; address: string; city: string; country: string; pricePerHour: number; surface: string | null; indoor: boolean; active: boolean };

export default function CourtForm({ court }: { court?: Court }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: fd.get("name"), description: fd.get("description"), address: fd.get("address"),
      city: fd.get("city"), country: fd.get("country"), pricePerHour: Number(fd.get("pricePerHour")),
      surface: fd.get("surface"), indoor: fd.has("indoor"),
    };
    const res = await fetch(court ? `/api/manage/courts/${court.id}` : "/api/manage/courts", {
      method: court ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) router.push("/manage/courts");
    else setLoading(false);
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <input name="name" required defaultValue={court?.name} placeholder="Court name" className="border rounded-lg px-4 py-2" />
      <textarea name="description" defaultValue={court?.description ?? ""} placeholder="Description" rows={3} className="border rounded-lg px-4 py-2 resize-none" />
      <input name="address" required defaultValue={court?.address} placeholder="Address" className="border rounded-lg px-4 py-2" />
      <div className="grid grid-cols-2 gap-4">
        <input name="city" required defaultValue={court?.city} placeholder="City" className="border rounded-lg px-4 py-2" />
        <input name="country" required defaultValue={court?.country} placeholder="Country" className="border rounded-lg px-4 py-2" />
      </div>
      <input name="pricePerHour" type="number" min="0" step="0.01" required defaultValue={court?.pricePerHour} placeholder="Price per hour ($)" className="border rounded-lg px-4 py-2" />
      <select name="surface" defaultValue={court?.surface ?? ""} className="border rounded-lg px-4 py-2">
        <option value="">Surface (optional)</option>
        <option value="crystal">Crystal</option>
        <option value="artificial_grass">Artificial grass</option>
        <option value="concrete">Concrete</option>
      </select>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="indoor" defaultChecked={court?.indoor} className="w-4 h-4" /> Indoor court
      </label>
      <button type="submit" disabled={loading} className="bg-green-600 text-white rounded-lg px-4 py-3 font-semibold hover:bg-green-700 disabled:opacity-50">
        {loading ? "Saving..." : court ? "Save changes" : "Create court"}
      </button>
    </form>
  );
}

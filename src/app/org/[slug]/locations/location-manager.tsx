"use client";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createLocation, toggleLocation } from "./location.actions";

type OrgLocation = {
  id: string; name: string; address: string; city: string; country: string;
  lat: number | null; lng: number | null; active: boolean;
};

export default function LocationManager({
  orgId, orgSlug, locations,
}: {
  orgId: string; orgSlug: string; locations: OrgLocation[];
}) {
  const [adding, setAdding] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("orgId", orgId);
    startTransition(async () => {
      await createLocation(fd);
      toast.success("Location created");
      setAdding(false);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <button onClick={() => setAdding(!adding)}
        className="self-start bg-green-600 text-white rounded-xl px-5 py-2 text-sm font-medium hover:bg-green-700">
        + Add location
      </button>

      {adding && (
        <form onSubmit={handleCreate} className="border rounded-2xl p-5 flex flex-col gap-3">
          <h3 className="font-semibold">New location</h3>
          <input name="name" placeholder="Location name" required className="border rounded-xl px-4 py-2 text-sm" />
          <input name="address" placeholder="Address" required className="border rounded-xl px-4 py-2 text-sm" />
          <div className="grid grid-cols-2 gap-3">
            <input name="city" placeholder="City" required className="border rounded-xl px-4 py-2 text-sm" />
            <input name="country" placeholder="Country" required className="border rounded-xl px-4 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input name="lat" placeholder="Latitude (optional)" type="number" step="any" className="border rounded-xl px-4 py-2 text-sm" />
            <input name="lng" placeholder="Longitude (optional)" type="number" step="any" className="border rounded-xl px-4 py-2 text-sm" />
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={isPending}
              className="bg-green-600 text-white rounded-xl px-5 py-2 text-sm font-medium hover:bg-green-700 disabled:opacity-50">
              Save
            </button>
            <button type="button" onClick={() => setAdding(false)}
              className="border rounded-xl px-5 py-2 text-sm">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="flex flex-col gap-3">
        {locations.map(loc => (
          <div key={loc.id} className="border rounded-2xl p-4 flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold">{loc.name}</p>
              <p className="text-sm text-gray-500">{loc.address}, {loc.city}, {loc.country}</p>
              {loc.lat && loc.lng && (
                <p className="text-xs text-gray-400">📍 {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}</p>
              )}
            </div>
            <button onClick={() => {
              const fd = new FormData();
              fd.set("locationId", loc.id);
              fd.set("active", String(!loc.active));
              startTransition(async () => {
                await toggleLocation(fd);
                toast.success(loc.active ? "Location deactivated" : "Location activated");
              });
            }}
              className={`text-xs px-3 py-1 rounded-lg border ${
                loc.active ? "border-green-300 text-green-600" : "border-gray-300 text-gray-400"
              }`}>
              {loc.active ? "Active" : "Inactive"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

import { db } from "@/lib/db";
import Link from "next/link";
import Image from "next/image";

export const metadata = { title: "Courts" };

export default async function CourtsPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string; indoor?: string }>;
}) {
  const params = await searchParams;
  const courts = await db.court.findMany({
    where: {
      active: true,
      ...(params.city && { city: { contains: params.city, mode: "insensitive" } }),
      ...(params.indoor !== undefined && { indoor: params.indoor === "true" }),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <main className="max-w-5xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Find a court</h1>
      <form className="flex gap-3 mb-8">
        <input name="city" defaultValue={params.city} placeholder="Filter by city"
          className="border rounded-lg px-4 py-2 flex-1" />
        <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">Search</button>
      </form>
      {courts.length === 0 && <p className="text-gray-500">No courts found.</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {courts.map(court => (
          <Link key={court.id} href={`/courts/${court.id}`}
            className="border rounded-xl overflow-hidden hover:shadow-md transition">
            {court.imageUrl && (
              <Image src={court.imageUrl} alt={court.name} width={400} height={200} className="w-full h-40 object-cover" />
            )}
            <div className="p-4">
              <h2 className="font-semibold text-lg">{court.name}</h2>
              <p className="text-gray-500 text-sm">{court.city}, {court.country}</p>
              <p className="text-green-600 font-medium mt-2">${court.pricePerHour}/hr</p>
              {court.indoor && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded mt-1 inline-block">Indoor</span>}
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}

"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ProductActions({ productId, active }: { productId: string; active: boolean }) {
  const router = useRouter();
  async function toggle() {
    await fetch(`/api/admin/products/${productId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: !active }) });
    router.refresh();
  }
  return (
    <div className="flex gap-3 items-center">
      <Link href={`/admin/products/${productId}`} className="text-sm text-green-600 hover:underline">Edit</Link>
      <button onClick={toggle} className={`text-xs px-3 py-1 rounded-lg border ${active ? "hover:bg-red-50 text-red-500" : "hover:bg-green-50 text-green-600"}`}>
        {active ? "Deactivate" : "Activate"}
      </button>
    </div>
  );
}

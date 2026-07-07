"use client";
import Link from "next/link";
import { useTransition } from "react";
import { toggleProductActive } from "@/lib/actions/product.actions";

export default function ProductActions({ productId, active }: { productId: string; active: boolean }) {
  const [isPending, startTransition] = useTransition();
  function toggle() { startTransition(() => toggleProductActive(productId)); }
  return (
    <div className="flex gap-3 items-center">
      <Link href={`/admin/products/${productId}`} className="text-sm text-green-600 hover:underline">Edit</Link>
      <button onClick={toggle} disabled={isPending}
        className={`text-xs px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${
          active ? "hover:bg-red-50 text-red-500" : "hover:bg-green-50 text-green-600"
        }`}>
        {isPending ? "..." : active ? "Deactivate" : "Activate"}
      </button>
    </div>
  );
}

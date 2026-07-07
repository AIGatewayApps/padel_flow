"use client";
import { useRouter } from "next/navigation";
export default function MarkReadButton() {
  const router = useRouter();
  async function mark() {
    await fetch("/api/notifications/read", { method: "POST" });
    router.refresh();
  }
  return <button onClick={mark} className="text-sm text-green-600 hover:underline">Mark all read</button>;
}

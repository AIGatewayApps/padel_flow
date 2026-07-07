import Link from "next/link";
export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="text-5xl">🎾</div>
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p className="text-gray-500">This page doesn't exist or you don't have access.</p>
      <Link href="/dashboard" className="bg-green-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-green-700 transition-colors">Go to dashboard</Link>
    </div>
  );
}

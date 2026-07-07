import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="text-5xl font-bold tracking-tight">PadelFlow</h1>
      <p className="text-xl text-gray-500 max-w-md">
        Connect, compete, book courts, track scores, and grow your padel game.
      </p>
      <div className="flex gap-4">
        <Link href="/sign-up" className="px-6 py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 transition">
          Get started
        </Link>
        <Link href="/courts" className="px-6 py-3 rounded-xl border border-gray-300 font-semibold hover:bg-gray-50 transition">
          Browse courts
        </Link>
      </div>
    </main>
  );
}

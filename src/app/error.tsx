"use client";
import { useEffect } from "react";
export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="text-5xl">🎾</div>
      <h2 className="text-xl font-bold">Something went wrong</h2>
      <p className="text-gray-500 text-sm max-w-sm">{error.message ?? "An unexpected error occurred. Please try again."}</p>
      <button onClick={reset} className="bg-green-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-green-700 transition-colors">Try again</button>
    </div>
  );
}

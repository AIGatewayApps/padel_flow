import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import ScoreForm from "./score-form";

export const metadata = { title: "Scores" };

export default async function ScoresPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const scores = await db.score.findMany({
    where: { userId },
    orderBy: { playedAt: "desc" },
    take: 30,
  });

  return (
    <main className="max-w-3xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">My Scores</h1>
      <ScoreForm />
      <h2 className="text-xl font-semibold mt-10 mb-4">Recent matches</h2>
      {scores.length === 0 && <p className="text-gray-500">No matches recorded yet.</p>}
      <ul className="flex flex-col gap-3">
        {scores.map(s => {
          const sets = s.sets as { player: number; opponent: number }[];
          return (
            <li key={s.id} className="border rounded-xl px-4 py-3 flex items-center justify-between">
              <span className="font-medium">{sets.map(set => `${set.player}–${set.opponent}`).join(" | ")}</span>
              <span className={`text-sm font-semibold ${s.result === "WIN" ? "text-green-600" : s.result === "LOSS" ? "text-red-500" : "text-gray-500"}`}>
                {s.result}
              </span>
              <span className="text-xs text-gray-400">{new Date(s.playedAt).toLocaleDateString()}</span>
            </li>
          );
        })}
      </ul>
    </main>
  );
}

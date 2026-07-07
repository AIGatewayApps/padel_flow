import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import LiveScoreBoard from "./live-score-board";

export const metadata = { title: "Live Score" };

export default async function LiveScorePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const live = await db.liveScore.findUnique({
    where: { id },
    include: { player1: { select: { id: true, displayName: true, avatarUrl: true } } },
  });
  if (!live) notFound();

  const isOwner = live.player1Id === userId;

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-0">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Live Score</h1>
        {live.isLive && <span className="flex items-center gap-1.5 text-xs font-semibold text-red-500 bg-red-50 px-3 py-1 rounded-full">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" /> LIVE
        </span>}
      </div>
      <LiveScoreBoard
        liveScoreId={id}
        initialSets={(live.sets as { p1: number; p2: number }[]) ?? []}
        player1Name={live.player1.displayName}
        isOwner={isOwner}
        isLive={live.isLive}
      />
    </div>
  );
}

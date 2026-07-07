"use client";
import { useState, useEffect, useTransition } from "react";
import { updateLiveScore, endLiveScore } from "@/lib/actions/live-score.actions";
import { getSupabaseClient } from "@/lib/supabase-realtime";

type Set = { p1: number; p2: number };

export default function LiveScoreBoard({
  liveScoreId, initialSets, player1Name, isOwner, isLive
}: { liveScoreId: string; initialSets: Set[]; player1Name: string; isOwner: boolean; isLive: boolean }) {
  const [sets, setSets] = useState<Set[]>(initialSets.length > 0 ? initialSets : [{ p1: 0, p2: 0 }]);
  const [isPending, startTransition] = useTransition();

  // Real-time sync for spectators
  useEffect(() => {
    const supabase = getSupabaseClient();
    const ch = supabase.channel(`live:${liveScoreId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "LiveScore", filter: `id=eq.${liveScoreId}` },
        (payload) => { if (payload.new.sets) setSets(payload.new.sets as Set[]); })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [liveScoreId]);

  function adjust(setIdx: number, player: "p1" | "p2", delta: number) {
    const updated = sets.map((s, i) => i === setIdx ? { ...s, [player]: Math.max(0, s[player] + delta) } : s);
    setSets(updated);
    startTransition(() => updateLiveScore(liveScoreId, updated));
  }

  function addSet() {
    const updated = [...sets, { p1: 0, p2: 0 }];
    setSets(updated);
    startTransition(() => updateLiveScore(liveScoreId, updated));
  }

  return (
    <div className="flex flex-col gap-6">
      {sets.map((set, i) => (
        <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Set {i + 1}</p>
          <div className="flex items-center justify-between gap-4">
            {/* Player 1 */}
            <div className="flex flex-col items-center gap-2 flex-1">
              <p className="text-sm font-medium truncate max-w-[100px]">{player1Name}</p>
              <p className="text-5xl font-bold text-green-600">{set.p1}</p>
              {isOwner && isLive && (
                <div className="flex gap-2">
                  <button onClick={() => adjust(i, "p1", 1)} className="w-8 h-8 bg-green-600 text-white rounded-full text-lg font-bold hover:bg-green-700">+</button>
                  <button onClick={() => adjust(i, "p1", -1)} className="w-8 h-8 bg-gray-200 rounded-full text-lg font-bold hover:bg-gray-300">-</button>
                </div>
              )}
            </div>
            <span className="text-2xl font-bold text-gray-300">vs</span>
            {/* Opponent */}
            <div className="flex flex-col items-center gap-2 flex-1">
              <p className="text-sm font-medium">Opponent</p>
              <p className="text-5xl font-bold text-gray-700 dark:text-gray-200">{set.p2}</p>
              {isOwner && isLive && (
                <div className="flex gap-2">
                  <button onClick={() => adjust(i, "p2", 1)} className="w-8 h-8 bg-gray-700 text-white rounded-full text-lg font-bold hover:bg-gray-800">+</button>
                  <button onClick={() => adjust(i, "p2", -1)} className="w-8 h-8 bg-gray-200 rounded-full text-lg font-bold hover:bg-gray-300">-</button>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {isOwner && isLive && (
        <div className="flex gap-3">
          {sets.length < 5 && (
            <button onClick={addSet} className="flex-1 border rounded-xl py-3 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800">
              + Add set
            </button>
          )}
          <button onClick={() => startTransition(() => endLiveScore(liveScoreId))}
            className="flex-1 bg-red-500 text-white rounded-xl py-3 text-sm font-semibold hover:bg-red-600">
            End match
          </button>
        </div>
      )}

      {!isLive && (
        <div className="text-center text-gray-400 text-sm py-4">Match ended</div>
      )}
    </div>
  );
}

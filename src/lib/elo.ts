/** Standard Elo rating system. K=32 for new players (<30 games), K=16 for established. */
export function calcElo(
  playerRating: number,
  opponentRating: number,
  result: "WIN" | "LOSS" | "DRAW",
  gamesPlayed: number
): number {
  const K = gamesPlayed < 30 ? 32 : 16;
  const expected = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
  const score = result === "WIN" ? 1 : result === "LOSS" ? 0 : 0.5;
  // Floor at 100 to prevent negative ratings
  return Math.max(100, Math.round(playerRating + K * (score - expected)));
}

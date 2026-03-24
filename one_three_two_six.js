/**
 * 1-3-2-6 Money Management Strategy
 * Positive progression: fixed 4-step sequence on consecutive wins.
 * Sequence: bet 1 → 3 → 2 → 6 units on 4 consecutive wins, then reset.
 *
 * @param {number} winStreak - Number of consecutive recent Banker wins (0–4+)
 * @param {number} baseUnit  - Base bet amount in dollars
 * @returns {{ betAmount: number, stage: number, nextStagePreview: string, cycleFull: boolean }}
 */
export function getOneThreeTwoSixBet(winStreak, baseUnit) {
  // The 4-step multiplier sequence
  const stages = [1, 3, 2, 6];

  // After 4 wins the cycle is complete — reset to stage 0
  const stage = winStreak >= 4 ? 0 : winStreak;
  const cycleFull = winStreak >= 4;

  const betAmount = baseUnit * stages[stage];

  // Preview next stage
  let nextStagePreview;
  if (cycleFull) {
    nextStagePreview = `4-win cycle complete! Resetting to $${baseUnit} (1 unit).`;
  } else if (stage === 3) {
    nextStagePreview = `If you win: cycle complete, reset to $${baseUnit}. If you lose: reset to $${baseUnit}.`;
  } else {
    const nextBet = baseUnit * stages[stage + 1];
    nextStagePreview = `If you win: next bet = $${nextBet} (${stages[stage + 1]} units). If you lose: reset to $${baseUnit}.`;
  }

  return {
    betAmount,
    stage,
    nextStagePreview,
    cycleFull,
  };
}

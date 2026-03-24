/**
 * Paroli Money Management Strategy
 * Positive progression: double bet after each win, reset after 3 wins or any loss.
 *
 * @param {number} winStreak - Number of consecutive recent Banker wins
 * @param {number} baseUnit  - Base bet amount in dollars
 * @returns {{ betAmount: number, stage: number, nextStagePreview: string, cycleComplete: boolean }}
 */
export function getParoliBet(winStreak, baseUnit) {
  // Clamp winStreak: Paroli resets after 3 consecutive wins
  const stage = Math.min(winStreak, 3);

  // Bet doubles each win: stage 0 → 1×, stage 1 → 2×, stage 2 → 4×
  // After 3 wins cycle completes, reset to 1×
  const multipliers = [1, 2, 4, 1]; // stage 3 resets to 1 unit
  const betAmount = baseUnit * multipliers[stage];

  const cycleComplete = winStreak >= 3;

  // Preview what the next stage looks like
  let nextStagePreview;
  if (cycleComplete) {
    nextStagePreview = `Cycle complete! Next bet resets to $${baseUnit} (1 unit).`;
  } else {
    const nextMultiplier = multipliers[Math.min(stage + 1, 3)];
    nextStagePreview = `If you win: next bet = $${baseUnit * nextMultiplier} (${nextMultiplier} unit${nextMultiplier > 1 ? "s" : ""}).`;
  }

  return {
    betAmount,
    stage,
    nextStagePreview,
    cycleComplete,
  };
}

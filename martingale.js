/**
 * Martingale Money Management Strategy
 * Negative progression: double bet after every loss, reset to baseUnit after any win.
 * Safety cap: maximum 5 doublings (bet = baseUnit × 32).
 *
 * @param {number} lossStreak - Number of consecutive recent losses
 * @param {number} baseUnit   - Base bet amount in dollars
 * @returns {{ betAmount: number, stage: number, nextStagePreview: string, cappedOut: boolean }}
 */
export function getMartingaleBet(lossStreak, baseUnit) {
  // Maximum doubling level is 5 (bet = baseUnit × 32)
  const MAX_STAGE = 5;
  const stage = Math.min(lossStreak, MAX_STAGE);
  const cappedOut = lossStreak >= MAX_STAGE;

  // Bet = baseUnit × 2^stage
  const betAmount = baseUnit * Math.pow(2, stage);

  // Preview next stage
  let nextStagePreview;
  if (cappedOut) {
    nextStagePreview = `Maximum reached ($${betAmount}). If you lose again, stay at $${betAmount}.`;
  } else {
    const nextBet = baseUnit * Math.pow(2, stage + 1);
    nextStagePreview = `If you lose: next bet = $${nextBet}. If you win: reset to $${baseUnit}.`;
  }

  return {
    betAmount,
    stage,
    nextStagePreview,
    cappedOut,
  };
}

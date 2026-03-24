/**
 * D'Alembert Money Management Strategy
 * Gradual negative progression: add 1 unit after a loss, subtract 1 unit after a win.
 * Minimum bet is always 1 unit (baseUnit).
 *
 * @param {number} netLosses - Net number of losses minus wins in recent history (minimum 0)
 * @param {number} baseUnit  - Base bet amount in dollars
 * @returns {{ betAmount: number, level: number, nextStagePreview: string }}
 */
export function getDalembertBet(netLosses, baseUnit) {
  // Ensure netLosses is non-negative; level is how many units above the base we are
  const level = Math.max(0, netLosses);

  // Bet = baseUnit × max(1, 1 + level)
  const betAmount = baseUnit * Math.max(1, 1 + level);

  // Preview next stage
  let nextStagePreview;
  if (level === 0) {
    nextStagePreview = `If you lose: next bet = $${baseUnit * 2} (level 1). If you win: stay at $${baseUnit}.`;
  } else {
    const nextLoss = baseUnit * (level + 2);
    const nextWin = level - 1 >= 0
      ? `$${baseUnit * Math.max(1, level)}`
      : `$${baseUnit}`;
    nextStagePreview = `If you lose: next bet = $${nextLoss}. If you win: next bet = ${nextWin}.`;
  }

  return {
    betAmount,
    level,
    nextStagePreview,
  };
}

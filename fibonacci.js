/**
 * Fibonacci Money Management Strategy
 * Negative progression: follow the Fibonacci sequence on losses.
 * On a loss: move one step forward in the sequence.
 * On a win: move two steps back (minimum step 0).
 *
 * @param {number} lossStreak - Current sequence index (used as position in Fibonacci sequence)
 * @param {number} baseUnit   - Base bet amount in dollars
 * @returns {{ betAmount: number, sequenceIndex: number, sequence: number[], nextStagePreview: string }}
 */
export function getFibonacciBet(lossStreak, baseUnit) {
  const sequence = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55];

  // Clamp the index to the available sequence length
  const sequenceIndex = Math.min(Math.max(lossStreak, 0), sequence.length - 1);
  const betAmount = baseUnit * sequence[sequenceIndex];

  // Preview next stage
  let nextStagePreview;
  if (sequenceIndex >= sequence.length - 1) {
    nextStagePreview = `At maximum Fibonacci step. If you win: move back 2 steps to $${baseUnit * sequence[Math.max(sequenceIndex - 2, 0)]}.`;
  } else {
    const nextLoss = baseUnit * sequence[sequenceIndex + 1];
    const nextWin = sequenceIndex >= 2
      ? `$${baseUnit * sequence[sequenceIndex - 2]}`
      : `$${baseUnit * sequence[0]}`;
    nextStagePreview = `If you lose: next bet = $${nextLoss}. If you win: go back to ${nextWin}.`;
  }

  return {
    betAmount,
    sequenceIndex,
    sequence,
    nextStagePreview,
  };
}

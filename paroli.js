/**
 * paroli.js
 * Paroli Money Management System for Baccarat Banker-Only Strategy
 *
 * The Paroli system is a positive progression strategy:
 * - Double your bet after each consecutive win (up to 3 wins)
 * - After 3 wins OR any loss, reset to the base unit
 */

/**
 * Returns the recommended bet amount and Paroli stage
 * based on the current win streak and base unit.
 *
 * @param {number} winStreak - Number of consecutive recent Banker wins (0, 1, 2, or 3+)
 * @param {number} baseUnit  - Base bet amount in dollars
 * @returns {{
 *   betAmount: number,
 *   stage: number|string,
 *   nextStagePreview: string,
 *   paroliFull: boolean
 * }}
 */
function getParoliBet(winStreak, baseUnit) {
  const base = Number(baseUnit) || 10;
  let betAmount;
  let stage;
  let paroliFull = false;
  let nextStagePreview;

  if (winStreak >= 3) {
    // 3+ consecutive wins → reset to base (lock in profit)
    betAmount = base;
    stage = 'reset';
    paroliFull = true;
    nextStagePreview = `Win → bet $${base * 2} | Lose → reset to $${base}`;
  } else if (winStreak === 2) {
    // 2 consecutive wins → bet ×4
    betAmount = base * 4;
    stage = 2;
    nextStagePreview = `Win → reset to $${base} (profit locked!) | Lose → reset to $${base}`;
  } else if (winStreak === 1) {
    // 1 consecutive win → bet ×2
    betAmount = base * 2;
    stage = 1;
    nextStagePreview = `Win → bet $${base * 4} | Lose → reset to $${base}`;
  } else {
    // 0 wins (fresh start or after reset/loss)
    betAmount = base;
    stage = 0;
    nextStagePreview = `Win → bet $${base * 2} | Lose → reset to $${base}`;
  }

  return {
    betAmount,
    stage,
    nextStagePreview,
    paroliFull
  };
}

/**
 * Calculates the net payout for a winning Banker bet.
 * Banker bets pay 0.95:1 (5% commission deducted).
 *
 * @param {number} betAmount - The amount wagered on Banker
 * @returns {number} Net profit on a Banker win
 */
function calculatePayout(betAmount) {
  return betAmount * 0.95;
}

/**
 * AI Pattern Analysis Engine for Baccarat
 * Analyzes the last 10 hands to detect trends, streaks, and chop patterns,
 * then produces a trend-following suggestion (Banker or Player).
 */

/**
 * Analyze up to 10 baccarat hands and produce an AI betting suggestion.
 * Follows the detected trend — streak continuation or chop continuation —
 * rather than defaulting to Banker regardless of pattern.
 *
 * @param {string[]} hands - Array of up to 10 results: "B", "P", or "T"
 * @returns {{
 *   suggestion: string,          // "Banker" | "Player"
 *   confidence: number,          // 0–100
 *   pattern: string,
 *   reasoning: string,
 *   bankerCount: number,
 *   playerCount: number,
 *   tieCount: number,
 *   skipBet: boolean,
 *   alternativeAction: string,
 *   secondOpinion: null
 * }}
 */
export function analyzeHands(hands) {
  const relevant = hands.filter(h => h === "B" || h === "P");
  const bankerCount = hands.filter(h => h === "B").length;
  const playerCount = hands.filter(h => h === "P").length;
  const tieCount    = hands.filter(h => h === "T").length;

  const trailingStreak = getTrailingStreak(relevant);
  const chopScore      = getChopScore(relevant);
  const recencyScore   = getRecencyScore(hands);  // 0–1, higher = more Banker recently

  let suggestion = "Banker";  // default
  let confidence = 50;
  let pattern    = "Neutral — no strong pattern detected.";
  let reasoning  = "No dominant pattern in the last 10 hands. Defaulting to Banker (lowest house edge).";
  let alternativeAction = "Standard bet.";
  let skipBet = false;

  if (relevant.length === 0) {
    suggestion = "Banker";
    confidence = 51;
    pattern = "No data — defaulting to Banker.";
    reasoning = "No non-tie hands available. Banker has the best statistical edge by default.";
    alternativeAction = "Bet minimum unit.";

  } else if (trailingStreak.count >= 3) {
    // ── STREAK PATTERN ──
    // Follow the streak: predict continuation of whichever side is streaking
    suggestion = trailingStreak.result === "B" ? "Banker" : "Player";
    confidence = Math.min(88, 58 + trailingStreak.count * 5);
    const sideName = suggestion === "Banker" ? "Banker" : "Player";
    pattern = `${sideName} streak of ${trailingStreak.count} — follow the streak.`;
    reasoning = `${trailingStreak.count} consecutive ${sideName} wins detected. Trend-following strategy predicts continuation. Bet ${sideName}.`;
    alternativeAction = `Bet ${sideName} — streak momentum.`;

  } else if (chopScore >= 0.6 && relevant.length >= 4) {
    // ── CHOP PATTERN ──
    // Follow the chop: predict the opposite of the last result
    const lastResult = relevant[relevant.length - 1];
    suggestion = lastResult === "B" ? "Player" : "Banker";
    confidence = Math.min(78, 50 + Math.round(chopScore * 40));
    const oppName = suggestion === "Banker" ? "Banker" : "Player";
    pattern = `Chop pattern (${Math.round(chopScore * 100)}% alternating) — follow the chop.`;
    reasoning = `The shoe is alternating heavily. Last result was ${lastResult === "B" ? "Banker" : "Player"}, so chop continuation predicts ${oppName}. Bet ${oppName}.`;
    alternativeAction = `Bet ${oppName} — chop continuation.`;

  } else if (recencyScore > 0.65) {
    // Recent Banker dominance
    suggestion = "Banker";
    confidence = Math.min(75, 52 + Math.round(recencyScore * 28));
    pattern = `Recent Banker dominance (recency score: ${Math.round(recencyScore * 100)}%).`;
    reasoning = "Recent hands are skewed toward Banker. Recency-weighted analysis favors Banker.";
    alternativeAction = "Full bet — favorable conditions.";

  } else if (recencyScore < 0.35) {
    // Recent Player dominance
    suggestion = "Player";
    confidence = Math.min(72, 50 + Math.round((0.5 - recencyScore) * 56));
    pattern = `Recent Player dominance (recency score: ${Math.round(recencyScore * 100)}%).`;
    reasoning = "Recent hands are skewed toward Player. Recency-weighted analysis favors Player.";
    alternativeAction = "Full bet — Player dominant recently.";

  } else {
    // Balanced / no pattern
    suggestion = "Banker";
    confidence = 55;
    pattern = "Balanced shoe — no dominant pattern.";
    reasoning = "No strong trend detected. Defaulting to Banker for its statistical edge (~1.06% house edge advantage).";
    alternativeAction = "Standard bet.";
  }

  // skipBet only when truly uncertain (confidence too low to justify a bet).
  // Current confidence floor is 50; this threshold acts as a safety net for
  // edge cases or future logic paths that may produce lower confidence values.
  skipBet = confidence < 45;

  return {
    suggestion,
    confidence,
    pattern,
    reasoning,
    bankerCount,
    playerCount,
    tieCount,
    skipBet,
    alternativeAction,
    secondOpinion: null,
  };
}

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

/**
 * Count the trailing streak of the same result at the end of the array.
 * @param {string[]} results - Array of "B" or "P"
 * @returns {{ result: string, count: number }}
 */
function getTrailingStreak(results) {
  if (results.length === 0) return { result: "", count: 0 };
  const last = results[results.length - 1];
  let count = 0;
  for (let i = results.length - 1; i >= 0; i--) {
    if (results[i] === last) count++;
    else break;
  }
  return { result: last, count };
}

/**
 * Calculate what fraction of consecutive pairs alternate (chop score).
 * Score of 1.0 means perfectly alternating; 0 means no alternation.
 * @param {string[]} results
 * @returns {number} 0–1
 */
function getChopScore(results) {
  if (results.length < 2) return 0;
  let alternations = 0;
  for (let i = 1; i < results.length; i++) {
    if (results[i] !== results[i - 1]) alternations++;
  }
  return alternations / (results.length - 1);
}

/**
 * Recency-weighted Banker frequency.
 * More recent hands are weighted more heavily (linear weighting: position+1).
 * @param {string[]} hands - Raw hands including Ties
 * @returns {number} 0–1 fraction of weighted Banker results
 */
function getRecencyScore(hands) {
  let totalWeight = 0;
  let bankerWeight = 0;
  hands.forEach((h, i) => {
    if (h === "T") return; // skip ties
    const weight = i + 1; // later index = more recent = higher weight
    totalWeight += weight;
    if (h === "B") bankerWeight += weight;
  });
  if (totalWeight === 0) return 0.5;
  return bankerWeight / totalWeight;
}

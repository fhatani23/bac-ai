/**
 * AI Pattern Analysis Engine for Baccarat
 * Analyzes the last 10 hands to detect trends, streaks, and chop patterns,
 * then produces a confidence-weighted suggestion.
 */

/**
 * Analyze 10 baccarat hands and produce an AI betting suggestion.
 *
 * @param {string[]} hands - Array of up to 10 results, each "B" (Banker), "P" (Player), or "T" (Tie)
 * @returns {{
 *   suggestion: string,       // "Banker" (always Banker-only mode)
 *   confidence: number,       // 0–100 confidence score
 *   pattern: string,          // Human-readable pattern description
 *   reasoning: string,        // Explanation of the recommendation
 *   bankerCount: number,
 *   playerCount: number,
 *   tieCount: number
 * }}
 */
export function analyzeHands(hands) {
  // Filter out Ties for streak analysis (Ties are traditionally ignored in progression)
  const relevant = hands.filter((h) => h === "B" || h === "P");

  const bankerCount = hands.filter((h) => h === "B").length;
  const playerCount = hands.filter((h) => h === "P").length;
  const tieCount = hands.filter((h) => h === "T").length;

  // --- Pattern Detection ---

  // 1. Trailing streak (most recent consecutive same result)
  const trailingStreak = getTrailingStreak(relevant);

  // 2. Alternating / chop pattern score (how often results alternate)
  const chopScore = getChopScore(relevant);

  // 3. Recency-weighted Banker frequency (recent hands count more)
  const recencyScore = getRecencyScore(hands);

  // --- Confidence Calculation ---
  // Base confidence starts at 50% (coin flip without data)
  let confidence = 50;
  let pattern = "Neutral — no strong pattern detected.";
  let reasoning = "The AI recommends Banker as it carries the lowest house edge (~1.06%).";

  if (relevant.length === 0) {
    // No non-tie data at all
    confidence = 51;
    pattern = "No data — defaulting to Banker (lowest house edge).";
    reasoning = "With no usable hand history, Banker is the statistically safest bet.";
  } else if (trailingStreak.count >= 3 && trailingStreak.result === "B") {
    // Strong Banker streak
    confidence = Math.min(85, 60 + trailingStreak.count * 5);
    pattern = `Banker streak of ${trailingStreak.count} — momentum favors Banker.`;
    reasoning = `A streak of ${trailingStreak.count} consecutive Banker wins has been detected. Streaks tend to continue short-term in baccarat shoes.`;
  } else if (trailingStreak.count >= 3 && trailingStreak.result === "P") {
    // Player streak — still suggest Banker but lower confidence
    confidence = 52;
    pattern = `Player streak of ${trailingStreak.count} — streak may continue but Banker edge applies.`;
    reasoning = `A Player streak is active. The AI still recommends Banker due to its mathematical edge, but confidence is lower.`;
  } else if (chopScore >= 0.6) {
    // Choppy / alternating shoe
    confidence = 57;
    pattern = `Choppy shoe (${Math.round(chopScore * 100)}% alternating) — unpredictable but Banker edge holds.`;
    reasoning = "The shoe is showing an alternating pattern. Banker is still preferred due to its built-in statistical advantage.";
  } else if (recencyScore > 0.65) {
    // Recent Banker dominance
    confidence = Math.min(80, 55 + Math.round(recencyScore * 30));
    pattern = `Recent Banker dominance (recency score: ${Math.round(recencyScore * 100)}%).`;
    reasoning = "Recent hands are heavily weighted toward Banker outcomes, reinforcing the standard recommendation.";
  } else if (recencyScore < 0.35) {
    // Recent Player dominance
    confidence = 53;
    pattern = `Recent Player dominance — Banker edge still applies mathematically.`;
    reasoning = "Player has been winning recently, but the house edge still favors Banker over time.";
  } else {
    // Balanced shoe
    confidence = 58;
    pattern = "Balanced shoe — Banker and Player results are even.";
    reasoning = "No strong trend detected. Banker remains the recommended bet based on its lower house edge.";
  }

  return {
    suggestion: "Banker",
    confidence,
    pattern,
    reasoning,
    bankerCount,
    playerCount,
    tieCount,
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

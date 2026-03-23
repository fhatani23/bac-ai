/**
 * ai_engine.js
 * AI Pattern Recognition Engine for Baccarat Betting Advisor
 *
 * Analyzes the last 10 hands and returns a betting suggestion
 * with confidence score and detected pattern.
 */

/**
 * Analyzes an array of 10 baccarat hand results and returns
 * a betting suggestion with pattern, confidence, and reasoning.
 *
 * @param {string[]} hands - Array of 10 strings: "B", "P", or "T"
 * @returns {{
 *   suggestedBet: string,
 *   pattern: string,
 *   confidence: number,
 *   reasoning: string,
 *   bankerScore: number
 * }}
 */
function analyzeHands(hands) {
  // Step 1: Filter out Ties — ties are ignored in trend detection
  const nonTie = hands.filter(h => h === 'B' || h === 'P');

  // Need at least 2 non-tie results for meaningful analysis
  if (nonTie.length < 2) {
    return {
      suggestedBet: 'Banker',
      pattern: 'Neutral',
      confidence: 50,
      reasoning: 'Not enough non-tie results to detect a pattern. Defaulting to Banker (lowest house edge).',
      bankerScore: 0.5
    };
  }

  // -------------------------------------------------------
  // Step 2: Streak Detection
  // Check if the last 3+ non-tie results are the same
  // -------------------------------------------------------
  let streakLength = 1;
  const last = nonTie[nonTie.length - 1];
  for (let i = nonTie.length - 2; i >= 0; i--) {
    if (nonTie[i] === last) {
      streakLength++;
    } else {
      break;
    }
  }
  const hasStreak = streakLength >= 3;

  // -------------------------------------------------------
  // Step 3: Chop Detection
  // Check if the last 4+ non-tie results strictly alternate
  // -------------------------------------------------------
  let chopLength = 1;
  for (let i = nonTie.length - 2; i >= 0; i--) {
    if (nonTie[i] !== nonTie[i + 1]) {
      chopLength++;
    } else {
      break;
    }
  }
  const hasChop = chopLength >= 4;

  // -------------------------------------------------------
  // Step 4: Recency-Weighted Banker/Player Frequency
  // Last 3 hands weighted ×3, older hands weighted ×1
  // -------------------------------------------------------
  let weightedBanker = 0;
  let weightedTotal = 0;

  hands.forEach((hand, index) => {
    if (hand === 'T') return; // skip ties
    const weight = index >= 7 ? 3 : 1; // last 3 positions (7, 8, 9) get weight ×3
    weightedTotal += weight;
    if (hand === 'B') {
      weightedBanker += weight;
    }
  });

  // Step 5: Banker Bias Score (0 = all Player, 1 = all Banker)
  const bankerScore = weightedTotal > 0 ? weightedBanker / weightedTotal : 0.5;

  // -------------------------------------------------------
  // Step 6: Confidence Calculation
  // -------------------------------------------------------
  let confidence;
  let pattern;
  let reasoning;

  if (hasStreak) {
    // Streak detected — confidence scales with streak length, capped at 90
    confidence = Math.min(90, 65 + streakLength * 3);

    if (last === 'B') {
      pattern = 'Banker Streak';
      reasoning = `A Banker streak of ${streakLength} has been detected. `
        + `Banker streaks tend to continue in the short term. `
        + `Confidence is high (${confidence}%). Always bet Banker.`;
    } else {
      pattern = 'Player Streak';
      confidence = Math.max(40, confidence - 10); // slight penalty for Player streak vs Banker strategy
      reasoning = `A Player streak of ${streakLength} has been detected. `
        + `While the streak may continue, we always recommend Banker due to its statistical edge. `
        + `Confidence is moderate (${confidence}%).`;
    }
  } else if (hasChop) {
    // Alternating / chop pattern
    confidence = 58;
    pattern = 'Chop Pattern';
    reasoning = `An alternating chop pattern has been detected over the last ${chopLength} hands. `
      + `In a chop, outcomes flip between Banker and Player. The next result could go either way. `
      + `Banker is still recommended due to the 1.06% house edge advantage.`;
  } else {
    // General bias calculation
    confidence = Math.round(50 + (bankerScore - 0.5) * 80);
    confidence = Math.max(40, Math.min(85, confidence)); // clamp between 40–85

    if (bankerScore > 0.55) {
      pattern = 'Banker Favored';
      reasoning = `Recent results show a Banker-favored trend (weighted score: ${(bankerScore * 100).toFixed(1)}%). `
        + `No strong streak or chop detected, but Banker has appeared more frequently in recent hands.`;
    } else if (bankerScore < 0.45) {
      pattern = 'Player Favored';
      reasoning = `Recent results show a slight Player bias (weighted score: ${(bankerScore * 100).toFixed(1)}%). `
        + `Despite this, Banker remains the statistically superior bet with the lowest house edge (~1.06%).`;
    } else {
      pattern = 'Neutral';
      reasoning = `No dominant pattern detected. Results are roughly balanced between Banker and Player. `
        + `Defaulting to Banker — the safest long-term bet in Baccarat.`;
    }
  }

  return {
    suggestedBet: 'Banker', // always Banker
    pattern,
    confidence,
    reasoning,
    bankerScore
  };
}

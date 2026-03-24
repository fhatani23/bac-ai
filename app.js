/**
 * app.js — Main application logic for the AI-powered Baccarat Betting System.
 * Reads 10 hand inputs and a strategy selector, then outputs AI analysis
 * and money management bet sizing.
 */

import { analyzeHands } from "./ai_engine.js";
import { getParoliBet } from "./paroli.js";
import { getMartingaleBet } from "./martingale.js";
import { getFibonacciBet } from "./fibonacci.js";
import { getOneThreeTwoSixBet } from "./one_three_two_six.js";
import { getDalembertBet } from "./dalembert.js";

// ---------------------------------------------------------------------------
// Strategy metadata (descriptions shown in the tooltip)
// ---------------------------------------------------------------------------
const STRATEGY_DESCRIPTIONS = {
  paroli:
    "Positive progression — double after each win, reset after 3 wins or a loss.",
  martingale:
    "Negative progression — double after each loss to recover. High risk.",
  fibonacci:
    "Negative progression — follow Fibonacci sequence on losses. Moderate risk.",
  "1-3-2-6":
    "Positive progression — fixed 4-step sequence. Low risk, structured.",
  dalembert:
    "Gradual negative progression — +1 unit on loss, -1 unit on win. Low risk.",
};

// ---------------------------------------------------------------------------
// DOM references (assigned after DOMContentLoaded)
// ---------------------------------------------------------------------------
let strategySelect;
let strategyDescription;
let baseUnitInput;
let analyzeBtn;
let resultsPanel;

// ---------------------------------------------------------------------------
// Initialise app
// ---------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  strategySelect = document.getElementById("strategySelect");
  strategyDescription = document.getElementById("strategyDescription");
  baseUnitInput = document.getElementById("baseUnit");
  analyzeBtn = document.getElementById("analyzeBtn");
  resultsPanel = document.getElementById("resultsPanel");

  // Update description tooltip when strategy changes
  strategySelect.addEventListener("change", updateStrategyDescription);
  updateStrategyDescription(); // set initial description

  analyzeBtn.addEventListener("click", runAnalysis);
});

/** Update the tooltip text below the strategy dropdown. */
function updateStrategyDescription() {
  const selected = strategySelect.value;
  strategyDescription.textContent = STRATEGY_DESCRIPTIONS[selected] || "";
}

// ---------------------------------------------------------------------------
// Core analysis
// ---------------------------------------------------------------------------

/** Read hand selects, run AI engine + chosen strategy, render results. */
function runAnalysis() {
  // 1. Collect the 10 hand values
  const hands = [];
  for (let i = 1; i <= 10; i++) {
    const val = document.getElementById(`hand${i}`).value;
    hands.push(val);
  }

  // 2. Base unit
  const baseUnit = parseFloat(baseUnitInput.value) || 10;

  // 3. AI analysis
  const aiResult = analyzeHands(hands);

  // 4. Strategy calculation
  const strategy = strategySelect.value;
  const strategyResult = computeStrategy(strategy, hands, baseUnit);

  // 5. Render
  renderResults(aiResult, strategyResult, strategy, baseUnit);
}

/**
 * Compute streak/counter values from the last 10 hands and call
 * the appropriate strategy function.
 *
 * @param {string} strategy  - One of: paroli | martingale | fibonacci | 1-3-2-6 | dalembert
 * @param {string[]} hands   - Array of 10 "B" / "P" / "T" results
 * @param {number} baseUnit  - Base bet in dollars
 * @returns {object} Strategy-specific result object
 */
function computeStrategy(strategy, hands, baseUnit) {
  switch (strategy) {
    case "paroli": {
      const winStreak = trailingBankerWins(hands);
      return { ...getParoliBet(winStreak, baseUnit), winStreak };
    }
    case "martingale": {
      const lossStreak = trailingLosses(hands);
      return { ...getMartingaleBet(lossStreak, baseUnit), lossStreak };
    }
    case "fibonacci": {
      const lossStreak = trailingLosses(hands);
      return { ...getFibonacciBet(lossStreak, baseUnit), lossStreak };
    }
    case "1-3-2-6": {
      const winStreak = trailingBankerWins(hands);
      return { ...getOneThreeTwoSixBet(winStreak, baseUnit), winStreak };
    }
    case "dalembert": {
      const netLosses = calcNetLosses(hands);
      return { ...getDalembertBet(netLosses, baseUnit), netLosses };
    }
    default:
      return {};
  }
}

// ---------------------------------------------------------------------------
// Streak / counter helpers
// ---------------------------------------------------------------------------

/** Count trailing consecutive Banker wins (ignoring Ties). */
function trailingBankerWins(hands) {
  let count = 0;
  for (let i = hands.length - 1; i >= 0; i--) {
    if (hands[i] === "T") continue; // Ties don't break or count streaks
    if (hands[i] === "B") count++;
    else break;
  }
  return count;
}

/** Count trailing consecutive non-Banker results (losses when betting Banker). */
function trailingLosses(hands) {
  let count = 0;
  for (let i = hands.length - 1; i >= 0; i--) {
    if (hands[i] === "T") continue; // Ties are pushes — don't count as losses
    if (hands[i] !== "B") count++;
    else break;
  }
  return count;
}

/** Net losses = (Player results) − (Banker results) across all 10 hands, min 0. */
function calcNetLosses(hands) {
  let losses = 0;
  let wins = 0;
  hands.forEach((h) => {
    if (h === "B") wins++;
    else if (h === "P") losses++;
    // Ties ignored
  });
  return Math.max(0, losses - wins);
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

const STRATEGY_LABELS = {
  paroli: "Paroli",
  martingale: "Martingale",
  fibonacci: "Fibonacci",
  "1-3-2-6": "1-3-2-6",
  dalembert: "D'Alembert",
};

/** Build and inject the results HTML into the results panel. */
function renderResults(ai, strat, strategyKey, baseUnit) {
  const stratName = STRATEGY_LABELS[strategyKey] || strategyKey;
  const commissionRate = 0.05;
  const netPayout = (strat.betAmount * (1 - commissionRate)).toFixed(2);

  // Confidence badge colour
  const confColor =
    ai.confidence >= 75
      ? "#4caf50"
      : ai.confidence >= 60
      ? "#ff9800"
      : "#f44336";

  // Extra strategy-specific info rows
  const extraRows = buildExtraRows(strat, strategyKey, baseUnit);

  resultsPanel.innerHTML = `
    <div class="result-card">
      <div class="result-header">
        <span class="result-icon">🃏</span>
        <h2>AI Baccarat Advisor</h2>
      </div>

      <div class="result-section">
        <h3>📊 AI Analysis</h3>
        <div class="stat-row">
          <span class="stat-label">Suggestion</span>
          <span class="stat-value highlight">Banker</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Confidence</span>
          <span class="stat-value" style="color:${confColor}">${ai.confidence}%</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Pattern</span>
          <span class="stat-value">${ai.pattern}</span>
        </div>
        <div class="reasoning">${ai.reasoning}</div>
      </div>

      <div class="result-section">
        <h3>💼 ${stratName} Strategy</h3>
        <div class="stat-row">
          <span class="stat-label">Bet Amount</span>
          <span class="stat-value highlight">$${strat.betAmount.toFixed(2)}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Net Payout (after 5% commission)</span>
          <span class="stat-value">$${netPayout}</span>
        </div>
        ${extraRows}
        <div class="next-stage">${strat.nextStagePreview || ""}</div>
      </div>

      <div class="result-section">
        <h3>📈 Hand History Summary</h3>
        <div class="hand-summary">
          <span class="hand-badge banker">B: ${ai.bankerCount}</span>
          <span class="hand-badge player">P: ${ai.playerCount}</span>
          <span class="hand-badge tie">T: ${ai.tieCount}</span>
        </div>
      </div>

      <div class="disclaimer">
        ⚠️ No system overcomes the house edge. Bet responsibly.
      </div>
    </div>
  `;

  resultsPanel.style.display = "block";
  resultsPanel.scrollIntoView({ behavior: "smooth" });
}

/** Build strategy-specific extra stat rows for the results card. */
function buildExtraRows(strat, strategyKey, baseUnit) {
  switch (strategyKey) {
    case "paroli":
      return `
        <div class="stat-row">
          <span class="stat-label">Win Streak</span>
          <span class="stat-value">${strat.winStreak}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Stage</span>
          <span class="stat-value">${strat.stage} / 3</span>
        </div>`;

    case "martingale":
      return `
        <div class="stat-row">
          <span class="stat-label">Loss Streak</span>
          <span class="stat-value">${strat.lossStreak}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Doubling Level</span>
          <span class="stat-value">${strat.stage} / 5${strat.cappedOut ? " ⚠️ CAPPED" : ""}</span>
        </div>`;

    case "fibonacci":
      return `
        <div class="stat-row">
          <span class="stat-label">Loss Streak</span>
          <span class="stat-value">${strat.lossStreak}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Sequence Index</span>
          <span class="stat-value">${strat.sequenceIndex} (${strat.sequence[strat.sequenceIndex]}× base)</span>
        </div>`;

    case "1-3-2-6":
      return `
        <div class="stat-row">
          <span class="stat-label">Win Streak</span>
          <span class="stat-value">${strat.winStreak}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Stage</span>
          <span class="stat-value">${strat.stage} / 3${strat.cycleFull ? " 🎉 Cycle Complete" : ""}</span>
        </div>`;

    case "dalembert":
      return `
        <div class="stat-row">
          <span class="stat-label">Net Losses (last 10)</span>
          <span class="stat-value">${strat.netLosses}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">D'Alembert Level</span>
          <span class="stat-value">+${strat.level} unit${strat.level !== 1 ? "s" : ""}</span>
        </div>`;

    default:
      return "";
  }
}

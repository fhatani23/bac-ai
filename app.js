/**
 * app.js — Main application logic for the AI-powered Baccarat Betting System.
 *
 * Phase 1 — Setup: reads 10 hand inputs, initialises SessionManager, transitions to Phase 2.
 * Phase 2 — Live Play: hand-by-hand prediction loop with result tracking, scoreboard,
 *            consecutive-loss guard (stop at 7), and New Shoe / Full Reset controls.
 */

import { SessionManager } from "./session_manager.js";

// ---------------------------------------------------------------------------
// Strategy metadata (descriptions shown below the dropdown)
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

const STRATEGY_LABELS = {
  paroli: "Paroli",
  martingale: "Martingale",
  fibonacci: "Fibonacci",
  "1-3-2-6": "1-3-2-6",
  dalembert: "D'Alembert",
};

// ---------------------------------------------------------------------------
// DOM references (assigned in DOMContentLoaded)
// ---------------------------------------------------------------------------

// Phase 1
let setupPhase;
let strategySelect;
let strategyDescription;
let baseUnitInput;
let analyzeBtn;

// Phase 2
let livePlaySection;
let liveHandTitle;
let predictionCard;
let btnBanker, btnPlayer, btnTie;
let lossWarning;
let stopBanner;
let scoreboardBody;
let statsBar;
let btnNewShoe, btnFullReset;
let btnNewShoe2, btnFullReset2;

// ---------------------------------------------------------------------------
// Session state
// ---------------------------------------------------------------------------
let session = null;

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  // Phase 1 elements
  setupPhase         = document.getElementById("setup-phase");
  strategySelect     = document.getElementById("strategySelect");
  strategyDescription = document.getElementById("strategyDescription");
  baseUnitInput      = document.getElementById("baseUnit");
  analyzeBtn         = document.getElementById("analyzeBtn");

  // Phase 2 elements
  livePlaySection = document.getElementById("live-play");
  liveHandTitle   = document.getElementById("liveHandTitle");
  predictionCard  = document.getElementById("predictionCard");
  btnBanker       = document.getElementById("btnBanker");
  btnPlayer       = document.getElementById("btnPlayer");
  btnTie          = document.getElementById("btnTie");
  lossWarning     = document.getElementById("lossWarning");
  stopBanner      = document.getElementById("stopBanner");
  scoreboardBody  = document.getElementById("scoreboardBody");
  statsBar        = document.getElementById("statsBar");
  btnNewShoe      = document.getElementById("btnNewShoe");
  btnFullReset    = document.getElementById("btnFullReset");
  btnNewShoe2     = document.getElementById("btnNewShoe2");
  btnFullReset2   = document.getElementById("btnFullReset2");

  // Strategy description tooltip
  strategySelect.addEventListener("change", updateStrategyDescription);
  updateStrategyDescription();

  // Button handlers
  analyzeBtn.addEventListener("click", startLivePlay);
  btnBanker.addEventListener("click", () => handleResult("B"));
  btnPlayer.addEventListener("click", () => handleResult("P"));
  btnTie.addEventListener("click",    () => handleResult("T"));
  btnNewShoe.addEventListener("click",   onNewShoe);
  btnFullReset.addEventListener("click", onFullReset);
  btnNewShoe2.addEventListener("click",  onNewShoe);
  btnFullReset2.addEventListener("click", onFullReset);
});

/** Update the tooltip text below the strategy dropdown. */
function updateStrategyDescription() {
  const selected = strategySelect.value;
  strategyDescription.textContent = STRATEGY_DESCRIPTIONS[selected] || "";
}

// ---------------------------------------------------------------------------
// Phase 1 → Phase 2 transition
// ---------------------------------------------------------------------------

/**
 * Validate the 10 hand inputs, initialise the SessionManager, seed it with
 * the training hands, then switch to the live play UI.
 */
function startLivePlay() {
  // Collect the 10 hand values
  const hands = [];
  for (let i = 1; i <= 10; i++) {
    hands.push(document.getElementById(`hand${i}`).value);
  }

  const baseUnit = parseFloat(baseUnitInput.value) || 10;
  const strategy = strategySelect.value;

  // Initialise session and seed with the 10 training hands
  session = new SessionManager(baseUnit, strategy);
  session.seedHands(hands);

  // Switch UI phases
  setupPhase.style.display = "none";
  livePlaySection.style.display = "block";

  // Reset live play UI state
  scoreboardBody.innerHTML = "";
  stopBanner.style.display = "none";
  lossWarning.style.display = "none";
  setResultButtonsDisabled(false);
  updateStatsBar();

  // Show the first prediction (hand #11 onwards)
  renderNextPrediction();

  livePlaySection.scrollIntoView({ behavior: "smooth" });
}

// ---------------------------------------------------------------------------
// Live play — result handling
// ---------------------------------------------------------------------------

/**
 * Called when the user clicks Banker / Player / Tie.
 * Records the result, updates the scoreboard and stats, then shows the
 * next prediction (or the STOP banner if 7 consecutive losses are reached).
 *
 * @param {string} actual - "B", "P", or "T"
 */
function handleResult(actual) {
  if (!session || !session.shoeActive) return;

  // Record and get outcome
  const outcome = session.recordResult(actual);

  // Append row to scoreboard
  addScoreboardRow(outcome);

  // Update stats and warning bars
  updateStatsBar();
  updateLossWarning(outcome.consecutiveLosses);

  if (!outcome.shoeActive) {
    // 7 consecutive losses — stop play
    stopBanner.style.display = "block";
    setResultButtonsDisabled(true);
    stopBanner.scrollIntoView({ behavior: "smooth" });
  } else {
    // Continue to next prediction
    renderNextPrediction();
  }
}

// ---------------------------------------------------------------------------
// Prediction rendering
// ---------------------------------------------------------------------------

/** Ask the session for the next prediction and update the prediction card + header. */
function renderNextPrediction() {
  const prediction = session.makePrediction();
  const handNumber = session.hands.length + 1; // next hand to be played

  liveHandTitle.textContent = `Live Play Mode — Hand #${handNumber}`;
  renderPredictionCard(prediction);
}

/**
 * Render the AI prediction card content.
 * @param {{ predictedOutcome: string, confidence: number, pattern: string, reasoning: string, betAmount: number, skipBet: boolean, alternativeAction: string }} prediction
 */
function renderPredictionCard(prediction) {
  const strategy = session.strategy;
  const stratName = STRATEGY_LABELS[strategy] || strategy;
  const confColor =
    prediction.confidence >= 75
      ? "#4caf50"
      : prediction.confidence >= 60
      ? "#ff9800"
      : "#f44336";

  // Confidence bar fill (clamped 0–100)
  const barFill = Math.min(100, Math.max(0, prediction.confidence));

  const isBanker = prediction.predictedOutcome === "B";
  const betIcon  = isBanker ? "🏦" : "👤";
  const betName  = isBanker ? "BANKER" : "PLAYER";
  const betClass = isBanker ? "pred-bet-value banker" : "pred-bet-value player";

  const skipBetAdvisory = prediction.skipBet
    ? `<div class="skip-bet-advisory">⚠️ Low confidence — minimum bet applied automatically. ${prediction.alternativeAction || ""}</div>`
    : "";

  predictionCard.innerHTML = `
    <div class="pred-header">
      <span class="pred-icon">🤖</span>
      <h3>AI Prediction</h3>
    </div>

    <div class="pred-row">
      <span class="pred-label">Bet</span>
      <span class="${betClass}">${betIcon} ${betName}</span>
    </div>

    <div class="pred-row">
      <span class="pred-label">Bet Size</span>
      <span class="pred-value highlight">$${prediction.betAmount.toFixed(2)}
        <em class="strat-tag">(${prediction.skipBet ? "min — low confidence ⚠️" : stratName})</em>
      </span>
    </div>

    <div class="pred-row">
      <span class="pred-label">Confidence</span>
      <span class="pred-value" style="color:${confColor}">${prediction.confidence}%</span>
    </div>
    <div class="confidence-bar">
      <div class="confidence-fill" style="width:${barFill}%; background:${confColor};"></div>
    </div>

    <div class="pred-row">
      <span class="pred-label">Pattern</span>
      <span class="pred-value pred-pattern">${prediction.pattern}</span>
    </div>

    <div class="pred-reasoning">${prediction.reasoning}</div>
    ${skipBetAdvisory}
  `;
}

// ---------------------------------------------------------------------------
// Scoreboard
// ---------------------------------------------------------------------------

/**
 * Append one row to the live scoreboard.
 * @param {{ betAmount: number, prediction: object, correct: boolean|null }} outcome
 */
function addScoreboardRow(outcome) {
  const record = session.predictions[session.predictions.length - 1];
  const row = document.createElement("tr");

  // Result cell styling
  let resultIcon, resultClass;
  if (outcome.correct === true) {
    resultIcon = "✅ WIN";
    resultClass = "result-win";
  } else if (outcome.correct === false) {
    resultIcon = "❌ LOSS";
    resultClass = "result-loss";
  } else {
    resultIcon = "➖ PUSH";
    resultClass = "result-push";
  }

  const actualLabel = record.actual === "B" ? "B" : record.actual === "P" ? "P" : "T";
  const predictedLabel = record.predicted === "B" ? "B" : "P";

  row.innerHTML = `
    <td>${record.handNumber}</td>
    <td>${predictedLabel}</td>
    <td>${actualLabel}</td>
    <td class="${resultClass}">${resultIcon}</td>
    <td>$${record.betAmount.toFixed(2)}</td>
  `;

  scoreboardBody.appendChild(row);
  row.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// ---------------------------------------------------------------------------
// Stats bar
// ---------------------------------------------------------------------------

/** Refresh all the stat badge values from the current session. */
function updateStatsBar() {
  const stats = session.getStats();
  document.getElementById("statHands").textContent    = stats.totalHands;
  document.getElementById("statWins").textContent     = stats.correctPredictions;
  document.getElementById("statLosses").textContent   = stats.totalLosses;
  document.getElementById("statPushes").textContent   = stats.totalPushes;
  document.getElementById("statAccuracy").textContent = stats.accuracy + "%";
  document.getElementById("statConsec").textContent   = stats.consecutiveLosses + "/7";
}

// ---------------------------------------------------------------------------
// Loss warning bar
// ---------------------------------------------------------------------------

/**
 * Show/hide and colour the consecutive-loss warning.
 * • 0–3  → hidden
 * • 4    → yellow
 * • 5–6  → orange
 * • 7+   → red
 *
 * @param {number} count
 */
function updateLossWarning(count) {
  if (count < 4) {
    lossWarning.style.display = "none";
    return;
  }

  lossWarning.style.display = "block";

  if (count >= 7) {
    lossWarning.className = "loss-warning loss-red";
    lossWarning.textContent = `🛑 DANGER: ${count} consecutive losses — stop play recommended`;
  } else if (count >= 5) {
    lossWarning.className = "loss-warning loss-orange";
    lossWarning.textContent = `⚠️ Warning: ${count} consecutive losses — consider pausing`;
  } else {
    lossWarning.className = "loss-warning loss-yellow";
    lossWarning.textContent = `⚠️ Caution: ${count} consecutive losses — monitor closely`;
  }
}

// ---------------------------------------------------------------------------
// New Shoe / Full Reset
// ---------------------------------------------------------------------------

/** Reset the consecutive loss counter and resume play without clearing history. */
function onNewShoe() {
  session.resetShoe();
  stopBanner.style.display = "none";
  lossWarning.style.display = "none";
  setResultButtonsDisabled(false);
  updateStatsBar();
  renderNextPrediction();
}

/** Clear all session data and return to the Phase 1 setup screen. */
function onFullReset() {
  session.fullReset();

  // Clear scoreboard
  scoreboardBody.innerHTML = "";

  // Reset stats display
  document.getElementById("statHands").textContent    = "0";
  document.getElementById("statWins").textContent     = "0";
  document.getElementById("statLosses").textContent   = "0";
  document.getElementById("statPushes").textContent   = "0";
  document.getElementById("statAccuracy").textContent = "0%";
  document.getElementById("statConsec").textContent   = "0/7";

  // Clear hand selectors back to default (Banker)
  for (let i = 1; i <= 10; i++) {
    document.getElementById(`hand${i}`).value = "B";
  }

  // Hide warnings and banners
  stopBanner.style.display = "none";
  lossWarning.style.display = "none";
  setResultButtonsDisabled(false);

  // Switch back to Phase 1
  livePlaySection.style.display = "none";
  setupPhase.style.display = "block";
  setupPhase.scrollIntoView({ behavior: "smooth" });
}

// ---------------------------------------------------------------------------
// UI helpers
// ---------------------------------------------------------------------------

/** Enable or disable the three result entry buttons. */
function setResultButtonsDisabled(disabled) {
  btnBanker.disabled = disabled;
  btnPlayer.disabled = disabled;
  btnTie.disabled    = disabled;
}


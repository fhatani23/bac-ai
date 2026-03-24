/**
 * session_manager.js — Live Play session state for the Baccarat AI Advisor.
 *
 * Manages the rolling prediction loop after the initial 10-hand setup:
 *   • Rolling 10-hand window used for each new AI prediction
 *   • Always bets Banker; result is correct if Banker wins, wrong if Player wins, push on Tie
 *   • Tracks consecutive losses; disables play after 7 in a row
 *   • Money management bet sizing derived from the chosen strategy
 */

import { analyzeHands } from "./ai_engine.js";
import { getParoliBet } from "./paroli.js";
import { getMartingaleBet } from "./martingale.js";
import { getFibonacciBet } from "./fibonacci.js";
import { getOneThreeTwoSixBet } from "./one_three_two_six.js";
import { getDalembertBet } from "./dalembert.js";

export class SessionManager {
  /**
   * @param {number} baseUnit  - Base bet unit in dollars
   * @param {string} strategy  - One of: paroli | martingale | fibonacci | 1-3-2-6 | dalembert
   */
  constructor(baseUnit, strategy) {
    this.baseUnit = baseUnit;
    this.strategy = strategy;

    /** All hands played — training hands first, then live play hands. */
    this.hands = [];

    /**
     * One entry per live-play hand:
     * { handNumber, predicted, actual, correct, betAmount }
     * correct = true (win), false (loss), null (push/tie)
     */
    this.predictions = [];

    /** Total live-play hands entered (includes ties). */
    this.totalHands = 0;

    /** How many times Banker won (correct predictions). */
    this.correctPredictions = 0;

    /** Consecutive losses since last Banker win. */
    this.consecutiveLosses = 0;

    /** Whether the session has been started. */
    this.sessionActive = true;

    /** false once 7 consecutive losses are reached; re-enabled by resetShoe(). */
    this.shoeActive = true;
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Seed the session with an initial set of training hands.
   * Must be called before the first `makePrediction()` / `recordResult()`.
   * @param {string[]} hands - Array of "B", "P", or "T" values
   */
  seedHands(hands) {
    hands.forEach((h) => this.hands.push(h));
  }

  /** Returns the most recent 10 hands from the full history. */
  getLastTenHands() {
    return this.hands.slice(-10);
  }

  /**
   * Generate the next AI prediction using the rolling 10-hand window.
   * Always predicts Banker — consistent with the banker-only strategy.
   *
   * @returns {{
   *   predictedOutcome: string,
   *   confidence: number,
   *   pattern: string,
   *   reasoning: string,
   *   betAmount: number
   * }}
   */
  makePrediction() {
    const last10 = this.getLastTenHands();
    const aiResult = analyzeHands(last10);
    const betAmount = this._computeBetAmount();

    return {
      predictedOutcome: "B",
      confidence: aiResult.confidence,
      pattern: aiResult.pattern,
      reasoning: aiResult.reasoning,
      betAmount,
    };
  }

  /**
   * Record the actual result of the hand, update session state, and return
   * a summary of the outcome.
   *
   * Rules:
   *  - "B" (Banker wins)  → correct prediction: reset consecutiveLosses, +1 correctPredictions
   *  - "P" (Player wins)  → wrong prediction:   +1 consecutiveLosses; stop shoe at 7
   *  - "T" (Tie / push)   → no effect on win/loss counters
   *
   * @param {string} actual - "B", "P", or "T"
   * @returns {{
   *   correct: boolean|null,
   *   consecutiveLosses: number,
   *   shoeActive: boolean,
   *   betAmount: number,
   *   prediction: object
   * }}
   */
  recordResult(actual) {
    // Capture the prediction state BEFORE updating hands history
    const prediction = this.makePrediction();
    const betAmount = prediction.betAmount;

    this.totalHands++;

    // null = push (Tie); true = win; false = loss
    let correct = null;

    if (actual === "B") {
      correct = true;
      this.consecutiveLosses = 0;
      this.correctPredictions++;
    } else if (actual === "P") {
      correct = false;
      this.consecutiveLosses++;
      if (this.consecutiveLosses >= 7) {
        this.shoeActive = false;
      }
    }
    // Tie: correct stays null, no streak changes

    // Append to rolling history (drives future predictions)
    this.hands.push(actual);

    // Log for scoreboard
    this.predictions.push({
      handNumber: this.hands.length, // e.g. 11 for first live-play hand after 10 training hands
      predicted: "B",
      actual,
      correct,
      betAmount,
    });

    return {
      correct,
      consecutiveLosses: this.consecutiveLosses,
      shoeActive: this.shoeActive,
      betAmount,
      prediction,
    };
  }

  /**
   * Return current session statistics.
   *
   * @returns {{
   *   totalHands: number,
   *   correctPredictions: number,
   *   totalLosses: number,
   *   totalPushes: number,
   *   accuracy: number,
   *   consecutiveLosses: number,
   *   shoeActive: boolean
   * }}
   */
  getStats() {
    const totalLosses = this.predictions.filter((p) => p.correct === false).length;
    const totalPushes = this.predictions.filter((p) => p.actual === "T").length;
    // Accuracy is wins / (wins + losses), excluding pushes
    const nonTieHands = this.correctPredictions + totalLosses;
    const accuracy =
      nonTieHands > 0
        ? Math.round((this.correctPredictions / nonTieHands) * 100)
        : 0;

    return {
      totalHands: this.totalHands,
      correctPredictions: this.correctPredictions,
      totalLosses,
      totalPushes,
      accuracy,
      consecutiveLosses: this.consecutiveLosses,
      shoeActive: this.shoeActive,
    };
  }

  /**
   * Reset the shoe after 7 consecutive losses.
   * Clears the consecutive loss counter and re-enables play.
   * Keeps full hands history so the rolling window continues correctly.
   */
  resetShoe() {
    this.consecutiveLosses = 0;
    this.shoeActive = true;
  }

  /**
   * Full reset — clears all state back to the initial constructor values.
   * The caller should also clear the scoreboard UI and return to Phase 1.
   */
  fullReset() {
    this.hands = [];
    this.predictions = [];
    this.consecutiveLosses = 0;
    this.totalHands = 0;
    this.correctPredictions = 0;
    this.sessionActive = true;
    this.shoeActive = true;
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Compute the bet amount for the current strategy based on the rolling
   * hands history.  Mirror of the helper functions in app.js so that the
   * SessionManager is self-contained.
   *
   * @returns {number} Bet amount in dollars
   */
  _computeBetAmount() {
    const hands = this.hands;
    switch (this.strategy) {
      case "paroli": {
        const winStreak = _trailingBankerWins(hands);
        return getParoliBet(winStreak, this.baseUnit).betAmount;
      }
      case "martingale": {
        const lossStreak = _trailingLosses(hands);
        return getMartingaleBet(lossStreak, this.baseUnit).betAmount;
      }
      case "fibonacci": {
        const lossStreak = _trailingLosses(hands);
        return getFibonacciBet(lossStreak, this.baseUnit).betAmount;
      }
      case "1-3-2-6": {
        const winStreak = _trailingBankerWins(hands);
        return getOneThreeTwoSixBet(winStreak, this.baseUnit).betAmount;
      }
      case "dalembert": {
        const netLosses = _calcNetLosses(hands);
        return getDalembertBet(netLosses, this.baseUnit).betAmount;
      }
      default:
        return this.baseUnit;
    }
  }
}

// ---------------------------------------------------------------------------
// Module-level helpers (not exported)
// ---------------------------------------------------------------------------

/** Count trailing consecutive Banker wins, skipping Ties. */
function _trailingBankerWins(hands) {
  let count = 0;
  for (let i = hands.length - 1; i >= 0; i--) {
    if (hands[i] === "T") continue; // Ties don't break or count streaks
    if (hands[i] === "B") count++;
    else break;
  }
  return count;
}

/** Count trailing consecutive non-Banker results (losses when betting Banker), skipping Ties. */
function _trailingLosses(hands) {
  let count = 0;
  for (let i = hands.length - 1; i >= 0; i--) {
    if (hands[i] === "T") continue; // Ties are pushes, not losses
    if (hands[i] !== "B") count++;
    else break;
  }
  return count;
}

/** Net losses = Player count − Banker count across all hands, clamped to 0. */
function _calcNetLosses(hands) {
  let losses = 0;
  let wins = 0;
  hands.forEach((h) => {
    if (h === "B") wins++;
    else if (h === "P") losses++;
    // Ties ignored
  });
  return Math.max(0, losses - wins);
}

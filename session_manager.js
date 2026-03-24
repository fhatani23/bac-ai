/**
 * session_manager.js — Live Play session state for the Baccarat AI Advisor.
 *
 * Manages the rolling prediction loop after the initial 10-hand setup:
 *   • Rolling 10-hand window used for each new AI prediction
 *   • Follows AI suggestion (Banker OR Player); result is correct if actual matches prediction, push on Tie
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

    /** How many times the AI prediction was correct. */
    this.correctPredictions = 0;

    /** Consecutive losses since last correct prediction. */
    this.consecutiveLosses = 0;

    /** Whether the session has been started. */
    this.sessionActive = true;

    /** false once 7 consecutive losses are reached; re-enabled by resetShoe(). */
    this.shoeActive = true;

    /** The most recent AI prediction outcome: "B" or "P". Set in makePrediction(). */
    this.lastPrediction = null;

    /** Whether the AI flagged low confidence (skip or min bet). Set in makePrediction(). */
    this._lastSkipBet = false;
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
   * Follows the AI's trend-based suggestion (Banker or Player).
   *
   * @returns {{
   *   predictedOutcome: string,
   *   confidence: number,
   *   pattern: string,
   *   reasoning: string,
   *   betAmount: number,
   *   skipBet: boolean,
   *   alternativeAction: string
   * }}
   */
  makePrediction() {
    const last10 = this.getLastTenHands();
    const aiResult = analyzeHands(last10);

    this._lastSkipBet = aiResult.skipBet || false;

    const predictedOutcome = aiResult.suggestion === "Banker" ? "B" : "P";
    this.lastPrediction = predictedOutcome;

    const betAmount = this._computeBetAmount();

    return {
      predictedOutcome,
      confidence: aiResult.confidence,
      pattern: aiResult.pattern,
      reasoning: aiResult.reasoning,
      betAmount,
      skipBet: aiResult.skipBet,
      alternativeAction: aiResult.alternativeAction,
    };
  }

  /**
   * Record the actual result of the hand, update session state, and return
   * a summary of the outcome.
   *
   * Rules:
   *  - actual === lastPrediction → correct prediction: reset consecutiveLosses, +1 correctPredictions
   *  - actual !== lastPrediction (and not Tie) → wrong prediction: +1 consecutiveLosses; stop shoe at 7
   *  - "T" (Tie / push) → no effect on win/loss counters
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

    if (actual === "T") {
      // Tie is always a push — no effect on streak or win/loss counts
    } else if (actual === this.lastPrediction) {
      correct = true;
      this.consecutiveLosses = 0;
      this.correctPredictions++;
    } else {
      correct = false;
      this.consecutiveLosses++;
      if (this.consecutiveLosses >= 7) {
        this.shoeActive = false;
      }
    }

    // Append to rolling history (drives future predictions)
    this.hands.push(actual);

    // Log for scoreboard
    this.predictions.push({
      handNumber: this.hands.length, // e.g. 11 for first live-play hand after 10 training hands
      predicted: this.lastPrediction,
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
    this.lastPrediction = null;
    this._lastSkipBet = false;
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Compute the bet amount for the current strategy based on the rolling
   * prediction history.  Uses the win/loss record rather than raw B/P outcomes
   * so that the strategy responds to whether the AI prediction was correct,
   * regardless of which side (Banker or Player) was predicted.
   *
   * When `skipBet` is flagged (low confidence), always returns `baseUnit`.
   *
   * @returns {number} Bet amount in dollars
   */
  _computeBetAmount() {
    if (this._lastSkipBet) return this.baseUnit;
    const preds = this.predictions;
    switch (this.strategy) {
      case "paroli": {
        const winStreak = _trailingWins(preds);
        return getParoliBet(winStreak, this.baseUnit).betAmount;
      }
      case "martingale": {
        const lossStreak = _trailingLosses(preds);
        return getMartingaleBet(lossStreak, this.baseUnit).betAmount;
      }
      case "fibonacci": {
        const lossStreak = _trailingLosses(preds);
        return getFibonacciBet(lossStreak, this.baseUnit).betAmount;
      }
      case "1-3-2-6": {
        const winStreak = _trailingWins(preds);
        return getOneThreeTwoSixBet(winStreak, this.baseUnit).betAmount;
      }
      case "dalembert": {
        const netLosses = _calcNetLosses(preds);
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

/** Count trailing consecutive correct predictions (wins), skipping Ties (null). */
function _trailingWins(predictions) {
  let count = 0;
  for (let i = predictions.length - 1; i >= 0; i--) {
    if (predictions[i].correct === null) continue; // Ties don't break streaks
    if (predictions[i].correct === true) count++;
    else break;
  }
  return count;
}

/** Count trailing consecutive wrong predictions (losses), skipping Ties (null). */
function _trailingLosses(predictions) {
  let count = 0;
  for (let i = predictions.length - 1; i >= 0; i--) {
    if (predictions[i].correct === null) continue; // Ties are pushes, not losses
    if (predictions[i].correct === false) count++;
    else break;
  }
  return count;
}

/** Net losses = total losses − total wins across all predictions, clamped to 0. */
function _calcNetLosses(predictions) {
  let losses = 0;
  let wins = 0;
  predictions.forEach((p) => {
    if (p.correct === true) wins++;
    else if (p.correct === false) losses++;
  });
  return Math.max(0, losses - wins);
}

/**
 * app.js
 * Main Application Logic — Baccarat AI Betting Advisor
 *
 * Handles UI interactions, orchestrates AI analysis and Paroli bet sizing,
 * and renders results to the page.
 */

// ─── State ───────────────────────────────────────────────────────────────────
let baseUnit = 10; // default base bet

// ─── Initialisation ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initHandSelectors();
  setupBaseUnitInput();
  document.getElementById('analyzeBtn').addEventListener('click', handleAnalyze);
  document.getElementById('resetBtn').addEventListener('click', handleReset);
});

/**
 * Wire up the B / P / T toggle buttons for all 10 hand rows.
 */
function initHandSelectors() {
  const container = document.getElementById('handsContainer');
  container.querySelectorAll('.hand-group').forEach(group => {
    group.querySelectorAll('.hand-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        // Deselect siblings in same group
        group.querySelectorAll('.hand-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  });
}

/**
 * Keep baseUnit in sync with the input field.
 */
function setupBaseUnitInput() {
  const input = document.getElementById('baseUnit');
  input.addEventListener('input', () => {
    const val = parseFloat(input.value);
    if (!isNaN(val) && val > 0) {
      baseUnit = val;
    }
  });
}

// ─── Core Handlers ───────────────────────────────────────────────────────────

/**
 * Collect hand selections, run AI + Paroli, render results.
 */
function handleAnalyze() {
  // 1. Collect hand values
  const hands = getSelectedHands();

  // 2. Validate all 10 are selected
  if (hands.includes(null)) {
    showError('Please select a result (B / P / T) for all 10 hands before analyzing.');
    return;
  }
  clearError();

  // 3. Run AI engine
  const aiResult = analyzeHands(hands);

  // 4. Determine current win streak from trailing Banker wins
  const winStreak = countTrailingBankerWins(hands);

  // 5. Get Paroli bet
  const paroliResult = getParoliBet(winStreak, baseUnit);

  // 6. Render results
  renderResults(aiResult, paroliResult);

  // 7. Scroll to results panel
  document.getElementById('resultsPanel').scrollIntoView({ behavior: 'smooth' });
}

/**
 * Clear all selections and hide the results panel.
 */
function handleReset() {
  document.querySelectorAll('.hand-btn').forEach(btn => btn.classList.remove('active'));
  const panel = document.getElementById('resultsPanel');
  panel.classList.remove('visible');
  clearError();
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Returns an array of 10 selected values ("B", "P", "T", or null if unselected).
 * @returns {Array<string|null>}
 */
function getSelectedHands() {
  const hands = [];
  document.querySelectorAll('.hand-group').forEach(group => {
    const active = group.querySelector('.hand-btn.active');
    hands.push(active ? active.dataset.value : null);
  });
  return hands;
}

/**
 * Count trailing consecutive Banker wins from the end of the hands array.
 * Ties are skipped (they don't break or extend the streak).
 *
 * @param {string[]} hands
 * @returns {number}
 */
function countTrailingBankerWins(hands) {
  let streak = 0;
  for (let i = hands.length - 1; i >= 0; i--) {
    if (hands[i] === 'T') continue; // skip ties
    if (hands[i] === 'B') {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

// ─── Rendering ───────────────────────────────────────────────────────────────

/**
 * Render AI + Paroli results into the results panel.
 *
 * @param {object} ai      - Result from analyzeHands()
 * @param {object} paroli  - Result from getParoliBet()
 */
function renderResults(ai, paroli) {
  // Suggested Bet
  document.getElementById('suggestedBet').textContent = '🎰 BANKER';

  // Bet Amount
  document.getElementById('betAmount').textContent =
    `$${paroli.betAmount.toFixed(2)}`;
  document.getElementById('paroliStage').textContent =
    paroli.paroliFull
      ? 'Stage: Reset (3-win cycle complete! Profit locked 🎉)'
      : `Stage: ${paroli.stage === 0 ? 'Base' : paroli.stage}`;
  document.getElementById('nextStagePreview').textContent =
    `Next: ${paroli.nextStagePreview}`;

  // Confidence bar
  const pct = Math.round(ai.confidence);
  document.getElementById('confidenceText').textContent = `${pct}%`;
  const bar = document.getElementById('confidenceBar');
  bar.style.width = '0%';
  setTimeout(() => { bar.style.width = `${pct}%`; }, 50); // animate
  bar.className = 'confidence-fill'; // reset classes
  if (pct >= 70) {
    bar.classList.add('high');
  } else if (pct >= 40) {
    bar.classList.add('medium');
  } else {
    bar.classList.add('low');
  }

  // Pattern badge
  const patternEl = document.getElementById('patternBadge');
  patternEl.textContent = `${patternIcon(ai.pattern)} ${ai.pattern}`;
  patternEl.className = 'pattern-badge ' + patternClass(ai.pattern);

  // Reasoning
  document.getElementById('reasoning').textContent = ai.reasoning;

  // Payout preview
  const payout = calculatePayout(paroli.betAmount);
  document.getElementById('payoutPreview').textContent =
    `Potential Banker win payout: +$${payout.toFixed(2)} (after 5% commission)`;

  // Show panel with fade-in
  const panel = document.getElementById('resultsPanel');
  panel.classList.add('visible');
}

/** Returns an emoji icon for a given pattern label. */
function patternIcon(pattern) {
  const icons = {
    'Banker Streak': '🔥',
    'Player Streak': '⚡',
    'Chop Pattern': '🔄',
    'Banker Favored': '📈',
    'Player Favored': '📉',
    'Neutral': '⚖️'
  };
  return icons[pattern] || '❓';
}

/** Returns a CSS class for styling the pattern badge. */
function patternClass(pattern) {
  const classes = {
    'Banker Streak': 'badge-banker',
    'Player Streak': 'badge-player',
    'Chop Pattern': 'badge-chop',
    'Banker Favored': 'badge-banker',
    'Player Favored': 'badge-player',
    'Neutral': 'badge-neutral'
  };
  return classes[pattern] || 'badge-neutral';
}

// ─── Error Display ────────────────────────────────────────────────────────────

function showError(msg) {
  const el = document.getElementById('errorMsg');
  el.textContent = msg;
  el.style.display = 'block';
}

function clearError() {
  const el = document.getElementById('errorMsg');
  el.textContent = '';
  el.style.display = 'none';
}

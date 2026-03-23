# 🃏 Baccarat AI Betting Advisor

A **pure client-side AI-powered Baccarat Betting Suggestion System** built with vanilla HTML, CSS, and JavaScript. No server, no dependencies — just open `index.html` in any browser.

---

## 🚀 How to Use

1. **Open `index.html`** in any modern web browser (Chrome, Firefox, Edge, Safari).
2. **Enter the last 10 hand results** — click **B** (Banker), **P** (Player), or **T** (Tie) for each hand.
3. **Set your base unit** (default $10) in the Bet Settings section.
4. Click **"Analyze & Suggest Next Bet"**.
5. The AI will display:
   - 🎯 Suggested bet (always Banker)
   - 💰 Recommended bet size (via the Paroli system)
   - 📊 Confidence level with animated bar
   - 📈 Detected pattern
   - 📋 Human-readable reasoning
6. Click **Reset** to start over.

> No installation or internet connection required.

---

## 🧠 How the AI Engine Works (`ai_engine.js`)

The AI engine uses **pattern recognition** and **recency-weighted frequency analysis**:

1. **Tie Filtering** — Ties are excluded from trend analysis (standard baccarat practice).
2. **Streak Detection** — If the last 3+ non-tie results are the same (e.g., B-B-B), a streak is flagged.
3. **Chop Detection** — If the last 4+ non-tie results strictly alternate (e.g., B-P-B-P), a chop is flagged.
4. **Recency Weighting** — The last 3 hands are weighted ×3 versus ×1 for older hands, making recent results more influential.
5. **Banker Bias Score** — Computes `weightedBankerCount / totalWeightedCount` (0 = all Player, 1 = all Banker).
6. **Confidence Score** — Derived from the pattern:
   - Streak of 3+: `65 + (streakLength × 3)`, capped at 90
   - Chop: fixed 58%
   - Otherwise: `50 + ((bankerScore − 0.5) × 80)`, clamped 40–85

The system **always recommends Banker** — it only adjusts confidence and reasoning based on detected patterns.

---

## 💰 How the Paroli System Works (`paroli.js`)

The Paroli system is a **positive progression** strategy — you increase your bet after wins and reset after losses or after 3 consecutive wins.

| Win Streak | Bet              |
|------------|------------------|
| 0 (start)  | 1× base unit     |
| 1 win      | 2× base unit     |
| 2 wins     | 4× base unit     |
| 3+ wins    | Reset → 1× base  |

**Example with $10 base:**

| Hand | Bet  | Outcome | Net P/L |
|------|------|---------|---------|
| 1    | $10  | Win     | +$9.50  |
| 2    | $20  | Win     | +$19.00 |
| 3    | $40  | Win     | +$38.00 |
| Reset | $10 | —       | **+$66.50 total** |

> Banker bets pay 0.95:1 (5% commission deducted).

---

## 📸 Screenshot

![App Screenshot](screenshot.png)

*(Open `index.html` in your browser to see the live UI)*

---

## 🛠 Tech Stack

- **HTML5** — semantic, accessible markup
- **CSS3** — custom properties, grid, animations, Google Fonts
- **Vanilla JavaScript (ES6+)** — no frameworks, no libraries, no build step

---

## ⚠️ Disclaimer

> This application is **for entertainment purposes only**. No betting system guarantees profit. The house always has an edge. Please gamble responsibly. If gambling becomes a problem, please seek help from a professional service.

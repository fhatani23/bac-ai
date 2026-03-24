# 🃏 Baccarat AI Advisor

An **AI-powered Baccarat Betting Suggestion System** that analyzes the last 10 hands and recommends the next bet size using one of 5 configurable money management strategies. Opens directly in any modern browser — no server or build step required.

---

## 🚀 Getting Started

1. Clone or download this repository.
2. Open `index.html` in any modern web browser.
3. Select your base unit and money management strategy.
4. Enter the results of your last 10 hands, then click **Analyze & Start Live Play**.
5. The app enters **Live Play Mode** — enter each new hand result as you play.

---

## 📁 Project Structure

```
bac-ai/
├── index.html            # UI — 10-hand setup, live play panel, scoreboard
├── style.css             # Dark casino-themed responsive design
├── app.js                # Main app logic — setup, live play event handling
├── ai_engine.js          # AI pattern recognition (streaks, chops, recency weighting)
├── session_manager.js    # Live Play session state — predictions, loss tracking, stats
├── paroli.js             # Paroli money management strategy
├── martingale.js         # Martingale money management strategy
├── fibonacci.js          # Fibonacci money management strategy
├── one_three_two_six.js  # 1-3-2-6 money management strategy
├── dalembert.js          # D'Alembert money management strategy
└── README.md
```

---

## 🧠 AI Engine

The AI engine (`ai_engine.js`) analyzes the last 10 hand results to detect:

- **Trailing streaks** — consecutive same outcomes
- **Chop patterns** — how often results alternate
- **Recency-weighted Banker frequency** — recent hands are weighted more heavily

It outputs a **confidence score (0–100%)** and a **pattern description** alongside the always-Banker suggestion (Banker carries the lowest house edge at ~1.06%).

---

## 💼 Money Management Strategies

All strategies are **Banker-only** — they affect only bet *sizing*, not which outcome to bet on.

| Strategy | Type | Risk | How It Works |
|---|---|---|---|
| **Paroli** | Positive progression | Low | Double your bet after each win; reset after 3 consecutive wins or any loss. Maximises hot streaks with limited downside. |
| **Martingale** | Negative progression | High | Double your bet after every loss to recover all losses in one win. Capped at 5 doublings (32× base) for safety. |
| **Fibonacci** | Negative progression | Moderate | Follow the Fibonacci sequence (1-1-2-3-5-8-13-21-34-55) on losses; move back two steps on a win. Slower recovery than Martingale. |
| **1-3-2-6** | Positive progression | Low | Bet 1→3→2→6 units on four consecutive wins, then reset. Structured cycle that locks in profit after each full sequence. |
| **D'Alembert** | Gradual negative progression | Low | Add 1 unit after a loss and subtract 1 unit after a win (minimum 1 unit). Very gradual adjustment with low variance. |

---

## 🎮 Live Play Mode

### Phase 1 — Setup

Enter the results of your last 10 hands (Banker / Player / Tie) and choose a base unit and strategy, then click **Analyze & Start Live Play**. These 10 hands seed the AI's rolling window and establish your starting money management state.

### Phase 2 — Live Play

After setup, the app enters a continuous **hand-by-hand prediction loop**:

1. **AI Prediction Card** — the app predicts the next result (always Banker) and displays the bet size from your chosen strategy, the confidence percentage, and the detected pattern.
2. **Enter the actual result** — click **🏦 Banker**, **👤 Player**, or **🤝 Tie** to record what happened.
3. **Outcome evaluation** — the app checks whether the prediction was correct:
   - **Banker wins** → ✅ WIN — consecutive loss counter resets.
   - **Player wins** → ❌ LOSS — consecutive loss counter increments.
   - **Tie** → ➖ PUSH — no effect on the win/loss counter.
4. The **rolling window** shifts: the most recent 10 hands (including the one just played) are used for the next prediction.
5. Repeat until the shoe ends or you choose to stop.

### The 7-Consecutive-Loss Rule

If the app records **7 consecutive Player wins** (7 losses for our Banker bets), it triggers a **🛑 STOP PLAY** banner and disables further input. This is a built-in risk management guard — a run of 7 straight losses is a strong signal that the shoe has turned against the strategy.

At that point you can:
- **🔄 New Shoe** — reset the consecutive loss counter and continue in the same session (hands history is preserved so the rolling window stays accurate).
- **🗑️ Full Reset** — clear everything and return to the Phase 1 setup screen.

### Warning Levels

The app shows a warning bar as consecutive losses build up:

| Consecutive Losses | Colour | Message |
|---|---|---|
| 0–3 | — | Hidden |
| 4 | 🟡 Yellow | Caution — monitor closely |
| 5–6 | 🟠 Orange | Consider pausing |
| 7 | 🔴 Red | STOP PLAY banner shown |

### Rolling 10-Hand Window

Every prediction uses only the **most recent 10 hands**, not the initial 10 hands forever. As you play more hands, older hands drop out of the window and new ones enter. This means the AI adapts in real time to the current state of the shoe.

### Scoreboard & Stats

The **Live Scoreboard** table records every hand with the hand number, predicted outcome (always B), actual result, win/loss/push indicator, and bet amount.

The **Stats Bar** shows running totals:
- **Hands Played** — total live-play hands entered (including ties)
- **Wins / Losses / Pushes** — breakdown of outcomes
- **Accuracy** — wins ÷ (wins + losses), ties excluded
- **Consecutive Losses** — current streak / 7 maximum

---

## ⚠️ Disclaimer

No betting system overcomes the house edge. This tool is for **educational and entertainment purposes only**. Always gamble responsibly.

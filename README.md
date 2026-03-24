# 🃏 Baccarat AI Advisor

An **AI-powered Baccarat Betting Suggestion System** that analyzes the last 10 hands and recommends the next bet size using one of 5 configurable money management strategies. Opens directly in any modern browser — no server or build step required.

---

## 🚀 Getting Started

1. Clone or download this repository.
2. Open `index.html` in any modern web browser.
3. Select your base unit, choose a money management strategy, enter the last 10 hand results, and click **Analyze & Suggest Bet**.

---

## 📁 Project Structure

```
bac-ai/
├── index.html            # UI — 10-hand input, strategy selector, results panel
├── style.css             # Dark casino-themed responsive design
├── app.js                # Main app logic — reads inputs, calls engine & strategy
├── ai_engine.js          # AI pattern recognition (streaks, chops, recency weighting)
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

## ⚠️ Disclaimer

No betting system overcomes the house edge. This tool is for **educational and entertainment purposes only**. Always gamble responsibly.

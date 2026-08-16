/**
 * Trade Fusion sells a single monthly Pro subscription at launch. This file is
 * the one source of truth for display copy and Stripe Checkout price data.
 */
export const TRADE_FUSION_PRO = {
  key: "trade_fusion_pro_monthly",
  name: "Trade Fusion Pro",
  description: "Unlimited Trade Fusion access, including the private Backtest workspace.",
  currency: "usd" as const,
  unitAmount: 1_000,
  interval: "month" as const,
  intervalCount: 1,
  trialDays: 7,
  displayPrice: "$10 USD",
  displayCadence: "per month",
} as const;

export const PRO_FEATURES = [
  "Unlimited manual trades and private Journal entries",
  "Unlimited Trader’s Room discussion threads and replies",
  "Full Backtest workspace with replay, drawing, simulated execution, and snapshots",
  "Private Backtest history retained if you cancel and restored when you return",
] as const;

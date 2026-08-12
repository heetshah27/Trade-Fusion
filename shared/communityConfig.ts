/** Secure, product-level constraints used by both the Trader’s Room API and UI. */
export const COMMUNITY_ATTACHMENT_RULES = {
  maxFilesPerPost: 2,
  maxBytesPerFile: 3 * 1024 * 1024,
  acceptedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
} as const;

/** A member may hold one reaction per post or comment and may toggle or replace it. */
export const COMMUNITY_REACTIONS = ["insightful", "support", "question"] as const;
export type CommunityReaction = (typeof COMMUNITY_REACTIONS)[number];

/** Optional self-selected badges—never inferred from a member’s private journal data. */
export const TRADING_STYLES = [
  "scalper",
  "day_trader",
  "swing_trader",
  "position_trader",
  "options_trader",
  "crypto_trader",
  "forex_trader",
] as const;
export type TradingStyle = (typeof TRADING_STYLES)[number];

export const TRADING_STYLE_LABELS: Record<TradingStyle, string> = {
  scalper: "Scalper",
  day_trader: "Day Trader",
  swing_trader: "Swing Trader",
  position_trader: "Position Trader",
  options_trader: "Options Trader",
  crypto_trader: "Crypto Trader",
  forex_trader: "Forex Trader",
};

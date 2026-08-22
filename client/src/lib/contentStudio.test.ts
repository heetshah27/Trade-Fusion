import { describe, expect, it } from "vitest";
import type { Trade } from "./tradeTypes";
import { buildWeeklyCaption, getWeeklyRecap } from "./contentStudio";

const trades: Trade[] = [
  { id: 1, date: "2026-08-17", symbol: "EURUSD", direction: "LONG", entryPrice: 1.17, exitPrice: 1.18, quantity: 1, pnl: 120, fees: 2, ruleFollowed: true, notes: "" },
  { id: 2, date: "2026-08-19", symbol: "XAUUSD", direction: "SHORT", entryPrice: 3350, exitPrice: 3360, quantity: 1, pnl: -50, fees: 2, ruleFollowed: false, notes: "" },
  { id: 3, date: "2026-08-21", symbol: "EURUSD", direction: "LONG", entryPrice: 1.18, exitPrice: 1.185, quantity: 1, pnl: 80, fees: 2, ruleFollowed: true, notes: "" },
  { id: 4, date: "2026-08-23", symbol: "GBPUSD", direction: "LONG", entryPrice: 1.35, exitPrice: 1.36, quantity: 1, pnl: 200, fees: 2, ruleFollowed: true, notes: "" },
];

describe("weekly content recap", () => {
  it("summarizes only the seven-day period ending on the selected date", () => {
    const recap = getWeeklyRecap(trades, "2026-08-22");

    expect(recap).toMatchObject({
      startDate: "2026-08-16",
      endDate: "2026-08-22",
      tradeCount: 3,
      wins: 2,
      losses: 1,
      winRate: 67,
      recordedPnl: 150,
      focusSymbols: ["EURUSD", "XAUUSD"],
      ruleFollowRate: 67,
    });
    expect(recap.bestTrade?.symbol).toBe("EURUSD");
  });

  it("keeps recorded P&L private in captions until the author explicitly chooses to show it", () => {
    const recap = getWeeklyRecap(trades, "2026-08-22");
    const privateCaption = buildWeeklyCaption(recap, "My lesson for the week.", false);
    const transparentCaption = buildWeeklyCaption(recap, "My lesson for the week.", true);

    expect(privateCaption).not.toContain("recorded P&L");
    expect(transparentCaption).toContain("recorded P&L: +$150");
    expect(privateCaption).toContain("not a signal or financial advice");
  });
});

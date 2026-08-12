import { describe, expect, it } from "vitest";
import { calculateBacktestMetrics, isBacktestSessionOwnedByUser } from "./backtest";

describe("Backtest ownership and metrics", () => {
  it("keeps each simulated session private to its owner", () => {
    expect(isBacktestSessionOwnedByUser(9, 9)).toBe(true);
    expect(isBacktestSessionOwnedByUser(9, 10)).toBe(false);
  });

  it("calculates simulated performance without referencing live journal trades", () => {
    const trades = [
      { id: 1, date: "2026-08-01", pnl: "250", fees: "5", rMultiple: "2.5" },
      { id: 2, date: "2026-08-02", pnl: "-100", fees: "0", rMultiple: "-1" },
      { id: 3, date: "2026-08-03", pnl: "75", fees: "0", rMultiple: null },
    ] as never;
    expect(calculateBacktestMetrics(trades, 10_000)).toMatchObject({
      totalTrades: 3,
      wins: 2,
      losses: 1,
      totalPnl: 220,
      endingBalance: 10_220,
      maxDrawdown: 100,
      averageR: 0.75,
    });
  });
});

import { describe, expect, it } from "vitest";
import { buildAccountPerformance } from "./tradingAccounts";

describe("buildAccountPerformance", () => {
  it("calculates win rate, profit factor, and peak-to-trough drawdown", () => {
    const performance = buildAccountPerformance(10_000, [
      { pnl: 100 },
      { pnl: -250 },
      { pnl: 50 },
    ]);

    expect(performance).toMatchObject({
      tradeCount: 3,
      wins: 2,
      losses: 1,
      netPnl: -100,
      winRate: 66.66666666666666,
      profitFactor: 0.6,
      maxDrawdown: 250,
    });
    expect(performance.maxDrawdownPercent).toBeCloseTo(2.4752475, 5);
  });

  it("keeps unavailable profit factor and zero drawdown for an untouched account", () => {
    expect(buildAccountPerformance(50_000, [])).toMatchObject({
      tradeCount: 0,
      winRate: 0,
      profitFactor: null,
      maxDrawdown: 0,
      maxDrawdownPercent: 0,
    });
  });
});

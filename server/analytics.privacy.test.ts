import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildMemberLiveAnalytics } from "./analytics";

const analyticsSource = readFileSync(new URL("./analytics.ts", import.meta.url), "utf8");

describe("Setup Analytics privacy contract", () => {
  it("filters the analytics query to the authenticated member's live journal rows", () => {
    expect(analyticsSource).toContain("from(trades).where(eq(trades.userId, ctx.user.id))");
  });

  it("does not import or query simulated Backtest trade data", () => {
    expect(analyticsSource).not.toMatch(/backtestTrades|backtest_trades/i);
  });

  it("behaviorally aggregates only the authenticated member's live records", () => {
    const analytics = buildMemberLiveAnalytics([
      { userId: 7, source: "live", date: "2026-08-10", symbol: "EURUSD", direction: "LONG", pnl: 100, setupTag: "Breakout", marketSession: "London" },
      { userId: 19, source: "live", date: "2026-08-10", symbol: "BTCUSD", direction: "SHORT", pnl: 900, setupTag: "Other user", marketSession: "Asia" },
      { userId: 7, source: "backtest", date: "2026-08-11", symbol: "XAUUSD", direction: "LONG", pnl: 500, setupTag: "Simulation", marketSession: "New York" },
    ], 7);

    expect(analytics.summary).toMatchObject({ tradeCount: 1, pnl: 100 });
    expect(analytics.setups).toEqual([expect.objectContaining({ key: "Breakout", pnl: 100 })]);
    expect(analytics.symbols).toEqual([expect.objectContaining({ key: "EURUSD", pnl: 100 })]);
  });
});

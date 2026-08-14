import { describe, expect, it } from "vitest";
import { buildSetupAnalytics } from "./analytics";

describe("buildSetupAnalytics", () => {
  it("groups only provided live journal trades by setup and calculates recorded P&L metrics", () => {
    const analytics = buildSetupAnalytics([
      { date: "2026-08-10", symbol: "EURUSD", direction: "LONG", pnl: 120, setupTag: "London breakout", marketSession: "London" },
      { date: "2026-08-11", symbol: "EURUSD", direction: "SHORT", pnl: -60, setupTag: "London breakout", marketSession: "London" },
      { date: "2026-08-12", symbol: "XAUUSD", direction: "LONG", pnl: 90, setupTag: null, marketSession: null },
    ]);

    expect(analytics.summary).toMatchObject({ tradeCount: 3, wins: 2, losses: 1, pnl: 150, winRate: 66.66666666666666, profitFactor: 3.5 });
    expect(analytics.setups).toEqual(expect.arrayContaining([
      expect.objectContaining({ key: "London breakout", tradeCount: 2, pnl: 60, profitFactor: 2 }),
      expect.objectContaining({ key: "Untagged", tradeCount: 1, pnl: 90 }),
    ]));
    expect(analytics.symbols).toEqual(expect.arrayContaining([
      expect.objectContaining({ key: "EURUSD", tradeCount: 2 }),
      expect.objectContaining({ key: "XAUUSD", tradeCount: 1 }),
    ]));
    expect(analytics.sessions).toEqual(expect.arrayContaining([
      expect.objectContaining({ key: "London", tradeCount: 2, pnl: 60 }),
      expect.objectContaining({ key: "Unspecified", tradeCount: 1, pnl: 90 }),
    ]));
  });

  it("keeps profit factor unavailable when a group has no recorded losses", () => {
    const analytics = buildSetupAnalytics([{ date: "2026-08-10", symbol: "BTCUSD", direction: "LONG", pnl: 40, setupTag: "Momentum", marketSession: "Asia" }]);
    expect(analytics.summary.profitFactor).toBeNull();
  });
});

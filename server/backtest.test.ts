import { describe, expect, it } from "vitest";
import { calculateBacktestMetrics, hasValidAnnotationGeometry, hasValidBacktestTradeWindow, isBacktestAnnotationOwnedByUser, isBacktestSessionEditable, isBacktestSessionOwnedByUser } from "./backtest";

describe("Backtest ownership and metrics", () => {
  it("keeps each simulated session private to its owner", () => {
    expect(isBacktestSessionOwnedByUser(9, 9)).toBe(true);
    expect(isBacktestSessionOwnedByUser(9, 10)).toBe(false);
  });

  it("keeps session chart annotations private to their creator", () => {
    expect(isBacktestAnnotationOwnedByUser(9, 9)).toBe(true);
    expect(isBacktestAnnotationOwnedByUser(9, 10)).toBe(false);
  });

  it("allows private trade and chart markup only while a Backtest session is active", () => {
    expect(isBacktestSessionEditable("active")).toBe(true);
    expect(isBacktestSessionEditable("archived")).toBe(false);
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

  it("accepts distinct saved entry and exit windows while rejecting backwards replay markers", () => {
    expect(hasValidBacktestTradeWindow("2026-08-11T09:15:00.000Z", "2026-08-11T11:45:00.000Z")).toBe(true);
    expect(hasValidBacktestTradeWindow("2026-08-11T11:45:00.000Z", "2026-08-11T09:15:00.000Z")).toBe(false);
  });

  it("requires valid time-price anchors for private trendlines and zones", () => {
    expect(hasValidAnnotationGeometry({ sessionId: 1, kind: "trendline", price: 2400, endPrice: 2410, startAt: "2026-08-12T10:00:00.000Z", endAt: "2026-08-12T11:00:00.000Z", label: "Trend" })).toBe(true);
    expect(hasValidAnnotationGeometry({ sessionId: 1, kind: "zone", price: 2420, endPrice: null, startAt: null, endAt: null, label: "Zone" })).toBe(false);
  });
});

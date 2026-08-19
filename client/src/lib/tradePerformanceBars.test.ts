import { describe, expect, it } from "vitest";
import { buildTradePerformanceBars } from "./tradePerformanceBars";

describe("buildTradePerformanceBars", () => {
  it("orders individual live-trade P&L bars chronologically and keeps the latest requested range", () => {
    const result = buildTradePerformanceBars([
      { id: 3, date: "2026-08-03", pnl: -9 },
      { id: 1, date: "2026-08-01", pnl: 4 },
      { id: 2, date: "2026-08-02", pnl: 12 },
    ], 2);

    expect(result.bars.map(bar => bar.id)).toEqual([2, 3]);
    expect(result.maxAbsolutePnl).toBe(12);
  });

  it("provides a stable positive scale for an empty or flat trade set", () => {
    expect(buildTradePerformanceBars([]).maxAbsolutePnl).toBe(1);
    expect(buildTradePerformanceBars([{ id: 1, date: "2026-08-01", pnl: 0 }]).maxAbsolutePnl).toBe(1);
  });
});

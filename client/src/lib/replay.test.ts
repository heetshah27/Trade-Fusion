import { describe, expect, it } from "vitest";
import { filterReplayRange, toReplayInterval, toReplaySymbol } from "./replay";

describe("Backtest replay helpers", () => {
  it("accepts source-backed crypto and licensed multi-asset replay symbols", () => {
    expect(toReplaySymbol("BTC/USD")).toBe("BTCUSD");
    expect(toReplaySymbol("XAU/USD")).toBe("XAUUSD");
    expect(toReplaySymbol("NAS100")).toBeNull();
  });

  it("normalizes common workspace timeframes to the replay provider contract", () => {
    expect(toReplayInterval("1H")).toBe("1h");
    expect(toReplayInterval("60m")).toBe("1h");
    expect(toReplayInterval("Daily")).toBe("1d");
  });

  it("limits replay points to a member-selected recent date range", () => {
    expect(filterReplayRange([{ time: 0 }, { time: 86_400 }, { time: 172_800 }], 1)).toEqual([{ time: 86_400 }, { time: 172_800 }]);
    expect(filterReplayRange([{ time: 0 }, { time: 86_400 }], null)).toHaveLength(2);
  });
});

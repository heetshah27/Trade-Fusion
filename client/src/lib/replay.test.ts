import { describe, expect, it } from "vitest";
import { toReplayInterval, toReplaySymbol } from "./replay";

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
});

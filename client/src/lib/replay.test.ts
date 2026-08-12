import { describe, expect, it } from "vitest";
import { toReplayInterval, toReplaySymbol } from "./replay";

describe("Backtest replay helpers", () => {
  it("accepts only source-backed crypto symbols in the first replay release", () => {
    expect(toReplaySymbol("BTC/USD")).toBe("BTCUSD");
    expect(toReplaySymbol("XAUUSD")).toBeNull();
  });

  it("normalizes common workspace timeframes to the replay provider contract", () => {
    expect(toReplayInterval("1H")).toBe("1h");
    expect(toReplayInterval("60m")).toBe("1h");
    expect(toReplayInterval("Daily")).toBe("1d");
  });
});

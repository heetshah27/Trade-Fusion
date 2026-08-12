import { describe, expect, it } from "vitest";
import { normalizeKrakenCandles, requireReplaySymbol } from "./replay";

describe("historical replay candle contract", () => {
  it("normalizes and sorts valid Kraken OHLC rows without inventing prices", () => {
    const candles = normalizeKrakenCandles([
      [200, "102", "106", "101", "105", "104", "4", 5, 2],
      [100, "100", "103", "99", "102", "101", "3", 4, 1],
      [300, "bad", "1", "1", "1", "1", "1", 1, 1],
    ]);
    expect(candles).toEqual([
      { time: 100, open: 100, high: 103, low: 99, close: 102 },
      { time: 200, open: 102, high: 106, low: 101, close: 105 },
    ]);
  });

  it("accepts only the initially supported source-backed crypto pairs", () => {
    expect(requireReplaySymbol("BTC/USD")).toBe("BTCUSD");
    expect(() => requireReplaySymbol("XAUUSD")).toThrow(/BTC\/USD, ETH\/USD, and SOL\/USD/);
  });
});

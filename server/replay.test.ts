import { describe, expect, it } from "vitest";
import { normalizeAlphaFxDaily, normalizeAlphaGoldHistory, normalizeKrakenCandles, requireReplaySymbol } from "./replay";

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

  it("accepts the source-backed crypto, licensed FX, and licensed gold symbols", () => {
    expect(requireReplaySymbol("BTC/USD")).toBe("BTCUSD");
    expect(requireReplaySymbol("EUR/USD")).toBe("EURUSD");
    expect(requireReplaySymbol("XAUUSD")).toBe("XAUUSD");
  });

  it("normalizes licensed Alpha Vantage FX OHLC and gold price-line responses without inventing gold candles", () => {
    expect(normalizeAlphaFxDaily({ "2026-08-11": { "1. open": "1.15", "2. high": "1.16", "3. low": "1.14", "4. close": "1.155" } })).toEqual([{ time: 1786406400, open: 1.15, high: 1.16, low: 1.14, close: 1.155 }]);
    expect(normalizeAlphaGoldHistory([{ date: "2026-08-11", price: "4405.33" }])).toEqual([{ time: 1786406400, value: 4405.33 }]);
  });
});

import { describe, expect, it } from "vitest";
import { normalizeAlphaFxDaily, normalizeAlphaGoldHistory, normalizeKrakenCandles, normalizeTwelveDataCandles, requireReplaySymbol } from "./replay";

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

  it("normalizes and orders Twelve Data intraday FX OHLC responses", () => {
    expect(normalizeTwelveDataCandles([
      { datetime: "2026-08-11 15:00:00", open: "1.1650", high: "1.1660", low: "1.1640", close: "1.1655" },
      { datetime: "2026-08-11 14:45:00", open: "1.1640", high: "1.1651", low: "1.1635", close: "1.1650" },
    ])).toEqual([
      { time: 1786459500, open: 1.164, high: 1.1651, low: 1.1635, close: 1.165 },
      { time: 1786460400, open: 1.165, high: 1.166, low: 1.164, close: 1.1655 },
    ]);
  });
});

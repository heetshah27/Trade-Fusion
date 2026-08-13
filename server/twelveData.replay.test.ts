import { afterEach, describe, expect, it, vi } from "vitest";
import { getReplaySeries } from "./replay";

describe("Twelve Data intraday replay provider", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("returns and caches truthful 15-minute FX OHLC candles", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      status: "ok",
      values: [
        { datetime: "2026-08-11 15:00:00", open: "1.1650", high: "1.1660", low: "1.1640", close: "1.1655" },
        { datetime: "2026-08-11 14:45:00", open: "1.1640", high: "1.1651", low: "1.1635", close: "1.1650" },
      ],
    }), { status: 200, headers: { "content-type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);

    const first = await getReplaySeries("GBPUSD", "15m");
    const second = await getReplaySeries("GBPUSD", "15m");

    expect(first).toMatchObject({ source: "Twelve Data Time Series", sourceStatus: "live", assetClass: "forex", seriesType: "candlestick" });
    expect(first.candles).toHaveLength(2);
    expect(second.candles).toEqual(first.candles);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain("interval=15min");
  });
});

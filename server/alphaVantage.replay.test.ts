import { afterEach, describe, expect, it, vi } from "vitest";
import { getReplaySeries } from "./replay";

describe("Alpha Vantage licensed replay source", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("normalizes a truthful daily XAUUSD price line for the private replay chart", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      nominal: "XAUUSD",
      data: [{ date: "2026-08-11", price: "4405.3368" }, { date: "2026-08-10", price: "4343.8524" }],
    }), { status: 200, headers: { "content-type": "application/json" } })));
    const replay = await getReplaySeries("XAUUSD", "1d");
    expect(replay.source).toBe("Alpha Vantage GOLD_SILVER_HISTORY");
    expect(replay.sourceStatus).toBe("live");
    expect(replay.seriesType).toBe("line");
    expect(replay.prices.length).toBeGreaterThan(0);
    expect(replay.prices[0]).toEqual(expect.objectContaining({ time: expect.any(Number), value: expect.any(Number) }));
  }, 15_000);
});

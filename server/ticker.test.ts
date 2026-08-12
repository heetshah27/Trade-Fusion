import { describe, expect, it } from "vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getTickerResponse, krakenQuote, mergeKrakenQuotes, resetTickerCacheForTests } from "./ticker";

describe("Kraken ticker quote mapping", () => {
  it("formats a real quote and calculates its change from the exchange opening price", () => {
    expect(krakenQuote({ XXBTZUSD: { c: ["64001.125"], o: "63200" } }, "XXBTZUSD", "BTC/USD", 2)).toEqual({
      symbol: "BTC/USD",
      price: "64,001.13",
      change: "+1.27%",
      positive: true,
      isLive: true,
    });
  });

  it("retains reference instruments when no corresponding real exchange quote is available", () => {
    const items = mergeKrakenQuotes({ XXBTZUSD: { c: ["64000"], o: "64000" } });
    expect(items.find(item => item.symbol === "BTC/USD")?.isLive).toBe(true);
    expect(items.find(item => item.symbol === "EUR/USD")?.isLive).toBe(false);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    resetTickerCacheForTests();
  });

  it("falls back to reference quotes after a provider timeout and recovers with a later real quote", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("provider timeout")));
    const fallback = await getTickerResponse();
    expect(fallback.source).toBe("reference");
    expect(fallback.items.find(item => item.symbol === "BTC/USD")?.isLive).toBe(false);

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      error: [],
      result: {
        XXBTZUSD: { c: ["64000"], o: "63200" },
        XETHZUSD: { c: ["1880"], o: "1900" },
        SOLUSD: { c: ["76"], o: "75" },
      },
    }), { status: 200 })));
    const recovered = await getTickerResponse();
    expect(recovered.source).toBe("kraken");
    expect(recovered.items.find(item => item.symbol === "BTC/USD")?.isLive).toBe(true);
  });
});

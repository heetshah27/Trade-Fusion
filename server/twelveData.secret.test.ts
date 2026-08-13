import { describe, expect, it } from "vitest";

describe("Twelve Data credential", () => {
  it("authenticates a lightweight intraday EUR/USD candle request", async () => {
    const key = process.env.TWELVE_DATA_API_KEY;
    expect(key).toMatch(/^[a-z0-9]{16,}$/i);
    const response = await fetch(
      `https://api.twelvedata.com/time_series?symbol=EUR/USD&interval=15min&outputsize=1&apikey=${key}`,
      { signal: AbortSignal.timeout(12_000) }
    );
    const payload = await response.json() as { status?: string; code?: number; values?: unknown[] };
    expect(payload.status).not.toBe("error");
    expect(payload.code).toBeUndefined();
    expect(payload.values?.length).toBeGreaterThan(0);
  }, 15_000);
});

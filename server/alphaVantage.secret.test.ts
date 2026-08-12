import { describe, expect, it } from "vitest";

describe("Alpha Vantage credential", () => {
  it("authenticates a lightweight server-side exchange-rate request", async () => {
    const key = process.env.ALPHA_VANTAGE_API_KEY;
    expect(key).toMatch(/^[A-Z0-9]{8,}$/);
    const response = await fetch(`https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=EUR&to_currency=USD&apikey=${key}`, { signal: AbortSignal.timeout(12_000) });
    const payload = await response.json() as Record<string, unknown>;
    expect(payload["Error Message"]).toBeUndefined();
    expect(payload["Information"]).toBeUndefined();
    expect(payload["Realtime Currency Exchange Rate"]).toBeTruthy();
  }, 15_000);
});

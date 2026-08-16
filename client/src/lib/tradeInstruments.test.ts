import { describe, expect, it } from "vitest";
import { calculateTradePnl, getInstrumentProfile, inferInstrumentCategory } from "./tradeInstruments";

describe("instrument-aware P&L assistance", () => {
  it("infers common forex, metals, crypto, and index instruments", () => {
    expect(inferInstrumentCategory("EURUSD")).toBe("forex");
    expect(inferInstrumentCategory("XAU/USD")).toBe("metals");
    expect(inferInstrumentCategory("BTCUSD")).toBe("crypto");
    expect(inferInstrumentCategory("NAS100")).toBe("indices");
  });

  it("calculates standard-lot gold and forex results using visible contract rules", () => {
    expect(calculateTradePnl({ symbol: "XAUUSD", instrumentCategory: "metals", direction: "LONG", entryPrice: 4333, exitPrice: 4351, quantity: 0.1, fees: 0 }).net).toBe(180);
    expect(calculateTradePnl({ symbol: "EURUSD", instrumentCategory: "forex", direction: "SHORT", entryPrice: 1.1, exitPrice: 1.095, quantity: 0.2, fees: 3 }).net).toBe(97);
  });

  it("marks broker-sensitive index sizing as an estimate", () => {
    const profile = getInstrumentProfile("NAS100", "indices");
    expect(profile.estimate).toBe(true);
    expect(profile.quantityLabel).toBe("Contracts");
  });
});

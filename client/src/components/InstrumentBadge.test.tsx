// @vitest-environment jsdom
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { InstrumentBadge } from "./InstrumentBadge";

describe("InstrumentBadge", () => {
  it("renders accessible original paired currency tokens for forex", () => {
    render(<InstrumentBadge symbol="EURUSD" category="forex" />);
    const badge = screen.getByRole("img", { name: /euro.*US dollar forex pair/i });
    expect(badge).toBeTruthy();
    expect(badge.textContent).toContain("🇪🇺");
    expect(badge.textContent).toContain("🇺🇸");
  });

  it("renders the supplied gold-bars asset for XAU/USD and the original crypto mark", () => {
    const { rerender } = render(<InstrumentBadge symbol="XAUUSD" category="metals" />);
    const goldBadge = screen.getByRole("img", { name: /gold/i });
    expect(goldBadge).toBeTruthy();
    expect(goldBadge.className).toContain("w-8");
    expect(document.querySelector('img[src*="trade-fusion-xauusd-gold-bars"]')).toBeTruthy();
    rerender(<InstrumentBadge symbol="BTCUSD" category="crypto" />);
    expect(screen.getByRole("img", { name: /btc crypto/i }).textContent).toContain("₿");
  });

  it("renders the supplied silver-bars asset for XAG/USD", () => {
    render(<InstrumentBadge symbol="XAGUSD" category="metals" />);
    const silverBadge = screen.getByRole("img", { name: /silver/i });
    expect(silverBadge).toBeTruthy();
    expect(silverBadge.className).toContain("w-8");
    expect(document.querySelector('img[src*="trade-fusion-xagusd-silver-bars"]')).toBeTruthy();
  });
});

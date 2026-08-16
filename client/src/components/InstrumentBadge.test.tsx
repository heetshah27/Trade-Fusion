// @vitest-environment jsdom
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { InstrumentBadge } from "./InstrumentBadge";

describe("InstrumentBadge", () => {
  it("renders accessible original paired currency tokens for forex", () => {
    render(<InstrumentBadge symbol="EURUSD" category="forex" />);
    expect(screen.getByRole("img", { name: /euro.*US dollar forex pair/i })).toBeTruthy();
  });

  it("renders the supplied gold-bars asset for XAU/USD and the original crypto mark", () => {
    const { rerender } = render(<InstrumentBadge symbol="XAUUSD" category="metals" />);
    expect(screen.getByRole("img", { name: /gold/i })).toBeTruthy();
    expect(document.querySelector('img[src*="trade-fusion-xauusd-gold-bars"]')).toBeTruthy();
    rerender(<InstrumentBadge symbol="BTCUSD" category="crypto" />);
    expect(screen.getByRole("img", { name: /btc crypto/i }).textContent).toContain("₿");
  });
});

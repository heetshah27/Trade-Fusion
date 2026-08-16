// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { InstrumentBadge } from "./InstrumentBadge";

afterEach(cleanup);

describe("InstrumentBadge", () => {
  it("renders accessible original paired currency tokens for forex", () => {
    render(<InstrumentBadge symbol="AUDUSD" category="forex" />);
    const badge = screen.getByRole("img", { name: /Australian dollar.*US dollar forex pair/i });
    expect(badge).toBeTruthy();
    expect(badge.textContent).toContain("🇦🇺");
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

  it("renders the supplied oil-drop asset for USOIL", () => {
    render(<InstrumentBadge symbol="USOIL" category="other" />);
    expect(screen.getByRole("img", { name: /US Oil instrument/i })).toBeTruthy();
    expect(document.querySelector('img[src*="trade-fusion-usoil-oil-drop"]')).toBeTruthy();
  });

  it("renders the supplied paired-flag asset for NZD/USD", () => {
    render(<InstrumentBadge symbol="NZDUSD" category="forex" />);
    expect(screen.getByRole("img", { name: /New Zealand dollar.*US dollar forex pair/i })).toBeTruthy();
    expect(document.querySelector('img[src*="trade-fusion-nzdusd-paired-flags"]')).toBeTruthy();
  });

  it("renders the supplied paired-flag asset for EUR/USD", () => {
    render(<InstrumentBadge symbol="EURUSD" category="forex" />);
    expect(screen.getByRole("img", { name: /Euro.*US dollar forex pair/i })).toBeTruthy();
    expect(document.querySelector('img[src*="trade-fusion-eurusd-paired-flags"]')).toBeTruthy();
  });

  it("renders the supplied paired-flag asset for GBP/USD", () => {
    render(<InstrumentBadge symbol="GBPUSD" category="forex" />);
    expect(screen.getByRole("img", { name: /British pound.*US dollar forex pair/i })).toBeTruthy();
    expect(document.querySelector('img[src*="trade-fusion-gbpusd-paired-flags"]')).toBeTruthy();
  });

  it("renders the supplied symbol for DXY", () => {
    render(<InstrumentBadge symbol="DXY" category="indices" />);
    expect(screen.getByRole("img", { name: /U\.S\. Dollar Index/i })).toBeTruthy();
    expect(document.querySelector('img[src*="trade-fusion-dxy-dollar-index"]')).toBeTruthy();
  });
});

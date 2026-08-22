// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Trade } from "@/lib/tradeTypes";

const queryState = {
  data: {
    tradeIdea: "Break above Asia range",
    marketContext: "USD catalyst",
    executionReview: "Held to plan",
    reflection: "Keep risk fixed",
    attachments: [{ id: 5, url: "https://example.com/private-chart.png", fileName: "private-chart.png" }],
  } as any,
  isLoading: false,
  isError: false,
  error: null as unknown,
  refetch: vi.fn(),
};

vi.mock("@/lib/trpc", () => ({ trpc: { tradeJournal: { byTrade: { useQuery: () => queryState } } } }));

import { TradeDetailDrawer } from "./TradeDetailDrawer";

const trade: Trade = { id: 7, date: "2026-08-21", symbol: "XAUUSD", direction: "LONG", entryPrice: 2400, exitPrice: 2405, quantity: 1, pnl: 5, fees: 0, notes: "Private execution note", setupTag: "London Breakout" };

describe("TradeDetailDrawer", () => {
  afterEach(() => {
    cleanup();
    queryState.isLoading = false;
    queryState.isError = false;
    queryState.error = null;
    queryState.refetch.mockReset();
  });

  it("renders only the selected trade’s private journal screenshot in the open drawer", () => {
    render(<TradeDetailDrawer trade={trade} open onOpenChange={vi.fn()} />);

    expect(screen.getByText("Private execution review")).toBeTruthy();
    const drawer = document.querySelector('[data-slot="sheet-content"]');
    expect(drawer?.className).toContain("w-full");
    expect(drawer?.className).toContain("sm:!max-w-[620px]");
    expect(drawer?.textContent).toContain("Entry");
    expect(drawer?.textContent).toContain("Private Journal review");
    expect(screen.getByAltText("Private chart screenshot: private-chart.png")).toBeTruthy();
    expect(screen.getByRole("link", { name: /private-chart.png/i }).getAttribute("href")).toBe("https://example.com/private-chart.png");
  });

  it("shows a retryable private Journal error instead of an empty-review message", () => {
    queryState.isError = true;
    queryState.error = new Error("Private Journal request failed");
    render(<TradeDetailDrawer trade={trade} open onOpenChange={vi.fn()} />);

    expect(screen.getByRole("alert").textContent).toContain("Private Journal review could not load");
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(queryState.refetch).toHaveBeenCalledTimes(1);
  });
});

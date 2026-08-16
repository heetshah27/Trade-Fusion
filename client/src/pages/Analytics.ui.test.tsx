// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const overview = {
  summary: { pnl: 125, tradeCount: 3, wins: 2, losses: 1, winRate: 66.67, profitFactor: 1.8, averagePnl: 41.67 },
  setups: [{ key: "London Breakout", tradeCount: 2, wins: 2, losses: 0, winRate: 100, pnl: 140, averagePnl: 70, profitFactor: null }],
  symbols: [{ key: "XAUUSD", tradeCount: 3, wins: 2, losses: 1, winRate: 66.67, pnl: 125, averagePnl: 41.67, profitFactor: 1.8 }],
  directions: [{ key: "Long", tradeCount: 3, wins: 2, losses: 1, winRate: 66.67, pnl: 125, averagePnl: 41.67, profitFactor: 1.8 }],
  sessions: [{ key: "London", tradeCount: 3, wins: 2, losses: 1, winRate: 66.67, pnl: 125, averagePnl: 41.67, profitFactor: 1.8 }],
  weekdays: [{ key: "Friday", tradeCount: 3, wins: 2, losses: 1, winRate: 66.67, pnl: 125, averagePnl: 41.67, profitFactor: 1.8 }],
};

vi.mock("@/lib/trpc", () => ({ trpc: { analytics: { overview: { useQuery: () => ({ data: overview, isLoading: false, error: null, isFetching: false, refetch: vi.fn() }) } } } }));

import Analytics from "./Analytics";

describe("Setup Analytics operating dashboard", () => {
  afterEach(cleanup);

  it("shows live-only signal lanes and private performance comparison panels", () => {
    render(<Analytics />);
    expect(screen.getByText("Strongest current setup")).toBeTruthy();
    expect(screen.getAllByText("London Breakout").length).toBeGreaterThan(1);
    expect(screen.getByText("Highest-volume symbol")).toBeTruthy();
    expect(screen.getByText("Performance by market session")).toBeTruthy();
    expect(screen.getAllByText("Live only").length).toBeGreaterThan(2);
  });
});

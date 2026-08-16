// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ setLocation: vi.fn(), invalidate: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() }));

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: { name: "Avery Trader" }, loading: false, error: null, isAuthenticated: true, logout: vi.fn() }) }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ trades: { list: { invalidate: mocks.invalidate } } }),
    trades: {
      list: { useQuery: () => ({ data: [{ id: 7, date: "2026-08-16", symbol: "XAUUSD", direction: "LONG", entryPrice: 2400, exitPrice: 2405, quantity: 1, pnl: 5, fees: 0, notes: "", setupTag: "London Breakout" }], isLoading: false }) },
      create: { useMutation: () => ({ mutate: mocks.create }) },
      update: { useMutation: () => ({ mutate: mocks.update }) },
      delete: { useMutation: () => ({ mutate: mocks.remove }) },
    },
  },
}));
vi.mock("wouter", () => ({ useLocation: () => ["/app", mocks.setLocation] }));
vi.mock("@/components/TradeStats", () => ({ default: () => <div data-testid="trade-stats">Trade stats</div> }));
vi.mock("@/components/DayRow", () => ({ default: () => <div data-testid="day-row">Day row</div> }));
vi.mock("@/components/AddTradeModal", () => ({ default: ({ open }: { open: boolean }) => open ? <div role="dialog">Trade entry open</div> : null }));

import Home from "./Home";

describe("Journal command center", () => {
  afterEach(() => { cleanup(); Object.values(mocks).forEach(mock => mock.mockReset()); });

  it("renders the private command-center modules and opens the manual log flow", () => {
    render(<Home />);
    expect(screen.getByText("Private command center")).toBeTruthy();
    expect(screen.getByText("Monthly P&L")).toBeTruthy();
    expect(screen.getByText("Recent activity")).toBeTruthy();
    expect(screen.getByRole("button", { name: /open market calendar/i })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /log trade/i }));
    expect(screen.getByRole("dialog").textContent).toContain("Trade entry open");
  });

  it("keeps symbol filter chips and Backtest access within the command center", () => {
    render(<Home />);
    expect(screen.getByRole("button", { name: "XAUUSD" })).toBeTruthy();
    fireEvent.click(screen.getAllByRole("button", { name: /open backtest/i })[0]!);
    expect(mocks.setLocation).toHaveBeenCalled();
  });
});

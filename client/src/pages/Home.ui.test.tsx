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
import Home from "./Home";

describe("Dashboard command center", () => {
  afterEach(() => { cleanup(); Object.values(mocks).forEach(mock => mock.mockReset()); });

  it("renders the private Dashboard modules and routes to the manual Trade flow", () => {
    render(<Home />);
    expect(screen.getByText("Live-trade command center")).toBeTruthy();
    expect(screen.getByText("Recorded performance")).toBeTruthy();
    expect(screen.getByText("Recent activity")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /log trade/i }));
    expect(mocks.setLocation).toHaveBeenCalled();
  });

  it("keeps Journal access within the Dashboard workflow", () => {
    render(<Home />);
    fireEvent.click(screen.getByRole("button", { name: /open journal/i }));
    expect(mocks.setLocation).toHaveBeenCalled();
  });
});

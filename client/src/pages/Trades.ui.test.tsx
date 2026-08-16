// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ setLocation: vi.fn(), invalidate: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() }));

vi.mock("@/lib/trpc", () => ({ trpc: { useUtils: () => ({ trades: { list: { invalidate: mocks.invalidate } } }), trades: { list: { useQuery: () => ({ data: [{ id: 7, date: "2026-08-16", symbol: "XAUUSD", direction: "LONG", entryPrice: 2400, exitPrice: 2405, quantity: 1, pnl: 5, fees: 0, notes: "", setupTag: "London Breakout" }] }) }, create: { useMutation: () => ({ mutate: mocks.create }) }, update: { useMutation: () => ({ mutate: mocks.update }) }, delete: { useMutation: () => ({ mutate: mocks.remove }) } } } }));
vi.mock("wouter", () => ({ useLocation: () => ["/app/trades", mocks.setLocation] }));
vi.mock("@/components/AddTradeModal", () => ({ default: ({ open }: { open: boolean }) => open ? <div role="dialog">Trade entry open</div> : null }));

import Trades from "./Trades";

describe("Trades workspace", () => {
  afterEach(() => { cleanup(); Object.values(mocks).forEach(mock => mock.mockReset()); });
  it("keeps manual trade logging in the dedicated ledger", () => {
    render(<Trades />);
    expect(screen.getByText("Private portfolio ledger")).toBeTruthy();
    expect(screen.getByText("Execution portfolio")).toBeTruthy();
    expect(screen.getByText("Gold")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /add trade/i }));
    expect(screen.getByRole("dialog").textContent).toContain("Trade entry open");
  });
  it("links the live Trade ledger to the private Journal", () => {
    render(<Trades />);
    fireEvent.click(screen.getByRole("button", { name: /trade journal/i }));
    expect(mocks.setLocation).toHaveBeenCalled();
  });
});

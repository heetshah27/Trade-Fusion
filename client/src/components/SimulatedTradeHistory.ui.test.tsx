// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SimulatedTradeHistory } from "./SimulatedTradeHistory";

describe("SimulatedTradeHistory", () => {
  afterEach(cleanup);

  it("lists each private execution with its direction, entry/exit, and net P&L", () => {
    render(<SimulatedTradeHistory onDelete={vi.fn()} trades={[
      { id: 1, date: "2026-08-13", entryAt: "2026-08-13T09:00:00.000Z", exitAt: "2026-08-13T11:00:00.000Z", direction: "LONG", entryPrice: 4400, exitPrice: 4415, pnl: 150, fees: 7.5, rMultiple: 1.5, setupTag: "London continuation" },
      { id: 2, date: "2026-08-13", entryAt: "2026-08-13T13:00:00.000Z", exitAt: "2026-08-13T14:00:00.000Z", direction: "SHORT", entryPrice: 4412, exitPrice: 4420, pnl: -80, fees: 0, rMultiple: -1, setupTag: "Failed retest" },
    ]} />);
    expect(screen.getByRole("region", { name: /simulated trade history/i })).toBeTruthy();
    expect(screen.getByText("London continuation")).toBeTruthy();
    expect(screen.getByText("Failed retest")).toBeTruthy();
    expect(screen.getByText("+$142.50")).toBeTruthy();
    expect(screen.getByText("-$80.00")).toBeTruthy();
    expect(screen.getByText("2 trades")).toBeTruthy();
  });

  it("forwards history delete actions only for the selected private trade", async () => {
    const user = userEvent.setup();
    const removeTrade = vi.fn();
    render(<SimulatedTradeHistory onDelete={removeTrade} trades={[{ id: 8, date: "2026-08-13", entryAt: null, exitAt: null, direction: "LONG", entryPrice: 100, exitPrice: 105, pnl: 5, fees: 0, rMultiple: null, setupTag: "Replay" }]} />);
    await user.click(screen.getByLabelText("Delete simulated trade"));
    expect(removeTrade).toHaveBeenCalledWith(8);
  });
});

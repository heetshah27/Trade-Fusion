// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ invalidate: vi.fn(), upsert: vi.fn(), remove: vi.fn(), upload: vi.fn(), removeAttachment: vi.fn() }));
vi.mock("@/lib/trpc", () => ({ trpc: { useUtils: () => ({ tradeJournal: { byTrade: { invalidate: mocks.invalidate }, list: { invalidate: mocks.invalidate } } }), trades: { list: { useQuery: () => ({ data: [{ id: 7, date: "2026-08-16", symbol: "XAUUSD", direction: "LONG", pnl: 5, setupTag: "London Breakout" }] }) } }, tradeJournal: { byTrade: { useQuery: () => ({ data: null, isLoading: false }) }, list: { useQuery: () => ({ data: [] }) }, upsert: { useMutation: () => ({ mutate: mocks.upsert, isPending: false }) }, delete: { useMutation: () => ({ mutate: mocks.remove }) }, uploadAttachment: { useMutation: () => ({ mutateAsync: mocks.upload, isPending: false }) }, removeAttachment: { useMutation: () => ({ mutate: mocks.removeAttachment, isPending: false }) } } } }));
import TradeJournal from "./TradeJournal";

describe("private trade Journal", () => {
  afterEach(() => { cleanup(); Object.values(mocks).forEach(mock => mock.mockReset()); });
  it("links a private reflection form to a member-owned live trade", () => {
    render(<TradeJournal />);
    expect(screen.getByText("Private trade notes")).toBeTruthy();
    expect(screen.getByText("Linked live trade")).toBeTruthy();
    fireEvent.change(screen.getByPlaceholderText(/thesis, level, or trigger/i), { target: { value: "London liquidity sweep." } });
    fireEvent.click(screen.getByRole("button", { name: /save private journal/i }));
    expect(mocks.upsert).toHaveBeenCalledWith(expect.objectContaining({ tradeId: 7, tradeIdea: "London liquidity sweep." }));
  });

  it("shows screenshot constraints and requires a saved private Journal entry before upload", () => {
    render(<TradeJournal />);
    expect(screen.getByText("Chart screenshots")).toBeTruthy();
    expect(screen.getByText(/PNG, JPG, or WebP/i)).toBeTruthy();
    expect(screen.getByText("Save to attach")).toBeTruthy();
  });
});

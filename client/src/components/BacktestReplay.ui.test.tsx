// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ markers: vi.fn(), setData: vi.fn() }));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    replay: {
      candles: {
        useQuery: () => ({ data: { candles: [
          { time: 1_785_888_000, open: 95, high: 101, low: 94, close: 100 },
          { time: 1_786_579_200, open: 100, high: 106, low: 99, close: 104 },
          { time: 1_786_582_800, open: 104, high: 110, low: 103, close: 108 },
        ], sourceStatus: "live", note: "Public source-backed crypto candle data.", source: "Kraken public OHLC" }, isFetching: false }),
      },
    },
  },
}));

vi.mock("lightweight-charts", () => ({
  CandlestickSeries: "Candlestick",
  ColorType: { Solid: "solid" },
  createChart: () => ({ addSeries: () => ({ setData: mocks.setData }), timeScale: () => ({ fitContent: vi.fn() }), applyOptions: vi.fn(), remove: vi.fn() }),
  createSeriesMarkers: (_series: unknown, markers: unknown[]) => { mocks.markers(markers); return {}; },
}));

class ResizeObserverMock { observe() {} disconnect() {} }
vi.stubGlobal("ResizeObserver", ResizeObserverMock);

import { BacktestReplay } from "./BacktestReplay";

describe("BacktestReplay", () => {
  afterEach(cleanup);

  it("labels source-backed crypto replay and creates overlays for simulated trades", () => {
    render(<BacktestReplay session={{ symbol: "BTCUSD", timeframe: "1H", trades: [{ id: 1, date: "2026-08-13", entryAt: "2026-08-13T00:00:00.000Z", exitAt: "2026-08-13T01:00:00.000Z", direction: "LONG", entryPrice: 100, exitPrice: 108, pnl: 8, fees: 0 }] }} />);
    expect(screen.getByText("Historical replay")).toBeTruthy();
    expect(screen.getByText("Source-backed")).toBeTruthy();
    expect(screen.getByLabelText("Replay symbol")).toBeTruthy();
    expect(screen.getByLabelText("Replay date range")).toBeTruthy();
    expect(screen.getByText("▲ Simulated entry")).toBeTruthy();
    expect(screen.getByText("● Simulated exit")).toBeTruthy();
    expect(screen.getByLabelText("Play replay")).toBeTruthy();
    expect(mocks.setData).toHaveBeenCalled();
    expect(mocks.markers).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ text: "LONG entry" })]));
    expect(mocks.markers).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ text: "Exit +8.00" })]));
    const markers = mocks.markers.mock.calls.at(-1)?.[0] as Array<{ text: string; time: number }>;
    const entryMarker = markers.find(marker => marker.text === "LONG entry");
    const exitMarker = markers.find(marker => marker.text === "Exit +8.00");
    expect(entryMarker?.time).not.toBe(exitMarker?.time);
  });

  it("retains markers on their saved filtered entry and exit candles", async () => {
    const user = userEvent.setup();
    render(<BacktestReplay session={{ symbol: "BTCUSD", timeframe: "1H", trades: [{ id: 2, date: "2026-08-13", entryAt: "2026-08-13T00:00:00.000Z", exitAt: "2026-08-13T01:00:00.000Z", direction: "SHORT", entryPrice: 104, exitPrice: 100, pnl: 4, fees: 0 }] }} />);
    await user.selectOptions(screen.getByLabelText("Replay date range"), "7");
    const markers = mocks.markers.mock.calls.at(-1)?.[0] as Array<{ text: string; time: number }>;
    expect(markers).toEqual(expect.arrayContaining([
      expect.objectContaining({ text: "SHORT entry", time: 1_786_579_200 }),
      expect.objectContaining({ text: "Exit +4.00", time: 1_786_582_800 }),
    ]));
    expect(markers.some(marker => marker.time === 1_785_888_000)).toBe(false);
  });
});

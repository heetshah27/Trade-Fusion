// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ markers: vi.fn(), setData: vi.fn() }));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    replay: {
      candles: {
        useQuery: () => ({ data: { candles: [
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
    render(<BacktestReplay session={{ symbol: "BTCUSD", timeframe: "1H", trades: [{ id: 1, date: "2026-08-13", direction: "LONG", entryPrice: 100, exitPrice: 108, pnl: 8, fees: 0 }] }} />);
    expect(screen.getByText("Historical replay")).toBeTruthy();
    expect(screen.getByText("Source-backed")).toBeTruthy();
    expect(screen.getByLabelText("Replay symbol")).toBeTruthy();
    expect(screen.getByLabelText("Play replay")).toBeTruthy();
    expect(mocks.setData).toHaveBeenCalled();
    expect(mocks.markers).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ text: "LONG entry" })]));
  });
});

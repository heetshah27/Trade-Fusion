// @vitest-environment jsdom
import React from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ markers: vi.fn(), setData: vi.fn(), createChart: vi.fn(), createAnnotation: vi.fn(), updateAnnotation: vi.fn(), createTrade: vi.fn(), refetchAnnotations: vi.fn(), invalidateSession: vi.fn(), toastMessage: vi.fn(), annotations: [] as Array<{ id: number; sessionId: number; kind: "support" | "resistance" | "trendline" | "zone"; price: number; endPrice: number | null; startAt: string | null; endAt: string | null; label: string; createdAt: string }>, chartClickHandler: undefined as undefined | ((param: { time: number; point: { x: number; y: number } }) => void) }));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), message: mocks.toastMessage } }));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ backtest: { getSession: { invalidate: mocks.invalidateSession } } }),
    replay: {
      candles: {
        useQuery: () => ({ data: { candles: [
          { time: 1_785_888_000, open: 95, high: 101, low: 94, close: 100 },
          { time: 1_786_579_200, open: 100, high: 106, low: 99, close: 104 },
          { time: 1_786_582_800, open: 104, high: 110, low: 103, close: 108 },
        ], sourceStatus: "live", note: "Public source-backed crypto candle data.", source: "Kraken public OHLC" }, isFetching: false }),
      },
    },
    backtest: {
      listAnnotations: { useQuery: () => ({ data: mocks.annotations, refetch: mocks.refetchAnnotations }) },
      createAnnotation: { useMutation: () => ({ mutate: mocks.createAnnotation, isPending: false }) },
      updateAnnotation: { useMutation: () => ({ mutate: mocks.updateAnnotation, isPending: false }) },
      deleteAnnotation: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      createTrade: { useMutation: () => ({ mutate: mocks.createTrade, isPending: false }) },
    },
  },
}));

vi.mock("lightweight-charts", () => ({
  CandlestickSeries: "Candlestick",
  ColorType: { Solid: "solid" },
  createChart: () => { mocks.createChart(); return { addSeries: () => ({ setData: mocks.setData, createPriceLine: vi.fn(), coordinateToPrice: (coordinate: number) => 2400 + coordinate, priceToCoordinate: (price: number) => 2600 - price }), timeScale: () => ({ fitContent: vi.fn(), timeToCoordinate: (time: number) => time % 1000, coordinateToTime: (coordinate: number) => coordinate < 50 ? 1_786_579_200 : 1_786_582_800, subscribeVisibleTimeRangeChange: vi.fn(), unsubscribeVisibleTimeRangeChange: vi.fn() }), subscribeClick: (handler: (param: { time: number; point: { x: number; y: number } }) => void) => { mocks.chartClickHandler = handler; }, unsubscribeClick: vi.fn(), takeScreenshot: () => document.createElement("canvas"), applyOptions: vi.fn(), remove: vi.fn() }; },
  createSeriesMarkers: (_series: unknown, markers: unknown[]) => { mocks.markers(markers); return {}; },
}));

class ResizeObserverMock { observe() {} disconnect() {} }
vi.stubGlobal("ResizeObserver", ResizeObserverMock);

import { BacktestReplay } from "./BacktestReplay";

describe("BacktestReplay", () => {
  afterEach(() => { cleanup(); mocks.annotations = []; mocks.chartClickHandler = undefined; vi.clearAllMocks(); });

  it("labels source-backed crypto replay and creates overlays for simulated trades", () => {
    render(<BacktestReplay session={{ id: 1, symbol: "BTCUSD", timeframe: "1H", trades: [{ id: 1, date: "2026-08-13", entryAt: "2026-08-13T00:00:00.000Z", exitAt: "2026-08-13T01:00:00.000Z", direction: "LONG", entryPrice: 100, exitPrice: 108, pnl: 8, fees: 0 }] }} />);
    expect(screen.getByText("Historical replay")).toBeTruthy();
    expect(screen.getByText("Source-backed")).toBeTruthy();
    expect(screen.getByLabelText("Replay symbol")).toBeTruthy();
    expect(screen.getByLabelText("Replay date range")).toBeTruthy();
    expect(screen.getByText("▲ Simulated entry")).toBeTruthy();
    expect(screen.getByText("● Simulated exit")).toBeTruthy();
    expect(screen.getByText("Chart drawings")).toBeTruthy();
    expect(screen.getByLabelText("Annotation kind")).toBeTruthy();
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
    render(<BacktestReplay session={{ id: 2, symbol: "BTCUSD", timeframe: "1H", trades: [{ id: 2, date: "2026-08-13", entryAt: "2026-08-13T00:00:00.000Z", exitAt: "2026-08-13T01:00:00.000Z", direction: "SHORT", entryPrice: 104, exitPrice: 100, pnl: 4, fees: 0 }] }} />);
    await user.selectOptions(screen.getByLabelText("Replay date range"), "7");
    const markers = mocks.markers.mock.calls.at(-1)?.[0] as Array<{ text: string; time: number }>;
    expect(markers).toEqual(expect.arrayContaining([
      expect.objectContaining({ text: "SHORT entry", time: 1_786_579_200 }),
      expect.objectContaining({ text: "Exit +4.00", time: 1_786_582_800 }),
    ]));
    expect(markers.some(marker => marker.time === 1_785_888_000)).toBe(false);
  });

  it("keeps the chart instance stable while replay advances through candles", async () => {
    vi.useFakeTimers();
    try {
      render(<BacktestReplay session={{ id: 22, symbol: "BTCUSD", timeframe: "1H", trades: [] }} />);
      const chartsBeforeReplay = mocks.createChart.mock.calls.length;
      fireEvent.click(screen.getByRole("button", { name: /play replay/i }));
      await act(async () => { vi.advanceTimersByTime(1_400); });
      expect(mocks.createChart).toHaveBeenCalledTimes(chartsBeforeReplay);
    } finally {
      vi.useRealTimers();
    }
  });

  it("captures a private chart snapshot locally and triggers its download", () => {
    const drawImage = vi.fn();
    const fillRect = vi.fn();
    const strokeRect = vi.fn();
    const getContext = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({ drawImage, fillRect, strokeRect, set fillStyle(_value: string) {}, set strokeStyle(_value: string) {}, set lineWidth(_value: number) {} } as unknown as CanvasRenderingContext2D);
    const toDataUrl = vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue("data:image/png;base64,private-chart");
    const download = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    try {
      render(<BacktestReplay session={{ id: 23, symbol: "BTCUSD", timeframe: "1H", trades: [] }} />);
      fireEvent.click(screen.getByLabelText("Download private chart snapshot"));
      expect(drawImage).toHaveBeenCalled();
      expect(toDataUrl).toHaveBeenCalledWith("image/png");
      expect(download).toHaveBeenCalled();
    } finally {
      getContext.mockRestore();
      toDataUrl.mockRestore();
      download.mockRestore();
    }
  });

  it("creates a private support or resistance level for the selected session", async () => {
    const user = userEvent.setup();
    render(<BacktestReplay session={{ id: 7, symbol: "XAUUSD", timeframe: "15m", trades: [] }} />);
    await user.selectOptions(screen.getByLabelText("Annotation kind"), "resistance");
    await user.type(screen.getByLabelText("Annotation price"), "2425.5");
    await user.type(screen.getByLabelText("Annotation label"), "London high");
    await user.click(screen.getByRole("button", { name: /add level/i }));
    expect(mocks.createAnnotation).toHaveBeenCalledWith({ sessionId: 7, kind: "resistance", price: 2425.5, label: "London high" });
  });

  it("exposes focused chart controls and saves a point-based simulated execution", async () => {
    const user = userEvent.setup();
    render(<BacktestReplay session={{ id: 11, symbol: "BTCUSD", timeframe: "1H", trades: [] }} />);
    expect(screen.getByLabelText("Open full screen chart")).toBeTruthy();
    expect(screen.getByLabelText("Download private chart snapshot")).toBeTruthy();
    expect(screen.getByText("Simulated execution")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /tools/i }));
    expect(screen.getByRole("menuitem", { name: /trendline/i })).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: /zone rectangle/i })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /^sell/i }));
    expect((screen.getByLabelText("Execution direction") as HTMLSelectElement).value).toBe("SHORT");
    await user.click(screen.getByRole("button", { name: /^buy/i }));
    expect((screen.getByLabelText("Execution direction") as HTMLSelectElement).value).toBe("LONG");
    expect(screen.getByTestId("execution-quote-controls")).toBeTruthy();
    await user.clear(screen.getByLabelText("Execution entry price"));
    await user.type(screen.getByLabelText("Execution entry price"), "100");
    await user.clear(screen.getByLabelText("Execution exit price"));
    await user.type(screen.getByLabelText("Execution exit price"), "110");
    await user.click(screen.getByRole("button", { name: /save simulated trade/i }));
    expect(mocks.createTrade).toHaveBeenCalledWith(expect.objectContaining({ sessionId: 11, direction: "LONG", entryPrice: "100", exitPrice: "110" }));
  });

  it("prepares a direct Buy with an exit time after the replay entry so it can save", async () => {
    const user = userEvent.setup();
    render(<BacktestReplay session={{ id: 18, symbol: "BTCUSD", timeframe: "1H", status: "active", trades: [] }} />);
    await user.click(screen.getByRole("button", { name: /^buy/i }));
    await user.click(screen.getByRole("button", { name: /save simulated trade/i }));
    const payload = mocks.createTrade.mock.calls.at(-1)?.[0] as { entryAt: string; exitAt: string; sessionId: number };
    expect(payload.sessionId).toBe(18);
    expect(Date.parse(payload.exitAt)).toBeGreaterThan(Date.parse(payload.entryAt));
  });

  it("creates a private supply/demand zone by dragging smoothly across an active chart", async () => {
    const user = userEvent.setup();
    render(<BacktestReplay session={{ id: 12, symbol: "BTCUSD", timeframe: "1H", status: "active", trades: [] }} />);
    await user.click(screen.getByRole("button", { name: /tools/i }));
    await user.click(screen.getByRole("menuitem", { name: /zone rectangle/i }));
    const chart = screen.getByTestId("historical-replay-chart");
    Object.defineProperty(chart, "getBoundingClientRect", { value: () => ({ left: 0, top: 0, width: 300, height: 410, right: 300, bottom: 410 }) });
    fireEvent.pointerDown(chart, { clientX: 20, clientY: 10, button: 0, pointerId: 1 });
    fireEvent.pointerMove(chart, { clientX: 90, clientY: 30, pointerId: 1 });
    expect(screen.getByTestId("supply-demand-zone")).toBeTruthy();
    fireEvent.pointerUp(chart, { clientX: 90, clientY: 30, pointerId: 1 });
    await waitFor(() => expect(mocks.createAnnotation).toHaveBeenCalledWith(expect.objectContaining({ sessionId: 12, kind: "zone", price: 2410, endPrice: 2430, startAt: "2026-08-13T00:00:00.000Z", endAt: "2026-08-13T01:00:00.000Z" })));
  });

  it("stores an optional partial target and its closed quantity with a Buy or Sell simulation", async () => {
    const user = userEvent.setup();
    render(<BacktestReplay session={{ id: 15, symbol: "BTCUSD", timeframe: "1H", status: "active", trades: [] }} />);
    await user.clear(screen.getByLabelText("Execution entry price"));
    await user.type(screen.getByLabelText("Execution entry price"), "100");
    await user.clear(screen.getByLabelText("Execution exit price"));
    await user.type(screen.getByLabelText("Execution exit price"), "110");
    await user.type(screen.getByLabelText("Partial take-profit price"), "108");
    await user.type(screen.getByLabelText("Partial take-profit quantity"), "0.5");
    await user.click(screen.getByRole("button", { name: /save simulated trade/i }));
    expect(mocks.createTrade).toHaveBeenCalledWith(expect.objectContaining({ sessionId: 15, takeProfit: "108", takeProfitQuantity: "0.5" }));
  });

  it("guides members when a partial target is incomplete instead of silently leaving the execution invalid", async () => {
    const user = userEvent.setup();
    render(<BacktestReplay session={{ id: 17, symbol: "BTCUSD", timeframe: "1H", status: "active", trades: [] }} />);
    await user.type(screen.getByLabelText("Partial take-profit price"), "108");
    await waitFor(() => expect(mocks.toastMessage).toHaveBeenCalledWith(expect.stringMatching(/partial target/i)));
  });

  it("renders a persisted supply/demand zone as a visible time-bounded rectangle", async () => {
    mocks.annotations = [{ id: 48, sessionId: 14, kind: "zone", price: 2410, endPrice: 2430, startAt: "2026-08-13T00:00:00.000Z", endAt: "2026-08-13T01:00:00.000Z", label: "London demand", createdAt: "2026-08-13T02:00:00.000Z" }];
    render(<BacktestReplay session={{ id: 14, symbol: "BTCUSD", timeframe: "1H", status: "active", trades: [] }} />);
    await waitFor(() => expect(screen.getByTestId("supply-demand-zone")).toBeTruthy());
    expect(screen.getByTestId("supply-demand-zone").getAttribute("title")).toBe("London demand");
  });

  it("persists a zone resize from a direct corner handle without recreating the chart", async () => {
    mocks.annotations = [{ id: 49, sessionId: 16, kind: "zone", price: 2410, endPrice: 2430, startAt: "2026-08-13T00:00:00.000Z", endAt: "2026-08-13T01:00:00.000Z", label: "New York supply", createdAt: "2026-08-13T02:00:00.000Z" }];
    render(<BacktestReplay session={{ id: 16, symbol: "BTCUSD", timeframe: "1H", status: "active", trades: [] }} />);
    await waitFor(() => expect(screen.getByTestId("zone-resize-handle-nw")).toBeTruthy());
    const chart = screen.getByTestId("historical-replay-chart");
    Object.defineProperty(chart, "getBoundingClientRect", { value: () => ({ left: 0, top: 0, width: 300, height: 410, right: 300, bottom: 410 }) });
    fireEvent.pointerDown(screen.getByTestId("zone-resize-handle-nw"), { clientX: 20, clientY: 10, button: 0, pointerId: 1 });
    fireEvent.pointerMove(chart, { clientX: 20, clientY: 15, pointerId: 1 });
    fireEvent.pointerUp(chart, { clientX: 20, clientY: 15, pointerId: 1 });
    await waitFor(() => expect(mocks.updateAnnotation).toHaveBeenCalledWith(expect.objectContaining({ id: 49, price: 2410, endPrice: 2415, label: "New York supply" })));
  });

  it("makes archived Backtest charts visibly read-only instead of accepting drawing clicks", async () => {
    const user = userEvent.setup();
    render(<BacktestReplay session={{ id: 13, symbol: "BTCUSD", timeframe: "1H", status: "archived", trades: [] }} />);
    expect(screen.getByRole("status").textContent).toMatch(/archived/i);
    await user.click(screen.getByRole("button", { name: /tools/i }));
    expect((screen.getByRole("menuitem", { name: /zone rectangle/i }) as HTMLButtonElement).disabled).toBe(true);
  });
});

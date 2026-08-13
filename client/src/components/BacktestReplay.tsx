import React, { useEffect, useMemo, useRef, useState } from "react";
import { CandlestickSeries, ColorType, createChart, createSeriesMarkers, LineSeries, type IChartApi, type MouseEventParams, type Time, type UTCTimestamp } from "lightweight-charts";
import { BoxSelect, Calculator, Camera, ChevronLeft, ChevronRight, CirclePause, CirclePlay, Crosshair, Layers3, Maximize2, Menu, Minimize2, Minus, MousePointer2, Plus, StepForward, Target, Trash2, TrendingUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { filterReplayRange, replayDateLabel, toReplayInterval, toReplaySymbol, type ReplayInterval } from "@/lib/replay";
import { toast } from "sonner";

type ReplayTrade = { id: number; date: string; entryAt: string | null; exitAt: string | null; direction: "LONG" | "SHORT"; entryPrice: number; exitPrice: number; quantity?: number; pnl: number; fees: number };
type ReplaySession = { id: number; symbol: string; timeframe: string; status?: "active" | "archived"; trades: ReplayTrade[] };
type ReplayAnnotation = { id: number; sessionId: number; kind: "support" | "resistance" | "trendline" | "zone"; price: number; endPrice: number | null; startAt: string | null; endAt: string | null; label: string; createdAt: string };
type DrawingTool = "none" | "trendline" | "zone";
type ChartAnchor = { time: number; price: number };
type ZoneBox = { id: number; label: string; left: number; top: number; width: number; height: number };
type ZoneGeometry = { price: number; endPrice: number; startAt: string; endAt: string };
type ZoneCorner = "nw" | "ne" | "sw" | "se";
type CreateAnnotationInput = { sessionId: number; kind: "support" | "resistance" | "trendline" | "zone"; price: number; endPrice?: number | null; startAt?: string | null; endAt?: string | null; label?: string };
type UpdateAnnotationInput = { id: number; price: number; endPrice?: number | null; startAt?: string | null; endAt?: string | null; label?: string };

const pairs = ["BTCUSD", "ETHUSD", "SOLUSD", "EURUSD", "GBPUSD", "USDJPY", "XAUUSD"] as const;
const intervals: ReplayInterval[] = ["1m", "5m", "15m", "30m", "1h", "4h", "1d"];
const goldIntervals: ReplayInterval[] = ["15m", "1h", "1d"];

function markerTimeForValue(candles: Array<{ time: number }>, value: string) {
  const target = Date.parse(value.includes("T") ? value : `${value}T23:59:59Z`) / 1000;
  const matching = [...candles].reverse().find(candle => candle.time <= target);
  return matching?.time ?? null;
}

function timestampToIso(value: number) {
  return new Date(value * 1000).toISOString();
}

function pointPrice(point: { close?: number; value?: number } | undefined) {
  if (!point) return null;
  return "close" in point ? point.close ?? null : point.value ?? null;
}

function localDateTime(value: number) {
  return new Date(value * 1000).toISOString().slice(0, 16);
}

function normalizedZoneGeometry(first: ChartAnchor, second: ChartAnchor): ZoneGeometry {
  return {
    price: Math.min(first.price, second.price),
    endPrice: Math.max(first.price, second.price),
    startAt: timestampToIso(Math.min(first.time, second.time)),
    endAt: timestampToIso(Math.max(first.time, second.time)),
  };
}

function DrawingButton({ active, children, disabled = false, onClick, onSnapshot }: { active: boolean; children: React.ReactNode; disabled?: boolean; onClick: () => void; onSnapshot: () => void }) {
  return <><Button type="button" size="sm" variant="outline" disabled={disabled} onClick={onClick} className={`border-blue-200/[0.12] ${active ? "bg-violet-400/20 text-violet-100" : "bg-transparent text-slate-300"}`}>{children}</Button><Button type="button" size="sm" variant="outline" aria-label="Download private chart snapshot" onClick={onSnapshot} className="border-sky-300/30 bg-sky-400/10 text-sky-100"><Camera className="mr-1 h-3.5 w-3.5" /> Snapshot</Button></>;
}

export function BacktestReplay({ session }: { session: ReplaySession }) {
  const initialSymbol = toReplaySymbol(session.symbol);
  const [symbol, setSymbol] = useState<(typeof pairs)[number]>(initialSymbol ?? "BTCUSD");
  const [interval, setInterval] = useState<ReplayInterval>(toReplayInterval(session.timeframe));
  const [rangeDays, setRangeDays] = useState<number | null>(null);
  const [cursor, setCursor] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isToolPaletteOpen, setIsToolPaletteOpen] = useState(false);
  const [drawingTool, setDrawingTool] = useState<DrawingTool>("none");
  const [pendingAnchor, setPendingAnchor] = useState<ChartAnchor | null>(null);
  const [annotationKind, setAnnotationKind] = useState<"support" | "resistance">("support");
  const [annotationPrice, setAnnotationPrice] = useState("");
  const [annotationLabel, setAnnotationLabel] = useState("");
  const [executionDirection, setExecutionDirection] = useState<"LONG" | "SHORT">("LONG");
  const [executionEntry, setExecutionEntry] = useState("");
  const [executionExit, setExecutionExit] = useState("");
  const [executionQuantity, setExecutionQuantity] = useState("1");
  const [executionRisk, setExecutionRisk] = useState("");
  const [executionTakeProfit, setExecutionTakeProfit] = useState("");
  const [executionTakeProfitQuantity, setExecutionTakeProfitQuantity] = useState("");
  const [executionFees, setExecutionFees] = useState("0");
  const [executionSetup, setExecutionSetup] = useState("Replay execution");
  const [executionEntryAt, setExecutionEntryAt] = useState("");
  const [executionExitAt, setExecutionExitAt] = useState("");
  const [executionInitialized, setExecutionInitialized] = useState(false);
  const [zoneBoxes, setZoneBoxes] = useState<ZoneBox[]>([]);
  const [zonePreview, setZonePreview] = useState<ZoneBox | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);
  const chartContainer = useRef<HTMLDivElement | null>(null);
  const fullscreenContainer = useRef<HTMLElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const priceSeriesRef = useRef<{ coordinateToPrice: (coordinate: number) => number | null; priceToCoordinate: (price: number) => number | null } | null>(null);
  const drawingToolRef = useRef<DrawingTool>("none");
  const pendingAnchorRef = useRef<ChartAnchor | null>(null);
  const archivedRef = useRef(false);
  const createAnnotationMutateRef = useRef<(input: CreateAnnotationInput) => void>(() => undefined);
  const updateAnnotationMutateRef = useRef<(input: UpdateAnnotationInput) => void>(() => undefined);
  const zoneGeometryToBoxRef = useRef<(geometry: ZoneGeometry, id: number, label: string) => ZoneBox | null>(() => null);
  const pointToAnchorRef = useRef<(clientX: number, clientY: number) => ChartAnchor | null>(() => null);
  const zoneDragStartRef = useRef<ChartAnchor | null>(null);
  const zoneResizeRef = useRef<{ annotation: ReplayAnnotation; corner: ZoneCorner } | null>(null);
  const executionValidationNoticeRef = useRef<string | null>(null);
  const utils = trpc.useUtils();
  const { data, isFetching } = trpc.replay.candles.useQuery({ symbol, interval }, { refetchOnWindowFocus: false, retry: false });
  const annotationsQuery = trpc.backtest.listAnnotations.useQuery({ sessionId: session.id });
  const createAnnotation = trpc.backtest.createAnnotation.useMutation({ onSuccess: () => { annotationsQuery.refetch(); setAnnotationLabel(""); setPendingAnchor(null); setDrawingTool("none"); } });
  const updateAnnotation = trpc.backtest.updateAnnotation.useMutation({ onSuccess: () => { annotationsQuery.refetch(); setZonePreview(null); setSelectedZoneId(null); } });
  const deleteAnnotation = trpc.backtest.deleteAnnotation.useMutation({ onSuccess: () => annotationsQuery.refetch() });
  const createTrade = trpc.backtest.createTrade.useMutation({
    onSuccess: () => {
      utils.backtest.getSession.invalidate({ id: session.id });
      toast.success("Private simulated trade saved to this Backtest session.");
    },
    onError: error => toast.error(error.message || "The simulated trade could not be saved. Check the execution details and try again."),
  });
  const annotations = annotationsQuery.data ?? [];
  const archived = session.status === "archived";
  const candles = data?.candles ?? [];
  const prices = data?.prices ?? [];
  const chartPoints = data?.seriesType === "line" ? prices : candles;
  const filteredCandles = useMemo(() => filterReplayRange(candles, rangeDays), [candles, rangeDays]);
  const filteredPrices = useMemo(() => filterReplayRange(prices, rangeDays), [prices, rangeDays]);
  const filteredPoints = data?.seriesType === "line" ? filteredPrices : filteredCandles;

  useEffect(() => {
    if (symbol === "XAUUSD" && !goldIntervals.includes(interval)) setInterval("1h");
  }, [symbol, interval]);

  useEffect(() => {
    setCursor(Math.max(0, filteredPoints.length - 1));
    setPlaying(false);
    setPendingAnchor(null);
    setExecutionInitialized(false);
  }, [symbol, interval, rangeDays, filteredPoints.length]);

  useEffect(() => {
    if (!archived) return;
    setDrawingTool("none");
    setPendingAnchor(null);
  }, [archived]);

  useEffect(() => {
    drawingToolRef.current = drawingTool;
    pendingAnchorRef.current = pendingAnchor;
    archivedRef.current = archived;
  }, [drawingTool, pendingAnchor]);

  useEffect(() => { createAnnotationMutateRef.current = createAnnotation.mutate; }, [createAnnotation.mutate]);
  useEffect(() => { updateAnnotationMutateRef.current = updateAnnotation.mutate; }, [updateAnnotation.mutate]);

  useEffect(() => {
    if (!playing || cursor >= filteredPoints.length - 1) { if (cursor >= filteredPoints.length - 1) setPlaying(false); return; }
    const timer = window.setInterval(() => setCursor(current => Math.min(current + 1, filteredPoints.length - 1)), 650);
    return () => window.clearInterval(timer);
  }, [playing, cursor, filteredPoints.length]);

  useEffect(() => {
    const handleFullscreen = () => setIsFullscreen(document.fullscreenElement === fullscreenContainer.current);
    document.addEventListener("fullscreenchange", handleFullscreen);
    return () => document.removeEventListener("fullscreenchange", handleFullscreen);
  }, []);

  const visibleCandles = filteredCandles;
  const visiblePrices = filteredPrices;
  const visibleTimes = data?.seriesType === "line" ? visiblePrices : visibleCandles;
  const visibleTrades = useMemo(() => session.trades.filter(trade => markerTimeForValue(visibleTimes, trade.entryAt ?? trade.date) !== null || markerTimeForValue(visibleTimes, trade.exitAt ?? trade.date) !== null), [session.trades, visibleTimes]);
  const current = filteredPoints[cursor];
  const currentPrice = pointPrice(current);
  const quoteDecimals = symbol === "XAUUSD" || (currentPrice ?? 0) >= 1_000 ? 2 : 5;
  const quoteSpread = Math.max((currentPrice ?? 0) * 0.00004, quoteDecimals === 2 ? 0.01 : 0.00001);
  const sellQuote = currentPrice === null ? null : currentPrice - quoteSpread / 2;
  const buyQuote = currentPrice === null ? null : currentPrice + quoteSpread / 2;

  useEffect(() => {
    if (!current || currentPrice === null || executionInitialized) return;
    setExecutionEntry(String(currentPrice));
    setExecutionExit(String(currentPrice));
    setExecutionEntryAt(localDateTime(current.time));
    setExecutionExitAt(localDateTime(current.time));
    setExecutionInitialized(true);
  }, [current, currentPrice, executionInitialized]);

  const executionPreview = useMemo(() => {
    const entry = Number(executionEntry);
    const exit = Number(executionExit);
    const quantity = Number(executionQuantity);
    const fees = Number(executionFees || 0);
    if (![entry, exit, quantity, fees].every(Number.isFinite) || quantity <= 0) return null;
    const partialPriceEntered = executionTakeProfit.trim() !== "";
    const partialQuantityEntered = executionTakeProfitQuantity.trim() !== "";
    if (partialPriceEntered !== partialQuantityEntered) return null;
    const partialPrice = partialPriceEntered ? Number(executionTakeProfit) : null;
    const partialQuantity = partialQuantityEntered ? Number(executionTakeProfitQuantity) : 0;
    if ((partialPrice !== null && !Number.isFinite(partialPrice)) || !Number.isFinite(partialQuantity) || partialQuantity < 0 || partialQuantity > quantity) return null;
    const directionalResult = (price: number, size: number) => executionDirection === "LONG" ? (price - entry) * size : (entry - price) * size;
    const gross = directionalResult(exit, quantity - partialQuantity) + (partialPrice === null ? 0 : directionalResult(partialPrice, partialQuantity));
    const risk = Number(executionRisk);
    const riskAmount = Number.isFinite(risk) ? Math.abs(entry - risk) * quantity : null;
    return { gross, net: gross - fees, partialPrice, partialQuantity, riskAmount, rMultiple: riskAmount && riskAmount > 0 ? (gross - fees) / riskAmount : null };
  }, [executionDirection, executionEntry, executionExit, executionQuantity, executionFees, executionRisk, executionTakeProfit, executionTakeProfitQuantity]);

  useEffect(() => {
    const hasExecutionInput = Boolean(executionEntry || executionExit || executionQuantity || executionTakeProfit || executionTakeProfitQuantity);
    if (!hasExecutionInput || executionPreview) { executionValidationNoticeRef.current = null; return; }
    const message = "Complete a valid entry, final exit, and positive quantity. If using a partial target, enter both its price and quantity.";
    if (executionValidationNoticeRef.current === message) return;
    executionValidationNoticeRef.current = message;
    toast.message(message);
  }, [executionEntry, executionExit, executionQuantity, executionTakeProfit, executionTakeProfitQuantity, executionPreview]);

  const saveExecution = () => {
    if (archived) { toast.error("Reopen this strategy before recording a private simulation."); return; }
    if (!executionPreview) { toast.error("Enter a valid entry, final exit, quantity, and complete both partial target fields if you use them."); return; }
    if (!executionEntryAt || !executionExitAt || !current) { toast.error("Choose a replay entry and exit point before saving the simulation."); return; }
    const entryDate = new Date(executionEntryAt);
    const exitDate = new Date(executionExitAt);
    if (Number.isNaN(entryDate.valueOf()) || Number.isNaN(exitDate.valueOf())) { toast.error("Use valid replay timestamps for the entry and exit."); return; }
    createTrade.mutate({
      sessionId: session.id,
      date: entryDate.toISOString().slice(0, 10),
      entryAt: entryDate.toISOString(),
      exitAt: exitDate.toISOString(),
      direction: executionDirection,
      entryPrice: executionEntry,
      exitPrice: executionExit,
      quantity: executionQuantity,
      stopLoss: executionRisk || null,
      takeProfit: executionTakeProfit || null,
      takeProfitQuantity: executionTakeProfitQuantity || null,
      fees: executionFees || 0,
      setupTag: executionSetup || "Chart execution",
      notes: "Created from the private historical replay chart.",
    });
  };

  const prepareMarketExecution = (direction: "LONG" | "SHORT") => {
    if (!current || currentPrice === null || archived) return;
    const nextReplayPoint = visibleTimes.find(point => point.time > current.time);
    const exitTime = nextReplayPoint?.time ?? current.time + 60;
    setExecutionDirection(direction);
    setExecutionEntry(String(currentPrice));
    setExecutionEntryAt(localDateTime(current.time));
    setExecutionExitAt(localDateTime(exitTime));
    if (!executionExit) setExecutionExit(String(pointPrice(nextReplayPoint) ?? currentPrice));
  };

  const addReplayLevel = (kind: "support" | "resistance") => {
    if (currentPrice === null || archived || createAnnotation.isPending) return;
    createAnnotation.mutate({ sessionId: session.id, kind, price: currentPrice, label: kind === "support" ? "Replay support" : "Replay resistance" });
    setIsToolPaletteOpen(false);
  };

  const beginZoneResize = (event: React.PointerEvent<HTMLButtonElement>, annotation: ReplayAnnotation, corner: ZoneCorner) => {
    if (archived || annotation.endPrice === null || !annotation.startAt || !annotation.endAt) return;
    event.preventDefault();
    event.stopPropagation();
    setSelectedZoneId(annotation.id);
    zoneResizeRef.current = { annotation, corner };
    const preview = zoneGeometryToBoxRef.current({ price: annotation.price, endPrice: annotation.endPrice, startAt: annotation.startAt, endAt: annotation.endAt }, annotation.id, annotation.label || "Supply / demand zone");
    setZonePreview(preview);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const toggleFullscreen = async () => {
    if (!fullscreenContainer.current) return;
    if (document.fullscreenElement) await document.exitFullscreen();
    else await fullscreenContainer.current.requestFullscreen();
  };

  const captureChartSnapshot = () => {
    const chartCanvas = chartRef.current?.takeScreenshot(true, true);
    const container = chartContainer.current;
    if (!chartCanvas || !container) { toast.error("Load a chart before capturing a private snapshot."); return; }
    const output = document.createElement("canvas");
    output.width = chartCanvas.width;
    output.height = chartCanvas.height;
    const context = output.getContext("2d");
    if (!context) { toast.error("Your browser could not prepare this chart snapshot."); return; }
    context.drawImage(chartCanvas, 0, 0);
    const scaleX = output.width / Math.max(1, container.clientWidth);
    const scaleY = output.height / Math.max(1, container.clientHeight);
    renderedZoneBoxes.forEach(zone => {
      context.fillStyle = "rgba(251, 191, 36, 0.18)";
      context.strokeStyle = "rgba(253, 230, 138, 0.95)";
      context.lineWidth = Math.max(1, 1.5 * scaleX);
      context.fillRect(zone.left * scaleX, zone.top * scaleY, zone.width * scaleX, zone.height * scaleY);
      context.strokeRect(zone.left * scaleX, zone.top * scaleY, zone.width * scaleX, zone.height * scaleY);
    });
    const link = document.createElement("a");
    link.download = `trade-fusion-${symbol.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = output.toDataURL("image/png");
    link.click();
    toast.success("Private chart snapshot downloaded.");
  };

  const renderedZoneBoxes = zonePreview ? [...zoneBoxes.filter(zone => zone.id !== zonePreview.id), zonePreview] : zoneBoxes;
  const chartDataKey = `${data?.seriesType ?? "candle"}:${visibleTimes.map(point => `${point.time}:${pointPrice(point) ?? ""}`).join("|")}`;
  const chartTradeKey = session.trades.map(trade => `${trade.id}:${trade.entryAt ?? ""}:${trade.exitAt ?? ""}:${trade.pnl}:${trade.fees}`).join("|");
  const chartAnnotationKey = annotations.map(annotation => `${annotation.id}:${annotation.kind}:${annotation.price}:${annotation.endPrice ?? ""}:${annotation.startAt ?? ""}:${annotation.endAt ?? ""}`).join("|");

  useEffect(() => {
    if (!chartContainer.current || !visibleTimes.length) return;
    const chart = createChart(chartContainer.current, {
      width: chartContainer.current.clientWidth,
      height: isFullscreen ? Math.max(560, window.innerHeight - 310) : 410,
      layout: { background: { type: ColorType.Solid, color: "#0a1427" }, textColor: "#7f92b4", fontFamily: "Inter, sans-serif" },
      grid: { vertLines: { color: "rgba(114, 151, 205, 0.08)" }, horzLines: { color: "rgba(114, 151, 205, 0.08)" } },
      rightPriceScale: { borderColor: "rgba(114, 151, 205, 0.14)" },
      timeScale: { borderColor: "rgba(114, 151, 205, 0.14)", timeVisible: true, secondsVisible: false },
      crosshair: { vertLine: { color: "rgba(167, 139, 250, 0.4)" }, horzLine: { color: "rgba(167, 139, 250, 0.4)" } },
    });
    const series = data?.seriesType === "line"
      ? chart.addSeries(LineSeries, { color: "#f6c85f", lineWidth: 2, priceLineVisible: true, lastValueVisible: true })
      : chart.addSeries(CandlestickSeries, { upColor: "#56d39b", downColor: "#fb7185", borderVisible: false, wickUpColor: "#56d39b", wickDownColor: "#fb7185" });
    if (data?.seriesType === "line") series.setData(visiblePrices.map(point => ({ ...point, time: point.time as UTCTimestamp })));
    else series.setData(visibleCandles.map(candle => ({ ...candle, time: candle.time as UTCTimestamp })));
    const markers = visibleTrades.flatMap(trade => {
      const entryTime = markerTimeForValue(visibleTimes, trade.entryAt ?? trade.date);
      const exitTime = markerTimeForValue(visibleTimes, trade.exitAt ?? trade.date);
      const entryPosition = trade.direction === "LONG" ? "belowBar" : "aboveBar";
      const exitPosition = trade.direction === "LONG" ? "aboveBar" : "belowBar";
      const positive = trade.pnl - trade.fees >= 0;
      const tradeMarkers: Array<{ time: UTCTimestamp; position: "belowBar" | "aboveBar" | "inBar"; color: string; shape: "arrowUp" | "arrowDown" | "circle"; text: string }> = [];
      if (entryTime) tradeMarkers.push({ time: entryTime as UTCTimestamp, position: entryPosition, color: trade.direction === "LONG" ? "#56d39b" : "#fb7185", shape: trade.direction === "LONG" ? "arrowUp" : "arrowDown", text: `${trade.direction} entry` });
      if (exitTime) tradeMarkers.push({ time: exitTime as UTCTimestamp, position: exitPosition, color: positive ? "#56d39b" : "#fb7185", shape: "circle", text: `Exit ${positive ? "+" : ""}${(trade.pnl - trade.fees).toFixed(2)}` });
      return tradeMarkers;
    });
    createSeriesMarkers(series, markers);
    annotations.forEach(annotation => {
      if (annotation.kind === "trendline" && annotation.startAt && annotation.endAt && annotation.endPrice !== null) {
        const line = chart.addSeries(LineSeries, { color: "#c084fc", lineWidth: 2, lineStyle: 0, lastValueVisible: false, priceLineVisible: false });
        line.setData([{ time: Math.floor(Date.parse(annotation.startAt) / 1000) as UTCTimestamp, value: annotation.price }, { time: Math.floor(Date.parse(annotation.endAt) / 1000) as UTCTimestamp, value: annotation.endPrice }]);
      } else if (annotation.kind === "zone" && annotation.endPrice !== null) {
        const floor = Math.min(annotation.price, annotation.endPrice);
        const ceiling = Math.max(annotation.price, annotation.endPrice);
        series.createPriceLine({ price: floor, color: "#f59e0b", lineWidth: 2, axisLabelVisible: true, title: `${annotation.label || "Zone"} low` });
        series.createPriceLine({ price: ceiling, color: "#f59e0b", lineWidth: 2, axisLabelVisible: true, title: `${annotation.label || "Zone"} high` });
      } else {
        series.createPriceLine({ price: annotation.price, color: annotation.kind === "support" ? "#38bdf8" : "#fb7185", lineWidth: 2, axisLabelVisible: true, title: annotation.label || (annotation.kind === "support" ? "Support" : "Resistance") });
      }
    });
    priceSeriesRef.current = series;
    const zoneBoxForGeometry = (geometry: ZoneGeometry, id: number, label: string) => {
      const firstX = chart.timeScale().timeToCoordinate(Math.floor(Date.parse(geometry.startAt) / 1000) as UTCTimestamp);
      const secondX = chart.timeScale().timeToCoordinate(Math.floor(Date.parse(geometry.endAt) / 1000) as UTCTimestamp);
      const firstY = series.priceToCoordinate(geometry.price);
      const secondY = series.priceToCoordinate(geometry.endPrice);
      if (firstX === null || secondX === null || firstY === null || secondY === null) return null;
      return { id, label, left: Math.min(firstX, secondX), top: Math.min(firstY, secondY), width: Math.max(2, Math.abs(secondX - firstX)), height: Math.max(2, Math.abs(secondY - firstY)) };
    };
    zoneGeometryToBoxRef.current = zoneBoxForGeometry;
    const pointToAnchor = (clientX: number, clientY: number): ChartAnchor | null => {
      const rect = chartContainer.current?.getBoundingClientRect();
      if (!rect) return null;
      const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
      const y = Math.max(0, Math.min(rect.height, clientY - rect.top));
      const time = chart.timeScale().coordinateToTime(x);
      const price = series.coordinateToPrice(y);
      return typeof time === "number" && price !== null ? { time, price } : null;
    };
    pointToAnchorRef.current = pointToAnchor;
    const updateZoneBoxes = () => {
      const nextBoxes = annotations.flatMap(annotation => annotation.kind === "zone" && annotation.endPrice !== null && annotation.startAt && annotation.endAt ? [zoneBoxForGeometry({ price: annotation.price, endPrice: annotation.endPrice, startAt: annotation.startAt, endAt: annotation.endAt }, annotation.id, annotation.label || "Supply / demand zone")].filter((box): box is ZoneBox => box !== null) : []);
      setZoneBoxes(currentBoxes => JSON.stringify(currentBoxes) === JSON.stringify(nextBoxes) ? currentBoxes : nextBoxes);
    };
    const handlePointerDown = (event: PointerEvent) => {
      if (archivedRef.current || drawingToolRef.current !== "zone" || event.button !== 0) return;
      const anchor = pointToAnchor(event.clientX, event.clientY);
      if (!anchor) return;
      event.preventDefault();
      zoneDragStartRef.current = anchor;
      try { chartContainer.current?.setPointerCapture?.(event.pointerId); } catch { /* Window-level pointer completion remains active. */ }
      const preview = zoneBoxForGeometry(normalizedZoneGeometry(anchor, anchor), -1, "New zone");
      setZonePreview(preview);
    };
    const handlePointerMove = (event: PointerEvent) => {
      const anchor = pointToAnchor(event.clientX, event.clientY);
      if (!anchor) return;
      if (zoneDragStartRef.current) {
        const preview = zoneBoxForGeometry(normalizedZoneGeometry(zoneDragStartRef.current, anchor), -1, "New zone");
        setZonePreview(preview);
        return;
      }
      const resize = zoneResizeRef.current;
      if (!resize) return;
      const annotation = resize.annotation;
      if (annotation.endPrice === null || !annotation.startAt || !annotation.endAt) return;
      const start = { time: Math.floor(Date.parse(annotation.startAt) / 1000), price: annotation.price };
      const end = { time: Math.floor(Date.parse(annotation.endAt) / 1000), price: annotation.endPrice };
      const timeStart = resize.corner.includes("w") ? anchor.time : start.time;
      const timeEnd = resize.corner.includes("e") ? anchor.time : end.time;
      const lower = resize.corner.includes("s") ? anchor.price : start.price;
      const upper = resize.corner.includes("n") ? anchor.price : end.price;
      const preview = zoneBoxForGeometry(normalizedZoneGeometry({ time: timeStart, price: lower }, { time: timeEnd, price: upper }), annotation.id, annotation.label || "Supply / demand zone");
      setZonePreview(preview);
    };
    const handlePointerUp = (event: PointerEvent) => {
      const anchor = pointToAnchor(event.clientX, event.clientY);
      if (!anchor) return;
      if (zoneDragStartRef.current) {
        const start = zoneDragStartRef.current;
        zoneDragStartRef.current = null;
        const geometry = normalizedZoneGeometry(start, anchor);
        setZonePreview(null);
        if (Math.abs(anchor.time - start.time) > 0 || Math.abs(anchor.price - start.price) > 0) createAnnotationMutateRef.current({ sessionId: session.id, kind: "zone", ...geometry, label: "Supply / demand zone" });
        setDrawingTool("none");
        return;
      }
      const resize = zoneResizeRef.current;
      if (!resize) return;
      zoneResizeRef.current = null;
      const annotation = resize.annotation;
      if (annotation.endPrice === null || !annotation.startAt || !annotation.endAt) return;
      const start = { time: Math.floor(Date.parse(annotation.startAt) / 1000), price: annotation.price };
      const end = { time: Math.floor(Date.parse(annotation.endAt) / 1000), price: annotation.endPrice };
      const geometry = normalizedZoneGeometry({ time: resize.corner.includes("w") ? anchor.time : start.time, price: resize.corner.includes("s") ? anchor.price : start.price }, { time: resize.corner.includes("e") ? anchor.time : end.time, price: resize.corner.includes("n") ? anchor.price : end.price });
      updateAnnotationMutateRef.current({ id: annotation.id, ...geometry, label: annotation.label });
    };
    updateZoneBoxes();
    chart.timeScale().subscribeVisibleTimeRangeChange(updateZoneBoxes);
    chartContainer.current.addEventListener("pointerdown", handlePointerDown, { capture: true });
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
    const handleChartClick = (param: MouseEventParams<Time>) => {
      if (archivedRef.current || drawingToolRef.current !== "trendline" || typeof param.time !== "number" || !param.point) return;
      const price = series.coordinateToPrice(param.point.y);
      if (price === null) return;
      const anchor = { time: param.time, price };
      const first = pendingAnchorRef.current;
      if (!first) { setPendingAnchor(anchor); return; }
      createAnnotationMutateRef.current({ sessionId: session.id, kind: "trendline", price: first.price, endPrice: anchor.price, startAt: timestampToIso(first.time), endAt: timestampToIso(anchor.time), label: "Trendline" });
    };
    chart.subscribeClick(handleChartClick);
    chart.timeScale().fitContent();
    const resize = new ResizeObserver(() => { chart.applyOptions({ width: chartContainer.current?.clientWidth ?? 0, height: isFullscreen ? Math.max(560, window.innerHeight - 310) : 410 }); updateZoneBoxes(); });
    resize.observe(chartContainer.current);
    chartRef.current = chart;
    return () => { resize.disconnect(); chart.timeScale().unsubscribeVisibleTimeRangeChange(updateZoneBoxes); chart.unsubscribeClick(handleChartClick); chartContainer.current?.removeEventListener("pointerdown", handlePointerDown, { capture: true }); window.removeEventListener("pointermove", handlePointerMove); window.removeEventListener("pointerup", handlePointerUp); window.removeEventListener("pointercancel", handlePointerUp); chart.remove(); chartRef.current = null; priceSeriesRef.current = null; };
  }, [chartAnnotationKey, chartDataKey, chartTradeKey, isFullscreen, session.id]);

  return <section ref={fullscreenContainer} className={isFullscreen ? "fixed inset-0 z-[100] overflow-y-auto bg-[#07101f] p-3 md:p-6" : "mt-5 overflow-hidden rounded-2xl border border-violet-300/[0.16] bg-[#0c1830]/88"}>
    <div className={`overflow-hidden rounded-2xl ${isFullscreen ? "border border-violet-300/[0.18]" : ""}`}>
      <div className="flex flex-col gap-4 border-b border-violet-300/[0.10] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div><div className="flex items-center gap-2"><Layers3 className="h-4 w-4 text-violet-300" /><h3 className="text-sm font-semibold">Historical replay</h3><span className={`rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] ${data?.sourceStatus === "live" ? "bg-emerald-400/10 text-emerald-200" : "bg-amber-400/10 text-amber-200"}`}>{data?.sourceStatus === "live" ? "Source-backed" : "Awaiting source"}</span></div><p className="mt-1 text-xs text-slate-500">{data?.note ?? "Requesting source-backed replay candles…"}</p></div>
        <div className="flex flex-wrap gap-2"><select aria-label="Replay symbol" value={symbol} onChange={event => { const next = event.target.value as (typeof pairs)[number]; setSymbol(next); if (next === "XAUUSD" && !goldIntervals.includes(interval)) setInterval("1h"); else if (["EURUSD", "GBPUSD", "USDJPY"].includes(next) && !["15m", "1h", "1d"].includes(interval)) setInterval("1h"); }} className="h-9 rounded-lg border border-blue-200/[0.12] bg-white/[0.04] px-2 text-xs text-slate-200">{pairs.map(pair => <option key={pair} value={pair}>{pair === "XAUUSD" ? "XAU/USD · intraday candles" : pair.replace("USD", "/USD")}</option>)}</select><select aria-label="Replay interval" value={interval} onChange={event => setInterval(event.target.value as ReplayInterval)} className="h-9 rounded-lg border border-blue-200/[0.12] bg-white/[0.04] px-2 text-xs text-slate-200">{((symbol === "XAUUSD" ? goldIntervals : (["EURUSD", "GBPUSD", "USDJPY"].includes(symbol) ? ["15m", "1h", "1d"] : intervals))).map(value => <option key={value} value={value}>{value}</option>)}</select><select aria-label="Replay date range" value={rangeDays ?? "all"} onChange={event => setRangeDays(event.target.value === "all" ? null : Number(event.target.value))} className="h-9 rounded-lg border border-blue-200/[0.12] bg-white/[0.04] px-2 text-xs text-slate-200"><option value="all">All loaded</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option></select><Button type="button" size="sm" variant="outline" aria-label={isFullscreen ? "Exit full screen" : "Open full screen chart"} onClick={toggleFullscreen} className="border-violet-300/30 bg-violet-400/10 text-violet-100">{isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}</Button></div>
      </div>
      {!initialSymbol && <div className="border-b border-amber-300/[0.12] bg-amber-400/[0.06] px-5 py-3 text-xs text-amber-100">This Backtest session uses <strong>{session.symbol}</strong>. Choose a supported replay symbol to compare your saved simulation against source-backed history.</div>}
      {data?.sourceStatus === "unavailable" ? <div className="grid min-h-[410px] place-items-center p-8 text-center"><div><p className="text-sm font-medium text-slate-200">Historical source data is unavailable right now</p><p className="mt-2 max-w-md text-xs leading-5 text-slate-500">No fallback candles or prices are fabricated. Try another supported market or return when the provider responds.</p></div></div> : !chartPoints.length || isFetching ? <div className="grid min-h-[410px] place-items-center text-sm text-slate-500">Loading source-backed {data?.seriesType === "line" ? "price history" : "candles"}…</div> : <>
        <div className="flex flex-col gap-3 border-b border-violet-300/[0.08] px-5 py-3 lg:flex-row lg:items-center lg:justify-between"><div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.12em] text-slate-500"><span className="text-emerald-200">▲ Simulated entry</span><span className="text-rose-200">● Simulated exit</span><span>Markers use saved entry and exit timestamps.</span></div><div className="flex flex-wrap items-center gap-2"><span className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">Draw on chart</span><DrawingButton active={drawingTool === "none"} onClick={() => { setDrawingTool("none"); setPendingAnchor(null); }} onSnapshot={captureChartSnapshot}><MousePointer2 className="mr-1 h-3.5 w-3.5" /> Cursor</DrawingButton><Button type="button" size="sm" variant="outline" aria-expanded={isToolPaletteOpen} aria-controls="backtest-drawing-palette" onClick={() => setIsToolPaletteOpen(value => !value)} className="border-violet-300/30 bg-violet-400/10 text-violet-100"><Menu className="mr-1 h-3.5 w-3.5" /> Tools</Button></div></div>
        {archived && <div role="status" className="border-b border-amber-300/[0.12] bg-amber-400/[0.06] px-5 py-2 text-xs text-amber-100">This strategy is archived and its chart is read-only. Use <strong>Reopen strategy</strong> above to add private drawings or simulations.</div>}
        {drawingTool !== "none" && !archived && <div className="flex items-center gap-2 border-b border-violet-300/[0.08] bg-violet-400/[0.06] px-5 py-2 text-xs text-violet-100"><Crosshair className="h-4 w-4" /><span>{drawingTool === "zone" ? "Click, hold, and drag across the chart to draw a private supply/demand rectangle." : "Click two chart points to place a private trendline."}</span><button type="button" onClick={() => { setDrawingTool("none"); setPendingAnchor(null); }} className="ml-auto rounded p-1 hover:bg-white/10" aria-label="Cancel drawing"><X className="h-4 w-4" /></button></div>}
        <div className="relative"><div ref={chartContainer} data-testid="historical-replay-chart" className={`w-full touch-none ${drawingTool === "zone" ? "cursor-crosshair" : ""} ${isFullscreen ? "min-h-[560px]" : "min-h-[410px]"}`} />{isToolPaletteOpen && <div id="backtest-drawing-palette" role="menu" className="absolute left-3 top-3 z-20 w-52 overflow-hidden rounded-xl border border-blue-200/[0.16] bg-[#0a1427]/95 p-2 shadow-2xl backdrop-blur"><div className="mb-1 flex items-center justify-between px-2 py-1"><span className="font-mono text-[9px] uppercase tracking-[0.16em] text-slate-500">Drawing tools</span><button type="button" aria-label="Close drawing tools" onClick={() => setIsToolPaletteOpen(false)} className="rounded p-1 text-slate-500 hover:bg-white/10 hover:text-white"><X className="h-3.5 w-3.5" /></button></div><button type="button" role="menuitem" disabled={archived || createAnnotation.isPending} onClick={() => { setDrawingTool("trendline"); setPendingAnchor(null); setIsToolPaletteOpen(false); }} className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-xs text-slate-100 transition hover:bg-violet-400/15 disabled:cursor-not-allowed disabled:opacity-40"><TrendingUp className="h-4 w-4 text-violet-300" /><span>Trendline</span><span className="ml-auto font-mono text-[9px] text-slate-500">2 clicks</span></button><button type="button" role="menuitem" disabled={archived || createAnnotation.isPending} onClick={() => { setDrawingTool("zone"); setPendingAnchor(null); setIsToolPaletteOpen(false); }} className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-xs text-slate-100 transition hover:bg-amber-400/15 disabled:cursor-not-allowed disabled:opacity-40"><BoxSelect className="h-4 w-4 text-amber-200" /><span>Zone rectangle</span><span className="ml-auto font-mono text-[9px] text-slate-500">Drag</span></button><div className="my-1 border-t border-blue-200/[0.10]" /><button type="button" role="menuitem" disabled={archived || createAnnotation.isPending} onClick={() => addReplayLevel("support")} className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-xs text-slate-100 transition hover:bg-sky-400/15 disabled:cursor-not-allowed disabled:opacity-40"><Minus className="h-4 w-4 text-sky-300" /><span>Support level</span><span className="ml-auto font-mono text-[9px] text-slate-500">Now</span></button><button type="button" role="menuitem" disabled={archived || createAnnotation.isPending} onClick={() => addReplayLevel("resistance")} className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-xs text-slate-100 transition hover:bg-rose-400/15 disabled:cursor-not-allowed disabled:opacity-40"><Minus className="h-4 w-4 text-rose-300" /><span>Resistance level</span><span className="ml-auto font-mono text-[9px] text-slate-500">Now</span></button></div>}{renderedZoneBoxes.map(zone => { const annotation = annotations.find(item => item.id === zone.id); const active = selectedZoneId === zone.id; return <div key={zone.id} data-testid="supply-demand-zone" title={zone.label} className={`pointer-events-none absolute z-10 border bg-amber-400/15 shadow-[inset_0_0_20px_rgba(251,191,36,0.10)] ${active || zone.id === -1 ? "border-amber-100 ring-1 ring-amber-200/60" : "border-amber-300/80"}`} style={{ left: zone.left, top: zone.top, width: zone.width, height: zone.height }}><span className="absolute left-1 top-1 rounded bg-[#0a1427]/85 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-amber-100">{zone.label}</span>{annotation && !archived && <>{(["nw", "ne", "sw", "se"] as ZoneCorner[]).map(corner => <button key={corner} type="button" aria-label={`Resize ${zone.label} ${corner}`} data-testid={`zone-resize-handle-${corner}`} onPointerDown={event => beginZoneResize(event, annotation, corner)} className={`pointer-events-auto absolute h-3 w-3 rounded-full border-2 border-[#0a1427] bg-amber-100 shadow ${corner.includes("n") ? "-top-1.5" : "-bottom-1.5"} ${corner.includes("w") ? "-left-1.5" : "-right-1.5"}`} />)}</>}</div>; })}</div>
        <div className="grid gap-4 border-t border-violet-300/[0.10] bg-violet-400/[0.04] px-5 py-4 xl:grid-cols-[0.9fr_1.2fr]">
          <div><div className="mb-2 flex items-center justify-between"><div><p className="text-xs font-semibold text-slate-200">Chart drawings</p><p className="text-[11px] text-slate-500">Private support, resistance, trendline, and supply/demand context.</p></div><span className="font-mono text-[9px] uppercase tracking-[0.12em] text-violet-200">Session only</span></div><div className="flex flex-col gap-2 sm:flex-row"><select aria-label="Annotation kind" value={annotationKind} onChange={event => setAnnotationKind(event.target.value as "support" | "resistance")} className="h-9 rounded-lg border border-blue-200/[0.12] bg-[#0a1427] px-2 text-xs text-slate-200"><option value="support">Support</option><option value="resistance">Resistance</option></select><input aria-label="Annotation price" value={annotationPrice} onChange={event => setAnnotationPrice(event.target.value)} placeholder={String(currentPrice ?? "Price")} inputMode="decimal" className="h-9 min-w-0 rounded-lg border border-blue-200/[0.12] bg-[#0a1427] px-3 text-xs text-slate-100" /><input aria-label="Annotation label" value={annotationLabel} onChange={event => setAnnotationLabel(event.target.value)} placeholder="Optional label" maxLength={120} className="h-9 min-w-0 flex-1 rounded-lg border border-blue-200/[0.12] bg-[#0a1427] px-3 text-xs text-slate-100" /><Button size="sm" disabled={createAnnotation.isPending || !Number.isFinite(Number(annotationPrice || currentPrice)) || archived} onClick={() => createAnnotation.mutate({ sessionId: session.id, kind: annotationKind, price: Number(annotationPrice || currentPrice), label: annotationLabel })} className="bg-violet-500 hover:bg-violet-400"><Plus className="mr-1 h-3.5 w-3.5" /> Add level</Button></div>{annotations.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{annotations.map(annotation => <div key={annotation.id} className="flex items-center gap-2 rounded-lg border border-violet-300/20 bg-violet-400/10 px-2 py-1 text-[11px] text-violet-100"><span>{annotation.kind} {annotation.price.toFixed(2)}{annotation.endPrice !== null ? ` → ${annotation.endPrice.toFixed(2)}` : ""}{annotation.label ? ` · ${annotation.label}` : ""}</span><button type="button" aria-label={`Delete ${annotation.kind} annotation`} onClick={() => deleteAnnotation.mutate({ id: annotation.id })} className="opacity-70 transition hover:opacity-100"><Trash2 className="h-3 w-3" /></button></div>)}</div>}</div>
          <div><div className="mb-2 flex items-center justify-between"><div className="flex items-center gap-2"><Calculator className="h-4 w-4 text-emerald-300" /><div><p className="text-xs font-semibold text-slate-200">Simulated execution</p><p className="text-[11px] text-slate-500">Choose Buy or Sell, then define the final exit, protective stop, and any partial target.</p></div></div><span className="font-mono text-[9px] uppercase tracking-[0.12em] text-emerald-200">Simulation</span></div><div data-testid="execution-quote-controls" className="mb-3 flex items-stretch overflow-hidden rounded-xl border border-blue-200/[0.14] bg-[#0a1427]"><button type="button" disabled={archived || sellQuote === null} onClick={() => prepareMarketExecution("SHORT")} className="min-w-0 flex-1 bg-rose-500/15 px-3 py-2 text-left transition hover:bg-rose-500/25 disabled:cursor-not-allowed disabled:opacity-40"><span className="block font-mono text-[9px] uppercase tracking-[0.14em] text-rose-200">Sell</span><span className="mt-1 block font-mono text-sm font-semibold text-rose-100">{sellQuote === null ? "—" : sellQuote.toFixed(quoteDecimals)}</span></button><div className="flex min-w-16 flex-col items-center justify-center border-x border-blue-200/[0.12] px-2"><span className="font-mono text-[9px] uppercase tracking-[0.12em] text-slate-500">Qty</span><input aria-label="Quick execution quantity" value={executionQuantity} onChange={event => setExecutionQuantity(event.target.value)} inputMode="decimal" className="mt-1 w-12 bg-transparent text-center font-mono text-xs text-slate-100 outline-none" /></div><button type="button" disabled={archived || buyQuote === null} onClick={() => prepareMarketExecution("LONG")} className="min-w-0 flex-1 bg-sky-500/15 px-3 py-2 text-right transition hover:bg-sky-500/25 disabled:cursor-not-allowed disabled:opacity-40"><span className="block font-mono text-[9px] uppercase tracking-[0.14em] text-sky-200">Buy</span><span className="mt-1 block font-mono text-sm font-semibold text-sky-100">{buyQuote === null ? "—" : buyQuote.toFixed(quoteDecimals)}</span></button></div><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3"><select aria-label="Execution direction" value={executionDirection} onChange={event => setExecutionDirection(event.target.value as "LONG" | "SHORT")} className="h-9 rounded-lg border border-blue-200/[0.12] bg-[#0a1427] px-2 text-xs text-slate-200"><option value="LONG">Long</option><option value="SHORT">Short</option></select><input aria-label="Execution entry price" value={executionEntry} onChange={event => setExecutionEntry(event.target.value)} inputMode="decimal" placeholder="Entry price" className="h-9 rounded-lg border border-blue-200/[0.12] bg-[#0a1427] px-3 text-xs text-slate-100" /><input aria-label="Execution exit price" value={executionExit} onChange={event => setExecutionExit(event.target.value)} inputMode="decimal" placeholder="Final exit price" className="h-9 rounded-lg border border-blue-200/[0.12] bg-[#0a1427] px-3 text-xs text-slate-100" /><input aria-label="Execution stop loss" value={executionRisk} onChange={event => setExecutionRisk(event.target.value)} inputMode="decimal" placeholder="Stop-loss price (optional)" className="h-9 rounded-lg border border-blue-200/[0.12] bg-[#0a1427] px-3 text-xs text-slate-100" /><input aria-label="Partial take-profit price" value={executionTakeProfit} onChange={event => setExecutionTakeProfit(event.target.value)} inputMode="decimal" placeholder="Partial take-profit price" className="h-9 rounded-lg border border-amber-300/20 bg-amber-400/[0.04] px-3 text-xs text-amber-100" /><input aria-label="Partial take-profit quantity" value={executionTakeProfitQuantity} onChange={event => setExecutionTakeProfitQuantity(event.target.value)} inputMode="decimal" placeholder="Partial quantity" className="h-9 rounded-lg border border-amber-300/20 bg-amber-400/[0.04] px-3 text-xs text-amber-100" /><input aria-label="Execution fees" value={executionFees} onChange={event => setExecutionFees(event.target.value)} inputMode="decimal" placeholder="Fees" className="h-9 rounded-lg border border-blue-200/[0.12] bg-[#0a1427] px-3 text-xs text-slate-100" /><input aria-label="Execution setup" value={executionSetup} onChange={event => setExecutionSetup(event.target.value)} maxLength={80} placeholder="Setup tag" className="h-9 rounded-lg border border-blue-200/[0.12] bg-[#0a1427] px-3 text-xs text-slate-100" /></div><div className="mt-2 flex flex-wrap gap-2"><Button type="button" size="sm" variant="outline" onClick={() => { if (!current || currentPrice === null) return; setExecutionEntry(String(currentPrice)); setExecutionEntryAt(localDateTime(current.time)); }} className="border-emerald-300/30 bg-emerald-400/10 text-emerald-100"><Target className="mr-1 h-3.5 w-3.5" /> Use replay point as entry</Button><Button type="button" size="sm" variant="outline" onClick={() => { if (!current || currentPrice === null) return; setExecutionExit(String(currentPrice)); setExecutionExitAt(localDateTime(current.time)); }} className="border-rose-300/30 bg-rose-400/10 text-rose-100"><Target className="mr-1 h-3.5 w-3.5" /> Use replay point as exit</Button>{executionPreview && <span className={`rounded-lg px-2 py-1 text-xs font-semibold ${executionPreview.net >= 0 ? "bg-emerald-400/10 text-emerald-200" : "bg-rose-400/10 text-rose-200"}`}>P&L {executionPreview.net >= 0 ? "+" : ""}{executionPreview.net.toFixed(2)}{executionPreview.partialPrice !== null ? ` · partial ${executionPreview.partialQuantity}` : ""}{executionPreview.rMultiple !== null ? ` · ${executionPreview.rMultiple.toFixed(2)}R` : ""}</span>}<Button type="button" size="sm" disabled={!executionPreview || createTrade.isPending || archived} onClick={saveExecution} className="bg-emerald-500 text-slate-950 hover:bg-emerald-400"><Plus className="mr-1 h-3.5 w-3.5" /> Save simulated trade</Button></div></div>
        </div>
        <div className="flex flex-col gap-3 border-t border-violet-300/[0.10] bg-black/[0.10] px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div className="font-mono text-[10px] uppercase tracking-[0.13em] text-slate-500">Replay {data?.seriesType === "line" ? "price" : "candle"} · <span className="text-violet-200">{current ? replayDateLabel(current.time) : "—"}</span> · {cursor + 1}/{filteredPoints.length}</div><div className="flex items-center gap-2"><Button variant="outline" size="sm" aria-label="Previous candle" onClick={() => { setPlaying(false); setCursor(value => Math.max(0, value - 1)); }} disabled={cursor === 0} className="border-blue-200/[0.12] bg-transparent text-slate-300"><ChevronLeft className="h-4 w-4" /></Button><Button size="sm" aria-label={playing ? "Pause replay" : "Play replay"} onClick={() => setPlaying(value => !value)} className="bg-violet-500 hover:bg-violet-400">{playing ? <CirclePause className="mr-1.5 h-4 w-4" /> : <CirclePlay className="mr-1.5 h-4 w-4" />}{playing ? "Pause" : "Play"}</Button><Button variant="outline" size="sm" aria-label="Next candle" onClick={() => { setPlaying(false); setCursor(value => Math.min(filteredPoints.length - 1, value + 1)); }} disabled={cursor >= filteredPoints.length - 1} className="border-blue-200/[0.12] bg-transparent text-slate-300"><ChevronRight className="h-4 w-4" /></Button><Button variant="outline" size="sm" onClick={() => { setPlaying(false); setCursor(0); }} className="border-blue-200/[0.12] bg-transparent text-slate-300"><StepForward className="mr-1.5 h-3.5 w-3.5" /> Restart</Button></div></div>
      </>}
    </div>
  </section>;
}

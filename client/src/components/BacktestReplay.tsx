import React, { useEffect, useMemo, useRef, useState } from "react";
import { CandlestickSeries, ColorType, createChart, createSeriesMarkers, type IChartApi, type ISeriesApi, type UTCTimestamp } from "lightweight-charts";
import { ChevronLeft, ChevronRight, CirclePause, CirclePlay, Layers3, StepForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { replayDateLabel, toReplayInterval, toReplaySymbol, type ReplayInterval } from "@/lib/replay";

type ReplayTrade = { id: number; date: string; direction: "LONG" | "SHORT"; entryPrice: number; exitPrice: number; pnl: number; fees: number };
type ReplaySession = { symbol: string; timeframe: string; trades: ReplayTrade[] };

const pairs = ["BTCUSD", "ETHUSD", "SOLUSD"] as const;
const intervals: ReplayInterval[] = ["1m", "5m", "15m", "30m", "1h", "4h", "1d"];

function markerTimeForDate(candles: Array<{ time: number }>, date: string) {
  const target = Date.parse(`${date}T23:59:59Z`) / 1000;
  const matching = [...candles].reverse().find(candle => candle.time <= target);
  return matching?.time ?? null;
}

export function BacktestReplay({ session }: { session: ReplaySession }) {
  const initialSymbol = toReplaySymbol(session.symbol);
  const [symbol, setSymbol] = useState<(typeof pairs)[number]>(initialSymbol ?? "BTCUSD");
  const [interval, setInterval] = useState<ReplayInterval>(toReplayInterval(session.timeframe));
  const [cursor, setCursor] = useState(0);
  const [playing, setPlaying] = useState(false);
  const chartContainer = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const { data, isFetching } = trpc.replay.candles.useQuery({ symbol, interval }, { refetchOnWindowFocus: false });
  const candles = data?.candles ?? [];

  useEffect(() => {
    setCursor(Math.max(0, candles.length - 1));
    setPlaying(false);
  }, [symbol, interval, candles.length]);

  useEffect(() => {
    if (!playing || cursor >= candles.length - 1) { if (cursor >= candles.length - 1) setPlaying(false); return; }
    const timer = window.setInterval(() => setCursor(current => Math.min(current + 1, candles.length - 1)), 650);
    return () => window.clearInterval(timer);
  }, [playing, cursor, candles.length]);

  const visibleCandles = useMemo(() => candles.slice(0, cursor + 1), [candles, cursor]);
  const visibleTrades = useMemo(() => session.trades.filter(trade => markerTimeForDate(visibleCandles, trade.date) !== null), [session.trades, visibleCandles]);

  useEffect(() => {
    if (!chartContainer.current || !visibleCandles.length) return;
    const chart = createChart(chartContainer.current, {
      width: chartContainer.current.clientWidth,
      height: 385,
      layout: { background: { type: ColorType.Solid, color: "#0a1427" }, textColor: "#7f92b4", fontFamily: "Inter, sans-serif" },
      grid: { vertLines: { color: "rgba(114, 151, 205, 0.08)" }, horzLines: { color: "rgba(114, 151, 205, 0.08)" } },
      rightPriceScale: { borderColor: "rgba(114, 151, 205, 0.14)" },
      timeScale: { borderColor: "rgba(114, 151, 205, 0.14)", timeVisible: true, secondsVisible: false },
      crosshair: { vertLine: { color: "rgba(167, 139, 250, 0.4)" }, horzLine: { color: "rgba(167, 139, 250, 0.4)" } },
    });
    const series = chart.addSeries(CandlestickSeries, { upColor: "#56d39b", downColor: "#fb7185", borderVisible: false, wickUpColor: "#56d39b", wickDownColor: "#fb7185" });
    series.setData(visibleCandles.map(candle => ({ ...candle, time: candle.time as UTCTimestamp })));
    const markers = visibleTrades.flatMap(trade => {
      const time = markerTimeForDate(visibleCandles, trade.date);
      if (!time) return [];
      const entryPosition = trade.direction === "LONG" ? "belowBar" : "aboveBar";
      const exitPosition = trade.direction === "LONG" ? "aboveBar" : "belowBar";
      const positive = trade.pnl - trade.fees >= 0;
      return [
        { time: time as UTCTimestamp, position: entryPosition as "belowBar" | "aboveBar", color: trade.direction === "LONG" ? "#56d39b" : "#fb7185", shape: trade.direction === "LONG" ? "arrowUp" as const : "arrowDown" as const, text: `${trade.direction} entry` },
        { time: time as UTCTimestamp, position: exitPosition as "belowBar" | "aboveBar", color: positive ? "#56d39b" : "#fb7185", shape: "circle" as const, text: `Exit ${positive ? "+" : ""}${(trade.pnl - trade.fees).toFixed(2)}` },
      ];
    });
    createSeriesMarkers(series, markers);
    chart.timeScale().fitContent();
    const resize = new ResizeObserver(() => chart.applyOptions({ width: chartContainer.current?.clientWidth ?? 0 }));
    resize.observe(chartContainer.current);
    chartRef.current = chart; seriesRef.current = series;
    return () => { resize.disconnect(); chart.remove(); chartRef.current = null; seriesRef.current = null; };
  }, [visibleCandles, visibleTrades]);

  const current = candles[cursor];
  return <section className="mt-5 overflow-hidden rounded-2xl border border-violet-300/[0.16] bg-[#0c1830]/88">
    <div className="flex flex-col gap-4 border-b border-violet-300/[0.10] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
      <div><div className="flex items-center gap-2"><Layers3 className="h-4 w-4 text-violet-300" /><h3 className="text-sm font-semibold">Historical replay</h3><span className={`rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] ${data?.sourceStatus === "live" ? "bg-emerald-400/10 text-emerald-200" : "bg-amber-400/10 text-amber-200"}`}>{data?.sourceStatus === "live" ? "Source-backed" : "Awaiting source"}</span></div><p className="mt-1 text-xs text-slate-500">{data?.note ?? "Requesting public crypto candles…"}</p></div>
      <div className="flex flex-wrap gap-2"><select aria-label="Replay symbol" value={symbol} onChange={event => setSymbol(event.target.value as (typeof pairs)[number])} className="h-9 rounded-lg border border-blue-200/[0.12] bg-white/[0.04] px-2 text-xs text-slate-200">{pairs.map(pair => <option key={pair} value={pair}>{pair.replace("USD", "/USD")}</option>)}</select><select aria-label="Replay interval" value={interval} onChange={event => setInterval(event.target.value as ReplayInterval)} className="h-9 rounded-lg border border-blue-200/[0.12] bg-white/[0.04] px-2 text-xs text-slate-200">{intervals.map(value => <option key={value} value={value}>{value}</option>)}</select></div>
    </div>
    {!initialSymbol && <div className="border-b border-amber-300/[0.12] bg-amber-400/[0.06] px-5 py-3 text-xs text-amber-100">This Backtest session uses <strong>{session.symbol}</strong>. Its replay is temporarily shown with BTC/USD candles because the no-key release supports BTC/USD, ETH/USD, and SOL/USD only. Future licensed data can add forex, gold, and index replay without changing your saved simulated trades.</div>}
    {data?.sourceStatus === "unavailable" ? <div className="grid min-h-[385px] place-items-center p-8 text-center"><div><p className="text-sm font-medium text-slate-200">Historical candles are unavailable right now</p><p className="mt-2 max-w-md text-xs leading-5 text-slate-500">No fallback candles are fabricated. Try another supported crypto pair or return when the public source responds.</p></div></div> : !candles.length || isFetching ? <div className="grid min-h-[385px] place-items-center text-sm text-slate-500">Loading source-backed candles…</div> : <><div ref={chartContainer} data-testid="historical-replay-chart" className="min-h-[385px] w-full" /><div className="flex flex-col gap-3 border-t border-violet-300/[0.10] bg-black/[0.10] px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div className="font-mono text-[10px] uppercase tracking-[0.13em] text-slate-500">Replay candle · <span className="text-violet-200">{current ? replayDateLabel(current.time) : "—"}</span> · {cursor + 1}/{candles.length}</div><div className="flex items-center gap-2"><Button variant="outline" size="sm" aria-label="Previous candle" onClick={() => { setPlaying(false); setCursor(value => Math.max(0, value - 1)); }} disabled={cursor === 0} className="border-blue-200/[0.12] bg-transparent text-slate-300"><ChevronLeft className="h-4 w-4" /></Button><Button size="sm" aria-label={playing ? "Pause replay" : "Play replay"} onClick={() => setPlaying(value => !value)} className="bg-violet-500 hover:bg-violet-400">{playing ? <CirclePause className="mr-1.5 h-4 w-4" /> : <CirclePlay className="mr-1.5 h-4 w-4" />}{playing ? "Pause" : "Play"}</Button><Button variant="outline" size="sm" aria-label="Next candle" onClick={() => { setPlaying(false); setCursor(value => Math.min(candles.length - 1, value + 1)); }} disabled={cursor >= candles.length - 1} className="border-blue-200/[0.12] bg-transparent text-slate-300"><ChevronRight className="h-4 w-4" /></Button><Button variant="outline" size="sm" onClick={() => { setPlaying(false); setCursor(0); }} className="border-blue-200/[0.12] bg-transparent text-slate-300"><StepForward className="mr-1.5 h-3.5 w-3.5" /> Restart</Button></div></div></>}
  </section>;
}

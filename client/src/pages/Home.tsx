import React, { useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  FlaskConical,
  Gauge,
  Plus,
  ShieldCheck,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { appRoutes } from "@/lib/appRoutes";
import { CalendarRiskRibbon } from "@/components/CalendarRiskRibbon";
import { TradeDetailDrawer } from "@/components/TradeDetailDrawer";
import { InstrumentBadge } from "@/components/InstrumentBadge";
import { DirectionBadge } from "@/components/DirectionBadge";
import type { Trade } from "@/lib/tradeTypes";

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function percent(value: number) {
  return `${value.toFixed(1)}%`;
}

function startOfWeek(date: Date) {
  const copy = new Date(date);
  const day = copy.getDay();
  const distance = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + distance);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "blue",
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ElementType;
  tone?: "blue" | "profit" | "loss" | "amber";
}) {
  const toneClasses = {
    blue: "border-blue-300/15 bg-blue-400/[.055] text-blue-200",
    profit: "border-emerald-300/15 bg-emerald-400/[.055] text-emerald-200",
    loss: "border-rose-300/15 bg-rose-400/[.055] text-rose-200",
    amber: "border-amber-300/15 bg-amber-400/[.055] text-amber-200",
  }[tone];

  return (
    <section className="group relative overflow-hidden rounded-2xl border border-white/[.07] bg-[#0a0e16] p-4 shadow-[0_18px_40px_rgba(0,0,0,.18)] transition duration-200 hover:-translate-y-0.5 hover:border-white/[.13] hover:bg-[#0b101a] sm:p-5">
      <div className={`absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-lg border ${toneClasses}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="font-mono text-[9px] uppercase tracking-[.19em] text-slate-500">{label}</p>
      <p className="mt-3 pr-10 font-mono text-2xl font-semibold tracking-[-.06em] text-white sm:text-[1.7rem]">{value}</p>
      <p className="mt-1.5 text-[11px] text-slate-500">{detail}</p>
      <div className="absolute bottom-0 left-5 right-5 h-px bg-gradient-to-r from-transparent via-white/[.13] to-transparent" />
    </section>
  );
}

function WeekStrip({ trades, selectedDay, onSelect }: { trades: Trade[]; selectedDay: string; onSelect: (day: string) => void }) {
  const days = useMemo(() => {
    const start = startOfWeek(new Date());
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const key = isoDate(date);
      const dayTrades = trades.filter((trade) => trade.date === key);
      const pnl = dayTrades.reduce((sum, trade) => sum + trade.pnl, 0);
      return { key, date, dayTrades, pnl };
    });
  }, [trades]);

  return (
    <section aria-label="Weekly performance" className="mb-5 rounded-2xl border border-white/[.07] bg-[#090d14] p-3 shadow-[0_16px_36px_rgba(0,0,0,.15)] sm:p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[.19em] text-slate-500">Weekly rhythm</p>
          <p className="mt-1 text-sm font-medium text-white">Execution activity</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button type="button" aria-label="Previous week" className="tf-press grid h-8 w-8 place-items-center rounded-lg border border-white/[.08] text-slate-500 hover:bg-white/[.06] hover:text-white"><ChevronLeft className="h-3.5 w-3.5" /></button>
          <span className="rounded-lg border border-white/[.08] bg-white/[.025] px-3 py-1.5 font-mono text-[9px] uppercase tracking-[.13em] text-slate-400">Current week</span>
          <button type="button" aria-label="Next week" className="tf-press grid h-8 w-8 place-items-center rounded-lg border border-white/[.08] text-slate-500 hover:bg-white/[.06] hover:text-white"><ChevronRight className="h-3.5 w-3.5" /></button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
        {days.map(({ key, date, dayTrades, pnl }) => {
          const isSelected = selectedDay === key;
          const positive = pnl > 0;
          const negative = pnl < 0;
          return (
            <button key={key} type="button" onClick={() => onSelect(key)} className={`tf-press min-w-0 rounded-xl border px-3 py-2.5 text-left transition ${isSelected ? "border-blue-300/35 bg-blue-400/[.12]" : "border-white/[.07] bg-white/[.018] hover:border-white/[.14] hover:bg-white/[.04]"}`}>
              <div className="flex items-center justify-between gap-1"><span className={`text-[11px] font-medium ${isSelected ? "text-blue-100" : "text-slate-300"}`}>{date.toLocaleDateString("en-US", { weekday: "short" })} {date.getDate()}</span><span className={`font-mono text-[10px] ${positive ? "text-emerald-300" : negative ? "text-rose-300" : "text-slate-600"}`}>{pnl === 0 ? "0%" : `${positive ? "+" : ""}${money(pnl)}`}</span></div>
              <p className="mt-1 text-[10px] text-slate-600">{dayTrades.length} trade{dayTrades.length === 1 ? "" : "s"}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function EquityCurve({ trades, totalPnl, onLogTrade }: { trades: Trade[]; totalPnl: number; onLogTrade: () => void }) {
  const points = useMemo(() => {
    const ordered = [...trades].sort((a, b) => a.date.localeCompare(b.date));
    if (!ordered.length) return [];
    let running = 0;
    return ordered.map((trade, index) => {
      running += trade.pnl;
      return { x: ordered.length === 1 ? 50 : 8 + (index / (ordered.length - 1)) * 84, y: 86 - Math.max(0, Math.min(72, ((running - Math.min(0, totalPnl)) / Math.max(1, Math.abs(totalPnl) || 1)) * 68)), running };
    });
  }, [trades, totalPnl]);

  if (!points.length) {
    return (
      <div className="relative mt-5 grid h-64 place-items-center overflow-hidden rounded-xl border border-white/[.06] bg-[#070a10]">
        <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(#263247_1px,transparent_1px),linear-gradient(90deg,#263247_1px,transparent_1px)] [background-size:72px_48px]" />
        <div className="relative px-5 text-center"><Gauge className="mx-auto h-6 w-6 text-slate-700" /><p className="mt-3 text-sm text-slate-500">Log your first live trade to build an equity curve.</p><button type="button" onClick={onLogTrade} className="tf-press mt-3 font-mono text-[10px] uppercase tracking-[.16em] text-blue-300">Log trade <ArrowRight className="inline h-3.5 w-3.5" /></button></div>
      </div>
    );
  }

  const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const fillPath = `${path} L 92 92 L 8 92 Z`;

  return (
    <div className="relative mt-5 h-64 overflow-hidden rounded-xl border border-white/[.06] bg-[#070a10]">
      <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(#263247_1px,transparent_1px),linear-gradient(90deg,#263247_1px,transparent_1px)] [background-size:72px_48px]" />
      <div className="pointer-events-none absolute left-4 top-3 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[.14em] text-slate-500"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> Equity curve</div>
      <div className="pointer-events-none absolute right-4 top-3 rounded-md border border-white/[.08] bg-[#070a10]/85 px-2 py-1 font-mono text-[9px] text-slate-400">{trades.length} execution{trades.length === 1 ? "" : "s"}</div>
      <svg role="img" aria-label="Live-trade profit and loss bars" viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-x-5 bottom-8 top-10 h-[calc(100%-3.5rem)] w-[calc(100%-2.5rem)] overflow-visible"><defs><linearGradient id="dashboard-equity-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="rgba(52,211,153,.28)" /><stop offset="100%" stopColor="rgba(52,211,153,0)" /></linearGradient></defs><line x1="8" y1="86" x2="92" y2="86" stroke="rgba(148,163,184,.24)" strokeDasharray="1.8 2.2" vectorEffect="non-scaling-stroke" /><path d={fillPath} fill="url(#dashboard-equity-fill)" /><path d={path} fill="none" stroke="rgb(52 211 153)" strokeWidth="1.2" vectorEffect="non-scaling-stroke" /></svg>
      <div className="pointer-events-none absolute bottom-3 left-3 rounded-md border border-white/[.08] bg-[#070a10]/90 px-2 py-1 font-mono text-[9px] text-slate-400">Live trades only</div><div className="pointer-events-none absolute bottom-3 right-3 font-mono text-[9px] text-slate-500">Net {money(totalPnl)}</div>
    </div>
  );
}

function InstrumentBreakdown({ trades }: { trades: Trade[] }) {
  const instruments = useMemo(() => {
    const counts = new Map<string, { count: number; pnl: number }>();
    trades.forEach((trade) => { const current = counts.get(trade.symbol) ?? { count: 0, pnl: 0 }; counts.set(trade.symbol, { count: current.count + 1, pnl: current.pnl + trade.pnl }); });
    return Array.from(counts.entries()).sort((a, b) => b[1].count - a[1].count || b[1].pnl - a[1].pnl).slice(0, 4);
  }, [trades]);

  return <section className="rounded-2xl border border-white/[.07] bg-[#0a0e16] p-4 shadow-[0_18px_40px_rgba(0,0,0,.18)] sm:p-5"><div className="flex items-center justify-between"><div><p className="font-mono text-[9px] uppercase tracking-[.19em] text-slate-500">Portfolio focus</p><p className="mt-1 text-sm font-medium text-white">Most traded assets</p></div><BarChart3 className="h-4 w-4 text-blue-300" /></div>{instruments.length ? <div className="mt-5 space-y-3">{instruments.map(([symbol, stats]) => <div key={symbol} className="flex items-center gap-3"><InstrumentBadge symbol={symbol} size="sm" /><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><span className="truncate font-mono text-[11px] font-semibold text-slate-200">{symbol}</span><span className={`font-mono text-[10px] ${stats.pnl >= 0 ? "text-emerald-300" : "text-rose-300"}`}>{money(stats.pnl)}</span></div><div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/[.06]"><div className={`h-full rounded-full ${stats.pnl >= 0 ? "bg-emerald-400" : "bg-rose-400"}`} style={{ width: `${Math.min(100, Math.max(12, (stats.count / Math.max(1, trades.length)) * 100))}%` }} /></div></div></div>)}</div> : <p className="mt-5 rounded-xl border border-dashed border-white/[.07] px-3 py-8 text-center text-xs text-slate-600">Your most-traded instruments will appear here.</p>}<div className="mt-5 border-t border-white/[.07] pt-4 text-[11px] text-slate-500">Live journal only · Backtest excluded</div></section>;
}

export default function Home() {
  const [, setLocation] = useLocation();
  const { data: trades = [] } = trpc.trades.list.useQuery();
  const { data: calendar, isLoading: calendarLoading, isError: calendarError, error: calendarQueryError, refetch: refetchCalendar } = trpc.calendar.getEvents.useQuery(undefined, { staleTime: 4 * 60 * 1000, refetchOnWindowFocus: false });
  const [detailTrade, setDetailTrade] = useState<Trade | null>(null);
  const [selectedDay, setSelectedDay] = useState(isoDate(new Date()));
  const [range, setRange] = useState<"7D" | "30D" | "90D">("30D");

  const overview = useMemo(() => {
    const totalPnl = trades.reduce((sum, trade) => sum + trade.pnl, 0);
    const wins = trades.filter((trade) => trade.pnl > 0);
    const losses = trades.filter((trade) => trade.pnl < 0);
    const monthKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
    const monthPnl = trades.filter((trade) => trade.date.startsWith(monthKey)).reduce((sum, trade) => sum + trade.pnl, 0);
    const winRate = trades.length ? (wins.length / trades.length) * 100 : 0;
    const averageWin = wins.length ? wins.reduce((sum, trade) => sum + trade.pnl, 0) / wins.length : 0;
    const averageLoss = losses.length ? losses.reduce((sum, trade) => sum + trade.pnl, 0) / losses.length : 0;
    const factor = averageLoss < 0 ? Math.abs(averageWin / averageLoss) : averageWin > 0 ? Infinity : 0;
    const recent = [...trades].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);
    return { totalPnl, wins, losses, monthPnl, winRate, factor, recent };
  }, [trades]);

  const logTrade = () => {
    setLocation(appRoutes.trades);
    window.setTimeout(() => window.dispatchEvent(new Event("trade-fusion:open-log-trade")), 120);
  };

  const periodLabel = range === "7D" ? "Last 7 days" : range === "90D" ? "Last 90 days" : "Last 30 days";

  return (
    <div className="min-h-full bg-[#06090f] text-foreground">
      <main className="mx-auto w-full max-w-[1720px] px-4 py-5 sm:px-5 lg:px-7 lg:py-6">
        <section className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><div className="flex items-center gap-2 text-[10px] text-slate-600"><span>Trade Fusion</span><span>/</span><span className="text-slate-400">Dashboard</span></div><p className="mt-3 font-mono text-[9px] uppercase tracking-[.22em] text-blue-300">Private performance workspace</p><h1 className="mt-1.5 text-2xl font-semibold tracking-[-.045em] text-white sm:text-3xl">Welcome back, trader</h1><p className="mt-1.5 text-xs text-slate-500">Your live journal at a glance · Backtest stays separate</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => setLocation(appRoutes.journal)} className="tf-press inline-flex items-center gap-1.5 rounded-xl border border-white/[.08] bg-white/[.025] px-3 py-2 text-xs text-slate-300 hover:bg-white/[.06]"><BookOpenCheck className="h-3.5 w-3.5 text-blue-300" />Open Journal</button><button type="button" onClick={logTrade} className="tf-press inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-blue-400 to-blue-500 px-3 py-2 text-xs font-semibold text-white shadow-[0_10px_24px_oklch(.38_.16_250_/.28)]"><Plus className="h-4 w-4" />Log Trade</button></div></section>

        <CalendarRiskRibbon calendar={calendar} isLoading={calendarLoading} isError={calendarError} error={calendarQueryError} onRetry={() => void refetchCalendar()} onOpenCalendar={() => setLocation(appRoutes.calendar)} />
        <WeekStrip trades={trades as Trade[]} selectedDay={selectedDay} onSelect={setSelectedDay} />

        <section className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Net P&L" value={money(overview.totalPnl)} detail={`${trades.length} closed live trade${trades.length === 1 ? "" : "s"}`} tone={overview.totalPnl < 0 ? "loss" : "profit"} icon={CircleDollarSign} /><MetricCard label="Win rate" value={percent(overview.winRate)} detail={`${overview.wins.length} wins · ${overview.losses.length} losses`} tone="blue" icon={Target} /><MetricCard label="Profit factor" value={Number.isFinite(overview.factor) ? overview.factor.toFixed(2) : "∞"} detail="Average win ÷ average loss" tone="profit" icon={TrendingUp} /><MetricCard label="Journal coverage" value={`${trades.length ? Math.round((trades.filter((trade) => trade.notes?.trim()).length / trades.length) * 100) : 0}%`} detail="Trades with execution notes" tone="amber" icon={BookOpenCheck} /></section>

        <section className="mb-4 flex flex-col gap-3 rounded-2xl border border-white/[.07] bg-[#090d14] p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4"><div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-xl border border-blue-300/15 bg-blue-400/[.08]"><Activity className="h-4 w-4 text-blue-300" /></div><div><p className="font-mono text-[9px] uppercase tracking-[.19em] text-slate-500">Performance window</p><p className="mt-1 text-sm font-medium text-white">{periodLabel}</p></div></div><div className="flex items-center gap-1 rounded-xl border border-white/[.07] bg-white/[.018] p-1">{(["7D", "30D", "90D"] as const).map((option) => <button key={option} type="button" onClick={() => setRange(option)} className={`tf-press rounded-lg px-3 py-1.5 font-mono text-[10px] ${range === option ? "bg-blue-400/[.15] text-blue-100" : "text-slate-500 hover:text-slate-200"}`}>{option}</button>)}</div></section>

        <section className="grid gap-4 2xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,.85fr)]"><section className="overflow-hidden rounded-2xl border border-white/[.07] bg-[#0a0e16] p-4 shadow-[0_18px_40px_rgba(0,0,0,.18)] sm:p-5"><div className="flex items-start justify-between gap-3"><div><p className="font-mono text-[9px] uppercase tracking-[.19em] text-slate-500">Recorded performance</p><p className={`mt-2 font-mono text-3xl font-semibold tracking-[-.06em] ${overview.totalPnl > 0 ? "text-emerald-300" : overview.totalPnl < 0 ? "text-rose-300" : "text-white"}`}>{money(overview.totalPnl)}</p></div><span className="rounded-md border border-blue-400/15 bg-blue-500/[.06] px-2 py-1 font-mono text-[9px] text-blue-200">LIVE JOURNAL</span></div><EquityCurve trades={trades as Trade[]} totalPnl={overview.totalPnl} onLogTrade={logTrade} /></section><InstrumentBreakdown trades={trades as Trade[]} /></section>

        <section className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,.8fr)]"><section className="rounded-2xl border border-white/[.07] bg-[#0a0e16] p-4 shadow-[0_18px_40px_rgba(0,0,0,.18)] sm:p-5"><div className="flex items-center justify-between"><div><p className="font-mono text-[9px] uppercase tracking-[.19em] text-slate-500">Recent trades</p><p className="mt-1 text-sm font-medium text-white">Latest live executions</p></div><button type="button" onClick={() => setLocation(appRoutes.trades)} className="tf-press inline-flex items-center gap-1 rounded-lg border border-white/[.08] px-2.5 py-1.5 text-[10px] text-slate-400 hover:bg-white/[.05] hover:text-white">See all <ArrowRight className="h-3 w-3" /></button></div><div className="mt-4 overflow-hidden rounded-xl border border-white/[.06]"><div className="hidden grid-cols-[1.1fr_.9fr_.7fr_.7fr] gap-3 border-b border-white/[.06] bg-white/[.02] px-3 py-2 font-mono text-[9px] uppercase tracking-[.14em] text-slate-600 sm:grid"><span>Instrument</span><span>Direction</span><span>Date</span><span className="text-right">P&L</span></div>{overview.recent.length ? overview.recent.map((trade) => <button type="button" key={trade.id} data-testid={`dashboard-trade-${trade.id}`} onClick={() => setDetailTrade(trade as Trade)} className="tf-press grid w-full grid-cols-[1.1fr_.9fr_.7fr_.7fr] items-center gap-3 border-b border-white/[.05] px-3 py-3 text-left last:border-0 hover:bg-blue-500/[.04]"><span className="flex min-w-0 items-center gap-2"><InstrumentBadge symbol={trade.symbol} size="sm" /><span className="truncate font-mono text-[11px] font-semibold text-slate-200">{trade.symbol}</span></span><span><DirectionBadge direction={trade.direction} size="sm" /></span><span className="text-[10px] text-slate-600">{trade.date}</span><span className={`text-right font-mono text-xs ${trade.pnl > 0 ? "text-emerald-300" : trade.pnl < 0 ? "text-rose-300" : "text-slate-400"}`}>{money(trade.pnl)}</span></button>) : <p className="px-3 py-8 text-center text-xs text-slate-600">No live trades recorded.</p>}</div></section><section className="rounded-2xl border border-white/[.07] bg-[#0a0e16] p-4 shadow-[0_18px_40px_rgba(0,0,0,.18)] sm:p-5"><div className="flex items-center justify-between"><div><p className="font-mono text-[9px] uppercase tracking-[.19em] text-slate-500">Execution review</p><p className="mt-1 text-sm font-medium text-white">Journal follow-through</p></div><ShieldCheck className="h-4 w-4 text-emerald-300" /></div><div className="mt-5 space-y-4"><div><div className="flex items-center justify-between text-xs"><span className="text-slate-400">Winning trades</span><span className="font-mono text-emerald-300">{overview.wins.length}</span></div><div className="mt-2 h-2 rounded-full bg-white/[.06]"><div className="h-full rounded-full bg-emerald-400" style={{ width: `${trades.length ? (overview.wins.length / trades.length) * 100 : overview.winRate}%` }} /></div></div><div><div className="flex items-center justify-between text-xs"><span className="text-slate-400">With notes</span><span className="font-mono text-blue-300">{trades.filter((trade) => trade.notes?.trim()).length}</span></div><div className="mt-2 h-2 rounded-full bg-white/[.06]"><div className="h-full rounded-full bg-blue-400" style={{ width: `${trades.length ? (trades.filter((trade) => trade.notes?.trim()).length / trades.length) * 100 : 0}%` }} /></div></div><div className="grid grid-cols-2 gap-2 pt-1"><div className="rounded-xl border border-white/[.06] bg-white/[.018] p-3"><TrendingUp className="h-3.5 w-3.5 text-emerald-300" /><p className="mt-2 font-mono text-sm text-white">{money(overview.wins.length ? overview.wins.reduce((sum, trade) => sum + trade.pnl, 0) / overview.wins.length : 0)}</p><p className="mt-1 text-[10px] text-slate-600">Avg win</p></div><div className="rounded-xl border border-white/[.06] bg-white/[.018] p-3"><TrendingDown className="h-3.5 w-3.5 text-rose-300" /><p className="mt-2 font-mono text-sm text-white">{money(overview.losses.length ? overview.losses.reduce((sum, trade) => sum + trade.pnl, 0) / overview.losses.length : 0)}</p><p className="mt-1 text-[10px] text-slate-600">Avg loss</p></div></div></div></section></section>

        <section className="mt-4 grid gap-4 xl:grid-cols-[1fr_1fr]"><section className="rounded-2xl border border-white/[.07] bg-[#0a0e16] p-4 sm:p-5"><div className="flex items-center justify-between"><div><p className="font-mono text-[9px] uppercase tracking-[.19em] text-slate-500">Practice & prepare</p><p className="mt-1 text-sm font-medium text-white">Keep simulations separate</p></div><FlaskConical className="h-4 w-4 text-violet-300" /></div><p className="mt-4 text-xs leading-5 text-slate-500">Replay markets in Backtest and review macro risk before an execution. Simulated sessions never affect this Dashboard.</p><div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => setLocation(appRoutes.backtest)} className="tf-press inline-flex items-center gap-1.5 rounded-lg bg-violet-500/[.12] px-3 py-2 text-xs text-violet-200 hover:bg-violet-500/[.18]">Open Backtest <ArrowRight className="h-3.5 w-3.5" /></button><button type="button" onClick={() => setLocation(appRoutes.calendar)} className="tf-press inline-flex items-center gap-1.5 rounded-lg bg-blue-500/[.08] px-3 py-2 text-xs text-blue-200 hover:bg-blue-500/[.14]"><CalendarDays className="h-3.5 w-3.5" />Market Calendar</button></div></section><section className="rounded-2xl border border-white/[.07] bg-[#0a0e16] p-4 sm:p-5"><div className="flex items-center justify-between"><div><p className="font-mono text-[9px] uppercase tracking-[.19em] text-slate-500">Account guardrails</p><p className="mt-1 text-sm font-medium text-white">Private by design</p></div><ShieldCheck className="h-4 w-4 text-blue-300" /></div><p className="mt-4 text-xs leading-5 text-slate-500">Your trade records, journal notes, and screenshots stay scoped to your account. Backtest data is never mixed into live performance.</p><button type="button" onClick={() => setLocation(appRoutes.account)} className="tf-press mt-4 inline-flex items-center gap-1.5 rounded-lg border border-white/[.08] px-3 py-2 text-xs text-slate-300 hover:bg-white/[.05]">Review account privacy <ArrowRight className="h-3.5 w-3.5" /></button></section></section>
      </main>
      {detailTrade && <TradeDetailDrawer trade={detailTrade} open onOpenChange={(open) => { if (!open) setDetailTrade(null); }} />}
    </div>
  );
}

// Trade Journal — Main page
// Design: Trading Terminal — dark, data-dense, green/red P&L signals
// Typography: Space Grotesk (headings), Inter (body), JetBrains Mono (numbers)
import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Activity, ArrowRight, ArrowUpRight, BarChart2, CalendarDays, ChartNoAxesCombined, Download, FlaskConical, Gauge, ListFilter, Plus, ShieldCheck, Sparkles, Target, Trash2, TrendingUp } from 'lucide-react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import TradeStats from '@/components/TradeStats';
import DayRow from '@/components/DayRow';
import AddTradeModal from '@/components/AddTradeModal';
import type { Trade } from '@/lib/tradeTypes';
import { groupByDay, loadTrades, saveTrades } from '@/lib/tradeTypes';
import { SEED_TRADES } from '@/lib/seedData';
import { appRoutes } from '@/lib/appRoutes';

function asCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(value);
}

function buildEquityPath(trades: Trade[]) {
  const sorted = [...trades].sort((left, right) => left.date.localeCompare(right.date));
  if (!sorted.length) return '';

  let running = 0;
  const points = sorted.map((trade) => {
    running += trade.pnl;
    return running;
  });
  const min = Math.min(0, ...points);
  const max = Math.max(0, ...points);
  const range = Math.max(1, max - min);

  return points.map((point, index) => {
    const x = points.length === 1 ? 300 : 18 + (index / (points.length - 1)) * 564;
    const y = 178 - ((point - min) / range) * 142;
    return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');
}

function MetricCard({ label, value, detail, tone, icon: Icon }: { label: string; value: string; detail: string; tone: 'blue' | 'emerald' | 'amber' | 'violet'; icon: React.ElementType }) {
  const toneClasses = {
    blue: 'border-blue-400/15 bg-blue-500/[0.055] text-blue-300',
    emerald: 'border-emerald-400/15 bg-emerald-500/[0.055] text-emerald-300',
    amber: 'border-amber-400/15 bg-amber-500/[0.055] text-amber-200',
    violet: 'border-violet-400/15 bg-violet-500/[0.055] text-violet-300',
  }[tone];

  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0a111f] p-4 shadow-[0_16px_32px_rgba(0,0,0,0.18)] sm:p-5">
      <div className={`absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-lg border ${toneClasses}`}><Icon className="h-4 w-4" /></div>
      <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-3 pr-9 font-mono text-2xl font-semibold tracking-[-0.05em] text-white sm:text-[1.65rem]">{value}</p>
      <p className="mt-1.5 text-[11px] text-slate-500">{detail}</p>
      <div className="absolute bottom-0 left-5 right-5 h-px bg-gradient-to-r from-transparent via-white/[0.12] to-transparent" />
    </section>
  );
}

export default function Home() {
  // The useAuth hook provides authentication state.
  // To implement login/logout, call logout(), or start login from an event
  // handler: onClick={() => startLogin()} (imported from "@/const"). Never call
  // startLogin() during render (no href={startLogin()}) — it mints a one-time
  // nonce cookie and must run only at the moment of navigation.
  const { user, loading, error, isAuthenticated, logout } = useAuth();

  const [trades, setTrades] = useState<Trade[]>(() => loadTrades());
  const [modalOpen, setModalOpen] = useState(false);
  const [editTrade, setEditTrade] = useState<Trade | null>(null);
  const [filterSymbol, setFilterSymbol] = useState('');
  const [sortAsc, setSortAsc] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const openTradeLog = () => {
      setEditTrade(null);
      setModalOpen(true);
    };
    window.addEventListener('trade-fusion:open-log-trade', openTradeLog);
    return () => window.removeEventListener('trade-fusion:open-log-trade', openTradeLog);
  }, []);

  // Fetch trades from cloud API
  const { data: cloudTrades = [], isLoading } = trpc.trades.list.useQuery(undefined, {
    enabled: !!user, // Only fetch if user is logged in
  });

  const utils = trpc.useUtils();
  const createTradeMutation = trpc.trades.create.useMutation({
    onSuccess: () => utils.trades.list.invalidate(),
  });
  const updateTradeMutation = trpc.trades.update.useMutation({
    onSuccess: () => utils.trades.list.invalidate(),
  });
  const deleteTradeMutation = trpc.trades.delete.useMutation({
    onSuccess: () => utils.trades.list.invalidate(),
  });

  const persist = (updated: Trade[]) => {
    setTrades(updated); // Update local state for UI
  };

  const handleSave = (trade: Trade) => {
    const marketSession = trade.marketSession === 'Asia' || trade.marketSession === 'London' || trade.marketSession === 'New York' || trade.marketSession === 'Other' ? trade.marketSession : '';
    const instrumentCategory = trade.instrumentCategory === 'forex' || trade.instrumentCategory === 'metals' || trade.instrumentCategory === 'crypto' || trade.instrumentCategory === 'indices' || trade.instrumentCategory === 'equities' || trade.instrumentCategory === 'options' || trade.instrumentCategory === 'other' ? trade.instrumentCategory : '';
    const tradeQuality = trade.tradeQuality === 'A_PLUS' || trade.tradeQuality === 'VALID' || trade.tradeQuality === 'FORCED' || trade.tradeQuality === 'RULE_BREAK' ? trade.tradeQuality : '';
    if (trades.some((t) => t.id === trade.id)) {
      // Update existing trade
      updateTradeMutation.mutate({
        ...trade,
        marketSession,
        instrumentCategory,
        tradeQuality,
        setupId: trade.setupId ?? null,
        ruleFollowed: trade.ruleFollowed ?? null,
        id: typeof trade.id === 'string' ? parseInt(trade.id) : trade.id,
      });
    } else {
      // Create new trade
      createTradeMutation.mutate({
        date: trade.date,
        symbol: trade.symbol,
        direction: trade.direction,
        entryPrice: trade.entryPrice,
        exitPrice: trade.exitPrice,
        quantity: trade.quantity,
        pnl: trade.pnl,
        fees: trade.fees,
        setupId: trade.setupId ?? null,
        setupTag: trade.setupTag || '',
        marketSession,
        instrumentCategory,
        tradeQuality,
        ruleFollowed: trade.ruleFollowed ?? null,
        notes: trade.notes,
      });
    }
    toast.success(editTrade ? 'Trade updated.' : 'Trade logged!');
    setEditTrade(null);
  };

  const handleEdit = (trade: Trade) => {
    setEditTrade(trade);
    setModalOpen(true);
  };

  const handleDelete = (id: number | string) => {
    deleteTradeMutation.mutate({ id: typeof id === 'string' ? parseInt(id) : id });
    toast.success('Trade removed.');
  };

  const handleClearAll = () => {
    if (!confirm('Clear all trades? This cannot be undone.')) return;
    trades.forEach((t) => deleteTradeMutation.mutate({ id: typeof t.id === 'string' ? parseInt(t.id) : t.id }));
    toast.success('All trades cleared.');
  };

  const handleLoadDemo = () => {
    persist(SEED_TRADES);
    toast.success('Demo trades loaded!');
  };

  const handleExport = () => {
    const header = 'Date,Symbol,Direction,Qty,Entry,Exit,Fees,P&L,Notes\n';
    const rows = trades
      .map((t) =>
        [t.date, t.symbol, t.direction, t.quantity, t.entryPrice, t.exitPrice, t.fees, t.pnl, `"${t.notes}"`].join(',')
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'trade-journal.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported to CSV.');
  };

  const filtered = useMemo(() => {
    const q = filterSymbol.trim().toUpperCase();
    return q ? cloudTrades.filter((t) => t.symbol.includes(q)) : cloudTrades;
  }, [cloudTrades, filterSymbol]);

  const dayGroups = useMemo(() => {
    const groups = groupByDay(filtered);
    return sortAsc ? [...groups].reverse() : groups;
  }, [filtered, sortAsc]);

  const symbolChips = useMemo(() => Array.from(new Set(cloudTrades.map((trade) => trade.symbol))).slice(0, 5), [cloudTrades]);
  const todayKey = new Date().toISOString().slice(0, 10);
  const todayTrades = useMemo(() => cloudTrades.filter((trade) => trade.date === todayKey), [cloudTrades, todayKey]);
  const todayPnl = useMemo(() => todayTrades.reduce((total, trade) => total + trade.pnl, 0), [todayTrades]);
  const commandCenter = useMemo(() => {
    const totalPnl = cloudTrades.reduce((total, trade) => total + trade.pnl, 0);
    const wins = cloudTrades.filter((trade) => trade.pnl > 0);
    const losses = cloudTrades.filter((trade) => trade.pnl < 0);
    const winRate = cloudTrades.length ? (wins.length / cloudTrades.length) * 100 : 0;
    const avgWin = wins.length ? wins.reduce((total, trade) => total + trade.pnl, 0) / wins.length : 0;
    const avgLoss = losses.length ? losses.reduce((total, trade) => total + trade.pnl, 0) / losses.length : 0;
    const profitFactor = avgLoss < 0 ? Math.abs(avgWin / avgLoss) : avgWin > 0 ? Infinity : 0;
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthTrades = cloudTrades.filter((trade) => trade.date.startsWith(monthKey));
    const monthlyPnl = monthTrades.reduce((total, trade) => total + trade.pnl, 0);
    const calendarByDay = monthTrades.reduce<Record<number, { pnl: number; count: number }>>((days, trade) => {
      const day = Number(trade.date.slice(-2));
      const previous = days[day] ?? { pnl: 0, count: 0 };
      days[day] = { pnl: previous.pnl + trade.pnl, count: previous.count + 1 };
      return days;
    }, {});
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
    const dayCount = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const calendarCells = Array.from({ length: firstDay + dayCount }, (_, index) => {
      if (index < firstDay) return null;
      const day = index - firstDay + 1;
      return { day, ...calendarByDay[day] };
    });
    const recentTrades = [...cloudTrades].sort((left, right) => right.date.localeCompare(left.date)).slice(0, 4);
    return {
      totalPnl, wins: wins.length, losses: losses.length, winRate, avgWin, avgLoss, profitFactor, monthlyPnl,
      monthLabel: now.toLocaleString('en-US', { month: 'long', year: 'numeric' }), calendarCells, recentTrades,
    };
  }, [cloudTrades]);
  const equityPath = useMemo(() => buildEquityPath(cloudTrades), [cloudTrades]);

  return (
    <div className="min-h-full bg-[#06090f] text-foreground">
      <main className="mx-auto w-full max-w-[1720px] px-4 py-5 sm:px-5 lg:px-7 lg:py-6">
        <section className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-blue-300">Private command center</p>
            <h1 className="mt-1.5 text-2xl font-semibold tracking-[-0.04em] text-white sm:text-3xl">Journal Dashboard</h1>
            <p className="mt-1.5 text-xs text-slate-500">Recorded trade performance · private to your account</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              placeholder="Filter by symbol..."
              value={filterSymbol}
              onChange={(e) => setFilterSymbol(e.target.value)}
              className="h-9 w-44 rounded-xl border border-white/[0.08] bg-white/[0.025] px-3 font-mono text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-300"
            />
            <button type="button" onClick={() => setSortAsc((v) => !v)} className="h-9 rounded-xl border border-white/[0.08] bg-white/[0.025] px-3 text-xs text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white">{sortAsc ? '↑ Oldest' : '↓ Newest'}</button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={trades.length === 0}
              className="h-9 rounded-xl border-white/[0.08] bg-white/[0.025] text-slate-400 hover:bg-white/[0.06] hover:text-white gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </Button>
            {trades.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                className="h-9 rounded-xl border-white/[0.08] bg-white/[0.025] text-slate-400 hover:bg-red-500/10 hover:text-red-300 gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear All
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setLocation(appRoutes.analytics)} className="h-9 rounded-xl gap-1.5 border-blue-300/20 bg-blue-400/[0.07] text-blue-100 hover:bg-blue-400/[0.14]">
              <BarChart2 className="w-3.5 h-3.5" />
              Analytics
            </Button>
            <Button
              size="sm"
              onClick={() => { setEditTrade(null); setModalOpen(true); }}
              className="tf-press h-9 rounded-xl gap-1.5 bg-gradient-to-br from-blue-400 to-blue-500 text-white shadow-[0_10px_24px_oklch(0.38_0.16_250_/_0.28)] hover:from-blue-300 hover:to-blue-400"
            >
              <Plus className="w-4 h-4" />
              Log Trade
            </Button>
          </div>
        </section>

        <section className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Recorded P&L" value={asCurrency(commandCenter.totalPnl)} detail={`${cloudTrades.length} closed trade${cloudTrades.length === 1 ? '' : 's'} in journal`} tone="blue" icon={ChartNoAxesCombined} />
          <MetricCard label="This month" value={asCurrency(commandCenter.monthlyPnl)} detail={commandCenter.monthLabel} tone={commandCenter.monthlyPnl >= 0 ? 'emerald' : 'amber'} icon={TrendingUp} />
          <MetricCard label="Win rate" value={`${commandCenter.winRate.toFixed(1)}%`} detail={`${commandCenter.wins} wins · ${commandCenter.losses} losses`} tone="violet" icon={Target} />
          <MetricCard label="Today" value={todayTrades.length.toString()} detail={todayTrades.length ? `${asCurrency(todayPnl)} recorded P&L` : 'No executions logged today'} tone="amber" icon={Activity} />
        </section>

        <section className="mb-5 grid gap-4 2xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,.85fr)]">
          <section className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0a111f] p-4 shadow-[0_18px_38px_rgba(0,0,0,.2)] sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-slate-500">Private performance</p><p className={`mt-2 font-mono text-3xl font-semibold tracking-[-0.06em] ${commandCenter.totalPnl > 0 ? 'text-emerald-300' : commandCenter.totalPnl < 0 ? 'text-rose-300' : 'text-white'}`}>{asCurrency(commandCenter.totalPnl)}</p></div><div className="flex gap-1 rounded-lg border border-white/[0.08] bg-white/[0.025] p-1 font-mono text-[9px] text-slate-500"><span className="rounded-md bg-blue-500/20 px-2.5 py-1 text-blue-200">ALL</span><span className="px-2.5 py-1">JOURNAL</span></div></div>
            <div className="relative mt-5 h-52 overflow-hidden rounded-xl border border-white/[0.06] bg-[#070d18] sm:h-60">
              <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(#31415b_1px,transparent_1px),linear-gradient(90deg,#31415b_1px,transparent_1px)] [background-size:72px_48px]" />
              {equityPath ? <svg viewBox="0 0 600 200" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-label="Recorded journal P and L trend"><defs><linearGradient id="tf-equity-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#60a5fa" stopOpacity=".30" /><stop offset="100%" stopColor="#60a5fa" stopOpacity="0" /></linearGradient></defs><path d={`${equityPath} L 582 196 L 18 196 Z`} fill="url(#tf-equity-fill)" /><path d={equityPath} fill="none" stroke={commandCenter.totalPnl >= 0 ? '#34d399' : '#fb7185'} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg> : <div className="relative grid h-full place-items-center text-center"><div><Gauge className="mx-auto h-6 w-6 text-slate-700" /><p className="mt-3 text-sm text-slate-500">Your recorded performance trend will appear here.</p><button type="button" onClick={() => { setEditTrade(null); setModalOpen(true); }} className="mt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-blue-300 hover:text-blue-100">Log first execution <ArrowRight className="inline h-3.5 w-3.5" /></button></div></div>}
              {equityPath && <div className="absolute bottom-3 left-3 rounded-md border border-white/[0.08] bg-[#070d18]/90 px-2 py-1 font-mono text-[9px] text-slate-400">Closed trades only</div>}
            </div>
          </section>

          <section className="rounded-2xl border border-white/[0.07] bg-[#0a111f] p-4 shadow-[0_18px_38px_rgba(0,0,0,.2)] sm:p-5">
            <div className="flex items-center justify-between gap-3"><div><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-slate-500">Monthly P&L</p><p className="mt-1 text-sm font-medium text-white">{commandCenter.monthLabel}</p></div><button type="button" onClick={() => setLocation(appRoutes.calendar)} className="tf-press rounded-lg border border-blue-400/15 bg-blue-500/[0.06] p-2 text-blue-200 hover:bg-blue-500/[0.13]" aria-label="Open market calendar"><CalendarDays className="h-4 w-4" /></button></div>
            <div className="mt-4 grid grid-cols-7 gap-1 font-mono text-[8px] uppercase tracking-[0.08em] text-slate-600">{['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => <span key={`${day}-${index}`} className="pb-1 text-center">{day}</span>)}{commandCenter.calendarCells.map((cell, index) => !cell ? <span key={`blank-${index}`} className="min-h-11" /> : <div key={cell.day} className={`min-h-11 rounded-md border p-1.5 ${cell.count ? cell.pnl > 0 ? 'border-emerald-400/20 bg-emerald-500/[0.10]' : cell.pnl < 0 ? 'border-rose-400/20 bg-rose-500/[0.10]' : 'border-white/[0.07] bg-white/[0.025]' : 'border-white/[0.04] bg-white/[0.015]'}`}><span className="text-slate-500">{cell.day}</span>{cell.count ? <span className={`mt-1 block text-[8px] ${cell.pnl > 0 ? 'text-emerald-300' : cell.pnl < 0 ? 'text-rose-300' : 'text-slate-400'}`}>{cell.pnl >= 0 ? '+' : '-'}{Math.abs(cell.pnl).toFixed(0)}</span> : null}</div>)}</div>
            <div className="mt-4 flex items-center gap-4 font-mono text-[9px] text-slate-500"><span className="inline-flex items-center gap-1.5"><i className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Profit day</span><span className="inline-flex items-center gap-1.5"><i className="h-1.5 w-1.5 rounded-full bg-rose-400" /> Loss day</span></div>
          </section>
        </section>

        <section className="mb-5 grid gap-4 xl:grid-cols-[.9fr_.9fr_1.2fr]">
          <section className="rounded-2xl border border-white/[0.07] bg-[#0a111f] p-4 sm:p-5"><div className="flex items-center justify-between"><div><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-slate-500">Recent activity</p><p className="mt-1 text-sm font-medium text-white">Latest executions</p></div><Activity className="h-4 w-4 text-blue-300" /></div><div className="mt-4 space-y-2.5">{commandCenter.recentTrades.length ? commandCenter.recentTrades.map((trade) => <button type="button" onClick={() => handleEdit(trade)} key={trade.id} className="group flex w-full items-center justify-between rounded-lg border border-white/[0.055] bg-white/[0.018] px-3 py-2.5 text-left transition hover:border-blue-300/20 hover:bg-blue-500/[0.04]"><div><p className="font-mono text-[10px] font-semibold text-slate-200">{trade.symbol} <span className="font-normal text-slate-600">· {trade.direction}</span></p><p className="mt-0.5 text-[10px] text-slate-600">{trade.date}</p></div><span className={`font-mono text-xs ${trade.pnl > 0 ? 'text-emerald-300' : trade.pnl < 0 ? 'text-rose-300' : 'text-slate-400'}`}>{asCurrency(trade.pnl)}</span></button>) : <p className="rounded-lg border border-dashed border-white/[0.07] px-3 py-7 text-center text-xs text-slate-600">No executions recorded yet.</p>}</div></section>
          <section className="rounded-2xl border border-white/[0.07] bg-[#0a111f] p-4 sm:p-5"><div className="flex items-center justify-between"><div><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-slate-500">Practice & prepare</p><p className="mt-1 text-sm font-medium text-white">Next decision desk</p></div><FlaskConical className="h-4 w-4 text-violet-300" /></div><div className="mt-4 rounded-xl border border-violet-400/10 bg-violet-500/[0.045] p-3.5"><p className="text-sm font-medium text-slate-200">Keep live performance separate.</p><p className="mt-1.5 text-xs leading-5 text-slate-500">Replay markets and simulate risk in Backtest. Journal and Analytics remain live-trade only.</p><button type="button" onClick={() => setLocation(appRoutes.backtest)} className="tf-press mt-4 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-violet-200 hover:text-violet-100">Open Backtest <ArrowUpRight className="h-3.5 w-3.5" /></button></div><button type="button" onClick={() => setLocation(appRoutes.calendar)} className="tf-press mt-3 flex w-full items-center justify-between rounded-xl border border-blue-400/10 bg-blue-500/[0.04] px-3.5 py-3 text-left hover:bg-blue-500/[0.08]"><span><span className="block text-xs font-medium text-slate-200">Macro risk check</span><span className="mt-0.5 block text-[10px] text-slate-600">Review the live economic calendar.</span></span><CalendarDays className="h-4 w-4 text-blue-300" /></button></section>
          <section className="rounded-2xl border border-white/[0.07] bg-[#0a111f] p-4 sm:p-5"><div className="flex items-center justify-between"><div><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-slate-500">Quick statistics</p><p className="mt-1 text-sm font-medium text-white">Recorded journal only</p></div><ShieldCheck className="h-4 w-4 text-emerald-300" /></div><div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-5 sm:grid-cols-4"><div><p className="font-mono text-[8px] uppercase tracking-[0.13em] text-slate-600">Profit factor</p><p className="mt-1.5 font-mono text-lg font-semibold text-white">{Number.isFinite(commandCenter.profitFactor) ? commandCenter.profitFactor.toFixed(2) : '∞'}</p></div><div><p className="font-mono text-[8px] uppercase tracking-[0.13em] text-slate-600">Avg win</p><p className="mt-1.5 font-mono text-lg font-semibold text-emerald-300">{asCurrency(commandCenter.avgWin)}</p></div><div><p className="font-mono text-[8px] uppercase tracking-[0.13em] text-slate-600">Avg loss</p><p className="mt-1.5 font-mono text-lg font-semibold text-rose-300">{asCurrency(commandCenter.avgLoss)}</p></div><div><p className="font-mono text-[8px] uppercase tracking-[0.13em] text-slate-600">Symbols</p><p className="mt-1.5 font-mono text-lg font-semibold text-white">{symbolChips.length}</p></div></div><button type="button" onClick={() => setLocation(appRoutes.analytics)} className="tf-press mt-6 inline-flex items-center gap-1.5 text-xs font-medium text-blue-200 hover:text-white">Open setup analytics <ArrowRight className="h-3.5 w-3.5" /></button></section>
        </section>

        <section className="mb-4 flex flex-col gap-3 rounded-2xl border border-white/[0.07] bg-[#0a111f] px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0"><ListFilter className="h-4 w-4 shrink-0 text-slate-500" /><button onClick={() => setFilterSymbol('')} className={`tf-press shrink-0 rounded-full border px-3 py-1.5 text-xs ${!filterSymbol ? 'border-emerald-300/30 bg-emerald-400/[0.10] text-emerald-200' : 'border-white/[0.09] text-slate-500 hover:text-slate-200'}`}>All symbols</button>{symbolChips.map((symbol) => <button key={symbol} onClick={() => setFilterSymbol(symbol)} className={`tf-press shrink-0 rounded-full border px-3 py-1.5 font-mono text-[11px] ${filterSymbol === symbol ? 'border-emerald-300/30 bg-emerald-400/[0.10] text-emerald-200' : 'border-white/[0.09] text-slate-500 hover:text-slate-200'}`}>{symbol}</button>)}</div>
          <button onClick={() => setLocation(appRoutes.backtest)} className="tf-press inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-violet-200"><FlaskConical className="h-3.5 w-3.5 text-violet-300" />Open Backtest lab <ArrowUpRight className="h-3.5 w-3.5" /></button>
        </section>
        <section className="mb-3 flex items-center justify-between"><div><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-slate-600">Execution ledger</p><p className="mt-1 text-sm font-medium text-white">Daily trade review</p></div><span className="font-mono text-[9px] uppercase tracking-[0.14em] text-slate-600">{filtered.length} filtered records</span></section>

        {/* Table header */}
        {dayGroups.length > 0 && (
          <div className="sticky top-[76px] z-10 mb-3 flex items-center gap-3 border-b border-border bg-[#07101f]/95 px-4 py-2 text-xs uppercase tracking-wider text-muted-foreground backdrop-blur-xl">
            <span className="w-4 flex-shrink-0" />
            <span className="w-44 flex-shrink-0">Date</span>
            <span className="w-24 flex-shrink-0">Trades</span>
            <span className="w-24 flex-shrink-0">W / L</span>
            <span className="w-24 flex-shrink-0">Fees</span>
            <span className="ml-auto">Net P&L</span>
            <span className="w-16 text-center flex-shrink-0">Result</span>
          </div>
        )}

        {/* Always-visible table shell (terminal frame) */}
        {dayGroups.length === 0 && (
          <div className="tf-workspace-surface mb-4 overflow-hidden rounded-xl">
            {/* Table header row */}
            <div className="flex items-center gap-3 px-4 py-2.5 bg-card border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
              <span className="w-4 flex-shrink-0" />
              <span className="w-44 flex-shrink-0">Date</span>
              <span className="w-24 flex-shrink-0">Trades</span>
              <span className="w-24 flex-shrink-0">W / L</span>
              <span className="w-24 flex-shrink-0">Fees</span>
              <span className="ml-auto">Net P&L</span>
              <span className="w-16 text-center flex-shrink-0">Result</span>
            </div>
            {/* Skeleton rows */}
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-3 border-b border-border/40 last:border-0"
                style={{ opacity: 0.18 - i * 0.04 }}
              >
                <span className="w-4 flex-shrink-0 h-3 rounded bg-border" />
                <span className="w-36 h-3 rounded bg-border flex-shrink-0" />
                <span className="w-16 h-3 rounded bg-border flex-shrink-0" />
                <span className="w-16 h-3 rounded bg-border flex-shrink-0" />
                <span className="w-20 h-3 rounded bg-border flex-shrink-0" />
                <span className="ml-auto w-20 h-3 rounded bg-border" />
                <span className="w-14 h-3 rounded bg-border flex-shrink-0" />
              </div>
            ))}
          </div>
        )}

        {/* Day rows */}
        {dayGroups.length > 0 ? (
          <div>
            {dayGroups.map((group, i) => (
              <motion.div
                key={group.date}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15, delay: i * 0.03, ease: [0.23, 1, 0.32, 1] }}
              >
                <DayRow
                  group={group}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
            <p
              className="text-base font-semibold text-foreground"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {filterSymbol
                ? `No trades found for "${filterSymbol.toUpperCase()}"`
                : 'Journal is empty — log your first trade.'}
            </p>
            <p className="text-xs text-muted-foreground font-mono tracking-wide">
              {filterSymbol ? 'Try a different symbol.' : 'Every trade. Every day.'}
            </p>
            {!filterSymbol && (
              <div className="flex items-center gap-3 mt-1">
                <Button
                  size="sm"
                  onClick={() => { setEditTrade(null); setModalOpen(true); }}
                  className="tf-press gap-2 bg-emerald-300 text-[#092117] hover:bg-emerald-200"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Log trade
                </Button>
                <button
                  type="button"
                  onClick={handleLoadDemo}
                  className="text-xs text-muted-foreground border border-border rounded px-3 py-1.5 hover:text-foreground hover:border-foreground/30 transition-colors font-mono"
                >
                  Load demo data
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-border py-4">
        <div className="container flex items-center justify-between text-xs text-muted-foreground">
          <span style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Trade Fusion Journal</span>
          <span>Private sync active · {cloudTrades.length} total trade{cloudTrades.length !== 1 ? 's' : ''}</span>
        </div>
      </footer>

      {/* ── Modal ── */}
      <AddTradeModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditTrade(null); }}
        onSave={handleSave}
        editTrade={editTrade}
      />
    </div>
  );
}

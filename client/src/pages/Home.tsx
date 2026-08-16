// Trade Journal — Main page
// Design: Trading Terminal — dark, data-dense, green/red P&L signals
// Typography: Space Grotesk (headings), Inter (body), JetBrains Mono (numbers)
import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { ArrowUpRight, BarChart2, CalendarDays, Download, FlaskConical, ListFilter, Plus, Sparkles, Trash2 } from 'lucide-react';
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

  return (
    <div className="min-h-full bg-[#07101f] text-foreground">
      <main className="mx-auto w-full max-w-[1640px] px-5 py-7 lg:px-8 lg:py-9">
        <section className="mb-6 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-emerald-300">Execution review</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">Trade Journal</h1>
            <p className="mt-2 text-sm text-slate-500">Log every execution. Measure the pattern. Improve the process.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              placeholder="Filter by symbol..."
              value={filterSymbol}
              onChange={(e) => setFilterSymbol(e.target.value)}
              className="h-9 w-44 rounded-xl border border-blue-200/[0.10] bg-blue-400/[0.04] px-3 font-mono text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-300"
            />
            <button type="button" onClick={() => setSortAsc((v) => !v)} className="h-9 rounded-xl border border-blue-200/[0.10] bg-blue-400/[0.04] px-3 text-xs text-slate-400 transition-colors hover:bg-blue-400/[0.10] hover:text-white">{sortAsc ? '↑ Oldest' : '↓ Newest'}</button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={trades.length === 0}
              className="h-9 rounded-xl border-blue-200/[0.10] bg-blue-400/[0.04] text-slate-400 hover:bg-blue-400/[0.10] hover:text-white gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </Button>
            {trades.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                className="h-9 rounded-xl border-blue-200/[0.10] bg-blue-400/[0.04] text-slate-400 hover:bg-red-500/10 hover:text-red-300 gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear All
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setLocation(appRoutes.analytics)} className="h-9 rounded-xl gap-1.5 border-emerald-300/20 bg-emerald-400/[0.07] text-emerald-100 hover:bg-emerald-400/[0.14]">
              <BarChart2 className="w-3.5 h-3.5" />
              Analytics
            </Button>
            <Button
              size="sm"
              onClick={() => { setEditTrade(null); setModalOpen(true); }}
              className="tf-press h-9 rounded-xl gap-1.5 bg-gradient-to-br from-emerald-300 to-emerald-400 text-[#092117] shadow-[0_10px_24px_oklch(0.36_0.15_145_/_0.32)] hover:from-emerald-200 hover:to-emerald-300"
            >
              <Plus className="w-4 h-4" />
              Log Trade
            </Button>
          </div>
        </section>

        <section className="tf-workspace-surface mb-5 overflow-hidden rounded-2xl p-4 sm:p-5">
          <div className="grid gap-4 xl:grid-cols-[1.25fr_.85fr_.85fr] xl:items-stretch">
            <div className="rounded-xl border border-emerald-300/[0.12] bg-gradient-to-br from-emerald-400/[0.10] via-transparent to-transparent p-4">
              <div className="flex items-start justify-between gap-3"><div><p className="font-mono text-[9px] uppercase tracking-[0.2em] text-emerald-300">Daily command center</p><h2 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-white">Keep the next decision simple.</h2><p className="mt-1.5 max-w-lg text-sm leading-5 text-slate-400">Record the execution, protect the review process, and use your live data to improve the next setup.</p></div><Sparkles className="h-5 w-5 shrink-0 text-emerald-300" /></div>
              <div className="mt-4 flex flex-wrap gap-2"><Button onClick={() => { setEditTrade(null); setModalOpen(true); }} className="tf-press bg-emerald-300 text-[#092117] hover:bg-emerald-200"><Plus className="mr-1.5 h-4 w-4" />Log execution</Button><Button variant="outline" onClick={() => setLocation(appRoutes.analytics)} className="tf-press border-white/[0.12] bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]"><BarChart2 className="mr-1.5 h-4 w-4" />Review patterns</Button></div>
            </div>
            <div className="tf-kpi-card rounded-xl p-4"><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-slate-500">Today’s executions</p><p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white">{todayTrades.length}</p><p className={`mt-1 text-sm font-medium ${todayPnl >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>{todayTrades.length === 0 ? 'No trades logged yet' : `${todayPnl >= 0 ? '+' : '-'}$${Math.abs(todayPnl).toFixed(2)} recorded P&L`}</p></div>
            <div className="tf-kpi-card rounded-xl p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-slate-500">Market preparation</p><p className="mt-3 text-sm font-medium text-slate-200">Check macro risk before the next setup.</p></div><CalendarDays className="h-4 w-4 text-sky-300" /></div><button onClick={() => setLocation(appRoutes.calendar)} className="tf-press mt-4 inline-flex items-center gap-1 text-xs font-medium text-sky-200 hover:text-sky-100">Open calendar <ArrowUpRight className="h-3.5 w-3.5" /></button></div>
          </div>
        </section>

        <section className="mb-5 flex flex-col gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0"><ListFilter className="h-4 w-4 shrink-0 text-slate-500" /><button onClick={() => setFilterSymbol('')} className={`tf-press shrink-0 rounded-full border px-3 py-1.5 text-xs ${!filterSymbol ? 'border-emerald-300/30 bg-emerald-400/[0.10] text-emerald-200' : 'border-white/[0.09] text-slate-500 hover:text-slate-200'}`}>All symbols</button>{symbolChips.map((symbol) => <button key={symbol} onClick={() => setFilterSymbol(symbol)} className={`tf-press shrink-0 rounded-full border px-3 py-1.5 font-mono text-[11px] ${filterSymbol === symbol ? 'border-emerald-300/30 bg-emerald-400/[0.10] text-emerald-200' : 'border-white/[0.09] text-slate-500 hover:text-slate-200'}`}>{symbol}</button>)}</div>
          <button onClick={() => setLocation(appRoutes.backtest)} className="tf-press inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-violet-200"><FlaskConical className="h-3.5 w-3.5 text-violet-300" />Open Backtest lab <ArrowUpRight className="h-3.5 w-3.5" /></button>
        </section>
        {/* Stats bar */}
        <TradeStats trades={filtered} />

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

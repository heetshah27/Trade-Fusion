// Trade Journal — Main page
// Design: Trading Terminal — dark, data-dense, green/red P&L signals
// Typography: Space Grotesk (headings), Inter (body), JetBrains Mono (numbers)
import { useState, useMemo } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Plus, TrendingUp, Download, Trash2, BarChart2, Calendar } from 'lucide-react';
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
    if (trades.some((t) => t.id === trade.id)) {
      // Update existing trade
      updateTradeMutation.mutate({
        ...trade,
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

  return (
    <div className="min-h-full bg-[#07101f] text-foreground">
      <main className="mx-auto w-full max-w-[1640px] px-5 py-7 lg:px-8 lg:py-9">
        <section className="mb-7 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[oklch(0.70_0.16_250)]">Execution review</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">Trade Journal</h1>
            <p className="mt-2 text-sm text-slate-500">Log every execution. Measure the pattern. Improve the process.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              placeholder="Filter by symbol..."
              value={filterSymbol}
              onChange={(e) => setFilterSymbol(e.target.value)}
              className="h-9 w-44 rounded-xl border border-blue-200/[0.10] bg-blue-400/[0.04] px-3 font-mono text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-[oklch(0.66_0.18_250)]"
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
            <Button
              size="sm"
              onClick={() => { setEditTrade(null); setModalOpen(true); }}
              className="h-9 rounded-xl gap-1.5 bg-[oklch(0.66_0.18_250)] text-white shadow-[0_10px_24px_oklch(0.45_0.18_250_/_0.32)] hover:bg-[oklch(0.72_0.18_250)]"
            >
              <Plus className="w-4 h-4" />
              Log Trade
            </Button>
          </div>
        </section>
        {/* Stats bar */}
        <TradeStats trades={filtered} />

        {/* Table header */}
        {dayGroups.length > 0 && (
          <div className="flex items-center gap-3 px-4 pb-2 text-xs text-muted-foreground uppercase tracking-wider border-b border-border mb-3">
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
          <div className="rounded-lg border border-border overflow-hidden mb-4">
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
                  className="gap-2"
                  style={{ background: 'oklch(0.62 0.18 240)' }}
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
          <span>Data stored locally in your browser · {trades.length} total trade{trades.length !== 1 ? 's' : ''}</span>
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

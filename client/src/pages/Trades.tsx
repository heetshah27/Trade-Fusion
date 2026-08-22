import React, { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Download, Instagram, ListFilter, Pencil, Plus, SlidersHorizontal, Trash2 } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import AddTradeModal from "@/components/AddTradeModal";
import { DirectionBadge } from "@/components/DirectionBadge";
import { InstrumentBadge } from "@/components/InstrumentBadge";
import type { Trade } from "@/lib/tradeTypes";
import { trpc } from "@/lib/trpc";
import { appRoutes } from "@/lib/appRoutes";
import { getInstrumentProfile } from "@/lib/tradeInstruments";
import { TradeDetailDrawer } from "@/components/TradeDetailDrawer";

function money(value: number) {
  const formatted = Math.abs(value).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${value > 0 ? "+" : value < 0 ? "−" : ""}${formatted}`;
}

function InstrumentMark({ symbol, category }: { symbol: string; category?: string }) {
  return <InstrumentBadge symbol={symbol} category={category} />;
}

function PnlValue({ value }: { value: number }) {
  return (
    <span className={`font-mono text-xs font-semibold ${value > 0 ? "text-emerald-300" : value < 0 ? "text-rose-300" : "text-slate-400"}`}>
      {money(value)}
    </span>
  );
}

function EditActions({ trade, onEdit, onDelete }: { trade: Trade; onEdit: (trade: Trade) => void; onDelete: (trade: Trade) => void }) {
  return (
    <div className="flex justify-end gap-1">
      <button
        type="button"
        aria-label={`Edit ${trade.symbol} trade`}
        onClick={(event) => { event.stopPropagation(); onEdit(trade); }}
        className="tf-press rounded-md p-1.5 text-slate-500 hover:bg-blue-500/[.1] hover:text-blue-200"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        aria-label={`Delete ${trade.symbol} trade`}
        onClick={(event) => { event.stopPropagation(); onDelete(trade); }}
        className="tf-press rounded-md p-1.5 text-slate-500 hover:bg-rose-500/[.1] hover:text-rose-200"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export default function Trades() {
  const [, setLocation] = useLocation();
  const [modalOpen, setModalOpen] = useState(false);
  const [editTrade, setEditTrade] = useState<Trade | null>(null);
  const [detailTrade, setDetailTrade] = useState<Trade | null>(null);
  const [filterSymbol, setFilterSymbol] = useState("");
  const [sortAsc, setSortAsc] = useState(false);
  const { data: cloudTrades = [] } = trpc.trades.list.useQuery();
  const utils = trpc.useUtils();
  const create = trpc.trades.create.useMutation({ onSuccess: () => void utils.trades.list.invalidate() });
  const update = trpc.trades.update.useMutation({ onSuccess: () => void utils.trades.list.invalidate() });
  const remove = trpc.trades.delete.useMutation({ onSuccess: () => void utils.trades.list.invalidate() });

  useEffect(() => {
    const open = () => {
      setEditTrade(null);
      setModalOpen(true);
    };
    window.addEventListener("trade-fusion:open-log-trade", open);
    return () => window.removeEventListener("trade-fusion:open-log-trade", open);
  }, []);

  const handleSave = (trade: Trade) => {
    const input = {
      ...trade,
      id: typeof trade.id === "string" ? Number(trade.id) : trade.id,
      setupId: trade.setupId ?? null,
      marketSession: (["Asia", "London", "New York", "Other"].includes(trade.marketSession || "") ? trade.marketSession : "") as "Asia" | "London" | "New York" | "Other" | "",
      instrumentCategory: (["forex", "metals", "crypto", "indices", "equities", "options", "other"].includes(trade.instrumentCategory || "") ? trade.instrumentCategory : "") as "forex" | "metals" | "crypto" | "indices" | "equities" | "options" | "other" | "",
      tradeQuality: (["A_PLUS", "VALID", "FORCED", "RULE_BREAK"].includes(trade.tradeQuality || "") ? trade.tradeQuality : "") as "A_PLUS" | "VALID" | "FORCED" | "RULE_BREAK" | "",
      ruleFollowed: trade.ruleFollowed ?? null,
    };
    if (cloudTrades.some((item) => item.id === trade.id)) update.mutate(input);
    else create.mutate(input);
    toast.success(editTrade ? "Trade updated." : "Trade logged.");
    setEditTrade(null);
  };

  const filtered = useMemo(() => {
    const query = filterSymbol.trim().toUpperCase();
    const result = query ? cloudTrades.filter((trade) => trade.symbol.includes(query)) : cloudTrades;
    return [...result].sort((a, b) => (sortAsc ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)));
  }, [cloudTrades, filterSymbol, sortAsc]);
  const symbols = useMemo(() => Array.from(new Set(cloudTrades.map((trade) => trade.symbol))).slice(0, 6), [cloudTrades]);
  const totalPnl = useMemo(() => filtered.reduce((total, trade) => total + Number(trade.pnl), 0), [filtered]);
  const wins = useMemo(() => filtered.filter((trade) => Number(trade.pnl) > 0).length, [filtered]);

  const exportCsv = () => {
    const rows = cloudTrades.map((trade) => [trade.date, trade.symbol, trade.instrumentCategory || "", trade.direction, trade.quantity, trade.entryPrice, trade.exitPrice, trade.fees, trade.pnl, "manual", `"${trade.notes}"`].join(","));
    const blob = new Blob(["Date,Symbol,Category,Direction,Size,Entry,Exit,Fees,P&L,Source,Notes\n", rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "trade-fusion-portfolio.csv";
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("Trades exported to CSV.");
  };

  const openEdit = (trade: Trade) => {
    setEditTrade(trade);
    setModalOpen(true);
  };
  const deleteTrade = (trade: Trade) => {
    remove.mutate({ id: Number(trade.id) });
    toast.success("Trade removed.");
  };

  return (
    <div className="min-h-full bg-[#06090f] text-foreground">
      <main className="mx-auto w-full max-w-[1720px] px-4 py-5 sm:px-5 lg:px-7 lg:py-6">
        <section className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[.22em] text-blue-300">Private portfolio ledger</p>
            <h1 className="mt-1.5 text-2xl font-semibold tracking-[-.04em] text-white sm:text-3xl">Trades</h1>
            <p className="mt-1.5 text-xs text-slate-500">A compact record of your manual live executions. Timing is intentionally not shown.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={exportCsv} disabled={!cloudTrades.length} className="h-9 rounded-xl border-white/[.08] bg-white/[.025] text-slate-300 hover:bg-white/[.06]"><Download className="mr-1.5 h-3.5 w-3.5" />Export CSV</Button>
            <Button variant="outline" size="sm" onClick={() => setLocation(appRoutes.content)} className="h-9 rounded-xl border-blue-400/20 bg-blue-500/[.06] text-blue-100 hover:bg-blue-500/[.12]"><Instagram className="mr-1.5 h-3.5 w-3.5" />Weekly recap</Button>
            <Button variant="outline" size="sm" onClick={() => setLocation(appRoutes.journal)} className="h-9 rounded-xl border-blue-400/20 bg-blue-500/[.06] text-blue-100 hover:bg-blue-500/[.12]">Trade Journal <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" /></Button>
            <Button size="sm" onClick={() => { setEditTrade(null); setModalOpen(true); }} className="tf-press h-9 rounded-xl bg-gradient-to-br from-blue-400 to-blue-500 text-white"><Plus className="mr-1.5 h-4 w-4" />Add Trade</Button>
          </div>
        </section>

        <section className="mb-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/[.07] bg-[#0a111f] px-4 py-3"><p className="font-mono text-[9px] uppercase tracking-[.15em] text-slate-600">Portfolio P&amp;L</p><p className="mt-1 font-mono text-lg font-semibold"><PnlValue value={totalPnl} /></p></div>
          <div className="rounded-xl border border-white/[.07] bg-[#0a111f] px-4 py-3"><p className="font-mono text-[9px] uppercase tracking-[.15em] text-slate-600">Win rate</p><p className="mt-1 font-mono text-lg font-semibold text-white">{filtered.length ? `${((wins / filtered.length) * 100).toFixed(1)}%` : "—"}</p></div>
          <div className="rounded-xl border border-white/[.07] bg-[#0a111f] px-4 py-3"><p className="font-mono text-[9px] uppercase tracking-[.15em] text-slate-600">Source</p><p className="mt-1 text-sm font-medium text-slate-200">Manual entries <span className="ml-1 font-mono text-[9px] uppercase text-blue-300">Private</span></p></div>
        </section>

        <section className="mb-4 flex flex-col gap-3 rounded-2xl border border-white/[.07] bg-[#0a111f] p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 overflow-x-auto"><SlidersHorizontal className="h-4 w-4 shrink-0 text-slate-500" /><button type="button" onClick={() => setFilterSymbol("")} className={`tf-press shrink-0 rounded-full border px-3 py-1.5 text-xs ${!filterSymbol ? "border-blue-300/30 bg-blue-500/[.12] text-blue-100" : "border-white/[.09] text-slate-500"}`}>All instruments</button>{symbols.map((symbol) => <button type="button" key={symbol} onClick={() => setFilterSymbol(symbol)} className={`tf-press shrink-0 rounded-full border px-3 py-1.5 font-mono text-[11px] ${filterSymbol === symbol ? "border-blue-300/30 bg-blue-500/[.12] text-blue-100" : "border-white/[.09] text-slate-500"}`}>{symbol}</button>)}</div>
          <div className="flex items-center gap-2"><input value={filterSymbol} onChange={(event) => setFilterSymbol(event.target.value)} placeholder="Filter symbol" className="h-8 w-32 rounded-lg border border-white/[.08] bg-white/[.025] px-2.5 font-mono text-[11px] text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-300" /><button type="button" onClick={() => setSortAsc((value) => !value)} className="tf-press rounded-lg border border-white/[.08] bg-white/[.025] px-2.5 py-1.5 text-[11px] text-slate-400">{sortAsc ? "↑ Oldest" : "↓ Newest"}</button></div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-white/[.07] bg-[#0a111f]">
          <div className="flex items-center justify-between border-b border-white/[.06] px-4 py-3 sm:px-5"><div><p className="font-mono text-[9px] uppercase tracking-[.18em] text-slate-600">Execution portfolio</p><p className="mt-1 text-sm font-medium text-white">Manual trade history</p></div><span className="font-mono text-[9px] uppercase tracking-[.14em] text-slate-600">{filtered.length} records</span></div>
          {filtered.length ? (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[980px] text-left">
                  <thead className="border-b border-white/[.055] bg-white/[.012] font-mono text-[9px] uppercase tracking-[.13em] text-slate-600"><tr><th className="px-5 py-3 font-medium">Date</th><th className="px-5 py-3 font-medium">Instrument</th><th className="px-5 py-3 font-medium">Type</th><th className="px-5 py-3 text-right font-medium">Entry</th><th className="px-5 py-3 text-right font-medium">Exit</th><th className="px-5 py-3 text-right font-medium">Size</th><th className="px-5 py-3 text-right font-medium">P&amp;L</th><th className="px-5 py-3 font-medium">Source</th><th className="px-5 py-3" /></tr></thead>
                  <tbody>{filtered.map((trade) => {
                    const profile = getInstrumentProfile(trade.symbol, trade.instrumentCategory);
                    return <tr key={trade.id} tabIndex={0} role="button" aria-label={`Open ${trade.symbol} trade details`} onClick={() => setDetailTrade(trade as Trade)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setDetailTrade(trade as Trade); } }} className="cursor-pointer border-b border-white/[.045] transition-colors hover:bg-white/[.025] focus-visible:bg-blue-500/[.06] focus-visible:outline-none"><td className="px-5 py-3.5 font-mono text-[11px] text-slate-500">{trade.date}</td><td className="px-5 py-3.5"><div className="flex items-center gap-2.5"><InstrumentMark symbol={trade.symbol} category={trade.instrumentCategory} /><div><p className="font-mono text-xs font-semibold text-white">{trade.symbol}</p><p className="mt-0.5 text-[10px] text-slate-600">{profile.label}</p></div></div></td><td className="px-5 py-3.5"><DirectionBadge direction={trade.direction} size="sm" /></td><td className="px-5 py-3.5 text-right font-mono text-[11px] text-slate-300">{Number(trade.entryPrice).toLocaleString()}</td><td className="px-5 py-3.5 text-right font-mono text-[11px] text-slate-300">{Number(trade.exitPrice).toLocaleString()}</td><td className="px-5 py-3.5 text-right"><p className="font-mono text-[11px] text-slate-200">{Number(trade.quantity).toLocaleString()}</p><p className="mt-0.5 text-[9px] text-slate-600">{profile.quantityLabel}</p></td><td className="px-5 py-3.5 text-right"><PnlValue value={Number(trade.pnl)} /></td><td className="px-5 py-3.5"><span className="rounded-md bg-white/[.04] px-2 py-1 font-mono text-[9px] uppercase text-slate-500">Manual</span></td><td className="px-5 py-3.5"><EditActions trade={trade as Trade} onEdit={openEdit} onDelete={deleteTrade} /></td></tr>;
                  })}</tbody>
                </table>
              </div>
              <div className="divide-y divide-white/[.05] md:hidden">
                {filtered.map((trade) => {
                  const profile = getInstrumentProfile(trade.symbol, trade.instrumentCategory);
                  return <article key={trade.id} className="p-4"><button type="button" aria-label={`Open ${trade.symbol} trade details`} onClick={() => setDetailTrade(trade as Trade)} className="tf-press w-full rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-2.5"><InstrumentMark symbol={trade.symbol} category={trade.instrumentCategory} /><div className="min-w-0"><p className="font-mono text-xs font-semibold text-white">{trade.symbol} <span className="text-[10px] font-normal text-slate-500">· {profile.label}</span></p><div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 font-mono text-[10px] text-slate-600"><span>{trade.date}</span><span aria-hidden="true">·</span><DirectionBadge direction={trade.direction} size="sm" className="!px-1.5 !py-0.5" /><span aria-hidden="true">·</span><span>{trade.quantity} {profile.quantityLabel.toLowerCase()}</span></div></div></div><PnlValue value={Number(trade.pnl)} /></div><div className="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-white/[.02] p-2.5 font-mono text-[10px]"><div><p className="text-slate-600">ENTRY</p><p className="mt-1 text-slate-300">{Number(trade.entryPrice).toLocaleString()}</p></div><div><p className="text-slate-600">EXIT</p><p className="mt-1 text-slate-300">{Number(trade.exitPrice).toLocaleString()}</p></div><div><p className="text-slate-600">SOURCE</p><p className="mt-1 text-slate-300">Manual</p></div></div></button><div className="mt-3 flex justify-end gap-1"><button type="button" onClick={() => openEdit(trade as Trade)} className="tf-press inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-[10px] text-blue-200 hover:bg-blue-500/[.1]"><Pencil className="h-3 w-3" />Edit</button><button type="button" onClick={() => deleteTrade(trade as Trade)} className="tf-press inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-[10px] text-rose-200 hover:bg-rose-500/[.1]"><Trash2 className="h-3 w-3" />Delete</button></div></article>;
                })}
              </div>
            </>
          ) : (
            <div className="py-16 text-center"><ListFilter className="mx-auto h-6 w-6 text-slate-700" /><p className="mt-4 text-base font-semibold text-white">{filterSymbol ? `No trades found for ${filterSymbol.toUpperCase()}.` : "No live trades in the portfolio yet."}</p><p className="mt-2 text-xs text-slate-500">Add a trade to begin reviewing instrument-aware entries and assisted P&amp;L.</p><Button onClick={() => { setEditTrade(null); setModalOpen(true); }} className="mt-5 bg-blue-500 text-white hover:bg-blue-400"><Plus className="mr-1.5 h-4 w-4" />Add Trade</Button></div>
          )}
        </section>
        <p className="mt-3 flex items-start gap-2 text-[10px] leading-4 text-slate-600"><ListFilter className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-300" />Assisted P&amp;L uses the selected or inferred instrument rule and excludes broker-specific swaps, conversion, and non-standard contract sizing. Use the manual override when your broker result differs.</p>
        <AddTradeModal open={modalOpen} onClose={() => { setModalOpen(false); setEditTrade(null); }} onSave={handleSave} editTrade={editTrade} />
        {detailTrade && <TradeDetailDrawer trade={detailTrade} open onOpenChange={(open) => { if (!open) setDetailTrade(null); }} />}
      </main>
    </div>
  );
}

import React from "react";
import { Clock3, History, Trash2 } from "lucide-react";
import { DirectionBadge } from "@/components/DirectionBadge";

export type SimulatedHistoryTrade = {
  id: number;
  date: string;
  entryAt: string | null;
  exitAt: string | null;
  direction: "LONG" | "SHORT";
  entryPrice: number;
  exitPrice: number;
  fees: number;
  pnl: number;
  rMultiple: number | null;
  setupTag: string;
};

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });

function displayTime(value: string | null, fallback: string) {
  return value ? new Date(value).toLocaleString() : fallback;
}

export function SimulatedTradeHistory({ trades, onDelete, readOnly = false }: { trades: SimulatedHistoryTrade[]; onDelete: (id: number) => void; readOnly?: boolean }) {
  return <section aria-label="Simulated trade history" className="mt-5 overflow-hidden rounded-2xl border border-blue-200/[0.10] bg-[#0c1830]/88">
    <header className="flex items-center justify-between border-b border-blue-200/[0.08] px-5 py-4">
      <div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-xl bg-violet-400/10 text-violet-200"><History className="h-4 w-4" /></div><div><h3 className="text-sm font-semibold">Trade history</h3><p className="mt-1 text-xs text-slate-500">Private simulated executions and their net P&amp;L.</p></div></div>
      <span className="rounded-full border border-violet-300/15 bg-violet-400/[0.08] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-violet-200">{trades.length} {trades.length === 1 ? "trade" : "trades"}</span>
    </header>
    {trades.length === 0 ? <div className="p-10 text-center"><Clock3 className="mx-auto h-6 w-6 text-slate-600" /><p className="mt-3 text-sm text-slate-400">No simulated trades yet.</p><p className="mt-1 text-xs text-slate-600">Use the Buy or Sell controls above to start this private history.</p></div> : <div className="divide-y divide-blue-200/[0.06]">{trades.map(trade => {
      const netPnl = trade.pnl - trade.fees;
      const profitable = netPnl >= 0;
      return <article key={trade.id} className="grid gap-3 px-5 py-4 transition hover:bg-white/[0.025] sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] sm:items-center">
        <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><DirectionBadge direction={trade.direction} size="sm" /><span className="truncate text-xs font-medium text-slate-200">{trade.setupTag || "Replay execution"}</span></div><p className="mt-2 truncate font-mono text-[10px] text-slate-500">{displayTime(trade.entryAt, trade.date)} → {displayTime(trade.exitAt, trade.date)}</p></div>
        <div className="flex items-center justify-between gap-3 sm:block"><div><p className="font-mono text-[9px] uppercase tracking-[0.14em] text-slate-600">Entry → Exit</p><p className="mt-1 font-mono text-xs text-slate-300">{trade.entryPrice} → {trade.exitPrice}</p></div><p className="font-mono text-[10px] text-slate-500 sm:mt-1">{trade.rMultiple === null ? "No R" : `${trade.rMultiple.toFixed(2)}R`} · fees {currency.format(trade.fees)}</p></div>
        <div className="flex items-center justify-between gap-3 sm:justify-end"><div className="text-right"><p className="font-mono text-[9px] uppercase tracking-[0.14em] text-slate-600">Net P&amp;L</p><p className={`mt-1 font-mono text-sm font-semibold ${profitable ? "text-emerald-300" : "text-rose-300"}`}>{profitable ? "+" : ""}{currency.format(netPnl)}</p></div>{!readOnly && <button type="button" aria-label="Delete simulated trade" onClick={() => onDelete(trade.id)} className="rounded-lg p-2 text-slate-600 transition hover:bg-rose-500/10 hover:text-rose-300"><Trash2 className="h-4 w-4" /></button>}</div>
      </article>;
    })}</div>}
  </section>;
}

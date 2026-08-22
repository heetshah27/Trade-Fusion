import React, { useMemo } from "react";
import { BookOpenCheck, CalendarDays, ImageIcon, Loader2, NotebookPen, ShieldCheck, Tag, TrendingUp } from "lucide-react";
import { trpc } from "@/lib/trpc";
import type { Trade } from "@/lib/tradeTypes";
import { getInstrumentProfile } from "@/lib/tradeInstruments";
import { InstrumentBadge } from "@/components/InstrumentBadge";
import { DirectionBadge } from "@/components/DirectionBadge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="rounded-xl border border-white/[.07] bg-white/[.025] px-3 py-2.5"><p className="font-mono text-[8px] uppercase tracking-[.14em] text-slate-600">{label}</p><div className="mt-1 text-xs text-slate-200">{value}</div></div>;
}

function JournalNote({ label, value }: { label: string; value?: string }) {
  if (!value?.trim()) return null;
  return <section className="rounded-xl border border-white/[.07] bg-white/[.018] p-3"><p className="font-mono text-[8px] uppercase tracking-[.14em] text-blue-200">{label}</p><p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-slate-300">{value}</p></section>;
}

export function TradeDetailDrawer({
  trade,
  open,
  onOpenChange,
}: {
  trade: Trade;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const input = useMemo(() => ({ tradeId: Number(trade.id) }), [trade.id]);
  const { data: journal, isLoading, isError, error, refetch } = trpc.tradeJournal.byTrade.useQuery(input, { enabled: open });
  const profile = getInstrumentProfile(trade.symbol, trade.instrumentCategory);
  const pnlTone = trade.pnl > 0 ? "text-emerald-300" : trade.pnl < 0 ? "text-rose-300" : "text-slate-300";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto border-white/[.08] bg-[#070d18] p-0 text-white sm:!max-w-[620px]">
        <SheetHeader className="border-b border-white/[.07] p-5 pr-12">
          <div className="flex items-center gap-3">
            <InstrumentBadge symbol={trade.symbol} category={trade.instrumentCategory} />
            <div className="min-w-0"><p className="font-mono text-[9px] uppercase tracking-[.16em] text-blue-300">Private execution review</p><SheetTitle className="mt-1 text-xl text-white">{trade.symbol} <span className="font-mono text-xs font-normal text-slate-500">· {trade.date}</span></SheetTitle></div>
          </div>
          <SheetDescription className="mt-2 text-xs text-slate-500">Only you can view these execution details, private notes, and chart screenshots.</SheetDescription>
        </SheetHeader>

        <div className="space-y-5 p-5">
          <section className="grid grid-cols-2 gap-2.5"><Detail label="Direction" value={<DirectionBadge direction={trade.direction} size="sm" />} /><Detail label="Net P&L" value={<span className={`font-mono font-semibold ${pnlTone}`}>{money(trade.pnl)}</span>} /><Detail label="Entry" value={<span className="font-mono">{Number(trade.entryPrice).toLocaleString()}</span>} /><Detail label="Exit" value={<span className="font-mono">{Number(trade.exitPrice).toLocaleString()}</span>} /><Detail label="Size" value={<span className="font-mono">{Number(trade.quantity).toLocaleString()} {profile.quantityLabel}</span>} /><Detail label="Fees" value={<span className="font-mono">{money(trade.fees)}</span>} /></section>

          <section className="rounded-xl border border-blue-400/12 bg-blue-500/[.035] p-3.5"><div className="flex items-center gap-2"><Tag className="h-3.5 w-3.5 text-blue-300" /><p className="font-mono text-[9px] uppercase tracking-[.14em] text-blue-200">Execution context</p></div><div className="mt-3 grid gap-2 sm:grid-cols-2"><Detail label="Setup" value={trade.setupTag || "Not tagged"} /><Detail label="Session" value={trade.marketSession || "Not specified"} /><Detail label="Quality" value={trade.tradeQuality?.replaceAll("_", " ") || "Not specified"} /><Detail label="Trading plan" value={trade.ruleFollowed === null || trade.ruleFollowed === undefined ? "Not reviewed" : trade.ruleFollowed ? "Followed" : "Deviated"} /></div></section>

          {trade.notes?.trim() && <section className="rounded-xl border border-white/[.07] bg-white/[.018] p-3"><div className="flex items-center gap-2"><NotebookPen className="h-3.5 w-3.5 text-violet-300" /><p className="font-mono text-[8px] uppercase tracking-[.14em] text-violet-200">Trade note</p></div><p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-slate-300">{trade.notes}</p></section>}

          <section><div className="flex items-center gap-2"><BookOpenCheck className="h-4 w-4 text-blue-300" /><div><p className="font-mono text-[9px] uppercase tracking-[.15em] text-slate-400">Private Journal review</p><p className="mt-0.5 text-xs text-slate-500">Thesis, execution learning, and screenshots linked to this trade.</p></div></div>{isLoading ? <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/[.06] p-3 text-xs text-slate-500"><Loader2 className="h-3.5 w-3.5 animate-spin" />Loading private review…</div> : isError ? <div role="alert" className="mt-3 rounded-xl border border-amber-300/15 bg-amber-500/[.05] p-4 text-center"><p className="text-xs text-amber-100">Private Journal review could not load. {error instanceof Error ? error.message : "Please retry."}</p><button type="button" onClick={() => void refetch()} className="tf-press mt-3 rounded-lg border border-amber-300/20 px-3 py-1.5 text-xs text-amber-100 hover:bg-amber-500/[.08]">Try again</button></div> : journal ? <div className="mt-3 space-y-2"><JournalNote label="Trade idea" value={journal.tradeIdea} /><JournalNote label="Market context" value={journal.marketContext} /><JournalNote label="Execution review" value={journal.executionReview} /><JournalNote label="Reflection" value={journal.reflection} />{journal.attachments.length > 0 && <div className="grid grid-cols-2 gap-2">{journal.attachments.map(attachment => <a key={attachment.id} href={attachment.url} target="_blank" rel="noreferrer" className="group overflow-hidden rounded-xl border border-white/[.08] bg-white/[.018] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"><img src={attachment.url} alt={`Private chart screenshot: ${attachment.fileName}`} className="aspect-[4/3] w-full object-cover transition duration-200 group-hover:scale-[1.02]" /><span className="block truncate px-2 py-1.5 font-mono text-[9px] text-slate-500">{attachment.fileName}</span></a>)}</div>}</div> : <div className="mt-3 rounded-xl border border-dashed border-white/[.08] p-4 text-center"><ShieldCheck className="mx-auto h-4 w-4 text-slate-600" /><p className="mt-2 text-xs text-slate-500">No private Journal review has been saved for this trade yet.</p></div>}</section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

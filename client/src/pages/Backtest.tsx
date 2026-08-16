import React, { useEffect, useMemo, useState } from "react";
import { BarChart3, BookOpenCheck, Calculator, CircleAlert, FlaskConical, LockKeyhole, Plus, RotateCcw, ShieldCheck, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { BacktestReplay } from "@/components/BacktestReplay";
import { SimulatedTradeHistory } from "@/components/SimulatedTradeHistory";
import { BacktestBetaBadge } from "@/components/BacktestBetaBadge";

const today = () => new Date().toISOString().slice(0, 10);
const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });

type SessionDraft = {
  strategyName: string;
  symbol: string;
  timeframe: string;
  startDate: string;
  endDate: string;
  initialBalance: string;
  notes: string;
};

type TradeDraft = {
  date: string;
  entryAt: string;
  exitAt: string;
  direction: "LONG" | "SHORT";
  entryPrice: string;
  exitPrice: string;
  quantity: string;
  stopLoss: string;
  takeProfit: string;
  fees: string;
  setupTag: string;
  notes: string;
};

const emptySession = (): SessionDraft => ({ strategyName: "", symbol: "", timeframe: "1H", startDate: today(), endDate: today(), initialBalance: "10000", notes: "" });
const emptyTrade = (): TradeDraft => ({ date: today(), entryAt: `${today()}T09:00`, exitAt: `${today()}T16:00`, direction: "LONG", entryPrice: "", exitPrice: "", quantity: "1", stopLoss: "", takeProfit: "", fees: "0", setupTag: "", notes: "" });

function MetricCard({ label, value, tone = "text-white" }: { label: string; value: string; tone?: string }) {
  return <div className="tf-kpi-card rounded-2xl p-4"><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-slate-500">{label}</p><p className={`mt-2 text-xl font-semibold tracking-[-0.04em] ${tone}`}>{value}</p></div>;
}

export default function Backtest() {
  const utils = trpc.useUtils();
  const { data: billing, isLoading: billingLoading, error: billingError, refetch: refetchBilling } = trpc.billing.status.useQuery();
  const checkout = trpc.billing.createCheckout.useMutation({
    onSuccess: ({ url, trialApplied }) => {
      window.open(url, "_blank");
      toast.success(trialApplied ? "Your 7-day Pro trial checkout is opening in a new tab." : "Your Pro checkout is opening in a new tab.");
    },
    onError: error => toast.error(error.message),
  });
  const backtestAccess = billing?.backtestAccess ?? "locked";
  const canViewBacktest = backtestAccess === "full" || backtestAccess === "read_only";
  const isReadOnly = backtestAccess === "read_only";
  const { data: sessions = [], isLoading: sessionsLoading, isError: sessionsError, error: sessionsQueryError, refetch: refetchSessions } = trpc.backtest.listSessions.useQuery(undefined, { enabled: canViewBacktest });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const activeSessionId = selectedId ?? sessions[0]?.id ?? null;
  const { data: selectedSession, isLoading: detailLoading } = trpc.backtest.getSession.useQuery({ id: activeSessionId ?? 0 }, { enabled: canViewBacktest && activeSessionId !== null });
  const [sessionOpen, setSessionOpen] = useState(false);
  const [tradeOpen, setTradeOpen] = useState(false);
  const [sessionDraft, setSessionDraft] = useState<SessionDraft>(emptySession);
  const [tradeDraft, setTradeDraft] = useState<TradeDraft>(emptyTrade);

  useEffect(() => {
    if (canViewBacktest) void refetchSessions();
  }, [canViewBacktest, refetchSessions]);

  useEffect(() => {
    if (!selectedId && sessions[0]) setSelectedId(sessions[0].id);
  }, [sessions, selectedId]);

  const refresh = async () => {
    await Promise.all([utils.backtest.listSessions.invalidate(), utils.backtest.getSession.invalidate()]);
  };
  const createSession = trpc.backtest.createSession.useMutation({ onSuccess: async created => { await refresh(); setSelectedId(created.id); setSessionOpen(false); setSessionDraft(emptySession()); toast.success("Simulated strategy session created."); } });
  const createTrade = trpc.backtest.createTrade.useMutation({ onSuccess: async () => { await refresh(); setTradeOpen(false); setTradeDraft(emptyTrade()); toast.success("Simulated trade added."); } });
  const archiveSession = trpc.backtest.archiveSession.useMutation({ onSuccess: async () => { await refresh(); toast.success("Backtest session archived."); } });
  const reopenSession = trpc.backtest.reopenSession.useMutation({ onSuccess: async () => { await refresh(); toast.success("Strategy reopened for private chart markup and simulated trades."); } });
  const deleteTrade = trpc.backtest.deleteTrade.useMutation({ onSuccess: async () => { await refresh(); toast.success("Simulated trade removed."); } });

  const projectedPnl = useMemo(() => {
    const entry = Number(tradeDraft.entryPrice); const exit = Number(tradeDraft.exitPrice); const qty = Number(tradeDraft.quantity);
    if (!Number.isFinite(entry) || !Number.isFinite(exit) || !Number.isFinite(qty)) return null;
    return (tradeDraft.direction === "LONG" ? exit - entry : entry - exit) * qty - Number(tradeDraft.fees || 0);
  }, [tradeDraft]);

  const saveSession = () => createSession.mutate({ ...sessionDraft, initialBalance: Number(sessionDraft.initialBalance) });
  const saveTrade = () => {
    if (!selectedSession) return;
    createTrade.mutate({ sessionId: selectedSession.id, ...tradeDraft, entryAt: new Date(tradeDraft.entryAt).toISOString(), exitAt: new Date(tradeDraft.exitAt).toISOString(), entryPrice: Number(tradeDraft.entryPrice), exitPrice: Number(tradeDraft.exitPrice), quantity: Number(tradeDraft.quantity), stopLoss: tradeDraft.stopLoss ? Number(tradeDraft.stopLoss) : null, takeProfit: tradeDraft.takeProfit ? Number(tradeDraft.takeProfit) : null, fees: Number(tradeDraft.fees || 0) });
  };

  if (billingLoading) return <div className="grid min-h-full place-items-center bg-[#07101f] p-8 text-sm text-slate-400">Checking your Backtest access…</div>;

  if (!canViewBacktest) return <div className="min-h-full bg-[#07101f] text-white">
    <main className="mx-auto grid min-h-[calc(100vh-8rem)] w-full max-w-5xl place-items-center px-5 py-10 lg:px-8">
      <section className="relative w-full overflow-hidden rounded-3xl border border-violet-300/20 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.20),transparent_38%),linear-gradient(145deg,#101d35,#081221)] p-6 shadow-2xl sm:p-10">
        <div className="pointer-events-none absolute -right-14 -top-14 h-56 w-56 rounded-full bg-violet-400/15 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div><div className="inline-flex items-center gap-2 rounded-full border border-violet-300/25 bg-violet-400/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-violet-100"><LockKeyhole className="h-3.5 w-3.5" /> Pro workspace</div><h1 className="mt-5 max-w-2xl text-3xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">Turn historical ideas into a repeatable execution record.</h1><p className="mt-4 max-w-xl text-sm leading-7 text-slate-400">Trade Fusion Pro unlocks the private Backtest workspace: source-backed historical replay, chart drawings, simulated execution, snapshots, and isolated strategy performance.</p><div className="mt-6 flex flex-wrap gap-3"><Button onClick={() => checkout.mutate()} disabled={checkout.isPending || !billing?.billingReady} className="tf-press h-11 rounded-xl bg-violet-400 px-5 text-slate-950 shadow-[0_12px_30px_rgba(167,139,250,0.28)] hover:bg-violet-300"><Sparkles className="mr-2 h-4 w-4" />{checkout.isPending ? "Opening checkout…" : "Start 7-day Pro trial"}</Button><a href="/#pricing" className="tf-press inline-flex h-11 items-center rounded-xl border border-white/[0.14] px-5 text-sm font-medium text-slate-200 transition hover:bg-white/[0.06]">Compare plans</a></div><p className="mt-3 text-xs text-slate-500">Card required. Then {billing?.product.price ?? "$10 USD"} {billing?.product.cadence ?? "per month"}. Cancel before renewal to avoid the first charge.</p>{billingError && <p className="mt-4 flex items-center gap-2 text-xs text-amber-200"><CircleAlert className="h-4 w-4" />We could not verify billing availability. <button type="button" onClick={() => refetchBilling()} className="underline underline-offset-2">Retry</button></p>}</div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1"><div className="rounded-2xl border border-white/[0.10] bg-[#07101f]/55 p-4"><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-violet-200">Pro includes</p><p className="mt-2 text-sm font-medium text-white">Private strategy lab</p><p className="mt-1 text-xs leading-5 text-slate-500">Historical replay, simulated executions, chart drawings, and snapshots.</p></div><div className="rounded-2xl border border-white/[0.10] bg-[#07101f]/55 p-4"><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-violet-200">Your work stays private</p><p className="mt-2 text-sm font-medium text-white">Separated from live results</p><p className="mt-1 text-xs leading-5 text-slate-500">Backtest data never changes your live Journal or Setup Analytics.</p></div></div>
        </div>
      </section>
    </main>
  </div>;

  return <div className="min-h-full bg-[#07101f] text-white">
    <main className="mx-auto w-full max-w-[1640px] px-5 py-7 lg:px-8 lg:py-9">
      <section className="mb-7 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="relative pr-14">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-emerald-300">Strategy laboratory</p>
          <h1 className="mt-2 flex items-center gap-2.5 text-2xl font-semibold tracking-[-0.04em] sm:gap-3 sm:text-4xl"><FlaskConical className="h-7 w-7 shrink-0 text-emerald-300 sm:h-8 sm:w-8" /> Backtest Workspace</h1><BacktestBetaBadge className="absolute right-0 top-4" />
          <p className="mt-2 max-w-2xl text-sm text-slate-500">Test historical ideas with simulated entries. Backtest results are private and never affect your live journal statistics.</p>
        </div>
        <Button onClick={() => isReadOnly ? checkout.mutate() : setSessionOpen(true)} disabled={checkout.isPending} className="tf-press h-10 rounded-xl bg-sky-400 text-slate-950 shadow-[0_10px_24px_rgba(56,189,248,0.26)] hover:bg-sky-300">{isReadOnly ? <Sparkles className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}{isReadOnly ? "Renew Pro to edit" : "New strategy session"}</Button>
      </section>

      <div className="mb-6 flex items-center gap-2 rounded-2xl border border-emerald-300/[0.12] bg-emerald-400/[0.06] px-4 py-3 text-xs text-emerald-100"><ShieldCheck className="h-4 w-4 shrink-0 text-emerald-300" /><span><strong>Simulated only.</strong> Strategy sessions, trades, and metrics are isolated from your live journal and are not shared with the Trader’s Room.</span></div>
      {isReadOnly && <div role="status" className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300/[0.18] bg-amber-400/[0.08] px-4 py-3 text-xs text-amber-100"><span><strong>Backtest is read-only.</strong> Your private strategy history is preserved. Renew Pro to create, edit, or remove Backtest data.</span><Button size="sm" onClick={() => checkout.mutate()} disabled={checkout.isPending} className="h-8 bg-amber-300 text-slate-950 hover:bg-amber-200">Restore Pro</Button></div>}

      <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-blue-200/[0.10] bg-[#0c1830]/88 p-3">
          <div className="flex items-center justify-between px-2 py-2"><span className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">Your strategies</span><span className="rounded-full bg-violet-400/10 px-2 py-0.5 text-[10px] text-violet-200">{sessions.length}</span></div>
          {sessionsLoading ? <div className="p-4 text-xs text-slate-500">Loading private sessions…</div> : sessionsError ? <div className="p-4"><p className="text-xs text-rose-200">Private sessions could not load: {sessionsQueryError.message}</p><Button size="sm" variant="outline" onClick={() => refetchSessions()} className="mt-3 border-rose-300/30 text-rose-100">Retry sessions</Button></div> : sessions.length === 0 ? <div className="p-5 text-center"><BookOpenCheck className="mx-auto h-7 w-7 text-violet-300" /><p className="mt-3 text-sm font-medium text-slate-200">No backtests yet</p><p className="mt-1 text-xs leading-5 text-slate-500">Create a strategy session, then log simulated entries against your chosen historical range.</p></div> : <div className="space-y-2">{sessions.map(session => <button key={session.id} onClick={() => setSelectedId(session.id)} className={`w-full rounded-xl border p-3 text-left transition-colors ${activeSessionId === session.id ? "border-violet-300/30 bg-violet-400/[0.12]" : "border-transparent hover:bg-white/[0.04]"}`}><div className="flex items-center justify-between gap-2"><span className="truncate text-sm font-medium text-slate-100">{session.strategyName}</span><span className="font-mono text-[9px] uppercase text-violet-200">{session.status}</span></div><p className="mt-1 font-mono text-[10px] text-slate-500">{session.symbol} · {session.timeframe}</p><p className={`mt-2 text-sm font-semibold ${session.metrics.totalPnl >= 0 ? "text-emerald-300" : "text-rose-300"}`}>{session.metrics.totalPnl >= 0 ? "+" : ""}{currency.format(session.metrics.totalPnl)}</p></button>)}</div>}
        </aside>

        <section className="min-w-0">
          {!selectedSession && !detailLoading ? <div className="grid min-h-[430px] place-items-center rounded-2xl border border-dashed border-blue-200/[0.15] bg-[#0c1830]/50 p-8 text-center"><div><Calculator className="mx-auto h-10 w-10 text-violet-300" /><h2 className="mt-4 text-xl font-semibold">Build a repeatable strategy record</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Start with the strategy, symbol, timeframe, and historical range you intend to test. Then add simulated executions one by one.</p><Button onClick={() => setSessionOpen(true)} className="mt-5 bg-violet-500 hover:bg-violet-400">Create your first session</Button></div></div> : selectedSession ? <>
            <div className="rounded-2xl border border-blue-200/[0.10] bg-[#0c1830]/88 p-5 sm:p-6"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><div className="flex flex-wrap items-center gap-2"><span className="rounded-full border border-violet-300/20 bg-violet-400/10 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-violet-200">Simulated</span><span className="rounded-full border border-blue-200/[0.10] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-slate-400">{selectedSession.symbol} · {selectedSession.timeframe}</span></div><h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em]">{selectedSession.strategyName}</h2><p className="mt-1 text-xs text-slate-500">Historical range · {selectedSession.startDate} to {selectedSession.endDate} · Starting balance {currency.format(selectedSession.initialBalance)}</p>{selectedSession.status === "archived" && <p className="mt-3 max-w-3xl text-xs leading-5 text-amber-200">This strategy is archived and read-only. Reopen it to add simulated trades or private chart drawings.</p>}{selectedSession.notes && <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">{selectedSession.notes}</p>}</div><div className="flex flex-wrap gap-2"><Button onClick={() => setTradeOpen(true)} disabled={selectedSession.status !== "active" || isReadOnly} className="bg-violet-500 hover:bg-violet-400"><Plus className="mr-2 h-4 w-4" /> Add simulated trade</Button>{selectedSession.status === "active" ? <Button variant="outline" onClick={() => archiveSession.mutate({ id: selectedSession.id })} disabled={isReadOnly || archiveSession.isPending} className="border-blue-200/[0.12] bg-transparent text-slate-400 hover:bg-white/[0.05] hover:text-white">Archive</Button> : <Button variant="outline" onClick={() => reopenSession.mutate({ id: selectedSession.id })} disabled={isReadOnly || reopenSession.isPending} className="border-amber-300/30 bg-amber-400/10 text-amber-100 hover:bg-amber-400/20"><RotateCcw className="mr-2 h-4 w-4" /> Reopen strategy</Button>}</div></div></div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><MetricCard label="Net simulated P&L" value={currency.format(selectedSession.metrics.totalPnl)} tone={selectedSession.metrics.totalPnl >= 0 ? "text-emerald-300" : "text-rose-300"} /><MetricCard label="Win rate" value={`${selectedSession.metrics.winRate.toFixed(1)}%`} /><MetricCard label="Profit factor" value={selectedSession.metrics.profitFactor === null ? "—" : selectedSession.metrics.profitFactor.toFixed(2)} /><MetricCard label="Max drawdown" value={currency.format(selectedSession.metrics.maxDrawdown)} tone="text-amber-200" /><MetricCard label="Average R" value={selectedSession.metrics.averageR === null ? "—" : `${selectedSession.metrics.averageR.toFixed(2)}R`} /></div>
            <BacktestReplay session={selectedSession} readOnly={isReadOnly} />
            <SimulatedTradeHistory trades={selectedSession.trades} onDelete={id => deleteTrade.mutate({ id })} readOnly={isReadOnly} />
          </> : null}
        </section>
      </div>
    </main>

    <Dialog open={sessionOpen} onOpenChange={setSessionOpen}><DialogContent className="max-w-xl border-blue-200/[0.12] bg-[#101d35] text-white"><DialogHeader><DialogTitle>New simulated strategy session</DialogTitle><DialogDescription className="text-slate-400">This creates a private historical-test workspace. It will never alter your live journal.</DialogDescription></DialogHeader><div className="grid gap-4 py-2 sm:grid-cols-2"><div className="sm:col-span-2"><Label htmlFor="strategyName">Strategy name</Label><Input id="strategyName" value={sessionDraft.strategyName} onChange={event => setSessionDraft({ ...sessionDraft, strategyName: event.target.value })} placeholder="London breakout retest" className="mt-2 border-blue-200/[0.12] bg-white/[0.04]" /></div><div><Label htmlFor="symbol">Symbol</Label><Input id="symbol" value={sessionDraft.symbol} onChange={event => setSessionDraft({ ...sessionDraft, symbol: event.target.value })} placeholder="EURUSD" className="mt-2 border-blue-200/[0.12] bg-white/[0.04]" /></div><div><Label htmlFor="timeframe">Timeframe</Label><Input id="timeframe" value={sessionDraft.timeframe} onChange={event => setSessionDraft({ ...sessionDraft, timeframe: event.target.value })} placeholder="1H" className="mt-2 border-blue-200/[0.12] bg-white/[0.04]" /></div><div><Label htmlFor="startDate">Historical start</Label><Input id="startDate" type="date" value={sessionDraft.startDate} onChange={event => setSessionDraft({ ...sessionDraft, startDate: event.target.value })} className="mt-2 border-blue-200/[0.12] bg-white/[0.04]" /></div><div><Label htmlFor="endDate">Historical end</Label><Input id="endDate" type="date" value={sessionDraft.endDate} onChange={event => setSessionDraft({ ...sessionDraft, endDate: event.target.value })} className="mt-2 border-blue-200/[0.12] bg-white/[0.04]" /></div><div><Label htmlFor="balance">Starting balance</Label><Input id="balance" type="number" min="0" value={sessionDraft.initialBalance} onChange={event => setSessionDraft({ ...sessionDraft, initialBalance: event.target.value })} className="mt-2 border-blue-200/[0.12] bg-white/[0.04]" /></div><div className="sm:col-span-2"><Label htmlFor="sessionNotes">Assumptions or notes</Label><Textarea id="sessionNotes" value={sessionDraft.notes} onChange={event => setSessionDraft({ ...sessionDraft, notes: event.target.value })} placeholder="Define entry conditions, risk rules, and testing assumptions." className="mt-2 min-h-24 border-blue-200/[0.12] bg-white/[0.04]" /></div></div><Button disabled={createSession.isPending || !sessionDraft.strategyName || !sessionDraft.symbol || isReadOnly} onClick={saveSession} className="w-full bg-violet-500 hover:bg-violet-400">Create private Backtest session</Button></DialogContent></Dialog>

    <Dialog open={tradeOpen} onOpenChange={setTradeOpen}><DialogContent className="max-w-2xl border-blue-200/[0.12] bg-[#101d35] text-white"><DialogHeader><DialogTitle>Add simulated trade</DialogTitle><DialogDescription className="text-slate-400">Calculated P&L is saved only to this Backtest session—not your live journal. Entry and exit times control the chart markers.</DialogDescription></DialogHeader><div className="grid gap-4 py-2 sm:grid-cols-2"><div><Label htmlFor="tradeDate">Trade date</Label><Input id="tradeDate" type="date" value={tradeDraft.date} onChange={event => setTradeDraft({ ...tradeDraft, date: event.target.value, entryAt: `${event.target.value}T09:00`, exitAt: `${event.target.value}T16:00` })} className="mt-2 border-blue-200/[0.12] bg-white/[0.04]" /></div><div><Label htmlFor="direction">Direction</Label><select id="direction" value={tradeDraft.direction} onChange={event => setTradeDraft({ ...tradeDraft, direction: event.target.value as TradeDraft["direction"] })} className="mt-2 flex h-10 w-full rounded-md border border-blue-200/[0.12] bg-white/[0.04] px-3 text-sm"><option value="LONG">Long</option><option value="SHORT">Short</option></select></div><div><Label htmlFor="entryAt">Entry time</Label><Input id="entryAt" type="datetime-local" value={tradeDraft.entryAt} onChange={event => setTradeDraft({ ...tradeDraft, entryAt: event.target.value })} className="mt-2 border-blue-200/[0.12] bg-white/[0.04]" /></div><div><Label htmlFor="exitAt">Exit time</Label><Input id="exitAt" type="datetime-local" value={tradeDraft.exitAt} onChange={event => setTradeDraft({ ...tradeDraft, exitAt: event.target.value })} className="mt-2 border-blue-200/[0.12] bg-white/[0.04]" /></div><div><Label htmlFor="entry">Entry price</Label><Input id="entry" type="number" step="any" value={tradeDraft.entryPrice} onChange={event => setTradeDraft({ ...tradeDraft, entryPrice: event.target.value })} className="mt-2 border-blue-200/[0.12] bg-white/[0.04]" /></div><div><Label htmlFor="exit">Exit price</Label><Input id="exit" type="number" step="any" value={tradeDraft.exitPrice} onChange={event => setTradeDraft({ ...tradeDraft, exitPrice: event.target.value })} className="mt-2 border-blue-200/[0.12] bg-white/[0.04]" /></div><div><Label htmlFor="quantity">Quantity</Label><Input id="quantity" type="number" step="any" value={tradeDraft.quantity} onChange={event => setTradeDraft({ ...tradeDraft, quantity: event.target.value })} className="mt-2 border-blue-200/[0.12] bg-white/[0.04]" /></div><div><Label htmlFor="fees">Fees</Label><Input id="fees" type="number" step="any" value={tradeDraft.fees} onChange={event => setTradeDraft({ ...tradeDraft, fees: event.target.value })} className="mt-2 border-blue-200/[0.12] bg-white/[0.04]" /></div><div><Label htmlFor="stop">Stop loss <span className="text-slate-600">(optional)</span></Label><Input id="stop" type="number" step="any" value={tradeDraft.stopLoss} onChange={event => setTradeDraft({ ...tradeDraft, stopLoss: event.target.value })} className="mt-2 border-blue-200/[0.12] bg-white/[0.04]" /></div><div><Label htmlFor="target">Take profit <span className="text-slate-600">(optional)</span></Label><Input id="target" type="number" step="any" value={tradeDraft.takeProfit} onChange={event => setTradeDraft({ ...tradeDraft, takeProfit: event.target.value })} className="mt-2 border-blue-200/[0.12] bg-white/[0.04]" /></div><div><Label htmlFor="tag">Setup tag</Label><Input id="tag" value={tradeDraft.setupTag} onChange={event => setTradeDraft({ ...tradeDraft, setupTag: event.target.value })} placeholder="Breakout retest" className="mt-2 border-blue-200/[0.12] bg-white/[0.04]" /></div><div className="rounded-xl border border-violet-300/[0.15] bg-violet-400/[0.06] p-3"><p className="font-mono text-[9px] uppercase tracking-[0.16em] text-violet-200">Projected net P&L</p><p className={`mt-1 text-lg font-semibold ${projectedPnl === null ? "text-slate-500" : projectedPnl >= 0 ? "text-emerald-300" : "text-rose-300"}`}>{projectedPnl === null ? "Enter prices" : currency.format(projectedPnl)}</p></div><div className="sm:col-span-2"><Label htmlFor="tradeNotes">Trade notes</Label><Textarea id="tradeNotes" value={tradeDraft.notes} onChange={event => setTradeDraft({ ...tradeDraft, notes: event.target.value })} placeholder="What did the setup show?" className="mt-2 min-h-20 border-blue-200/[0.12] bg-white/[0.04]" /></div></div><Button disabled={createTrade.isPending || !tradeDraft.entryPrice || !tradeDraft.exitPrice || !tradeDraft.quantity || !tradeDraft.entryAt || !tradeDraft.exitAt} onClick={saveTrade} className="w-full bg-violet-500 hover:bg-violet-400">Save simulated trade</Button></DialogContent></Dialog>
  </div>;
}

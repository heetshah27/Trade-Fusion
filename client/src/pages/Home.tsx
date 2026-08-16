import React, { useMemo } from "react";
import {
  Activity,
  ArrowRight,
  BookOpenCheck,
  CalendarDays,
  ChartNoAxesCombined,
  FlaskConical,
  Gauge,
  Plus,
  ShieldCheck,
  Target,
  TrendingUp,
} from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { appRoutes } from "@/lib/appRoutes";
import { buildEquityCurve, type EquityCurveTrade } from "@/lib/equityCurve";
import { InstrumentBadge } from "@/components/InstrumentBadge";
import { DirectionBadge } from "@/components/DirectionBadge";

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function Metric({
  label,
  value,
  detail,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  tone: "blue" | "emerald" | "violet" | "amber";
  icon: React.ElementType;
}) {
  const tones = {
    blue: "text-blue-300 bg-blue-500/[.055] border-blue-400/15",
    emerald: "text-emerald-300 bg-emerald-500/[.055] border-emerald-400/15",
    violet: "text-violet-300 bg-violet-500/[.055] border-violet-400/15",
    amber: "text-amber-200 bg-amber-500/[.055] border-amber-400/15",
  }[tone];

  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/[.07] bg-[#0a111f] p-4 shadow-[0_16px_32px_rgba(0,0,0,.18)]">
      <div className={`absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-lg border ${tones}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="font-mono text-[9px] uppercase tracking-[.18em] text-slate-500">{label}</p>
      <p className="mt-3 pr-9 font-mono text-2xl font-semibold tracking-[-.05em] text-white">{value}</p>
      <p className="mt-1.5 text-[11px] text-slate-500">{detail}</p>
      <div className="absolute bottom-0 left-5 right-5 h-px bg-gradient-to-r from-transparent via-white/[.12] to-transparent" />
    </section>
  );
}

function PerformanceCurve({
  trades,
  totalPnl,
  onLogTrade,
}: {
  trades: EquityCurveTrade[];
  totalPnl: number;
  onLogTrade: () => void;
}) {
  const curve = useMemo(() => buildEquityCurve(trades), [trades]);
  const curveTone = totalPnl >= 0 ? "#34d399" : "#fb7185";
  const curveGlow = totalPnl >= 0 ? "#6ee7b7" : "#fda4af";

  if (!curve) {
    return (
      <div className="relative mt-5 grid h-52 place-items-center overflow-hidden rounded-xl border border-white/[.06] bg-[#070d18] sm:h-60">
        <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(#31415b_1px,transparent_1px),linear-gradient(90deg,#31415b_1px,transparent_1px)] [background-size:72px_48px]" />
        <div className="relative text-center">
          <Gauge className="mx-auto h-6 w-6 text-slate-700" />
          <p className="mt-3 text-sm text-slate-500">Log your first live trade to build the equity curve.</p>
          <button type="button" onClick={onLogTrade} className="tf-press mt-3 font-mono text-[10px] uppercase tracking-[.16em] text-blue-300">
            Log trade <ArrowRight className="inline h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative mt-5 h-52 overflow-hidden rounded-xl border border-white/[.06] bg-[#070d18] sm:h-60">
      <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(#31415b_1px,transparent_1px),linear-gradient(90deg,#31415b_1px,transparent_1px)] [background-size:72px_48px]" />
      <div className="pointer-events-none absolute left-4 top-3 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[.14em] text-slate-500">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-300" />
        Equity after each closed trade
      </div>
      <div className="pointer-events-none absolute right-4 top-3 rounded-md border border-white/[.08] bg-[#070d18]/85 px-2 py-1 font-mono text-[9px] text-slate-400">
        {curve.points.length} execution{curve.points.length === 1 ? "" : "s"}
      </div>
      <svg viewBox="0 0 600 200" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-label="Stepped recorded live-trade equity curve">
        <defs>
          <linearGradient id="equity-area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={curveTone} stopOpacity="0.28" />
            <stop offset="100%" stopColor={curveTone} stopOpacity="0" />
          </linearGradient>
          <filter id="equity-glow" x="-20%" y="-40%" width="140%" height="180%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <line x1="28" x2="572" y1={curve.zeroY} y2={curve.zeroY} stroke="#64748b" strokeDasharray="4 5" strokeOpacity="0.5" />
        <path d={curve.areaPath} fill="url(#equity-area)" />
        <path d={curve.linePath} fill="none" stroke={curveGlow} strokeOpacity="0.24" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
        <path d={curve.linePath} fill="none" stroke={curveTone} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" filter="url(#equity-glow)" />
        {curve.points.map((point, index) => {
          const pointTone = point.pnl >= 0 ? "#34d399" : "#fb7185";
          return (
            <g key={`${point.date}-${point.id ?? index}`}>
              <circle cx={point.x} cy={point.y} r="6" fill="#070d18" stroke={pointTone} strokeWidth="2" />
              <circle cx={point.x} cy={point.y} r="2" fill={pointTone} />
              <title>{`${point.date}: ${money(point.pnl)} · running P&L ${money(point.balance)}`}</title>
            </g>
          );
        })}
      </svg>
      <div className="pointer-events-none absolute bottom-3 left-3 rounded-md border border-white/[.08] bg-[#070d18]/90 px-2 py-1 font-mono text-[9px] text-slate-400">Live trades only</div>
      <div className="pointer-events-none absolute bottom-3 right-3 font-mono text-[9px] text-slate-500">Start {money(0)} · Net {money(totalPnl)}</div>
    </div>
  );
}

export default function Home() {
  const [, setLocation] = useLocation();
  const { data: trades = [] } = trpc.trades.list.useQuery();
  const overview = useMemo(() => {
    const totalPnl = trades.reduce((sum, trade) => sum + trade.pnl, 0);
    const wins = trades.filter(trade => trade.pnl > 0);
    const losses = trades.filter(trade => trade.pnl < 0);
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const monthPnl = trades.filter(trade => trade.date.startsWith(monthKey)).reduce((sum, trade) => sum + trade.pnl, 0);
    const winRate = trades.length ? (wins.length / trades.length) * 100 : 0;
    const averageWin = wins.length ? wins.reduce((sum, trade) => sum + trade.pnl, 0) / wins.length : 0;
    const averageLoss = losses.length ? losses.reduce((sum, trade) => sum + trade.pnl, 0) / losses.length : 0;
    const factor = averageLoss < 0 ? Math.abs(averageWin / averageLoss) : averageWin > 0 ? Infinity : 0;
    return {
      totalPnl,
      wins,
      losses,
      monthPnl,
      winRate,
      averageWin,
      averageLoss,
      factor,
      recent: [...trades].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4),
    };
  }, [trades]);

  const logTrade = () => {
    setLocation(appRoutes.trades);
    window.setTimeout(() => window.dispatchEvent(new Event("trade-fusion:open-log-trade")), 120);
  };

  return (
    <div className="min-h-full bg-[#06090f] text-foreground">
      <main className="mx-auto w-full max-w-[1720px] px-4 py-5 sm:px-5 lg:px-7 lg:py-6">
        <section className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[.22em] text-blue-300">Live-trade command center</p>
            <h1 className="mt-1.5 text-2xl font-semibold tracking-[-.04em] text-white sm:text-3xl">Dashboard</h1>
            <p className="mt-1.5 text-xs text-slate-500">Private journal performance · Backtest excluded</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setLocation(appRoutes.journal)} className="tf-press inline-flex items-center gap-1.5 rounded-xl border border-white/[.08] bg-white/[.025] px-3 py-2 text-xs text-slate-300 hover:bg-white/[.06]"><BookOpenCheck className="h-3.5 w-3.5 text-blue-300" />Open Journal</button>
            <button type="button" onClick={logTrade} className="tf-press inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-blue-400 to-blue-500 px-3 py-2 text-xs font-semibold text-white shadow-[0_10px_24px_oklch(.38_.16_250_/.28)]"><Plus className="h-4 w-4" />Log Trade</button>
          </div>
        </section>

        <section className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Recorded P&L" value={money(overview.totalPnl)} detail={`${trades.length} closed live trade${trades.length === 1 ? "" : "s"}`} tone="blue" icon={ChartNoAxesCombined} />
          <Metric label="This month" value={money(overview.monthPnl)} detail={new Date().toLocaleString("en-US", { month: "long", year: "numeric" })} tone={overview.monthPnl >= 0 ? "emerald" : "amber"} icon={TrendingUp} />
          <Metric label="Win rate" value={`${overview.winRate.toFixed(1)}%`} detail={`${overview.wins.length} wins · ${overview.losses.length} losses`} tone="violet" icon={Target} />
          <Metric label="Journal reviews" value={`${trades.length}`} detail="Add an idea or review to each trade." tone="amber" icon={BookOpenCheck} />
        </section>

        {overview.recent[0] && (
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-300/15 bg-blue-500/[.05] px-3 py-1.5 text-xs text-slate-400">
            <InstrumentBadge symbol={overview.recent[0].symbol} size="sm" />
            <DirectionBadge direction={overview.recent[0].direction} size="sm" />
            <span className="font-mono text-[9px] uppercase tracking-[.14em] text-slate-500">Latest instrument</span>
            <span className="font-mono text-[11px] font-semibold text-slate-200">{overview.recent[0].symbol}</span>
          </div>
        )}

        <section className="grid gap-4 2xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,.85fr)]">
          <section className="overflow-hidden rounded-2xl border border-white/[.07] bg-[#0a111f] p-4 shadow-[0_18px_38px_rgba(0,0,0,.2)] sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[.18em] text-slate-500">Recorded performance</p>
                <p className={`mt-2 font-mono text-3xl font-semibold tracking-[-.06em] ${overview.totalPnl > 0 ? "text-emerald-300" : overview.totalPnl < 0 ? "text-rose-300" : "text-white"}`}>{money(overview.totalPnl)}</p>
              </div>
              <span className="rounded-md border border-blue-400/15 bg-blue-500/[.06] px-2 py-1 font-mono text-[9px] text-blue-200">LIVE JOURNAL</span>
            </div>
            <PerformanceCurve trades={trades} totalPnl={overview.totalPnl} onLogTrade={logTrade} />
          </section>

          <section className="rounded-2xl border border-white/[.07] bg-[#0a111f] p-4 shadow-[0_18px_38px_rgba(0,0,0,.2)] sm:p-5">
            <div className="flex items-center justify-between"><div><p className="font-mono text-[9px] uppercase tracking-[.18em] text-slate-500">Recent activity</p><p className="mt-1 text-sm font-medium text-white">Latest live executions</p></div><Activity className="h-4 w-4 text-blue-300" /></div>
            <div className="mt-4 space-y-2.5">
              {overview.recent.length ? overview.recent.map(trade => (
                <button type="button" key={trade.id} onClick={() => setLocation(appRoutes.journal)} className="group flex w-full items-center justify-between rounded-lg border border-white/[.055] bg-white/[.018] px-3 py-2.5 text-left hover:border-blue-300/20 hover:bg-blue-500/[.04]">
                  <div><p className="font-mono text-[10px] font-semibold text-slate-200">{trade.symbol} <span className="font-normal text-slate-600">· {trade.direction}</span></p><p className="mt-0.5 text-[10px] text-slate-600">{trade.date}</p></div>
                  <span className={`font-mono text-xs ${trade.pnl > 0 ? "text-emerald-300" : trade.pnl < 0 ? "text-rose-300" : "text-slate-400"}`}>{money(trade.pnl)}</span>
                </button>
              )) : <p className="rounded-lg border border-dashed border-white/[.07] px-3 py-8 text-center text-xs text-slate-600">No live trades recorded.</p>}
            </div>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <button type="button" onClick={() => setLocation(appRoutes.trades)} className="tf-press rounded-xl border border-blue-400/15 bg-blue-500/[.05] px-3 py-3 text-left text-xs text-blue-200 hover:bg-blue-500/[.1]"><span className="block font-medium">Trade ledger</span><span className="mt-1 block text-[10px] text-slate-500">Log, edit, and export trades.</span></button>
              <button type="button" onClick={() => setLocation(appRoutes.journal)} className="tf-press rounded-xl border border-violet-400/15 bg-violet-500/[.05] px-3 py-3 text-left text-xs text-violet-200 hover:bg-violet-500/[.1]"><span className="block font-medium">Trade Journal</span><span className="mt-1 block text-[10px] text-slate-500">Capture ideas and learning.</span></button>
            </div>
          </section>
        </section>

        <section className="mt-4 grid gap-4 xl:grid-cols-[.9fr_1.1fr]">
          <section className="rounded-2xl border border-white/[.07] bg-[#0a111f] p-4 sm:p-5"><div className="flex items-center justify-between"><div><p className="font-mono text-[9px] uppercase tracking-[.18em] text-slate-500">Practice & prepare</p><p className="mt-1 text-sm font-medium text-white">Keep simulations separate</p></div><FlaskConical className="h-4 w-4 text-violet-300" /></div><p className="mt-4 text-xs leading-5 text-slate-500">Replay markets in Backtest and review macro risk before an execution. Simulated sessions never affect this Dashboard.</p><div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => setLocation(appRoutes.backtest)} className="tf-press inline-flex items-center gap-1.5 rounded-lg bg-violet-500/[.12] px-3 py-2 text-xs text-violet-200 hover:bg-violet-500/[.18]">Open Backtest <ArrowRight className="h-3.5 w-3.5" /></button><button type="button" onClick={() => setLocation(appRoutes.calendar)} className="tf-press inline-flex items-center gap-1.5 rounded-lg bg-blue-500/[.08] px-3 py-2 text-xs text-blue-200 hover:bg-blue-500/[.14]"><CalendarDays className="h-3.5 w-3.5" />Market Calendar</button></div></section>
          <section className="rounded-2xl border border-white/[.07] bg-[#0a111f] p-4 sm:p-5"><div className="flex items-center justify-between"><div><p className="font-mono text-[9px] uppercase tracking-[.18em] text-slate-500">Quick statistics</p><p className="mt-1 text-sm font-medium text-white">Live trade ledger only</p></div><ShieldCheck className="h-4 w-4 text-emerald-300" /></div><div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-5 sm:grid-cols-4"><div><p className="font-mono text-[8px] uppercase tracking-[.13em] text-slate-600">Profit factor</p><p className="mt-1.5 font-mono text-lg font-semibold text-white">{Number.isFinite(overview.factor) ? overview.factor.toFixed(2) : "∞"}</p></div><div><p className="font-mono text-[8px] uppercase tracking-[.13em] text-slate-600">Avg win</p><p className="mt-1.5 font-mono text-lg font-semibold text-emerald-300">{money(overview.averageWin)}</p></div><div><p className="font-mono text-[8px] uppercase tracking-[.13em] text-slate-600">Avg loss</p><p className="mt-1.5 font-mono text-lg font-semibold text-rose-300">{money(overview.averageLoss)}</p></div><div><p className="font-mono text-[8px] uppercase tracking-[.13em] text-slate-600">Trades</p><p className="mt-1.5 font-mono text-lg font-semibold text-white">{trades.length}</p></div></div><button type="button" onClick={() => setLocation(appRoutes.analytics)} className="tf-press mt-6 inline-flex items-center gap-1.5 text-xs font-medium text-blue-200 hover:text-white">Open setup analytics <ArrowRight className="h-3.5 w-3.5" /></button></section>
        </section>
      </main>
    </div>
  );
}

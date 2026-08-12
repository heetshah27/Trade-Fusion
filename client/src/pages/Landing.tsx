import { dashboardReveal, shouldRunLandingMotion } from "@/lib/landingMotion";
import { appRoutes } from "@/lib/appRoutes";
import { ArrowRight, BarChart3, CalendarDays, CheckCircle2, ChevronRight, Cloud, Globe2, LockKeyhole, Menu, MessageSquare, ScanLine, ShieldCheck, Sparkles, TrendingUp, X, Zap } from "lucide-react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef, useState } from "react";
import { Link } from "wouter";

const tickers = [
  { symbol: "EUR/USD", price: "1.0842", change: "+0.34%", positive: true },
  { symbol: "GBP/USD", price: "1.2915", change: "+0.18%", positive: true },
  { symbol: "USD/JPY", price: "147.60", change: "-0.42%", positive: false },
  { symbol: "XAU/USD", price: "2,385.40", change: "+0.85%", positive: true },
  { symbol: "BTC/USD", price: "64,250.00", change: "+1.92%", positive: true },
  { symbol: "S&P 500", price: "5,420.10", change: "+0.45%", positive: true },
];

const features = [
  {
    icon: BarChart3,
    eyebrow: "Performance Review",
    title: "See the exact signal in every trade.",
    text: "Turn executions into a focused review system with automated P&L color coding, win rate analytics, profit factor, and trade-level notes.",
  },
  {
    icon: Cloud,
    eyebrow: "Private Cloud Journal",
    title: "Secure sync across all your devices.",
    text: "Your account keeps your private journal isolated from other traders and synchronized instantly wherever you sign in.",
  },
  {
    icon: CalendarDays,
    eyebrow: "Live Macro Calendar",
    title: "Real-time economic intelligence.",
    text: "Track live high-impact events converted to Eastern Time with official country flags, impact ratings, and 5-minute auto-refresh.",
  },
  {
    icon: MessageSquare,
    eyebrow: "Trader’s Room",
    title: "Discuss execution with peers.",
    text: "An authenticated community workspace featuring trade ideas, psychology notes, chart attachments, and verified member badges.",
  },
];

function TFMonogram({ size = "regular" }: { size?: "regular" | "small" }) {
  return (
    <div className={`tf-monogram ${size === "small" ? "tf-monogram-small" : ""}`} aria-label="Trade Fusion TF monogram" role="img">
      <span className="tf-monogram-t">T</span>
      <span className="tf-monogram-f">F</span>
      <span className="tf-monogram-up" />
      <span className="tf-monogram-down" />
    </div>
  );
}

function Brand() {
  return (
    <div className="group flex items-center gap-2.5" aria-label="Trade Fusion">
      <TFMonogram />
      <div className="leading-none">
        <p className="text-sm font-bold tracking-[-0.045em] text-white">TRADE<span className="text-[oklch(0.70_0.16_250)]">FUSION</span></p>
        <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.27em] text-slate-400">Trading Workspace</p>
      </div>
    </div>
  );
}

function WorkspacePreview() {
  const [activeTab, setActiveTab] = useState<"journal" | "calendar" | "room">("journal");
  const previewRef = useRef<HTMLDivElement>(null);
  const inView = useInView(previewRef, { once: true, amount: 0.22 });
  const reducedMotion = useReducedMotion();
  const shouldAnimate = shouldRunLandingMotion(reducedMotion, inView);

  return (
    <motion.div
      ref={previewRef}
      className="relative mx-auto mt-14 max-w-6xl px-1 sm:px-4"
      initial={reducedMotion ? false : dashboardReveal.hidden}
      animate={shouldAnimate ? dashboardReveal.visible : undefined}
      transition={{ duration: 0.78, ease: [0.23, 1, 0.32, 1] }}
    >
      <div className="pointer-events-none absolute inset-x-16 -top-10 h-44 rounded-full bg-blue-500/25 blur-[110px]" />
      <div className="tf-preview-shell relative overflow-hidden rounded-[1.8rem] border border-blue-200/[0.20] bg-[#071328] p-2.5 shadow-[0_40px_100px_rgba(0,0,0,0.6)] sm:p-4">
        <div className="overflow-hidden rounded-[1.3rem] border border-white/[0.09] bg-[#0b1830]">
          {/* Top Bar with Interactive Tab Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] px-4 py-3 sm:px-6">
            <div className="flex items-center gap-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.16em] text-slate-400">TradeFXBook Architecture</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] p-1">
              <button
                onClick={() => setActiveTab("journal")}
                className={`rounded-lg px-3 py-1 font-mono text-[10px] uppercase tracking-[0.12em] transition ${activeTab === "journal" ? "bg-[oklch(0.66_0.18_250)] text-white shadow-md" : "text-slate-400 hover:text-white"}`}
              >
                Journal
              </button>
              <button
                onClick={() => setActiveTab("calendar")}
                className={`rounded-lg px-3 py-1 font-mono text-[10px] uppercase tracking-[0.12em] transition ${activeTab === "calendar" ? "bg-[oklch(0.66_0.18_250)] text-white shadow-md" : "text-slate-400 hover:text-white"}`}
              >
                Calendar
              </button>
              <button
                onClick={() => setActiveTab("room")}
                className={`rounded-lg px-3 py-1 font-mono text-[10px] uppercase tracking-[0.12em] transition ${activeTab === "room" ? "bg-[oklch(0.66_0.18_250)] text-white shadow-md" : "text-slate-400 hover:text-white"}`}
              >
                Trader’s Room
              </button>
            </div>
          </div>

          <div className="grid min-h-[380px] grid-cols-[150px_1fr] sm:min-h-[460px] sm:grid-cols-[210px_1fr]">
            {/* Sidebar */}
            <aside className="border-r border-white/[0.08] bg-[#071326] p-3 sm:p-5">
              <div className="flex items-center gap-2.5 text-xs font-semibold text-white">
                <TFMonogram size="small" />
                <span className="hidden sm:inline tracking-tight">TRADEFUSION</span>
              </div>
              <div className="mt-8 space-y-2">
                <button
                  onClick={() => setActiveTab("journal")}
                  className={`w-full text-left rounded-xl border px-3 py-2.5 text-xs font-medium transition ${activeTab === "journal" ? "border-blue-300/30 bg-blue-500/15 text-white" : "border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200"}`}
                >
                  Performance Journal
                </button>
                <button
                  onClick={() => setActiveTab("calendar")}
                  className={`w-full text-left rounded-xl border px-3 py-2.5 text-xs font-medium transition ${activeTab === "calendar" ? "border-blue-300/30 bg-blue-500/15 text-white" : "border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200"}`}
                >
                  Economic Calendar
                </button>
                <button
                  onClick={() => setActiveTab("room")}
                  className={`w-full text-left rounded-xl border px-3 py-2.5 text-xs font-medium transition ${activeTab === "room" ? "border-blue-300/30 bg-blue-500/15 text-white" : "border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200"}`}
                >
                  Trader’s Room
                </button>
              </div>
              <div className="mt-12 hidden rounded-xl border border-blue-200/[0.12] bg-blue-400/[0.06] p-3 text-[10px] leading-relaxed text-slate-400 sm:block">
                <ShieldCheck className="mb-2 h-4 w-4 text-[oklch(0.70_0.16_250)]" />
                Encrypted private session & verified account state.
              </div>
            </aside>

            {/* Main Content Area based on Tab */}
            <div className="p-4 sm:p-7 overflow-x-auto">
              {activeTab === "journal" && (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[oklch(0.70_0.16_250)]">Verified Performance</p>
                      <h3 className="text-xl font-semibold tracking-[-0.03em] text-white sm:text-2xl">Executive Trading Ledger</h3>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-[10px] text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live Sync Active
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      ["Net P&L", "+$14,820.50", "text-emerald-400", "+18.4% MoM"],
                      ["Win Rate", "71.4%", "text-blue-300", "28 Wins / 11 Losses"],
                      ["Profit Factor", "2.38", "text-emerald-300", "Top 5% Tier"],
                      ["Sharpe Ratio", "2.12", "text-slate-200", "Low Volatility"],
                    ].map(([label, value, color, sub]) => (
                      <div key={label} className="group rounded-2xl border border-blue-200/[0.12] bg-gradient-to-b from-[#13284d] to-[#0c1a32] p-4 transition duration-300 hover:border-blue-400/40 hover:shadow-lg hover:shadow-blue-500/10">
                        <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-slate-400">{label}</p>
                        <p className={`mt-2 font-mono text-lg font-bold sm:text-xl ${color}`}>{value}</p>
                        <p className="mt-1 font-mono text-[9px] text-slate-500">{sub}</p>
                      </div>
                    ))}
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#09152b]">
                    <div className="grid grid-cols-[1.2fr_1fr_1fr_0.8fr] border-b border-white/[0.08] bg-white/[0.03] px-4 py-2.5 font-mono text-[8px] uppercase tracking-[0.18em] text-slate-400">
                      <span>Session</span><span>Instrument</span><span>Setup</span><span>Net Result</span>
                    </div>
                    {[
                      ["New York · Open", "EUR/USD", "Breakout Retest", "+$1,420.00", "text-emerald-400"],
                      ["London · Morning", "XAU/USD", "Liquidity Sweep", "+$895.50", "text-emerald-400"],
                      ["New York · Power Hour", "NAS100", "Trend Continuation", "-$310.00", "text-red-400"],
                    ].map(([session, inst, setup, res, color]) => (
                      <div key={`${session}-${inst}`} className="grid grid-cols-[1.2fr_1fr_1fr_0.8fr] border-b border-white/[0.05] px-4 py-3.5 font-mono text-xs text-slate-300 last:border-0 hover:bg-white/[0.02] transition">
                        <span className="text-slate-400">{session}</span>
                        <span className="font-semibold text-white">{inst}</span>
                        <span className="text-slate-400">{setup}</span>
                        <span className={`font-bold ${color}`}>{res}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "calendar" && (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[oklch(0.70_0.16_250)]">Macro Intelligence</p>
                      <h3 className="text-xl font-semibold tracking-[-0.03em] text-white sm:text-2xl">Economic Calendar & Impact Feed</h3>
                    </div>
                    <span className="rounded-xl border border-blue-300/25 bg-blue-500/10 px-3 py-1 font-mono text-[10px] text-blue-200">
                      Eastern Time (ET) · Auto-Refreshed
                    </span>
                  </div>

                  <div className="space-y-3">
                    {[
                      ["08:30 AM ET", "USD", "Core Retail Sales (MoM)", "High", "+0.4%", "+0.1%", "bg-red-500/20 text-red-300 border-red-500/40"],
                      ["10:00 AM ET", "USD", "FOMC Member Speech", "Medium", "—", "—", "bg-amber-500/20 text-amber-300 border-amber-500/40"],
                      ["02:00 PM ET", "USD", "Federal Reserve Interest Rate Decision", "High", "5.50%", "5.50%", "bg-red-500/20 text-red-300 border-red-500/40"],
                    ].map(([time, curr, event, impact, act, fore, badge]) => (
                      <div key={event} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-[#09152b] p-4 hover:border-blue-400/30 transition">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs text-blue-300">{time}</span>
                          <span className="rounded-lg bg-white/10 px-2 py-0.5 font-mono text-xs font-bold text-white">{curr}</span>
                          <span className="text-sm font-medium text-white">{event}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`rounded-full border px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-wider ${badge}`}>{impact} Impact</span>
                          <span className="font-mono text-xs text-slate-400">Act: <strong className="text-white">{act}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "room" && (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[oklch(0.70_0.16_250)]">Peer Community</p>
                      <h3 className="text-xl font-semibold tracking-[-0.03em] text-white sm:text-2xl">Trader’s Room Discussions</h3>
                    </div>
                    <span className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-[10px] text-emerald-400">
                      Verified Traders Only
                    </span>
                  </div>

                  <div className="space-y-3">
                    {[
                      ["Trade Ideas", "EUR/USD Daily Order Block Bounce & Liquidity Hunt", "Marcus_FX", "Day Trader", "14 Insights", "2h ago"],
                      ["Execution Review", "Why scaling out of XAU/USD shorts saved my weekly drawdown", "Elena_Scalps", "Scalper", "22 Insights", "5h ago"],
                      ["Psychology", "Managing FOMC volatility without over-leveraging position size", "ApexTrader", "Swing Trader", "38 Insights", "1d ago"],
                    ].map(([cat, title, author, badge, likes, time]) => (
                      <div key={title} className="rounded-2xl border border-white/[0.08] bg-[#09152b] p-4 hover:border-blue-400/40 transition">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[9px] uppercase tracking-wider text-blue-300">{cat}</span>
                          <span className="font-mono text-[9px] text-slate-500">{time}</span>
                        </div>
                        <h4 className="mt-2 text-sm font-semibold text-white sm:text-base">{title}</h4>
                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-300">{author}</span>
                            <span className="rounded-full bg-blue-500/20 px-2 py-0.5 font-mono text-[9px] text-blue-200">{badge}</span>
                          </div>
                          <span className="font-mono text-xs text-slate-400">💡 {likes}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">Interactive TradeFXBook Architecture Preview · Click tabs to explore modules</p>
    </motion.div>
  );
}

export default function Landing() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <main className="min-h-screen overflow-hidden bg-[#061023] text-white">
      {/* Live Market Ticker Tape */}
      <div className="relative z-30 border-b border-white/[0.08] bg-[#050d1a] py-2.5 overflow-hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 overflow-x-auto whitespace-nowrap scrollbar-none sm:gap-8 lg:px-8">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-blue-400 shrink-0 bg-[#050d1a] pr-3 sticky left-0 z-10 shadow-[8px_0_12px_-4px_rgba(5,13,26,0.9)]">
            <Zap className="h-3.5 w-3.5 text-amber-400 animate-pulse shrink-0" /> <span className="hidden sm:inline">Live Ticker Feed:</span><span className="sm:hidden">Feed:</span>
          </div>
          <div className="flex items-center gap-6 sm:gap-8 text-xs font-mono shrink-0">
            {tickers.map(t => (
              <div key={t.symbol} className="flex items-center gap-2">
                <span className="text-slate-400">{t.symbol}</span>
                <span className="text-white font-semibold">{t.price}</span>
                <span className={t.positive ? "text-emerald-400 font-medium" : "text-red-400 font-medium"}>{t.change}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,oklch(0.58_0.18_250_/_0.26),transparent_30rem),radial-gradient(circle_at_8%_65%,oklch(0.36_0.14_245_/_0.18),transparent_32rem)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.09] [background-image:linear-gradient(oklch(0.8_0.02_250)_1px,transparent_1px),linear-gradient(90deg,oklch(0.8_0.02_250)_1px,transparent_1px)] [background-size:56px_56px]" />

      <header className="relative z-20 mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">
        <Brand />
        <nav className="hidden items-center gap-8 text-sm md:flex">
          <a className="tf-nav-link text-slate-300 hover:text-white transition" href="#features">Features</a>
          <a className="tf-nav-link text-slate-300 hover:text-white transition" href="#architecture">Architecture</a>
          <a className="tf-nav-link text-slate-300 hover:text-white transition" href="#security">Privacy</a>
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <Link href={appRoutes.journal} className="text-xs font-mono text-slate-300 hover:text-white transition px-3 py-2">Sign in</Link>
          <Link href={appRoutes.journal} className="tf-cta-primary px-4 py-2.5 text-sm inline-flex items-center">Get started <ArrowRight className="ml-2 h-4 w-4" /></Link>
        </div>
        <button onClick={() => setMobileOpen((open) => !open)} className="grid h-10 w-10 place-items-center rounded-xl border border-white/[0.10] bg-white/[0.04] text-slate-300 md:hidden" aria-label="Toggle navigation">{mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}</button>
      </header>

      {mobileOpen && (
        <div className="relative z-20 mx-5 rounded-2xl border border-white/[0.09] bg-[#0c1a31]/95 p-5 shadow-2xl backdrop-blur-xl md:hidden">
          <div className="grid gap-3 text-sm text-slate-300">
            <a href="#features" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2 hover:bg-white/[0.05]">Features</a>
            <a href="#architecture" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2 hover:bg-white/[0.05]">Architecture</a>
            <Link href={appRoutes.journal} className="mt-2 inline-flex items-center justify-center rounded-xl bg-[oklch(0.66_0.18_250)] px-4 py-3 font-semibold text-white">Get started <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </div>
        </div>
      )}

      <section className="relative z-10 mx-auto max-w-7xl px-5 pb-20 pt-16 text-center sm:pb-28 sm:pt-20 lg:px-8 lg:pt-24">
        <div className="tf-signal-chip mx-auto inline-flex items-center gap-2 px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-blue-200">
          <Sparkles className="h-3.5 w-3.5 text-blue-400" /> Inspired by TradeFXBook Analytics · Enterprise Grade
        </div>
        <h1 className="tf-rise tf-rise-delay-1 mx-auto mt-7 max-w-5xl text-4xl font-semibold tracking-[-0.065em] text-white sm:text-6xl lg:text-7xl">
          Turn every execution into <span className="bg-gradient-to-r from-blue-300 via-blue-400 to-sky-300 bg-clip-text text-transparent">your next edge.</span>
        </h1>
        <p className="tf-rise tf-rise-delay-2 mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
          Trade Fusion unites your trade journal, quantitative performance review, live macro calendar, and peer community in one lightning-fast workspace.
        </p>
        <div className="tf-rise tf-rise-delay-3 mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href={appRoutes.journal} className="tf-cta-primary h-12 px-7 text-base font-semibold shadow-xl shadow-blue-500/20">Get started free <ArrowRight className="ml-2 h-4 w-4" /></Link>
          <a href="#features" className="tf-cta-secondary h-12 px-7 text-base">Explore platform <ChevronRight className="ml-1 h-4 w-4" /></a>
        </div>
        <div className="tf-rise tf-rise-delay-4 mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-slate-400 font-mono">
          <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Private neon database</span>
          <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Cross-device cloud sync</span>
          <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> ForexFactory live feed</span>
        </div>
        <WorkspacePreview />
      </section>

      {/* Features Grid with Rich Hover Effects */}
      <section id="features" className="relative z-10 border-y border-white/[0.08] bg-[#08152a]/80 py-24 backdrop-blur-md sm:py-28">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="max-w-2xl">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[oklch(0.70_0.16_250)]">Precision Review Stack</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl">Engineered for serious market participants.</h2>
            <p className="mt-3 text-slate-400">Everything you need to eliminate emotional mistakes and compound your edge.</p>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <article key={feature.title} className="group relative rounded-3xl border border-blue-200/[0.12] bg-gradient-to-b from-[#13284d] to-[#0c1a31] p-7 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-blue-400/40 hover:shadow-2xl hover:shadow-blue-500/20">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-500/15 text-blue-300 transition group-hover:scale-110 group-hover:bg-blue-500/25">
                  <feature.icon className="h-6 w-6" />
                </div>
                <p className="mt-6 font-mono text-[9px] uppercase tracking-[0.2em] text-[oklch(0.70_0.16_250)]">{feature.eyebrow}</p>
                <h3 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-white">{feature.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">{feature.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture & Workflow */}
      <section id="architecture" className="relative z-10 mx-auto grid max-w-7xl gap-12 px-5 py-24 sm:py-32 lg:grid-cols-[1fr_1.1fr] lg:px-8">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[oklch(0.70_0.16_250)]">Architectural Discipline</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl">Log the setup. Review the metrics. Execute with clarity.</h2>
          <p className="mt-5 text-base leading-7 text-slate-400">Trade Fusion provides a frictionless recording loop so you can focus entirely on price action and risk management.</p>
          <div className="mt-8 space-y-4">
            <div className="flex items-start gap-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-blue-500/20 font-mono text-xs text-blue-300">✓</span>
              <p className="text-sm text-slate-300"><strong className="text-white">Instant Day P&L Coloring:</strong> Green or red daily badges highlight profitable sessions instantly.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-blue-500/20 font-mono text-xs text-blue-300">✓</span>
              <p className="text-sm text-slate-300"><strong className="text-white">Zero Setup Friction:</strong> Add trades in seconds with session tags, risk/reward ratios, and side selectors.</p>
            </div>
          </div>
        </div>
        <div className="grid gap-4">
          {[
            ["01", "Capture Execution", "Record entry price, exit size, and strategic notes while trade context is fresh."],
            ["02", "Quantitative Review", "Inspect win rate, profit factor, and return distribution across instruments."],
            ["03", "Macro Preparedness", "Review high-impact economic releases before committing risk to the market."],
          ].map(([num, title, desc]) => (
            <div key={num} className="group flex items-start gap-5 rounded-3xl border border-white/[0.08] bg-[#09152b] p-6 transition hover:border-blue-400/40 hover:bg-[#0c1c38]">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-blue-500/10 font-mono text-sm font-bold text-blue-300">{num}</span>
              <div>
                <h3 className="text-lg font-semibold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Security & CTA */}
      <section id="security" className="relative z-10 px-5 pb-24 sm:pb-32 lg:px-8">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-blue-300/[0.20] bg-[radial-gradient(circle_at_20%_0%,oklch(0.55_0.16_250_/_0.30),transparent_36rem),linear-gradient(135deg,#122b56,#0a1a35_56%,#061226)] p-8 sm:p-14 shadow-2xl">
          <div className="max-w-2xl">
            <ScanLine className="h-8 w-8 text-blue-300" />
            <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.24em] text-blue-200">Total Account Isolation</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">Your journal is 100% private.</h2>
            <p className="mt-5 text-base leading-7 text-blue-100/80">Every trade, note, and statistic is bound exclusively to your authenticated user account. Secure OAuth sign-in guarantees your data remains confidential.</p>
            <Link href={appRoutes.journal} className="mt-9 inline-flex h-12 items-center rounded-xl bg-white px-7 text-sm font-semibold text-[#0a1830] transition hover:bg-blue-50 shadow-xl">
              Open Trade Fusion Workspace <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/[0.08] px-5 py-10 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 text-xs text-slate-500 sm:flex-row sm:items-center">
          <Brand />
          <p>© {new Date().getFullYear()} Trade Fusion. Professional trading review architecture.</p>
        </div>
      </footer>
    </main>
  );
}

import { dashboardReveal, shouldRunLandingMotion } from "@/lib/landingMotion";
import { appRoutes } from "@/lib/appRoutes";
import { ArrowRight, BarChart3, BookOpenCheck, CalendarDays, CheckCircle2, ChevronRight, Cloud, Crosshair, Globe2, Layers3, LockKeyhole, Menu, MessageSquare, ScanLine, ShieldCheck, Sparkles, Target, TrendingUp, X, Zap } from "lucide-react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";
import { Link } from "wouter";

import { trpc } from "@/lib/trpc";

const fallbackTickers = [
  { symbol: "EUR/USD", price: "1.0842", change: "+0.34%", positive: true, isLive: false },
  { symbol: "GBP/USD", price: "1.2915", change: "+0.18%", positive: true, isLive: false },
  { symbol: "USD/JPY", price: "147.60", change: "-0.42%", positive: false, isLive: false },
  { symbol: "XAU/USD", price: "2,385.40", change: "+0.85%", positive: true, isLive: false },
  { symbol: "BTC/USD", price: "64,250.00", change: "+1.92%", positive: true, isLive: false },
  { symbol: "ETH/USD", price: "3,450.00", change: "+2.10%", positive: true, isLive: false },
  { symbol: "SOL/USD", price: "145.20", change: "-1.15%", positive: false, isLive: false },
  { symbol: "S&P 500", price: "5,420.10", change: "+0.45%", positive: true, isLive: false },
  { symbol: "NASDAQ", price: "18,940.25", change: "+0.78%", positive: true, isLive: false },
];

const features = [
  {
    icon: BarChart3,
    eyebrow: "Performance Review",
    title: "See the exact signal in every trade.",
    text: "Turn executions into a focused review system with automated P&L color coding, win rate analytics, profit factor, and trade-level notes.",
  },
  {
    icon: BookOpenCheck,
    eyebrow: "Saved Setups",
    title: "Turn your playbook into a repeatable process.",
    text: "Create private setup definitions, reuse them in your journal, and retain their historical performance as your process evolves.",
  },
  {
    icon: TrendingUp,
    eyebrow: "Setup Analytics",
    title: "See where your edge is actually forming.",
    text: "Compare recorded P&L, win rate, profit factor, symbol, direction, weekday, and market-session context—live journal trades only.",
  },
  {
    icon: Crosshair,
    eyebrow: "Backtest Lab",
    title: "Rehearse your strategy before live risk.",
    text: "Replay source-backed markets, mark private zones, simulate entries and exits, and keep strategy testing separate from live performance.",
  },
  {
    icon: Cloud,
    eyebrow: "Private Cloud Journal",
    title: "Secure sync across all your devices.",
    text: "Your account keeps private journal data isolated from other traders and synchronized wherever you sign in.",
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

const productInsights = [
  { icon: BookOpenCheck, step: "01", title: "Capture the trade while context is fresh", text: "Log manual executions with entry, exit, fees, notes, saved setup, market session, instrument category, trade quality, and plan adherence.", accent: "text-sky-300" },
  { icon: Layers3, step: "02", title: "Build a playbook that stays organized", text: "Maintain a private saved-setup library. Archive older ideas without breaking historic analytics or your trade record.", accent: "text-emerald-300" },
  { icon: BarChart3, step: "03", title: "Review patterns, not isolated outcomes", text: "Inspect how each setup behaves across symbol, direction, session, and weekday to identify what deserves more attention.", accent: "text-violet-300" },
  { icon: Target, step: "04", title: "Practice the plan before live exposure", text: "Use the private Backtest workspace to replay markets, annotate a thesis, and assess a simulated execution separately from your journal.", accent: "text-amber-200" },
];

const productSpotlights = [
  {
    key: "backtest",
    icon: Crosshair,
    eyebrow: "Private replay lab",
    title: <>Test a decision before it becomes a live position.</>,
    description: "Step through source-backed historical markets, mark the thesis, rehearse execution, and measure a simulated outcome without changing live journal metrics.",
    bullets: ["Replay crypto, FX, and gold source data", "Draw private zones, levels, and trendlines", "Separate simulated P&L from live performance"],
    action: "Open Backtest lab",
    href: appRoutes.backtest,
    accent: "blue",
  },
  {
    key: "journal",
    icon: BookOpenCheck,
    eyebrow: "Execution journal",
    title: <>Give every execution its <span className="text-[oklch(0.70_0.16_250)]">full context.</span></>,
    description: "Record live trades with a saved setup, market session, quality, plan-adherence, notes, and P&L—then return to the decision with context intact.",
    bullets: ["Private manual entries with cloud sync", "Saved setup and quality context", "Clear day-by-day profit and loss review"],
    action: "Start your journal",
    href: appRoutes.journal,
    accent: "emerald",
  },
  {
    key: "analytics",
    icon: BarChart3,
    eyebrow: "Setup intelligence",
    title: <>See the <span className="text-[oklch(0.70_0.16_250)]">process</span> behind the P&L.</>,
    description: "Compare recorded results by setup, symbol, direction, weekday, and session. The dashboard focuses on your private live journal, never Backtest simulations.",
    bullets: ["Win rate, profit factor, and recorded P&L", "Saved-setup and session comparisons", "Live-trade analytics with private ownership"],
    action: "Review setup analytics",
    href: appRoutes.analytics,
    accent: "violet",
  },
  {
    key: "room",
    icon: MessageSquare,
    eyebrow: "Trader’s Room",
    title: <>Build conviction with a <span className="text-[oklch(0.70_0.16_250)]">private community.</span></>,
    description: "Discuss execution, share chart attachments, and learn from focused trading conversations while keeping every journal and metric private by default.",
    bullets: ["Member discussions and chart attachments", "Reactions, badges, and moderator controls", "No automatic sharing of journal data"],
    action: "Enter Trader’s Room",
    href: appRoutes.community,
    accent: "sky",
  },
] as const;

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

function SpotlightPreview({ kind }: { kind: "backtest" | "journal" | "analytics" | "room" }) {
  const navLabel = { backtest: "Backtest Lab", journal: "Performance Journal", analytics: "Setup Analytics", room: "Trader’s Room" }[kind];

  return (
    <div className="relative mx-auto w-full max-w-[670px]">
      <div className="pointer-events-none absolute inset-x-16 -top-8 h-32 rounded-full bg-blue-500/15 blur-[90px]" />
      <div className="relative overflow-hidden rounded-[1.65rem] border border-blue-200/[0.18] bg-[#050c18] p-2 shadow-[0_30px_90px_rgba(0,0,0,0.58)]">
        <div className="overflow-hidden rounded-[1.2rem] border border-white/[0.08] bg-[#08152a]">
          <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3">
            <div className="flex items-center gap-2.5"><TFMonogram size="small" /><span className="font-mono text-[9px] uppercase tracking-[0.16em] text-slate-400">Trade Fusion / {navLabel}</span></div>
            <div className="flex gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /><span className="h-1.5 w-1.5 rounded-full bg-blue-400" /><span className="h-1.5 w-1.5 rounded-full bg-slate-500" /></div>
          </div>
          <div className="grid min-h-[285px] grid-cols-[90px_1fr] sm:min-h-[330px] sm:grid-cols-[122px_1fr]">
            <aside className="border-r border-white/[0.07] bg-[#061022] p-3 sm:p-4">
              <p className="font-mono text-[7px] uppercase tracking-[0.16em] text-slate-600">Workspace</p>
              <div className="mt-5 space-y-2 font-mono text-[8px] text-slate-500 sm:text-[9px]">
                {['Journal', 'Setups', 'Analytics', 'Backtest', 'Calendar'].map((item) => <div key={item} className={`${item === navLabel.replace(' Lab', '').replace('Performance ', '').replace('Setup ', '').replace('Trader’s ', '') ? 'rounded-md bg-blue-500/15 px-2 py-1.5 text-blue-200' : 'px-2 py-1.5'}`}>{item}</div>)}
              </div>
            </aside>
            <div className="min-w-0 p-4 sm:p-5">
              {kind === "backtest" && <div className="space-y-4"><div className="flex items-center justify-between"><div><p className="font-mono text-[8px] uppercase tracking-[0.18em] text-blue-300">Historical replay</p><h4 className="mt-1 text-base font-semibold text-white">XAU/USD · 15m</h4></div><span className="rounded-full border border-blue-400/25 bg-blue-500/10 px-2 py-1 font-mono text-[8px] text-blue-200">SIMULATED</span></div><div className="relative h-40 overflow-hidden rounded-xl border border-white/[0.08] bg-[#050b16] sm:h-48"><div className="absolute inset-0 opacity-20 [background-image:linear-gradient(#3b82f6_1px,transparent_1px),linear-gradient(90deg,#3b82f6_1px,transparent_1px)] [background-size:32px_32px]" /><svg viewBox="0 0 500 180" className="absolute inset-0 h-full w-full" preserveAspectRatio="none"><polyline fill="none" stroke="#60a5fa" strokeWidth="2.5" points="0,115 25,90 50,106 75,70 100,78 125,42 150,60 175,92 200,80 225,110 250,98 275,125 300,85 325,102 350,75 375,110 400,95 425,132 450,115 475,138 500,122" /><line x1="0" x2="500" y1="106" y2="106" stroke="#34d399" strokeDasharray="5 5" opacity="0.9" /></svg><div className="absolute left-[38%] top-[30%] h-[43%] w-[25%] border border-blue-400/70 bg-blue-500/10"><span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-blue-300" /></div></div><div className="flex gap-2"><span className="rounded-lg bg-red-500/15 px-3 py-1.5 font-mono text-[9px] text-red-300">SELL · 0.10</span><span className="rounded-lg bg-blue-500/15 px-3 py-1.5 font-mono text-[9px] text-blue-200">BUY · 0.10</span><span className="ml-auto font-mono text-[9px] text-slate-500">Zone active</span></div></div>}
              {kind === "journal" && <div className="space-y-4"><div className="flex items-center justify-between"><div><p className="font-mono text-[8px] uppercase tracking-[0.18em] text-emerald-300">Execution review</p><h4 className="mt-1 text-base font-semibold text-white">Trade Journal</h4></div><span className="font-mono text-[9px] text-emerald-400">+ $3.93 today</span></div><div className="space-y-2">{[['XAU/USD', 'London Sweep', '+$182.40', 'text-emerald-400'], ['EUR/USD', 'Breakout Retest', '+$74.00', 'text-emerald-400'], ['NAS100', 'Trend Continuation', '-$51.50', 'text-red-400']].map(([symbol, setup, pnl, color]) => <div key={symbol} className="grid grid-cols-[1fr_1.3fr_0.8fr] items-center rounded-lg border border-white/[0.07] bg-white/[0.025] px-3 py-3 font-mono text-[9px]"><span className="font-semibold text-white">{symbol}</span><span className="text-slate-400">{setup}</span><span className={`text-right ${color}`}>{pnl}</span></div>)}</div><div className="rounded-xl border border-blue-300/15 bg-blue-400/[0.06] p-3 font-mono text-[9px] text-blue-200">Notes, setup, session, quality, and rule adherence stay together.</div></div>}
              {kind === "analytics" && <div className="space-y-4"><div className="flex items-center justify-between"><div><p className="font-mono text-[8px] uppercase tracking-[0.18em] text-violet-300">Live journal only</p><h4 className="mt-1 text-base font-semibold text-white">Setup Analytics</h4></div><span className="rounded-lg border border-white/[0.08] px-2 py-1 font-mono text-[8px] text-slate-400">30 DAYS</span></div><div className="grid grid-cols-3 gap-2">{[['WIN RATE', '68%', 'text-emerald-400'], ['P. FACTOR', '1.92', 'text-blue-200'], ['AVG P&L', '$44', 'text-emerald-300']].map(([label, value, color]) => <div key={label} className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3"><p className="font-mono text-[7px] text-slate-500">{label}</p><p className={`mt-2 font-mono text-sm font-bold ${color}`}>{value}</p></div>)}</div><div className="space-y-2">{[['London Sweep', 82, 'bg-emerald-400'], ['Breakout Retest', 64, 'bg-blue-400'], ['Trend Continuation', 41, 'bg-violet-400']].map(([label, width, color]) => <div key={label}><div className="mb-1 flex justify-between font-mono text-[8px] text-slate-400"><span>{label}</span><span>{width}%</span></div><div className="h-2 overflow-hidden rounded-full bg-white/[0.06]"><div className={`h-full rounded-full ${color}`} style={{ width: `${width}%` }} /></div></div>)}</div></div>}
              {kind === "room" && <div className="space-y-3"><div className="flex items-center justify-between"><div><p className="font-mono text-[8px] uppercase tracking-[0.18em] text-sky-300">Member discussion</p><h4 className="mt-1 text-base font-semibold text-white">Trader’s Room</h4></div><span className="rounded-full bg-emerald-500/10 px-2 py-1 font-mono text-[8px] text-emerald-300">LIVE ROOM</span></div>{[['Execution Review', 'Keeping size disciplined into CPI', '4 replies'], ['Trade Ideas', 'Mapping London session liquidity', '11 insights'], ['Psychology', 'Notes from a patient week', '6 insights']].map(([tag, title, activity]) => <div key={title} className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3"><div className="flex justify-between font-mono text-[8px] text-sky-300"><span>{tag}</span><span className="text-slate-500">{activity}</span></div><p className="mt-2 text-xs font-medium text-white">{title}</p><p className="mt-1 font-mono text-[8px] text-slate-500">Private journal data is never shared.</p></div>)}</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [clock, setClock] = useState(() => Date.now());
  const { data: tickerData } = trpc.ticker.quotes.useQuery(undefined, {
    refetchInterval: 6_000,
    refetchIntervalInBackground: true,
  });
  const tickers = tickerData?.items ?? fallbackTickers;
  const hasLiveQuotes = tickerData?.source === "kraken";
  const quoteAgeSeconds = tickerData ? Math.max(0, Math.floor((clock - tickerData.asOf) / 1_000)) : null;

  useEffect(() => {
    const interval = window.setInterval(() => setClock(Date.now()), 1_000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen overflow-hidden bg-[#061023] text-white">
      {/* Live Market Ticker Tape with Automatic Marquee */}
      <div className="relative z-30 border-b border-white/[0.08] bg-[#050d1a] py-2.5 overflow-hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 overflow-hidden whitespace-nowrap lg:px-8">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-blue-400 shrink-0 bg-[#050d1a] pr-3 sticky left-0 z-20 shadow-[12px_0_16px_-4px_rgba(5,13,26,0.95)]">
            <Zap className={`h-3.5 w-3.5 shrink-0 ${hasLiveQuotes ? "text-emerald-400 animate-pulse" : "text-amber-400"}`} /> <span className="hidden sm:inline">{hasLiveQuotes ? `Kraken Crypto · ${quoteAgeSeconds === 0 ? "just updated" : `${quoteAgeSeconds}s ago`}:` : "Reference Quotes:"}</span><span className="sm:hidden">{hasLiveQuotes ? "Kraken:" : "Ref:"}</span>
          </div>
          <div className="relative overflow-hidden w-full">
            <div className="animate-ticker flex items-center gap-8 text-xs font-mono">
              {[...tickers, ...tickers].map((t, idx) => (
                <div key={`${t.symbol}-${idx}`} className="flex items-center gap-2 shrink-0">
                  <span className="text-slate-400">{t.symbol}{t.isLive ? <span className="ml-1 text-emerald-400/80">●</span> : <span className="ml-1 text-[8px] uppercase tracking-wide text-slate-600">Ref</span>}</span>
                  <span className="text-white font-semibold">{t.price}</span>
                  <span className={t.positive ? "text-emerald-400 font-medium" : "text-red-400 font-medium"}>{t.change}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,oklch(0.58_0.18_250_/_0.26),transparent_30rem),radial-gradient(circle_at_8%_65%,oklch(0.36_0.14_245_/_0.18),transparent_32rem)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.09] [background-image:linear-gradient(oklch(0.8_0.02_250)_1px,transparent_1px),linear-gradient(90deg,oklch(0.8_0.02_250)_1px,transparent_1px)] [background-size:56px_56px]" />

      <header className="relative z-20 mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">
        <Brand />
        <nav className="hidden items-center gap-8 text-sm md:flex">
          <a className="tf-nav-link text-slate-300 hover:text-white transition" href="#platform">Platform</a>
          <a className="tf-nav-link text-slate-300 hover:text-white transition" href="#workflow">Workflow</a>
          <a className="tf-nav-link text-slate-300 hover:text-white transition" href="#security">Privacy</a>
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <Link href={appRoutes.journal} className="text-xs font-mono text-slate-300 hover:text-white transition px-3 py-2">Sign in</Link>
          <Link href={appRoutes.journal} className="tf-cta-primary !bg-[oklch(0.66_0.18_250)] px-4 py-2.5 text-sm inline-flex !shadow-blue-500/20 hover:!bg-[oklch(0.72_0.15_250)]">Get started <ArrowRight className="ml-2 h-4 w-4" /></Link>
        </div>
        <button onClick={() => setMobileOpen((open) => !open)} className="grid h-10 w-10 place-items-center rounded-xl border border-white/[0.10] bg-white/[0.04] text-slate-300 md:hidden" aria-label="Toggle navigation">{mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}</button>
      </header>

      {mobileOpen && (
        <div className="relative z-20 mx-5 rounded-2xl border border-white/[0.09] bg-[#0c1a31]/95 p-5 shadow-2xl backdrop-blur-xl md:hidden">
          <div className="grid gap-3 text-sm text-slate-300">
            <a href="#platform" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2 hover:bg-white/[0.05]">Platform</a>
            <a href="#workflow" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2 hover:bg-white/[0.05]">Workflow</a>
            <Link href={appRoutes.journal} className="mt-2 inline-flex items-center justify-center rounded-xl bg-[oklch(0.66_0.18_250)] px-4 py-3 font-semibold text-white">Get started <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </div>
        </div>
      )}

      <section className="relative z-10 mx-auto max-w-7xl px-5 pb-20 pt-16 text-center sm:pb-28 sm:pt-20 lg:px-8 lg:pt-24">
        <div className="tf-signal-chip mx-auto inline-flex items-center gap-2 px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-blue-200">
          <Sparkles className="h-3.5 w-3.5 text-blue-400" /> Private Trading Performance System · Built for Deliberate Review
        </div>
        <h1 className="tf-rise tf-rise-delay-1 mx-auto mt-7 max-w-5xl text-4xl font-semibold tracking-[-0.065em] text-white sm:text-6xl lg:text-7xl">
          Turn every execution into <span className="bg-gradient-to-r from-blue-300 via-blue-400 to-sky-300 bg-clip-text text-transparent">your next edge.</span>
        </h1>
        <p className="tf-rise tf-rise-delay-2 mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
          Trade Fusion brings together manual journaling, private saved setups, setup analytics, market context, replay practice, and peer discussion in one disciplined workflow.
        </p>
        <div className="tf-rise tf-rise-delay-3 mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href={appRoutes.journal} className="tf-cta-primary !bg-[oklch(0.66_0.18_250)] h-12 px-7 text-base font-semibold shadow-xl !shadow-blue-500/20 hover:!bg-[oklch(0.72_0.15_250)]">Get started free <ArrowRight className="ml-2 h-4 w-4" /></Link>
          <a href="#platform" className="tf-cta-secondary h-12 px-7 text-base">Explore platform <ChevronRight className="ml-1 h-4 w-4" /></a>
        </div>
        <div className="tf-rise tf-rise-delay-4 mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-slate-400 font-mono">
          <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Private neon database</span>
          <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Cross-device cloud sync</span>
          <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> ForexFactory live feed</span>
        </div>
        <WorkspacePreview />
      </section>

      <section id="platform" className="relative z-10 border-y border-white/[0.08] bg-[#050e1d] py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="tf-signal-chip inline-flex px-3 py-1 font-mono text-[9px] uppercase tracking-[0.22em] text-blue-200">What your workspace includes</p>
            <h2 className="mt-5 text-3xl font-semibold tracking-[-0.055em] text-white sm:text-5xl">Everything you need to build a more deliberate trading process.</h2>
            <p className="mt-5 text-base leading-7 text-slate-400">From the plan you test to the trade you review, every module has a distinct role inside one private trading workspace.</p>
          </div>

          <div className="mt-20 space-y-24 sm:mt-28 sm:space-y-32">
            {productSpotlights.map((spotlight, index) => (
              <article key={spotlight.key} className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
                <div className={`${index % 2 === 1 ? "lg:order-2" : ""} max-w-xl`}>
                  <div className={`grid h-12 w-12 place-items-center rounded-2xl border ${spotlight.accent === "emerald" ? "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-300" : spotlight.accent === "violet" ? "border-violet-400/20 bg-violet-400/[0.08] text-violet-300" : spotlight.accent === "sky" ? "border-sky-400/20 bg-sky-400/[0.08] text-sky-300" : "border-blue-400/20 bg-blue-400/[0.08] text-blue-300"}`}><spotlight.icon className="h-5 w-5" /></div>
                  <p className="mt-7 font-mono text-[10px] uppercase tracking-[0.22em] text-blue-300">{spotlight.eyebrow}</p>
                  <h3 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.055em] text-white sm:text-4xl">{spotlight.title}</h3>
                  <p className="mt-5 text-base leading-7 text-slate-400">{spotlight.description}</p>
                  <ul className="mt-7 space-y-3">
                    {spotlight.bullets.map((bullet) => <li key={bullet} className="flex items-start gap-3 text-sm text-slate-300"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-300" />{bullet}</li>)}
                  </ul>
                  <Link href={spotlight.href} className="mt-8 inline-flex items-center font-semibold text-blue-200 transition hover:text-white">{spotlight.action}<ArrowRight className="ml-2 h-4 w-4" /></Link>
                </div>
                <div className={index % 2 === 1 ? "lg:order-1" : ""}><SpotlightPreview kind={spotlight.key} /></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="workflow" className="relative z-10 border-b border-white/[0.08] bg-[#071327] py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="flex flex-col justify-between gap-7 rounded-[2rem] border border-blue-300/[0.15] bg-[linear-gradient(125deg,rgba(20,55,109,0.42),rgba(5,18,38,0.78))] p-7 sm:flex-row sm:items-center sm:p-10">
            <div className="max-w-2xl"><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-blue-300">One clear workflow</p><h2 className="mt-3 text-2xl font-semibold tracking-[-0.045em] text-white sm:text-3xl">Capture the execution. Review the pattern. Prepare the next decision.</h2><p className="mt-3 text-sm leading-6 text-slate-400">Your live journal, saved setups, and analytics remain private; Backtest stays a separate rehearsal space.</p></div>
            <Link href={appRoutes.journal} className="tf-cta-primary !bg-[oklch(0.66_0.18_250)] h-12 shrink-0 px-6 !shadow-blue-500/20 hover:!bg-[oklch(0.72_0.15_250)]">Build your workspace <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </div>
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

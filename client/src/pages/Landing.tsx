import { appRoutes } from "@/lib/appRoutes";
import { ArrowRight, BarChart3, CalendarDays, CheckCircle2, ChevronRight, Cloud, LockKeyhole, Menu, ScanLine, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

const features = [
  {
    icon: BarChart3,
    eyebrow: "Performance review",
    title: "See the signal in every trade.",
    text: "Turn executions into a focused review system with daily P&L, win rate, profit factor, and trade-level notes.",
  },
  {
    icon: Cloud,
    eyebrow: "Private cloud journal",
    title: "Pick up on any device.",
    text: "Your account keeps your journal separate from other traders and available wherever you sign in.",
  },
  {
    icon: CalendarDays,
    eyebrow: "Market context",
    title: "Know the macro schedule.",
    text: "Track live economic events in Eastern Time with impact levels and country identifiers before your next setup.",
  },
];

function Brand() {
  return (
    <div className="group flex items-center gap-2.5" aria-label="Trade Fusion">
      <div className="tf-monogram" aria-hidden="true">
        <span className="tf-monogram-t">T</span>
        <span className="tf-monogram-f">F</span>
        <span className="tf-monogram-up" />
        <span className="tf-monogram-down" />
      </div>
      <div className="leading-none">
        <p className="text-sm font-bold tracking-[-0.045em] text-white">TRADE<span className="text-[oklch(0.70_0.16_250)]">FUSION</span></p>
        <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.27em] text-slate-500">Trade journal</p>
      </div>
    </div>
  );
}

function WorkspacePreview() {
  return (
    <div className="relative mx-auto mt-14 max-w-6xl px-1 sm:px-4">
      <div className="pointer-events-none absolute inset-x-16 -top-10 h-44 rounded-full bg-blue-500/20 blur-[100px]" />
      <div className="tf-preview-shell relative overflow-hidden rounded-[1.6rem] border border-blue-200/[0.15] bg-[#08152b] p-2 shadow-[0_36px_95px_rgba(0,0,0,0.48)] sm:p-3">
        <div className="overflow-hidden rounded-[1.15rem] border border-white/[0.07] bg-[#0c1a31]">
          <div className="flex h-11 items-center justify-between border-b border-white/[0.07] px-4 sm:px-5">
            <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-red-400/80" /><span className="h-2 w-2 rounded-full bg-amber-300/80" /><span className="h-2 w-2 rounded-full bg-blue-400" /></div>
            <div className="rounded-full border border-blue-200/[0.12] bg-blue-400/[0.06] px-2.5 py-1 font-mono text-[8px] uppercase tracking-[0.16em] text-blue-200">Private workspace</div>
          </div>
          <div className="grid min-h-[340px] grid-cols-[145px_1fr] sm:min-h-[430px] sm:grid-cols-[190px_1fr]">
            <aside className="border-r border-white/[0.07] bg-[#09162a] p-3 sm:p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-white"><div className="relative grid h-6 w-6 place-items-center overflow-hidden rounded-lg bg-[#152746] ring-1 ring-blue-200/[0.14]"><span className="absolute h-4 w-px bg-red-400" /><span className="absolute top-1 h-3 w-[3px] rounded-[1px] bg-emerald-400" /><span className="absolute bottom-1 h-[3px] w-[3px] rounded-[1px] bg-red-400" /></div><span className="hidden sm:inline">TRADEFUSION</span></div>
              <div className="mt-7 space-y-2">
                <div className="rounded-lg border border-blue-300/[0.12] bg-blue-400/[0.13] px-2.5 py-2 text-[10px] font-medium text-white">Journal</div>
                <div className="px-2.5 py-2 text-[10px] text-slate-500">Market Calendar</div>
                <div className="px-2.5 py-2 text-[10px] text-slate-500">Account</div>
              </div>
              <div className="mt-10 rounded-lg border border-blue-200/[0.10] bg-blue-400/[0.05] p-2.5 text-[9px] leading-4 text-slate-500"><LockKeyhole className="mb-1.5 h-3 w-3 text-blue-300" /> Account-specific data</div>
            </aside>
            <div className="p-4 sm:p-6">
              <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-blue-300">Execution review</p>
              <div className="mt-2 flex items-end justify-between gap-3"><div><p className="text-lg font-semibold tracking-[-0.04em] text-white sm:text-2xl">Your trading, in context.</p><p className="mt-1 text-[10px] text-slate-500 sm:text-xs">One private workspace for the decisions you made.</p></div><div className="hidden rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 font-mono text-[8px] uppercase tracking-[0.14em] text-slate-400 sm:block">Today</div></div>
              <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
                {[
                  ["Net P&L", "+$1,842.50", "text-emerald-400"],
                  ["Win Rate", "67.8%", "text-blue-300"],
                  ["Total Trades", "36", "text-slate-200"],
                  ["Profit Factor", "1.84", "text-emerald-300"],
                ].map(([label, value, color]) => <div key={label} className="rounded-xl border border-blue-200/[0.09] bg-gradient-to-b from-[#14284b] to-[#10203b] p-2.5 sm:p-3"><p className="font-mono text-[7px] uppercase tracking-[0.14em] text-slate-500">{label}</p><p className={`mt-2 font-mono text-sm font-semibold sm:text-base ${color}`}>{value}</p></div>)}
              </div>
              <div className="mt-5 overflow-hidden rounded-xl border border-white/[0.07]">
                <div className="grid grid-cols-[1.2fr_1fr_0.8fr] border-b border-white/[0.07] bg-white/[0.025] px-3 py-2 font-mono text-[7px] uppercase tracking-[0.16em] text-slate-600 sm:px-4 sm:text-[8px]"><span>Session</span><span>Instrument</span><span>Result</span></div>
                {[
                  ["Aug 11 · NY", "EUR/USD", "+$420.00", "text-emerald-400"],
                  ["Aug 11 · London", "XAU/USD", "-$175.00", "text-red-400"],
                  ["Aug 10 · NY", "NAS100", "+$1,597.50", "text-emerald-400"],
                ].map(([session, instrument, result, color]) => <div key={`${session}-${instrument}`} className="grid grid-cols-[1.2fr_1fr_0.8fr] border-b border-white/[0.05] px-3 py-3 font-mono text-[9px] text-slate-400 last:border-0 sm:px-4 sm:text-[10px]"><span>{session}</span><span className="text-slate-300">{instrument}</span><span className={color}>{result}</span></div>)}
              </div>
            </div>
          </div>
        </div>
      </div>
      <p className="mt-4 text-center font-mono text-[9px] uppercase tracking-[0.18em] text-slate-600">Illustrative workspace preview · not live performance data</p>
    </div>
  );
}

export default function Landing() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <main className="min-h-screen overflow-hidden bg-[#061023] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_16%,oklch(0.58_0.18_250_/_0.23),transparent_26rem),radial-gradient(circle_at_6%_62%,oklch(0.36_0.14_245_/_0.17),transparent_27rem)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.10] [background-image:linear-gradient(oklch(0.8_0.02_250)_1px,transparent_1px),linear-gradient(90deg,oklch(0.8_0.02_250)_1px,transparent_1px)] [background-size:58px_58px]" />
      <header className="relative z-20 mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">
        <Brand />
        <nav className="hidden items-center gap-7 text-sm md:flex"><a className="tf-nav-link" href="#features">Features</a><a className="tf-nav-link" href="#how-it-works">How it works</a><a className="tf-nav-link" href="#security">Privacy</a></nav>
        <Link href={appRoutes.journal} className="tf-cta-primary hidden px-4 py-2.5 text-sm md:inline-flex">Get started <ArrowRight className="ml-2 h-4 w-4" /></Link>
        <button onClick={() => setMobileOpen((open) => !open)} className="grid h-10 w-10 place-items-center rounded-xl border border-white/[0.10] bg-white/[0.04] text-slate-300 md:hidden" aria-label="Toggle navigation">{mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}</button>
      </header>
      {mobileOpen && <div className="relative z-20 mx-5 rounded-2xl border border-white/[0.09] bg-[#0c1a31]/95 p-4 shadow-2xl backdrop-blur-xl md:hidden"><div className="grid gap-2 text-sm text-slate-300"><a href="#features" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2 hover:bg-white/[0.05]">Features</a><a href="#how-it-works" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2 hover:bg-white/[0.05]">How it works</a><Link href={appRoutes.journal} className="mt-2 inline-flex items-center justify-center rounded-xl bg-[oklch(0.66_0.18_250)] px-4 py-3 font-semibold text-white">Get started <ArrowRight className="ml-2 h-4 w-4" /></Link></div></div>}

      <section className="relative z-10 mx-auto max-w-7xl px-5 pb-20 pt-20 text-center sm:pb-28 sm:pt-24 lg:px-8 lg:pt-28">
        <div className="tf-signal-chip mx-auto inline-flex items-center gap-2 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-blue-200"><Sparkles className="h-3.5 w-3.5" /> A private trading review system</div>
        <h1 className="tf-rise tf-rise-delay-1 mx-auto mt-7 max-w-5xl text-4xl font-semibold tracking-[-0.065em] text-white sm:text-6xl lg:text-7xl">Turn every execution into <span className="bg-gradient-to-r from-blue-300 via-blue-400 to-sky-300 bg-clip-text text-transparent">your next edge.</span></h1>
        <p className="tf-rise tf-rise-delay-2 mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">Trade Fusion brings your journal, performance review, and economic calendar into one secure workspace built for deliberate traders.</p>
        <div className="tf-rise tf-rise-delay-3 mt-8 flex flex-col justify-center gap-3 sm:flex-row"><Link href={appRoutes.journal} className="tf-cta-primary h-12 px-6">Get started free <ArrowRight className="ml-2 h-4 w-4" /></Link><a href="#features" className="tf-cta-secondary h-12 px-6">Explore the workspace <ChevronRight className="ml-1 h-4 w-4" /></a></div>
        <div className="tf-rise tf-rise-delay-4 mt-7 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-slate-500"><span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-blue-300" />Private account workspace</span><span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-blue-300" />Cloud-synced journal</span><span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-blue-300" />Live market calendar</span></div>
        <WorkspacePreview />
      </section>

      <section id="features" className="relative z-10 border-y border-white/[0.07] bg-[#09162a]/70 py-20 backdrop-blur-sm sm:py-24"><div className="mx-auto max-w-7xl px-5 lg:px-8"><div className="max-w-xl"><p className="font-mono text-[10px] uppercase tracking-[0.22em] text-blue-300">Your review stack</p><h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl">A clearer way to improve the next decision.</h2></div><div className="mt-12 grid gap-4 md:grid-cols-3">{features.map((feature) => <article key={feature.title} className="rounded-2xl border border-blue-200/[0.10] bg-gradient-to-b from-[#13274a] to-[#0c1a31] p-6 shadow-[0_14px_30px_rgba(1,8,24,0.20)]"><div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-400/[0.10] text-blue-300"><feature.icon className="h-5 w-5" /></div><p className="mt-6 font-mono text-[9px] uppercase tracking-[0.18em] text-blue-300">{feature.eyebrow}</p><h3 className="mt-3 text-xl font-semibold tracking-[-0.04em] text-white">{feature.title}</h3><p className="mt-3 text-sm leading-6 text-slate-400">{feature.text}</p></article>)}</div></div></section>

      <section id="how-it-works" className="relative z-10 mx-auto grid max-w-7xl gap-10 px-5 py-20 sm:py-28 lg:grid-cols-[0.9fr_1.1fr] lg:px-8"><div><p className="font-mono text-[10px] uppercase tracking-[0.22em] text-blue-300">A disciplined loop</p><h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl">Log the trade. Study the pattern. Return prepared.</h2><p className="mt-5 max-w-lg text-sm leading-7 text-slate-400">Trade Fusion does not replace your decisions. It gives them a structure you can revisit, compare, and improve.</p></div><div className="space-y-3">{[["01","Capture","Record the execution while context is fresh."],["02","Review","Use daily performance signals to see what changed."],["03","Prepare","Check the macro calendar before the next setup."]].map(([number, title, text]) => <div key={number} className="flex gap-5 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5"><span className="font-mono text-xs text-blue-300">{number}</span><div><h3 className="font-semibold text-white">{title}</h3><p className="mt-1.5 text-sm text-slate-500">{text}</p></div></div>)}</div></section>

      <section id="security" className="relative z-10 px-5 pb-20 sm:pb-28 lg:px-8"><div className="mx-auto max-w-7xl overflow-hidden rounded-[1.6rem] border border-blue-300/[0.15] bg-[radial-gradient(circle_at_18%_0%,oklch(0.55_0.16_250_/_0.25),transparent_32rem),linear-gradient(135deg,#102a54,#0b1930_56%,#08162a)] p-8 sm:p-12"><div className="max-w-2xl"><ScanLine className="h-6 w-6 text-blue-200" /><p className="mt-6 font-mono text-[10px] uppercase tracking-[0.20em] text-blue-200">Built around your account</p><h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl">Your journal is yours.</h2><p className="mt-4 max-w-xl text-sm leading-7 text-blue-100/70">Sign in once, then access the same private workspace on the devices where you trade and review.</p><Link href={appRoutes.journal} className="mt-8 inline-flex h-11 items-center rounded-xl bg-white px-5 text-sm font-semibold text-[#0b1b34] transition hover:bg-blue-50">Open Trade Fusion <ArrowRight className="ml-2 h-4 w-4" /></Link></div></div></section>

      <footer className="relative z-10 border-t border-white/[0.07] px-5 py-8 lg:px-8"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 text-xs text-slate-600 sm:flex-row sm:items-center"><Brand /><p>Trade Fusion · Private trading review workspace</p></div></footer>
    </main>
  );
}

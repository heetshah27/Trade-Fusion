import { dashboardReveal, previewPanelReveal, shouldRunLandingMotion } from "@/lib/landingMotion";
import { appRoutes } from "@/lib/appRoutes";
import { ArrowRight, BarChart3, BookOpenCheck, CalendarDays, CheckCircle2, ChevronRight, Cloud, Crosshair, Globe2, Layers3, LockKeyhole, Mail, Menu, MessageSquare, ScanLine, Send, ShieldCheck, Sparkles, Target, TrendingUp, UserRound, X } from "lucide-react";
import { motion, useInView, useReducedMotion, useScroll, useTransform } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { TradeFusionBrand, TradeFusionMark } from "@/components/TradeFusionBrand";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

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

const frequentlyAskedQuestions = [
  {
    question: "What is Trade Fusion?",
    answer: "Trade Fusion is a private trading-performance workspace for recording live executions, reviewing the decision behind them, organizing setups, studying analytics, and rehearsing ideas in a separate Backtest environment.",
  },
  {
    question: "Is my data private?",
    answer: "Yes. Live trades, Journal notes, saved setups, screenshots, and analytics are scoped to your authenticated account. Trader’s Room discussions are separate, and nothing from your private journal is shared there automatically.",
  },
  {
    question: "How do I log a trade?",
    answer: "Open Trades, choose an instrument from the visual picker or enter a custom symbol, then record direction, size, entry, exit, fees, setup context, and the final result. The assisted P&L calculator can help with supported instruments, while manual adjustments remain available.",
  },
  {
    question: "How does Backtest work?",
    answer: "Backtest is a Trade Fusion Pro replay workspace for reviewing source-backed historical markets, marking levels or zones, and simulating entries and exits. Simulated trades remain separate from your live Journal and Setup Analytics results.",
  },
  {
    question: "Which markets can I record?",
    answer: "You can record the listed Forex, Metals, Crypto, Indices, Energy, and Equity instruments, or enter a custom symbol. The visual picker also recognizes familiar searches such as gold, bitcoin, cable, and crude.",
  },
  {
    question: "How does the Market Calendar work?",
    answer: "The calendar displays source-published economic events with impact context and U.S. Eastern Time formatting. It clearly indicates when source coverage or refreshed data is unavailable rather than presenting invented events.",
  },
  {
    question: "Can I attach chart screenshots to a Journal entry?",
    answer: "Yes. Each private Journal entry can include up to four supported chart screenshots. Attachments stay with your account and are not shared to Trader’s Room, Analytics, or Backtest.",
  },
  {
    question: "Does Trade Fusion sync with MT5 or a broker?",
    answer: "Manual logging is available today. Direct broker or MT5/VPS synchronization is planned for a future phase and is not currently required to use the private journal, review tools, or Backtest workspace.",
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
    action: "Explore Pro Backtest",
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

const mobileLandingSections = [
  { id: "start", label: "Start" },
  { id: "platform", label: "Platform" },
  { id: "workflow", label: "Workflow" },
  { id: "pricing", label: "Pricing" },
  { id: "security", label: "Privacy" },
  { id: "contact", label: "Contact" },
  { id: "faq", label: "FAQ" },
] as const;

type MobileLandingSectionId = (typeof mobileLandingSections)[number]["id"];

function Brand() {
  return <TradeFusionBrand />;
}

function LandingScrollCompass() {
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();

  if (reducedMotion) return null;

  return (
    <div aria-hidden="true" className="tf-scroll-compass pointer-events-none fixed bottom-7 right-7 z-40 hidden h-12 w-12 place-items-center rounded-2xl border border-blue-200/[0.14] xl:grid">
      <svg viewBox="0 0 42 42" className="h-8 w-8 -rotate-90">
        <circle cx="21" cy="21" r="16" fill="none" stroke="rgba(148,163,184,0.18)" strokeWidth="2.3" />
        <motion.circle cx="21" cy="21" r="16" fill="none" stroke="rgb(96 165 250)" strokeWidth="2.3" strokeLinecap="round" pathLength={scrollYProgress} />
      </svg>
      <span className="absolute font-mono text-[7px] tracking-[0.14em] text-blue-100">TF</span>
    </div>
  );
}

function MobileSectionProgress() {
  const [activeSection, setActiveSection] = useState<MobileLandingSectionId>("start");
  const [isOpen, setIsOpen] = useState(false);
  const activeIndex = mobileLandingSections.findIndex(section => section.id === activeSection);
  const activeLabel = mobileLandingSections[activeIndex]?.label ?? "Start";
  const progress = (activeIndex + 1) / mobileLandingSections.length;

  useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting).sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];
      if (visible?.target.id) setActiveSection(visible.target.id as MobileLandingSectionId);
    }, { rootMargin: "-36% 0px -52% 0px", threshold: [0.12, 0.35, 0.6] });

    mobileLandingSections.forEach(section => {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <aside className="fixed inset-x-0 bottom-4 z-40 px-4 md:hidden" aria-label="Landing page section progress" data-testid="mobile-section-progress">
      <div className="mx-auto max-w-sm">
        <div className="tf-mobile-section-progress relative overflow-hidden rounded-2xl border border-blue-200/[0.14] px-4 py-3 shadow-2xl backdrop-blur-xl">
          <button type="button" aria-expanded={isOpen} aria-controls="mobile-section-shortcuts" aria-label={`Current section: ${activeLabel}. Open section navigation.`} onClick={() => setIsOpen(open => !open)} className="flex w-full items-center gap-3 text-left">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-blue-200/[0.13] bg-blue-400/[0.10] font-mono text-[9px] text-blue-100">{String(activeIndex + 1).padStart(2, "0")}</span>
            <span className="min-w-0 flex-1"><span className="block font-mono text-[8px] uppercase tracking-[0.16em] text-slate-500">Landing progress</span><span className="mt-0.5 block truncate text-xs font-semibold text-slate-100">{activeLabel}</span></span>
            <span className={`font-mono text-[10px] text-blue-200 transition-transform duration-200 ${isOpen ? "rotate-45" : ""}`}>+</span>
          </button>
          <div className="mt-3 h-px overflow-hidden bg-white/[0.09]"><span className="block h-full origin-left bg-gradient-to-r from-blue-400 via-sky-300 to-emerald-300 transition-transform duration-200" style={{ transform: `scaleX(${progress})` }} /></div>
          {isOpen && <nav id="mobile-section-shortcuts" className="tf-mobile-section-shortcuts mt-3 grid grid-cols-2 gap-1.5 border-t border-white/[0.08] pt-3" aria-label="Landing section shortcuts">{mobileLandingSections.map((section, index) => <a key={section.id} href={`#${section.id}`} aria-current={section.id === activeSection ? "location" : undefined} onClick={() => setIsOpen(false)} className={`rounded-lg px-2.5 py-2 font-mono text-[9px] uppercase tracking-[0.1em] transition ${section.id === activeSection ? "bg-blue-400/[0.13] text-blue-100" : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-100"}`}><span className="mr-1.5 text-slate-600">{String(index + 1).padStart(2, "0")}</span>{section.label}</a>)}</nav>}
        </div>
      </div>
    </aside>
  );
}

type ProductSpotlight = (typeof productSpotlights)[number];

function ScrollSpotlight({ spotlight, index }: { spotlight: ProductSpotlight; index: number }) {
  const spotlightRef = useRef<HTMLElement>(null);
  const inView = useInView(spotlightRef, { amount: 0.24 });
  const reducedMotion = useReducedMotion();
  const shouldAnimate = shouldRunLandingMotion(reducedMotion, inView);
  const { scrollYProgress } = useScroll({ target: spotlightRef, offset: ["start end", "end start"] });
  const previewY = useTransform(scrollYProgress, [0, 0.5, 1], reducedMotion ? [0, 0, 0] : [42, 0, -34]);
  const previewScale = useTransform(scrollYProgress, [0, 0.5, 1], reducedMotion ? [1, 1, 1] : [0.965, 1, 0.98]);
  const copyY = useTransform(scrollYProgress, [0, 0.5, 1], reducedMotion ? [0, 0, 0] : [16, 0, -12]);
  const direction = index % 2 === 0 ? 1 : -1;

  return (
    <motion.article
      ref={spotlightRef}
      data-testid="scroll-linked-spotlight"
      className="relative grid items-center gap-10 lg:grid-cols-2 lg:gap-16"
      initial={reducedMotion ? false : { opacity: 0, y: 30 }}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.62, ease: [0.23, 1, 0.32, 1] }}
    >
      <motion.div
        style={{ y: copyY }}
        className={`${index % 2 === 1 ? "lg:order-2" : ""} max-w-xl`}
        initial={reducedMotion ? false : { opacity: 0, x: -24 * direction }}
        animate={shouldAnimate ? { opacity: 1, x: 0 } : undefined}
        transition={{ duration: 0.58, delay: 0.06, ease: [0.23, 1, 0.32, 1] }}
      >
        <div className={`grid h-12 w-12 place-items-center rounded-2xl border ${spotlight.accent === "emerald" ? "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-300" : spotlight.accent === "violet" ? "border-violet-400/20 bg-violet-400/[0.08] text-violet-300" : spotlight.accent === "sky" ? "border-sky-400/20 bg-sky-400/[0.08] text-sky-300" : "border-blue-400/20 bg-blue-400/[0.08] text-blue-300"}`}><spotlight.icon className="h-5 w-5" /></div>
        <p className="mt-7 font-mono text-[10px] uppercase tracking-[0.22em] text-blue-300">{spotlight.eyebrow}</p>
        <h3 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.055em] text-white sm:text-4xl">{spotlight.title}</h3>
        <p className="mt-5 text-base leading-7 text-slate-400">{spotlight.description}</p>
        <ul className="mt-7 space-y-3">
          {spotlight.bullets.map((bullet) => <li key={bullet} className="flex items-start gap-3 text-sm text-slate-300"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-300" />{bullet}</li>)}
        </ul>
        <Link href={spotlight.href} className="mt-8 inline-flex items-center font-semibold text-blue-200 transition hover:text-white">{spotlight.action}<ArrowRight className="ml-2 h-4 w-4" /></Link>
      </motion.div>
      <motion.div
        style={{ y: previewY, scale: previewScale }}
        className={index % 2 === 1 ? "lg:order-1" : ""}
        initial={reducedMotion ? false : { opacity: 0, x: 30 * direction }}
        animate={shouldAnimate ? { opacity: 1, x: 0 } : undefined}
        transition={{ duration: 0.68, delay: 0.12, ease: [0.23, 1, 0.32, 1] }}
      >
        <SpotlightPreview kind={spotlight.key} />
      </motion.div>
    </motion.article>
  );
}

function WorkspacePreview() {
  const [activeTab, setActiveTab] = useState<"journal" | "calendar" | "room" | "backtest">("journal");
  const previewRef = useRef<HTMLDivElement>(null);
  const inView = useInView(previewRef, { once: true, amount: 0.22 });
  const reducedMotion = useReducedMotion();
  const shouldAnimate = shouldRunLandingMotion(reducedMotion, inView);
  const { scrollYProgress } = useScroll({ target: previewRef, offset: ["start end", "end start"] });
  const previewY = useTransform(scrollYProgress, [0, 0.5, 1], reducedMotion ? [0, 0, 0] : [34, 0, -28]);
  const previewScale = useTransform(scrollYProgress, [0, 0.5, 1], reducedMotion ? [1, 1, 1] : [0.975, 1, 0.985]);

  const updateLaptopTilt = (event: React.PointerEvent<HTMLDivElement>) => {
    if (reducedMotion || event.pointerType === "touch" || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const frame = event.currentTarget;
    const bounds = frame.getBoundingClientRect();
    const horizontal = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
    const vertical = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
    frame.style.setProperty("--tf-tilt-x", `${Math.max(-2.4, Math.min(2.4, -vertical * 2.4)).toFixed(2)}deg`);
    frame.style.setProperty("--tf-tilt-y", `${Math.max(-3.2, Math.min(3.2, horizontal * 3.2)).toFixed(2)}deg`);
    frame.style.setProperty("--tf-pointer-x", `${Math.round(((event.clientX - bounds.left) / bounds.width) * 100)}%`);
    frame.style.setProperty("--tf-pointer-y", `${Math.round(((event.clientY - bounds.top) / bounds.height) * 100)}%`);
    frame.dataset.tiltActive = "true";
  };

  const resetLaptopTilt = (event: React.PointerEvent<HTMLDivElement>) => {
    const frame = event.currentTarget;
    frame.style.removeProperty("--tf-tilt-x");
    frame.style.removeProperty("--tf-tilt-y");
    frame.style.removeProperty("--tf-pointer-x");
    frame.style.removeProperty("--tf-pointer-y");
    delete frame.dataset.tiltActive;
  };

  return (
    <motion.div
      ref={previewRef}
      className="tf-laptop-reveal relative mx-auto mt-16 max-w-6xl px-1 sm:mt-20 sm:px-4"
      initial={reducedMotion ? false : dashboardReveal.hidden}
      animate={shouldAnimate ? dashboardReveal.visible : undefined}
      transition={{ duration: 0.78, ease: [0.23, 1, 0.32, 1] }}
    >
      <motion.div style={{ y: previewY, scale: previewScale }} data-testid="scroll-linked-workspace-preview">
      <div className="tf-laptop-stage relative" data-testid="workspace-preview-laptop" data-tilt-interactive="desktop-only" onPointerMove={updateLaptopTilt} onPointerLeave={resetLaptopTilt}>
      <div className="pointer-events-none absolute inset-x-16 -top-10 h-44 rounded-full bg-blue-500/25 blur-[110px]" />
      <div className="tf-laptop-lid relative">
      <div aria-hidden="true" className="tf-laptop-camera"><span /></div>
      <div className="tf-preview-shell tf-laptop-screen relative overflow-hidden rounded-[1.8rem] border border-blue-200/[0.20] bg-[#071328] p-2.5 shadow-[0_40px_100px_rgba(0,0,0,0.6)] sm:p-4">
        <span aria-hidden="true" data-testid="laptop-screen-reflection" className="tf-laptop-reflection" />
        <div className="overflow-hidden rounded-[1.3rem] border border-white/[0.09] bg-[#0b1830]">
          {/* Top Bar with Interactive Tab Switcher */}
          <div className="flex flex-col gap-2.5 border-b border-white/[0.08] px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-6">
            <div className="hidden items-center gap-2.5 sm:flex">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.16em] text-slate-400">Trade Fusion workspace preview</span>
            </div>
            <div className="grid w-full grid-cols-2 gap-1 rounded-xl border border-white/[0.08] bg-white/[0.03] p-1 sm:flex sm:w-auto sm:items-center sm:gap-1.5">
              <button
                onClick={() => setActiveTab("journal")}
                aria-pressed={activeTab === "journal"}
                className={`min-w-0 rounded-lg px-2 py-1.5 font-mono text-[9px] uppercase tracking-[0.08em] transition sm:px-3 sm:py-1 sm:text-[10px] sm:tracking-[0.12em] ${activeTab === "journal" ? "bg-[oklch(0.66_0.18_250)] text-white shadow-md" : "text-slate-400 hover:text-white"}`}
              >
                Journal
              </button>
              <button
                onClick={() => setActiveTab("calendar")}
                aria-pressed={activeTab === "calendar"}
                className={`min-w-0 rounded-lg px-2 py-1.5 font-mono text-[9px] uppercase tracking-[0.08em] transition sm:px-3 sm:py-1 sm:text-[10px] sm:tracking-[0.12em] ${activeTab === "calendar" ? "bg-[oklch(0.66_0.18_250)] text-white shadow-md" : "text-slate-400 hover:text-white"}`}
              >
                Calendar
              </button>
              <button
                onClick={() => setActiveTab("backtest")}
                aria-pressed={activeTab === "backtest"}
                className={`min-w-0 rounded-lg px-2 py-1.5 font-mono text-[9px] uppercase tracking-[0.08em] transition sm:px-3 sm:py-1 sm:text-[10px] sm:tracking-[0.12em] ${activeTab === "backtest" ? "bg-[oklch(0.66_0.18_250)] text-white shadow-md" : "text-slate-400 hover:text-white"}`}
              >
                Backtest
              </button>
              <button
                onClick={() => setActiveTab("room")}
                aria-pressed={activeTab === "room"}
                className={`min-w-0 rounded-lg px-2 py-1.5 font-mono text-[9px] uppercase tracking-[0.08em] transition sm:px-3 sm:py-1 sm:text-[10px] sm:tracking-[0.12em] ${activeTab === "room" ? "bg-[oklch(0.66_0.18_250)] text-white shadow-md" : "text-slate-400 hover:text-white"}`}
              >
                Trader’s Room
              </button>
            </div>
          </div>

          <div className="min-h-[380px] md:grid md:grid-cols-[210px_minmax(0,1fr)] md:min-h-[460px]">
            {/* Sidebar */}
            <aside className="hidden border-r border-white/[0.08] bg-[#071326] p-5 md:block">
              <div className="flex items-center gap-2.5 text-xs font-semibold text-white">
                <TradeFusionMark size="small" />
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
                  onClick={() => setActiveTab("backtest")}
                  className={`w-full text-left rounded-xl border px-3 py-2.5 text-xs font-medium transition ${activeTab === "backtest" ? "border-blue-300/30 bg-blue-500/15 text-white" : "border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200"}`}
                >
                  Backtest Lab
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
            <motion.div key={activeTab} data-testid="workspace-preview-tab-panel" className="min-w-0 p-4 sm:p-6 md:p-7" initial={reducedMotion ? false : previewPanelReveal.hidden} animate={reducedMotion ? undefined : previewPanelReveal.visible} transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}>
              {activeTab === "journal" && (
                <div className="space-y-5 sm:space-y-6">
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
                    <div className="hidden grid-cols-[1.2fr_1fr_1fr_0.8fr] border-b border-white/[0.08] bg-white/[0.03] px-4 py-2.5 font-mono text-[8px] uppercase tracking-[0.18em] text-slate-400 sm:grid">
                      <span>Session</span><span>Instrument</span><span>Setup</span><span>Net Result</span>
                    </div>
                    {[
                      ["New York · Open", "EUR/USD", "Breakout Retest", "+$1,420.00", "text-emerald-400"],
                      ["London · Morning", "XAU/USD", "Liquidity Sweep", "+$895.50", "text-emerald-400"],
                      ["New York · Power Hour", "NAS100", "Trend Continuation", "-$310.00", "text-red-400"],
                    ].map(([session, inst, setup, res, color]) => (
                      <div key={`${session}-${inst}`} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-white/[0.05] px-3 py-3 font-mono text-xs text-slate-300 last:border-0 hover:bg-white/[0.02] sm:grid-cols-[1.2fr_1fr_1fr_0.8fr] sm:px-4 sm:py-3.5">
                        <span className="min-w-0 sm:text-slate-400"><span className="block truncate font-semibold text-white sm:hidden">{inst}</span><span className="block truncate text-slate-400">{session}</span><span className="mt-0.5 block truncate text-[10px] text-slate-500 sm:hidden">{setup}</span></span>
                        <span className="hidden font-semibold text-white sm:block">{inst}</span>
                        <span className="hidden text-slate-400 sm:block">{setup}</span>
                        <span className={`text-right font-bold ${color}`}>{res}</span>
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

              {activeTab === "backtest" && (
                <div className="space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[oklch(0.70_0.16_250)]">Private Replay Workspace</p>
                      <h3 className="text-xl font-semibold tracking-[-0.03em] text-white sm:text-2xl">Backtest Lab · XAU/USD</h3>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1 font-mono text-[10px] text-blue-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-300" /> SIMULATED
                    </span>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_155px]">
                    <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#071225]">
                      <div className="flex items-center justify-between border-b border-white/[0.07] bg-white/[0.025] px-4 py-2.5">
                        <div className="flex items-center gap-2.5 font-mono text-[9px] text-slate-400">
                          <span className="font-semibold text-white">XAU/USD</span><span>15m</span><span>Historical replay</span>
                        </div>
                        <span className="font-mono text-[9px] text-emerald-300">2,384.62</span>
                      </div>
                      <div className="relative h-[180px] overflow-hidden sm:h-[215px]">
                        <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:linear-gradient(#315a8b_1px,transparent_1px),linear-gradient(90deg,#315a8b_1px,transparent_1px)] [background-size:44px_36px]" />
                        <div className="absolute left-[38%] top-[26%] h-[38%] w-[27%] border border-blue-300/70 bg-blue-500/10">
                          <span className="absolute -left-1 -top-1 h-2 w-2 rounded-full border border-white/60 bg-blue-300" />
                          <span className="absolute -right-1 -bottom-1 h-2 w-2 rounded-full border border-white/60 bg-blue-300" />
                          <span className="absolute -top-5 left-0 font-mono text-[8px] uppercase tracking-wider text-blue-200">Demand zone</span>
                        </div>
                        <svg viewBox="0 0 640 270" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-label="Illustrative simulated XAU/USD candlestick replay chart">
                          <g strokeWidth="2">
                            <path d="M35 166V114M35 128V146M72 177V123M72 139V160M109 152V87M109 102V132M146 139V95M146 108V124M183 172V112M183 125V154M220 146V69M220 88V128M257 128V75M257 90V113M294 161V108M294 122V145M331 144V82M331 95V130M368 117V58M368 72V101M405 133V78M405 92V117M442 183V111M442 128V168M479 154V97M479 110V138M516 128V60M516 76V111M553 112V47M553 65V95M590 126V79M590 94V110" stroke="#8aa7ce" opacity="0.92" />
                            <g fill="#34d399"><rect x="27" y="128" width="16" height="18" rx="1" /><rect x="101" y="102" width="16" height="30" rx="1" /><rect x="212" y="88" width="16" height="40" rx="1" /><rect x="360" y="72" width="16" height="29" rx="1" /><rect x="508" y="76" width="16" height="35" rx="1" /><rect x="545" y="65" width="16" height="30" rx="1" /></g>
                            <g fill="#fb7185"><rect x="64" y="139" width="16" height="21" rx="1" /><rect x="138" y="108" width="16" height="16" rx="1" /><rect x="175" y="125" width="16" height="29" rx="1" /><rect x="249" y="90" width="16" height="23" rx="1" /><rect x="286" y="122" width="16" height="23" rx="1" /><rect x="397" y="92" width="16" height="25" rx="1" /><rect x="434" y="128" width="16" height="40" rx="1" /><rect x="471" y="110" width="16" height="28" rx="1" /><rect x="582" y="94" width="16" height="16" rx="1" /></g>
                          </g>
                          <path d="M0 147 C80 159 120 112 180 134 S285 149 335 103 S430 108 485 92 S565 112 640 75" fill="none" stroke="#60a5fa" strokeWidth="2.5" opacity="0.8" />
                          <line x1="0" y1="121" x2="640" y2="121" stroke="#34d399" strokeWidth="1.5" strokeDasharray="6 6" opacity="0.75" />
                        </svg>
                        <div className="absolute bottom-3 left-3 rounded-lg border border-emerald-400/25 bg-[#071225]/90 px-2 py-1 font-mono text-[8px] text-emerald-300">ENTRY 2,381.20</div>
                        <div className="absolute right-3 top-3 rounded-lg border border-white/[0.1] bg-[#071225]/90 px-2 py-1 font-mono text-[8px] text-slate-400">Replay 58%</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
                      <div className="rounded-2xl border border-white/[0.08] bg-[#09152b] p-3.5">
                        <p className="font-mono text-[8px] uppercase tracking-[0.15em] text-slate-500">Position plan</p>
                        <p className="mt-2 font-mono text-sm font-semibold text-white">0.10 lots</p>
                        <p className="mt-1 font-mono text-[9px] text-slate-500">Risk: 0.50%</p>
                      </div>
                      <div className="rounded-2xl border border-white/[0.08] bg-[#09152b] p-3.5">
                        <p className="font-mono text-[8px] uppercase tracking-[0.15em] text-slate-500">Chart tools</p>
                        <div className="mt-2 flex gap-1.5"><span className="rounded-md bg-blue-500/15 px-2 py-1 font-mono text-[8px] text-blue-200">ZONE</span><span className="rounded-md bg-white/[0.06] px-2 py-1 font-mono text-[8px] text-slate-400">LINE</span></div>
                      </div>
                      <div className="col-span-2 flex gap-2 lg:col-span-1"><span className="flex-1 rounded-lg bg-red-500/15 px-2 py-2 text-center font-mono text-[9px] font-semibold text-red-300">SELL</span><span className="flex-1 rounded-lg bg-blue-500/15 px-2 py-2 text-center font-mono text-[9px] font-semibold text-blue-200">BUY</span></div>
                    </div>
                  </div>

                  <p className="rounded-xl border border-blue-300/10 bg-blue-400/[0.05] px-3 py-2.5 font-mono text-[9px] leading-relaxed text-slate-400">Backtest sessions, zones, and simulated entries are private practice data. They do not contribute to your live Journal or Setup Analytics performance.</p>
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
            </motion.div>
          </div>
        </div>
      </div>
      </div>
      <div aria-hidden="true" className="tf-laptop-hinge" />
      <div aria-hidden="true" className="tf-laptop-base"><div className="tf-laptop-trackpad" /></div>
      </div>
      </motion.div>
      <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">Interactive Trade Fusion workspace preview · Click tabs to explore Journal, Calendar, Backtest, and Trader’s Room</p>
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
            <div className="flex items-center gap-2.5"><TradeFusionMark size="small" /><span className="font-mono text-[9px] uppercase tracking-[0.16em] text-slate-400">Trade Fusion / {navLabel}</span></div>
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
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "", website: "" });
  const { data: tickerData } = trpc.ticker.quotes.useQuery(undefined, {
    refetchInterval: 6_000,
    refetchIntervalInBackground: true,
  });
  const tickers = tickerData?.items ?? fallbackTickers;
  const contactSubmit = trpc.contact.submit.useMutation({
    onSuccess: () => setContactForm({ name: "", email: "", message: "", website: "" }),
  });

  const submitContact = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    contactSubmit.mutate(contactForm);
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#061023] text-white">
      <LandingScrollCompass />
      <MobileSectionProgress />
      {/* Live Market Ticker Tape with Automatic Marquee */}
      <div className="relative z-30 border-b border-white/[0.08] bg-[#050d1a] py-2.5 overflow-hidden">
        <div className="mx-auto max-w-7xl overflow-hidden px-4 whitespace-nowrap lg:px-8">
          <div className="relative w-full overflow-hidden">
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

      <div aria-hidden="true" className="tf-hero-deep-space pointer-events-none absolute inset-0" />
      <div aria-hidden="true" className="tf-hero-grid pointer-events-none absolute inset-0" />
      <div aria-hidden="true" className="tf-hero-orbit tf-hero-orbit-left pointer-events-none absolute" />
      <div aria-hidden="true" className="tf-hero-orbit tf-hero-orbit-right pointer-events-none absolute" />

      <header className="relative z-20 mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">
        <Brand />
        <nav className="hidden items-center gap-8 text-sm md:flex">
          <a className="tf-nav-link text-slate-300 hover:text-white transition" href="#platform">Platform</a>
          <a className="tf-nav-link text-slate-300 hover:text-white transition" href="#workflow">Workflow</a>
          <a className="tf-nav-link text-slate-300 hover:text-white transition" href="#pricing">Pricing</a>
          <a className="tf-nav-link text-slate-300 hover:text-white transition" href="#faq">FAQ</a>
          <a className="tf-nav-link text-slate-300 hover:text-white transition" href="#contact">Contact</a>
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
            <a href="#pricing" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2 hover:bg-white/[0.05]">Pricing</a>
            <a href="#faq" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2 hover:bg-white/[0.05]">FAQ</a>
            <a href="#contact" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2 hover:bg-white/[0.05]">Contact</a>
            <Link href={appRoutes.journal} className="mt-2 inline-flex items-center justify-center rounded-xl bg-[oklch(0.66_0.18_250)] px-4 py-3 font-semibold text-white">Get started <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </div>
        </div>
      )}

      <section id="start" data-testid="cinematic-hero" className="tf-cinematic-hero relative z-10 mx-auto max-w-7xl px-5 pb-24 pt-20 text-center sm:pb-32 sm:pt-28 lg:px-8 lg:pt-32">
        <div className="tf-cinematic-copy relative mx-auto">
        <p className="tf-rise font-mono text-[9px] uppercase tracking-[0.3em] text-blue-200/80 sm:text-[10px]">Private performance workspace</p>
        <h1 className="tf-rise tf-rise-delay-1 mx-auto mt-5 max-w-5xl text-4xl font-semibold tracking-[-0.065em] text-white sm:text-6xl lg:text-7xl">
          Turn every execution into <span className="bg-gradient-to-r from-blue-300 via-blue-400 to-sky-300 bg-clip-text text-transparent">your next edge.</span>
        </h1>
        <p className="tf-rise tf-rise-delay-2 mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
          Trade Fusion brings together manual journaling, private saved setups, setup analytics, market context, replay practice, and peer discussion in one disciplined workflow.
        </p>
        <div className="tf-rise tf-rise-delay-3 mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href={appRoutes.journal} className="tf-cta-primary !bg-[oklch(0.66_0.18_250)] h-12 px-7 text-base font-semibold shadow-xl !shadow-blue-500/20 hover:!bg-[oklch(0.72_0.15_250)]">Get started free <ArrowRight className="ml-2 h-4 w-4" /></Link>
          <a href="#platform" className="tf-cta-secondary h-12 px-7 text-base">Explore platform <ChevronRight className="ml-1 h-4 w-4" /></a>
        </div>
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
            {productSpotlights.map((spotlight, index) => <ScrollSpotlight key={spotlight.key} spotlight={spotlight} index={index} />)}
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

      <section id="pricing" className="relative z-10 overflow-hidden border-b border-white/[0.08] bg-[#050e1d] px-5 py-20 sm:py-28 lg:px-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(139,92,246,0.18),transparent_24rem),radial-gradient(circle_at_15%_75%,rgba(14,165,233,0.12),transparent_26rem)]" />
        <div className="relative mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="tf-signal-chip inline-flex px-3 py-1 font-mono text-[9px] uppercase tracking-[0.22em] text-blue-200">Simple, focused access</p>
            <h2 className="mt-5 text-3xl font-semibold tracking-[-0.055em] text-white sm:text-5xl">Start with the journal. Upgrade when you are ready to rehearse the plan.</h2>
            <p className="mt-5 text-base leading-7 text-slate-400">Every member gets a private core workspace. Pro removes usage limits and opens the dedicated Backtest lab without mixing simulations into live performance.</p>
          </div>

          <div className="mt-12 grid gap-5 lg:grid-cols-2">
            <article className="tf-hover-lift rounded-[1.75rem] border border-white/[0.10] bg-[linear-gradient(150deg,rgba(17,35,62,0.92),rgba(6,15,29,0.92))] p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4"><div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-400">Free</p><h3 className="mt-3 text-2xl font-semibold text-white">Build the review habit.</h3></div><span className="rounded-full border border-slate-300/15 bg-white/[0.05] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-slate-300">$0</span></div>
              <p className="mt-5 max-w-md text-sm leading-6 text-slate-400">A structured starting point for documenting real decisions and participating in the member community.</p>
              <ul className="mt-7 grid gap-3 text-sm text-slate-200"><li className="flex gap-3"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />Up to 15 new live trades per calendar month</li><li className="flex gap-3"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />Private Journal entries linked to eligible trades</li><li className="flex gap-3"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />Market Calendar and Setup Analytics</li><li className="flex gap-3"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />Up to 10 new Trader’s Room threads per month; replies remain open</li></ul>
              <Link href={appRoutes.journal} className="tf-press mt-8 inline-flex h-11 items-center rounded-xl border border-white/[0.14] px-5 text-sm font-semibold text-slate-100 transition hover:bg-white/[0.06]">Get started free <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </article>

            <article className="tf-pro-plan relative overflow-hidden rounded-[1.75rem] border border-violet-300/35 bg-[radial-gradient(circle_at_top_right,rgba(167,139,250,0.24),transparent_38%),linear-gradient(150deg,rgba(30,32,71,0.98),rgba(9,15,34,0.98))] p-6 shadow-[0_20px_70px_rgba(99,102,241,0.18)] sm:p-8">
              <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-violet-300/20 blur-3xl" />
              <div className="relative flex items-start justify-between gap-4"><div><div className="inline-flex items-center gap-1.5 rounded-full border border-violet-200/25 bg-violet-300/10 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-violet-100"><Sparkles className="h-3 w-3" /> Pro</div><h3 className="mt-3 text-2xl font-semibold text-white">Rehearse with more conviction.</h3></div><div className="text-right"><p className="text-3xl font-semibold tracking-[-0.05em] text-white">$10</p><p className="mt-1 font-mono text-[9px] uppercase tracking-[0.14em] text-violet-200">USD / month</p></div></div>
              <p className="relative mt-5 max-w-md text-sm leading-6 text-slate-300">Unlimited private review and the full Backtest workspace for building and testing a repeatable strategy process.</p>
              <ul className="relative mt-7 grid gap-3 text-sm text-white"><li className="flex gap-3"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-violet-200" />Unlimited manual trades and private Journal entries</li><li className="flex gap-3"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-violet-200" />Unlimited Trader’s Room threads and replies</li><li className="flex gap-3"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-violet-200" />Full Backtest replay, drawings, simulated execution, and snapshots</li><li className="flex gap-3"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-violet-200" />One 7-day trial with a card required; cancel before renewal</li></ul>
              <Link href={appRoutes.account} className="tf-press relative mt-8 inline-flex h-11 items-center rounded-xl bg-violet-300 px-5 text-sm font-semibold text-slate-950 shadow-[0_12px_28px_rgba(167,139,250,0.25)] transition hover:bg-violet-200">Start 7-day Pro trial <ArrowRight className="ml-2 h-4 w-4" /></Link>
              <p className="relative mt-4 text-xs leading-5 text-slate-400">Monthly billing only. No annual plan at launch. Payments are non-refundable for unused time, except where applicable law requires otherwise.</p>
            </article>
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

      <section id="contact" className="relative z-10 border-y border-white/[0.08] bg-[#061326] px-5 py-20 sm:py-28 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="max-w-xl">
            <p className="tf-signal-chip inline-flex px-3 py-1 font-mono text-[9px] uppercase tracking-[0.22em] text-blue-200">Get in touch</p>
            <h2 className="mt-5 text-3xl font-semibold tracking-[-0.055em] text-white sm:text-5xl">Start a focused conversation.</h2>
            <p className="mt-5 text-base leading-7 text-slate-400">Questions about Trade Fusion, Backtest, or the upcoming signals service? Send a message and we will get back to you.</p>
          </div>

          <form onSubmit={submitContact} className="tf-contact-surface rounded-[2rem] border border-white/[0.10] bg-[linear-gradient(145deg,rgba(22,43,78,0.78),rgba(5,15,32,0.92))] p-6 shadow-2xl sm:p-8" data-testid="landing-contact-form">
            <div className="flex items-start justify-between gap-4"><div><h3 className="text-xl font-semibold text-white">Send a message</h3><p className="mt-2 text-sm leading-6 text-slate-400">Tell us what you are looking to build or improve.</p></div><MessageSquare className="h-5 w-5 text-blue-300" /></div>
            <div className="mt-7 grid gap-4">
              <label className="grid gap-2 text-sm font-medium text-slate-300" htmlFor="contact-name"><span className="flex items-center gap-2"><UserRound className="h-3.5 w-3.5 text-blue-300" /> Name</span><input id="contact-name" value={contactForm.name} onChange={event => setContactForm(current => ({ ...current, name: event.target.value }))} required minLength={2} maxLength={80} placeholder="Your name" className="h-12 rounded-xl border border-white/[0.10] bg-[#08172c] px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-300/60 focus:ring-2 focus:ring-blue-400/20" /></label>
              <label className="grid gap-2 text-sm font-medium text-slate-300" htmlFor="contact-email"><span className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-blue-300" /> Email</span><input id="contact-email" value={contactForm.email} onChange={event => setContactForm(current => ({ ...current, email: event.target.value }))} required type="email" maxLength={320} placeholder="you@example.com" className="h-12 rounded-xl border border-white/[0.10] bg-[#08172c] px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-300/60 focus:ring-2 focus:ring-blue-400/20" /></label>
              <label className="grid gap-2 text-sm font-medium text-slate-300" htmlFor="contact-message"><span className="flex items-center gap-2"><MessageSquare className="h-3.5 w-3.5 text-blue-300" /> Message</span><textarea id="contact-message" value={contactForm.message} onChange={event => setContactForm(current => ({ ...current, message: event.target.value }))} required minLength={10} maxLength={2000} rows={5} placeholder="Tell us how we can help…" className="resize-none rounded-xl border border-white/[0.10] bg-[#08172c] px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-300/60 focus:ring-2 focus:ring-blue-400/20" /></label>
              <label className="sr-only" htmlFor="contact-website">Website</label><input id="contact-website" tabIndex={-1} autoComplete="off" value={contactForm.website} onChange={event => setContactForm(current => ({ ...current, website: event.target.value }))} className="absolute left-[-10000px] h-px w-px opacity-0" aria-hidden="true" />
            </div>
            {contactSubmit.isSuccess && <p role="status" className="mt-4 rounded-xl border border-emerald-300/20 bg-emerald-400/[0.08] px-4 py-3 text-sm text-emerald-200">Your message has been sent privately. Thank you.</p>}
            {contactSubmit.error && <p role="alert" className="mt-4 rounded-xl border border-red-300/20 bg-red-400/[0.08] px-4 py-3 text-sm text-red-200">{contactSubmit.error.message}</p>}
            <button disabled={contactSubmit.isPending} className="tf-cta-primary mt-6 h-12 w-full !bg-[oklch(0.66_0.18_250)] text-sm font-semibold !shadow-blue-500/20 hover:!bg-[oklch(0.72_0.15_250)] disabled:cursor-not-allowed disabled:opacity-60" type="submit">{contactSubmit.isPending ? "Sending privately…" : <>Send message <Send className="ml-2 h-4 w-4" /></>}</button>
          </form>
        </div>
      </section>

      <section id="faq" className="relative z-10 border-t border-white/[0.08] bg-[#040d1b] px-5 py-20 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="tf-signal-chip inline-flex px-3 py-1 font-mono text-[9px] uppercase tracking-[0.22em] text-blue-200">Support</p>
            <h2 className="mt-5 text-3xl font-semibold tracking-[-0.055em] text-white sm:text-5xl">Frequently asked questions</h2>
            <p className="mt-5 text-base leading-7 text-slate-400">A clear view of what Trade Fusion does today, how your private workspace works, and where current feature boundaries are.</p>
          </div>

          <Accordion type="single" collapsible className="mt-12 grid gap-x-10 md:grid-cols-2 md:gap-y-0" data-testid="landing-faq">
            {frequentlyAskedQuestions.map((faq, index) => (
              <AccordionItem key={faq.question} value={`faq-${index}`} className="tf-faq-item border-white/[0.10]">
                <AccordionTrigger className="tf-faq-trigger py-5 text-left text-base font-semibold text-slate-100 hover:no-underline sm:text-[17px]">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="max-w-xl pr-7 text-sm leading-6 text-slate-400">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/[0.08] bg-[#030914] px-5 pt-16 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 pb-14 md:grid-cols-[1.45fr_0.7fr_0.7fr_1fr] md:gap-8">
          <div className="max-w-xs">
            <Brand />
            <p className="mt-5 text-sm leading-6 text-slate-400">A private performance workspace for documenting executions, reviewing setups, rehearsing decisions, and building a more deliberate trading process.</p>
            <div className="mt-6 flex items-center gap-2">
              {[
                ["X", "Trade Fusion X channel coming soon"],
                ["in", "Trade Fusion LinkedIn channel coming soon"],
                ["◎", "Trade Fusion Instagram channel coming soon"],
              ].map(([label, description]) => <button key={label} type="button" title={description} aria-label={description} className="grid h-9 w-9 place-items-center rounded-lg border border-white/[0.09] bg-white/[0.03] font-mono text-xs text-slate-400 transition hover:border-blue-300/35 hover:text-blue-200">{label}</button>)}
            </div>
          </div>

          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-blue-300">Platform</p>
            <nav className="mt-5 grid gap-3 text-sm text-slate-400">
              <Link href={appRoutes.journal} className="transition hover:text-white">Performance Journal</Link>
              <Link href={appRoutes.analytics} className="transition hover:text-white">Setup Analytics</Link>
              <Link href={appRoutes.backtest} className="transition hover:text-white">Backtest Lab</Link>
              <Link href={appRoutes.calendar} className="transition hover:text-white">Market Calendar</Link>
              <Link href={appRoutes.community} className="transition hover:text-white">Trader’s Room</Link>
            </nav>
          </div>

          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-blue-300">Workspace</p>
            <nav className="mt-5 grid gap-3 text-sm text-slate-400">
              <Link href={appRoutes.account} className="transition hover:text-white">Saved Setups</Link>
              <Link href={appRoutes.account} className="transition hover:text-white">Account Settings</Link>
              <a href="#pricing" className="transition hover:text-white">Pricing</a>
              <a href="#workflow" className="transition hover:text-white">How it works</a>
              <a href="#contact" className="transition hover:text-white">Contact</a>
              <a href="#faq" className="transition hover:text-white">Frequently asked questions</a>
              <a href="#security" className="transition hover:text-white">Privacy</a>
            </nav>
          </div>

          <div className="rounded-2xl border border-blue-300/[0.14] bg-[linear-gradient(145deg,rgba(31,82,157,0.17),rgba(5,16,32,0.52))] p-5">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-blue-300">Start reviewing</p>
            <p className="mt-3 text-sm leading-6 text-slate-300">Open a private workspace, log the next execution, and begin building setup-level insight.</p>
            <Link href={appRoutes.journal} className="mt-5 inline-flex h-10 items-center rounded-lg bg-[oklch(0.66_0.18_250)] px-4 text-sm font-semibold text-white transition hover:bg-[oklch(0.72_0.15_250)]">Open workspace <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </div>
        </div>
        <div className="mx-auto flex max-w-7xl flex-col gap-3 border-t border-white/[0.07] py-6 font-mono text-[9px] uppercase tracking-[0.12em] text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Trade Fusion. Private trading performance workspace.</p>
          <div className="flex gap-4"><a href="#security" className="transition hover:text-slate-300">Privacy</a><a href="#workflow" className="transition hover:text-slate-300">Workflow</a><span>Built for review, not signals</span></div>
        </div>
      </footer>
    </main>
  );
}

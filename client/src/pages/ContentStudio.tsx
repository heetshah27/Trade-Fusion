import { Button } from "@/components/ui/button";
import { appRoutes } from "@/lib/appRoutes";
import { buildWeeklyCaption, formatRecapRange, formatRecordedPnl, getWeeklyRecap } from "@/lib/contentStudio";
import type { Trade } from "@/lib/tradeTypes";
import { trpc } from "@/lib/trpc";
import { BarChart3, Check, ChevronRight, Clipboard, Eye, EyeOff, Image, Instagram, Lightbulb, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

const defaultLesson = "My lesson this week: I got my best reads when I waited for confirmation, defined invalidation first, and avoided forcing a setup after a loss.";

function formatToday() {
  return new Date().toLocaleDateString("en-CA");
}

export default function ContentStudio() {
  const [, setLocation] = useLocation();
  const { data: cloudTrades = [], isLoading } = trpc.trades.list.useQuery();
  const [weekEnd, setWeekEnd] = useState(formatToday);
  const [showPnl, setShowPnl] = useState(false);
  const [lesson, setLesson] = useState(defaultLesson);
  const recap = useMemo(() => getWeeklyRecap(cloudTrades as Trade[], weekEnd), [cloudTrades, weekEnd]);
  const caption = useMemo(() => buildWeeklyCaption(recap, lesson.trim() || defaultLesson, showPnl), [lesson, recap, showPnl]);
  const range = formatRecapRange(recap);

  const copyCaption = async () => {
    try {
      await navigator.clipboard.writeText(caption);
      toast.success("Caption copied. Review it, then post from Instagram.");
    } catch {
      toast.error("Could not copy the caption. Please select and copy it manually.");
    }
  };

  const slides = [
    { number: "01", title: "The cover", copy: `WEEKLY REVIEW\n${range}`, note: "A consistent title card makes the series recognisable." },
    { number: "02", title: "The process score", copy: `${recap.tradeCount || "—"} trades · ${recap.tradeCount ? `${recap.winRate}%` : "—"} win rate`, note: "Use only the metrics you are comfortable making public." },
    { number: "03", title: "One chart, one decision", copy: recap.bestTrade ? `${recap.bestTrade.symbol} · ${recap.bestTrade.direction}` : "Your cleanest setup", note: "Annotate the thesis, invalidation and execution—not a future call." },
    { number: "04", title: "The lesson", copy: "What I would repeat or change next week.", note: "This is what makes the post useful even when the week was red." },
    { number: "05", title: "The close", copy: "Journal, not signals.", note: "Invite thoughtful discussion; do not promise outcomes." },
  ];

  return (
    <div className="min-h-full bg-[#06090f] text-foreground">
      <main className="mx-auto w-full max-w-[1720px] px-4 py-5 sm:px-5 lg:px-7 lg:py-6">
        <section className="relative overflow-hidden rounded-[1.5rem] border border-blue-300/[.15] bg-[#0a111f] px-5 py-6 shadow-[0_20px_80px_rgba(0,0,0,.24)] sm:px-7 sm:py-8">
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-blue-500/[.12] blur-3xl" />
          <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[.22em] text-blue-300"><Instagram className="h-3.5 w-3.5" /> Content desk · Heet.fxlife</div>
              <h1 className="mt-3 text-3xl font-semibold tracking-[-.045em] text-white sm:text-4xl">Make the week worth sharing.</h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">For early-stage and developing FX traders who value honest post-trade learning over copied calls. Turn your private journal into an education-first recap: explain the process, share the lesson, and never let a green week become a promise.</p>
            </div>
            <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => setLocation(appRoutes.journal)} className="h-10 rounded-xl border-white/[.1] bg-white/[.025] text-slate-200 hover:bg-white/[.07]"><Lightbulb className="mr-2 h-4 w-4 text-amber-200" />Review notes</Button><Button onClick={() => setLocation(appRoutes.trades)} className="h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-500 text-white"><BarChart3 className="mr-2 h-4 w-4" />Open trades</Button></div>
          </div>
        </section>

        <section className="mt-5 grid gap-4 2xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,.65fr)]">
          <div className="space-y-4">
            <section className="rounded-2xl border border-white/[.07] bg-[#0a111f] p-4 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div><p className="font-mono text-[9px] uppercase tracking-[.18em] text-slate-600">The reporting window</p><h2 className="mt-1 text-base font-semibold text-white">Choose the week you want to review.</h2></div>
                <label className="block"><span className="sr-only">Week ending</span><input type="date" value={weekEnd} onChange={(event) => setWeekEnd(event.target.value)} className="h-10 rounded-xl border border-white/[.1] bg-white/[.025] px-3 font-mono text-xs text-slate-200 outline-none transition focus:border-blue-300/60 focus:ring-2 focus:ring-blue-400/15" /></label>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Metric label="Logged trades" value={isLoading ? "…" : String(recap.tradeCount)} tone="text-white" />
                <Metric label="Win rate" value={isLoading ? "…" : recap.tradeCount ? `${recap.winRate}%` : "—"} tone="text-blue-200" />
                <Metric label="Rule follow-through" value={isLoading ? "…" : recap.ruleFollowRate === null ? "—" : `${recap.ruleFollowRate}%`} tone="text-emerald-200" />
                <Metric label="Recorded P&L" value={showPnl ? formatRecordedPnl(recap.recordedPnl) : "Private"} tone={showPnl ? (recap.recordedPnl >= 0 ? "text-emerald-200" : "text-rose-200") : "text-slate-500"} />
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[.06] bg-white/[.018] px-3 py-2.5"><p className="text-xs text-slate-500"><span className="font-medium text-slate-300">Default privacy:</span> the caption does not show recorded P&amp;L unless you choose to include it.</p><button type="button" onClick={() => setShowPnl((value) => !value)} className="tf-press inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium text-blue-200 hover:bg-blue-500/[.1]">{showPnl ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}{showPnl ? "Hide P&L" : "Show P&L"}</button></div>
            </section>

            <section className="rounded-2xl border border-white/[.07] bg-[#0a111f] p-4 sm:p-5">
              <div className="flex items-start gap-3"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-500/[.11] text-blue-200"><Sparkles className="h-4 w-4" /></div><div><p className="font-mono text-[9px] uppercase tracking-[.18em] text-slate-600">Caption draft</p><h2 className="mt-1 text-base font-semibold text-white">Keep it like a journal, not a signal room.</h2></div></div>
              <label className="mt-5 block"><span className="text-xs font-medium text-slate-300">Your lesson from the week</span><textarea value={lesson} onChange={(event) => setLesson(event.target.value)} rows={3} className="mt-2 w-full resize-none rounded-xl border border-white/[.08] bg-white/[.02] px-3 py-3 text-sm leading-6 text-slate-300 outline-none transition placeholder:text-slate-600 focus:border-blue-300/50 focus:ring-2 focus:ring-blue-400/15" /></label>
              <pre className="mt-4 whitespace-pre-wrap rounded-xl border border-white/[.06] bg-[#06090f] p-4 font-sans text-sm leading-6 text-slate-300">{caption}</pre>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="text-[11px] leading-4 text-slate-600">Always read the draft against the actual charts before publishing.</p><Button onClick={copyCaption} className="tf-press h-9 rounded-xl bg-blue-500 text-white hover:bg-blue-400"><Clipboard className="mr-2 h-3.5 w-3.5" />Copy caption</Button></div>
            </section>
          </div>

          <aside className="rounded-2xl border border-white/[.07] bg-[#0a111f] p-4 sm:p-5">
            <p className="font-mono text-[9px] uppercase tracking-[.18em] text-slate-600">Carousel blueprint</p><h2 className="mt-1 text-base font-semibold text-white">A repeatable five-slide story.</h2><p className="mt-2 text-xs leading-5 text-slate-500">Use this each Saturday or Sunday. Consistency in the structure helps your audience recognise the series before they read the chart.</p>
            <div className="mt-5 space-y-2.5">{slides.map((slide, index) => <article key={slide.number} className="group relative overflow-hidden rounded-xl border border-white/[.06] bg-white/[.018] p-3 transition hover:border-blue-300/[.22] hover:bg-blue-500/[.035]"><span className="absolute right-3 top-3 font-mono text-[9px] tracking-[.15em] text-slate-700">{slide.number}</span><div className="flex gap-3"><div className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md bg-blue-500/[.1] font-mono text-[10px] text-blue-200">{index + 1}</div><div className="min-w-0"><h3 className="text-xs font-semibold text-slate-200">{slide.title}</h3><p className="mt-1 whitespace-pre-line font-mono text-[11px] leading-5 text-blue-100">{slide.copy}</p><p className="mt-1.5 text-[11px] leading-4 text-slate-600">{slide.note}</p></div></div></article>)}</div>
            <div className="mt-5 rounded-xl border border-emerald-300/[.12] bg-emerald-400/[.045] p-3"><div className="flex items-center gap-2 text-xs font-medium text-emerald-100"><Check className="h-3.5 w-3.5" />The Heet.fxlife rule</div><p className="mt-1.5 text-[11px] leading-5 text-slate-500">Lead with context and learning. Blur personal account details, review risk language, and share every chart after the trade is closed.</p></div>
          </aside>
        </section>

        <section className="mt-4 grid gap-3 md:grid-cols-3">
          <CadenceCard icon={Image} title="Saturday carousel" description="Your weekly five-slide review. This becomes your signature series." />
          <CadenceCard icon={ChevronRight} title="Tuesday trade lesson" description="One closed chart, one decision, one takeaway. Keep it short and specific." />
          <CadenceCard icon={Instagram} title="Friday process note" description="Share one rule, mistake or mindset adjustment from the week—no chart required." />
        </section>
      </main>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone: string }) {
  return <div className="rounded-xl border border-white/[.06] bg-white/[.018] px-3 py-3"><p className="font-mono text-[9px] uppercase tracking-[.13em] text-slate-600">{label}</p><p className={`mt-1 font-mono text-lg font-semibold ${tone}`}>{value}</p></div>;
}

function CadenceCard({ icon: Icon, title, description }: { icon: typeof Image; title: string; description: string }) {
  return <article className="rounded-2xl border border-white/[.07] bg-[#0a111f] p-4"><Icon className="h-4 w-4 text-blue-300" /><h2 className="mt-3 text-sm font-semibold text-white">{title}</h2><p className="mt-1.5 text-xs leading-5 text-slate-500">{description}</p></article>;
}

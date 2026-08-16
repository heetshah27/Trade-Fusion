import React, { ChangeEvent, useEffect, useMemo, useState } from "react";
import { BookOpenCheck, BrainCircuit, Camera, Check, ClipboardPenLine, ImagePlus, Loader2, LockKeyhole, Save, Star, X } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { InstrumentBadge } from "@/components/InstrumentBadge";
import { DirectionBadge } from "@/components/DirectionBadge";
import { TRADE_JOURNAL_ATTACHMENT_RULES } from "@shared/tradeJournalConfig";

type JournalForm = { tradeIdea: string; marketContext: string; executionReview: string; reflection: string; emotion: string; rating: number | null };
const emptyForm: JournalForm = { tradeIdea: "", marketContext: "", executionReview: "", reflection: "", emotion: "", rating: null };

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);
}

function readImageFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Unable to read image"));
    reader.onerror = () => reject(new Error("Unable to read image"));
    reader.readAsDataURL(file);
  });
}

export default function TradeJournal() {
  const { data: trades = [] } = trpc.trades.list.useQuery();
  const [selectedTradeId, setSelectedTradeId] = useState<number | null>(null);
  const [form, setForm] = useState<JournalForm>(emptyForm);
  const input = useMemo(() => ({ tradeId: selectedTradeId ?? 0 }), [selectedTradeId]);
  const { data: entry, isLoading } = trpc.tradeJournal.byTrade.useQuery(input, { enabled: selectedTradeId !== null });
  const { data: savedEntries = [] } = trpc.tradeJournal.list.useQuery();
  const utils = trpc.useUtils();
  const invalidateEntry = () => { void utils.tradeJournal.byTrade.invalidate(); void utils.tradeJournal.list.invalidate(); };
  const upsert = trpc.tradeJournal.upsert.useMutation({ onSuccess: () => { invalidateEntry(); toast.success("Private Journal entry saved."); } });
  const remove = trpc.tradeJournal.delete.useMutation({ onSuccess: () => { invalidateEntry(); setForm(emptyForm); toast.success("Journal entry cleared."); } });
  const uploadAttachment = trpc.tradeJournal.uploadAttachment.useMutation({ onSuccess: () => { invalidateEntry(); toast.success("Chart screenshot attached privately."); }, onError: error => toast.error(error.message) });
  const removeAttachment = trpc.tradeJournal.removeAttachment.useMutation({ onSuccess: () => { invalidateEntry(); toast.success("Chart screenshot removed."); }, onError: error => toast.error(error.message) });

  useEffect(() => { if (!selectedTradeId && trades.length) setSelectedTradeId(trades[0].id); }, [selectedTradeId, trades]);
  useEffect(() => { setForm(entry ? { tradeIdea: entry.tradeIdea, marketContext: entry.marketContext, executionReview: entry.executionReview, reflection: entry.reflection, emotion: entry.emotion, rating: entry.rating } : emptyForm); }, [entry, selectedTradeId]);

  const selected = useMemo(() => trades.find(trade => trade.id === selectedTradeId) ?? null, [trades, selectedTradeId]);
  const attachments = entry?.attachments ?? [];
  const canAddScreenshot = Boolean(entry) && attachments.length < TRADE_JOURNAL_ATTACHMENT_RULES.maxFilesPerEntry && !uploadAttachment.isPending;
  const setField = <K extends keyof JournalForm>(field: K, value: JournalForm[K]) => setForm(current => ({ ...current, [field]: value }));
  const save = () => { if (!selectedTradeId) return; upsert.mutate({ tradeId: selectedTradeId, ...form }); };

  const selectScreenshots = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length) return;
    if (!entry) { toast.error("Save this private Journal entry once before attaching screenshots."); return; }
    const remaining = TRADE_JOURNAL_ATTACHMENT_RULES.maxFilesPerEntry - attachments.length;
    if (files.length > remaining) toast.error(`You can attach up to ${TRADE_JOURNAL_ATTACHMENT_RULES.maxFilesPerEntry} chart screenshots to one Journal entry.`);
    const valid = files.slice(0, Math.max(0, remaining)).filter(file => {
      const allowed = TRADE_JOURNAL_ATTACHMENT_RULES.acceptedMimeTypes.includes(file.type as (typeof TRADE_JOURNAL_ATTACHMENT_RULES.acceptedMimeTypes)[number]);
      if (!allowed || file.size > TRADE_JOURNAL_ATTACHMENT_RULES.maxBytesPerFile) {
        toast.error(`${file.name} must be a PNG, JPG, or WebP image under 3 MB.`);
        return false;
      }
      return true;
    });
    try {
      for (const file of valid) {
        await uploadAttachment.mutateAsync({ journalEntryId: entry.id, fileName: file.name, mimeType: file.type as "image/jpeg" | "image/png" | "image/webp", dataUrl: await readImageFile(file) });
      }
    } catch {
      toast.error("One or more screenshots could not be attached.");
    }
  };

  return <div className="min-h-full bg-[#06090f] text-foreground"><main className="mx-auto w-full max-w-[1720px] px-4 py-5 sm:px-5 lg:px-7 lg:py-6">
    <section className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="font-mono text-[9px] uppercase tracking-[.22em] text-blue-300">Private trade notes</p><h1 className="mt-1.5 text-2xl font-semibold tracking-[-.04em] text-white sm:text-3xl">Journal</h1><p className="mt-1.5 text-xs text-slate-500">Capture an idea, context, execution review, screenshots, and learning for each live trade.</p></div><div className="inline-flex items-center gap-2 self-start rounded-full border border-emerald-400/15 bg-emerald-500/[.06] px-3 py-1.5 font-mono text-[9px] uppercase tracking-[.14em] text-emerald-200"><LockKeyhole className="h-3.5 w-3.5" />Private to your account</div></section>
    {!trades.length ? <section className="rounded-2xl border border-dashed border-white/[.08] bg-[#0a111f] py-20 text-center"><BookOpenCheck className="mx-auto h-7 w-7 text-slate-700" /><p className="mt-4 text-base font-semibold text-white">Log a live trade before adding a Journal entry.</p><p className="mt-2 text-xs text-slate-500">Journal ideas, reviews, and chart screenshots are always linked to a live trade you own.</p></section> : <>{selected && <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-300/15 bg-blue-500/[.05] px-3 py-1.5"><InstrumentBadge symbol={selected.symbol} category={selected.instrumentCategory} size="sm" /><DirectionBadge direction={selected.direction} size="sm" /><span className="font-mono text-[9px] uppercase tracking-[.14em] text-slate-500">Reviewing</span><span className="font-mono text-[11px] font-semibold text-slate-200">{selected.symbol}</span></div>}<section className="grid gap-4 xl:grid-cols-[310px_minmax(0,1fr)]">
      <aside className="rounded-2xl border border-white/[.07] bg-[#0a111f] p-3 sm:p-4"><div className="flex items-center justify-between px-1 pb-3"><div><p className="font-mono text-[9px] uppercase tracking-[.16em] text-slate-500">Trade queue</p><p className="mt-1 text-xs font-medium text-white">Select an execution</p></div><span className="rounded-md bg-blue-500/[.1] px-2 py-1 font-mono text-[9px] text-blue-200">{savedEntries.length} WRITTEN</span></div><div className="max-h-[560px] space-y-2 overflow-y-auto pr-1">{[...trades].sort((a, b) => b.date.localeCompare(a.date)).map(trade => { const saved = savedEntries.find(item => item.tradeId === trade.id); return <button type="button" key={trade.id} onClick={() => setSelectedTradeId(trade.id)} className={`tf-press w-full rounded-xl border p-3 text-left transition ${trade.id === selectedTradeId ? "border-blue-300/30 bg-blue-500/[.1]" : "border-white/[.055] bg-white/[.018] hover:bg-white/[.04]"}`}><div className="flex items-center justify-between gap-3"><span className="font-mono text-xs font-semibold text-white">{trade.symbol}</span><span className={`font-mono text-[11px] ${trade.pnl > 0 ? "text-emerald-300" : trade.pnl < 0 ? "text-rose-300" : "text-slate-400"}`}>{money(trade.pnl)}</span></div><p className="mt-1 text-[10px] text-slate-500">{trade.date} · {trade.direction} {trade.setupTag ? `· ${trade.setupTag}` : ""}</p><span className={`mt-2 inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[.1em] ${saved ? "text-emerald-300" : "text-slate-600"}`}>{saved ? <><Check className="h-3 w-3" /> Review saved {saved.attachments.length ? `· ${saved.attachments.length} chart${saved.attachments.length === 1 ? "" : "s"}` : ""}</> : "No Journal entry"}</span></button>; })}</div></aside>
      <section className="min-w-0 rounded-2xl border border-white/[.07] bg-[#0a111f] p-4 shadow-[0_18px_38px_rgba(0,0,0,.2)] sm:p-5">{selected ? <><div className="flex flex-col gap-3 border-b border-white/[.07] pb-4 sm:flex-row sm:items-start sm:justify-between"><div className="flex items-start gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-blue-400/15 bg-blue-500/[.07]"><ClipboardPenLine className="h-5 w-5 text-blue-300" /></div><div><p className="font-mono text-[9px] uppercase tracking-[.16em] text-slate-500">Linked live trade</p><h2 className="mt-1 text-lg font-semibold text-white">{selected.symbol} <span className="font-mono text-xs font-normal text-slate-500">· {selected.direction} · {selected.date}</span></h2><p className="mt-1 text-xs text-slate-500">{selected.setupTag || "No setup label"} · <span className={selected.pnl > 0 ? "text-emerald-300" : selected.pnl < 0 ? "text-rose-300" : "text-slate-400"}>{money(selected.pnl)} live result</span></p></div></div><span className="font-mono text-[9px] text-slate-600">{isLoading ? "Loading…" : entry ? "Last saved privately" : "New private entry"}</span></div>
        <div className="mt-5 grid gap-4 lg:grid-cols-2"><label className="block"><span className="font-mono text-[9px] uppercase tracking-[.15em] text-blue-200">Trade idea</span><textarea value={form.tradeIdea} onChange={event => setField("tradeIdea", event.target.value)} placeholder="What was the thesis, level, or trigger?" className="mt-2 min-h-32 w-full resize-y rounded-xl border border-white/[.08] bg-[#070d18] p-3 text-sm leading-6 text-slate-200 placeholder:text-slate-600 focus:border-blue-300/40 focus:outline-none" /></label><label className="block"><span className="font-mono text-[9px] uppercase tracking-[.15em] text-blue-200">Market context</span><textarea value={form.marketContext} onChange={event => setField("marketContext", event.target.value)} placeholder="Session, structure, macro risk, or key levels." className="mt-2 min-h-32 w-full resize-y rounded-xl border border-white/[.08] bg-[#070d18] p-3 text-sm leading-6 text-slate-200 placeholder:text-slate-600 focus:border-blue-300/40 focus:outline-none" /></label><label className="block"><span className="font-mono text-[9px] uppercase tracking-[.15em] text-slate-400">Execution review</span><textarea value={form.executionReview} onChange={event => setField("executionReview", event.target.value)} placeholder="What was executed well? Where did you deviate?" className="mt-2 min-h-32 w-full resize-y rounded-xl border border-white/[.08] bg-[#070d18] p-3 text-sm leading-6 text-slate-200 placeholder:text-slate-600 focus:border-blue-300/40 focus:outline-none" /></label><label className="block"><span className="font-mono text-[9px] uppercase tracking-[.15em] text-slate-400">Reflection</span><textarea value={form.reflection} onChange={event => setField("reflection", event.target.value)} placeholder="What should be repeated or changed next time?" className="mt-2 min-h-32 w-full resize-y rounded-xl border border-white/[.08] bg-[#070d18] p-3 text-sm leading-6 text-slate-200 placeholder:text-slate-600 focus:border-blue-300/40 focus:outline-none" /></label></div>
        <section className="mt-4 rounded-xl border border-white/[.06] bg-white/[.018] p-3.5"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[.15em] text-blue-200"><Camera className="h-3.5 w-3.5" />Chart screenshots</p><p className="mt-1 text-xs text-slate-500">PNG, JPG, or WebP · up to 3 MB each · {attachments.length}/{TRADE_JOURNAL_ATTACHMENT_RULES.maxFilesPerEntry} attached</p></div><label className={`tf-press inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium ${canAddScreenshot ? "border-blue-400/25 bg-blue-500/[.1] text-blue-100 hover:bg-blue-500/[.16]" : "cursor-not-allowed border-white/[.06] text-slate-600"}`}><ImagePlus className="h-3.5 w-3.5" />{uploadAttachment.isPending ? "Uploading…" : entry ? "Attach screenshots" : "Save to attach"}<input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={!canAddScreenshot} onChange={selectScreenshots} className="sr-only" /></label></div>{!entry && <p className="mt-3 rounded-lg border border-dashed border-white/[.07] px-3 py-2.5 text-xs text-slate-600">Save the written entry first, then securely attach up to four private chart screenshots.</p>}{attachments.length > 0 && <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{attachments.map(attachment => <figure key={attachment.id} className="group relative overflow-hidden rounded-xl border border-white/[.08] bg-[#070d18]"><img src={attachment.url} alt={`Private chart screenshot: ${attachment.fileName}`} className="aspect-[4/3] w-full object-cover" /><figcaption className="flex items-center justify-between gap-2 px-2.5 py-2"><span className="min-w-0 truncate font-mono text-[9px] text-slate-500">{attachment.fileName}</span><button type="button" aria-label={`Remove ${attachment.fileName}`} disabled={removeAttachment.isPending} onClick={() => removeAttachment.mutate({ attachmentId: attachment.id })} className="tf-press shrink-0 rounded-md p-1 text-slate-500 hover:bg-rose-500/[.1] hover:text-rose-300"><X className="h-3.5 w-3.5" /></button></figcaption></figure>)}</div>}</section>
        <div className="mt-4 flex flex-col gap-4 rounded-xl border border-white/[.06] bg-white/[.018] p-3.5 sm:flex-row sm:items-end sm:justify-between"><label className="block w-full sm:max-w-xs"><span className="font-mono text-[9px] uppercase tracking-[.15em] text-slate-500">Mindset label</span><input value={form.emotion} onChange={event => setField("emotion", event.target.value)} placeholder="Focused, patient, rushed…" className="mt-2 h-10 w-full rounded-lg border border-white/[.08] bg-[#070d18] px-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-300" /></label><div><p className="font-mono text-[9px] uppercase tracking-[.15em] text-slate-500">Process rating</p><div className="mt-2 flex items-center gap-1">{[1, 2, 3, 4, 5].map(rating => <button type="button" key={rating} onClick={() => setField("rating", form.rating === rating ? null : rating)} aria-label={`Set process rating to ${rating}`} className={`tf-press grid h-8 w-8 place-items-center rounded-lg border ${form.rating && rating <= form.rating ? "border-blue-300/30 bg-blue-500/[.12] text-blue-200" : "border-white/[.08] text-slate-600"}`}><Star className="h-3.5 w-3.5" /></button>)}</div></div></div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3"><p className="inline-flex items-center gap-2 text-xs text-slate-500"><BrainCircuit className="h-4 w-4 text-blue-300" />Notes and screenshots are private and never posted to Trader’s Room.</p><div className="flex gap-2">{entry && <button type="button" onClick={() => remove.mutate({ id: entry.id })} className="tf-press rounded-lg border border-rose-400/15 px-3 py-2 text-xs text-rose-300 hover:bg-rose-500/[.08]">Clear entry</button>}<button type="button" onClick={save} disabled={upsert.isPending} className="tf-press inline-flex items-center gap-1.5 rounded-lg bg-blue-500 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-400 disabled:opacity-60"><Save className="h-3.5 w-3.5" />{upsert.isPending ? "Saving…" : "Save private Journal"}</button></div></div>
      </> : null}</section>
    </section></>}</main></div>;
}

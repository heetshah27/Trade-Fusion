import React, { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Archive, ArchiveRestore, BadgeCheck, Check, CircleHelp, CircleUserRound, CreditCard, ImagePlus, Layers3, LoaderCircle, LockKeyhole, Mail, Pencil, Plus, ReceiptText, Save, ShieldCheck, Sparkles, Trash2, UserRound, X } from "lucide-react";

const MAX_PROFILE_PHOTO_BYTES = 10 * 1024 * 1024;
const ACCEPTED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const billingFaqs = [
  { question: "What does Pro include?", answer: "Pro includes unlimited live trades, private Journal entries, Trader’s Room threads and replies, plus the full Backtest workspace." },
  { question: "What happens after the 7-day trial?", answer: "Your subscription renews at $10 USD per month unless you cancel before the trial ends." },
  { question: "Can I cancel and keep my work?", answer: "Yes. You can cancel from Stripe’s billing portal. Your Backtest history stays private and is preserved; after the paid period, it becomes read-only before any future renewal restores editing." },
  { question: "Are payments refundable?", answer: "Payments are non-refundable for unused time, except where applicable law requires otherwise." },
] as const;

export default function Account() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const { data: profile } = trpc.account.profile.useQuery();
  const { data: billing, isLoading: billingLoading } = trpc.billing.status.useQuery();
  const { data: billingHistory = [] } = trpc.billing.history.useQuery(undefined, { enabled: Boolean(billing?.billingReady) });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [showSetupForm, setShowSetupForm] = useState(false);
  const [setupName, setSetupName] = useState("");
  const [setupDescription, setSetupDescription] = useState("");
  const [editingSetupId, setEditingSetupId] = useState<number | null>(null);
  const [editingSetupName, setEditingSetupName] = useState("");
  const [editingSetupDescription, setEditingSetupDescription] = useState("");
  const [setupError, setSetupError] = useState<string | null>(null);
  const [checkoutState, setCheckoutState] = useState<"idle" | "opening" | "opened">("idle");
  const initial = (profile?.name || user?.name || "T").charAt(0).toUpperCase();
  const { data: setups = [], isLoading: setupsLoading } = trpc.setups.list.useQuery();

  const uploadPhoto = trpc.account.uploadProfilePhoto.useMutation({
    onSuccess: async () => {
      setUploadError(null);
      await utils.account.profile.invalidate();
    },
    onError: error => setUploadError(error.message),
  });
  const removePhoto = trpc.account.removeProfilePhoto.useMutation({
    onSuccess: async () => {
      setUploadError(null);
      await utils.account.profile.invalidate();
    },
    onError: error => setUploadError(error.message),
  });
  const updateDisplayName = trpc.account.updateDisplayName.useMutation({
    onSuccess: async () => {
      setEditingName(false);
      setUploadError(null);
      await utils.account.profile.invalidate();
    },
    onError: error => setUploadError(error.message),
  });
  const createSetup = trpc.setups.create.useMutation({
    onSuccess: async () => {
      setSetupName(""); setSetupDescription(""); setShowSetupForm(false); setSetupError(null);
      await utils.setups.list.invalidate();
    },
    onError: error => setSetupError(error.message),
  });
  const updateSetup = trpc.setups.update.useMutation({
    onSuccess: async () => {
      setEditingSetupId(null); setSetupError(null);
      await utils.setups.list.invalidate();
    },
    onError: error => setSetupError(error.message),
  });
  const archiveSetup = trpc.setups.archive.useMutation({
    onSuccess: async () => { setSetupError(null); await utils.setups.list.invalidate(); },
    onError: error => setSetupError(error.message),
  });
  const checkout = trpc.billing.createCheckout.useMutation({
    onSuccess: ({ url, trialApplied }) => {
      window.open(url, "_blank");
      setCheckoutState("opened");
      setUploadError(trialApplied ? "Your 7-day Pro trial checkout opened in a new tab." : "Your Pro checkout opened in a new tab.");
    },
    onError: error => { setCheckoutState("idle"); setUploadError(error.message); },
  });
  const openBillingPortal = trpc.billing.createPortal.useMutation({
    onSuccess: ({ url }) => window.open(url, "_blank"),
    onError: error => setUploadError(error.message),
  });

  useEffect(() => setDisplayName(profile?.name || user?.name || "Trader"), [profile?.name, user?.name]);

  const choosePhoto = () => fileInputRef.current?.click();
  const handlePhotoSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!ACCEPTED_PHOTO_TYPES.includes(file.type)) {
      setUploadError("Choose a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > MAX_PROFILE_PHOTO_BYTES) {
      setUploadError("Profile photos must be 10 MB or smaller.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => uploadPhoto.mutate({ fileName: file.name, mimeType: file.type as "image/jpeg" | "image/png" | "image/webp", dataUrl: String(reader.result) });
    reader.onerror = () => setUploadError("Your photo could not be read. Please choose a different image.");
    reader.readAsDataURL(file);
  };

  const isWorking = uploadPhoto.isPending || removePhoto.isPending || updateDisplayName.isPending;
  const saveDisplayName = () => {
    const nextName = displayName.trim();
    if (!nextName) return setUploadError("Enter a display name before saving.");
    updateDisplayName.mutate({ displayName: nextName });
  };
  const setupWorking = createSetup.isPending || updateSetup.isPending || archiveSetup.isPending;
  const activeSetups = setups.filter(setup => !setup.isArchived);
  const archivedSetups = setups.filter(setup => setup.isArchived);
  const isPro = billing?.tier === "pro";
  const backtestReadOnly = billing?.backtestAccess === "read_only";
  const formatInvoiceAmount = (amount: number, currencyCode: string) => new Intl.NumberFormat("en-US", { style: "currency", currency: currencyCode.toUpperCase(), maximumFractionDigits: 2 }).format(amount / 100);
  const startCheckout = () => { setUploadError(null); setCheckoutState("opening"); checkout.mutate(); };
  const startSetupEdit = (setup: typeof setups[number]) => {
    setEditingSetupId(setup.id);
    setEditingSetupName(setup.name);
    setEditingSetupDescription(setup.description || "");
    setSetupError(null);
  };

  return (
    <div className="min-h-full bg-[#07101f] px-5 py-8 text-white sm:px-7 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-7">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[oklch(0.70_0.16_250)]">Member account</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-white">Your trader profile</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">Your account stays private. Add a custom profile photo, or keep the email-linked avatar as your fallback.</p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="border-blue-200/[0.10] bg-gradient-to-b from-[#152647] to-[#101c33] p-5 sm:p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="relative w-fit">
                <Avatar className="h-24 w-24 border-2 border-blue-300/[0.22] bg-slate-800 shadow-[0_0_26px_oklch(0.66_0.18_250_/_0.22)]">
                  <AvatarImage src={profile?.avatarUrl ?? undefined} alt={`${profile?.name || "Trader"} profile`} />
                  <AvatarFallback className="bg-slate-800 text-lg text-blue-200">{initial}</AvatarFallback>
                </Avatar>
                {isWorking && <span className="absolute inset-0 grid place-items-center rounded-full bg-[#07101f]/75"><LoaderCircle className="h-5 w-5 animate-spin text-blue-200" /></span>}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {editingName ? <div className="flex w-full max-w-sm items-center gap-2"><input value={displayName} onChange={event => setDisplayName(event.target.value)} maxLength={40} autoFocus className="h-9 min-w-0 flex-1 rounded-lg border border-blue-300/[0.22] bg-[#0a1427] px-3 text-sm font-semibold text-white outline-none focus:ring-1 focus:ring-blue-300/60" aria-label="Display name" /><Button type="button" size="icon" onClick={saveDisplayName} disabled={isWorking} className="h-9 w-9 bg-blue-500 text-white hover:bg-blue-400" aria-label="Save display name"><Check className="h-4 w-4" /></Button><Button type="button" size="icon" variant="outline" onClick={() => { setEditingName(false); setDisplayName(profile?.name || user?.name || "Trader"); }} disabled={isWorking} className="h-9 w-9 border-white/[0.12] text-slate-300 hover:bg-white/[0.06]" aria-label="Cancel display name editing"><X className="h-4 w-4" /></Button></div> : <><h2 className="truncate text-xl font-semibold text-white">{profile?.name || "Trader"}</h2><button type="button" onClick={() => setEditingName(true)} className="rounded-md p-1 text-slate-500 transition-colors hover:bg-white/[0.06] hover:text-blue-200" aria-label="Edit display name"><Pencil className="h-3.5 w-3.5" /></button></>}
                  {profile?.role === "admin" && <span className="inline-flex items-center gap-1 rounded-full border border-blue-300/[0.20] bg-blue-400/[0.10] px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-blue-100"><ShieldCheck className="h-3 w-3" />Founder · Moderator</span>}
                </div>
                <p className="mt-2 flex items-center gap-2 text-sm text-slate-400"><Mail className="h-4 w-4 text-slate-500" />{profile?.email || "Email unavailable"}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button type="button" onClick={choosePhoto} disabled={isWorking} className="bg-[oklch(0.66_0.18_250)] text-white hover:bg-[oklch(0.72_0.18_250)]">
                    <ImagePlus className="mr-2 h-4 w-4" />{profile?.customAvatarUrl ? "Replace photo" : "Upload photo"}
                  </Button>
                  {profile?.customAvatarUrl && <Button type="button" variant="outline" onClick={() => removePhoto.mutate()} disabled={isWorking} className="border-white/[0.12] text-slate-300 hover:bg-white/[0.06] hover:text-white"><Trash2 className="mr-2 h-4 w-4" />Use email avatar</Button>}
                </div>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={handlePhotoSelection} />
                <p className="mt-3 text-xs leading-5 text-slate-500">JPG, PNG, or WebP up to 10 MB. Your custom image appears beside your messages in Trader’s Room.</p>
                {uploadError && <p className="mt-2 text-xs text-red-300" role="alert">{uploadError}</p>}
              </div>
            </div>
          </Card>

          <Card className="border-blue-200/[0.10] bg-[#101c33] p-5">
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-slate-500">Account privacy</p>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex gap-3"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-300" /><span className="text-slate-300">Your journal and account information remain private.</span></div>
              <div className="flex gap-3"><BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-300" /><span className="text-slate-300">Only the trading style you select is shown in Trader’s Room.</span></div>
              <div className="flex gap-3"><CircleUserRound className="mt-0.5 h-4 w-4 shrink-0 text-blue-300" /><span className="text-slate-300">Your chosen photo is stored separately from your trading journal.</span></div>
            </div>
          </Card>
        </div>

        <Card className="mt-5 border-blue-200/[0.10] bg-[#101c33] p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl border border-blue-200/[0.12] bg-blue-400/[0.08] text-blue-200"><UserRound className="h-4 w-4" /></span>
            <div><p className="text-sm font-medium text-white">Profile photo fallback</p><p className="mt-1 text-xs leading-5 text-slate-500">If you remove a custom photo, Trade Fusion returns to the email-linked avatar when available, then uses your private initials fallback.</p></div>
          </div>
        </Card>

        <Card className="mt-5 overflow-hidden border-violet-300/[0.18] bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.16),transparent_34rem),linear-gradient(145deg,#152647,#101c33)] p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-violet-300/25 bg-violet-400/10 text-violet-200">{isPro ? <BadgeCheck className="h-5 w-5" /> : <CreditCard className="h-5 w-5" />}</span><div><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-violet-200">Plan & billing</p><h2 className="mt-1 text-lg font-semibold text-white">{billingLoading ? "Checking membership…" : isPro ? "Trade Fusion Pro" : backtestReadOnly ? "Backtest history preserved" : "Trade Fusion Free"}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{isPro ? "Unlimited journal and Trader’s Room access plus the full private Backtest workspace." : backtestReadOnly ? "Your private Backtest history is retained in read-only mode. Renew Pro to create, edit, or remove strategy data." : "Your Free plan includes the private core workspace. Upgrade when you are ready for unlimited review and the Backtest lab."}</p></div></div>
            <div className="w-full max-w-md lg:w-[23rem]">
              <div className="flex flex-wrap gap-2 lg:justify-end">{isPro ? <Button type="button" onClick={() => openBillingPortal.mutate()} disabled={openBillingPortal.isPending || !billing?.billingReady} className="tf-press tf-action-glow bg-blue-500 text-white hover:bg-blue-400"><CreditCard className="mr-2 h-4 w-4" />{openBillingPortal.isPending ? "Opening…" : "Manage billing"}</Button> : <Button type="button" onClick={startCheckout} disabled={checkout.isPending || checkoutState === "opening" || !billing?.billingReady} data-checkout-state={checkoutState} className="tf-press tf-action-glow tf-checkout-cta bg-blue-500 text-white hover:bg-blue-400"><Sparkles className={`mr-2 h-4 w-4 ${checkoutState === "opening" ? "tf-checkout-spinner" : ""}`} />{checkoutState === "opening" ? "Preparing secure checkout…" : checkoutState === "opened" ? "Checkout opened" : "Start 7-day Pro trial"}</Button>}</div>
              {!isPro && <section aria-labelledby="billing-faq-heading" className="mt-3 rounded-xl border border-violet-200/[0.14] bg-[#0a1427]/64 px-4 py-3 shadow-inner shadow-black/10"><div className="flex items-center gap-2"><CircleHelp className="h-3.5 w-3.5 text-violet-200" /><h3 id="billing-faq-heading" className="font-mono text-[9px] uppercase tracking-[0.16em] text-violet-100">Before you start</h3></div><Accordion type="single" collapsible className="mt-2" data-testid="billing-faq">{billingFaqs.map((faq, index) => <AccordionItem key={faq.question} value={`billing-faq-${index}`} className="border-violet-200/[0.10]"><AccordionTrigger className="py-2 text-left text-xs font-medium text-slate-200 hover:no-underline">{faq.question}</AccordionTrigger><AccordionContent className="pr-5 text-xs leading-5 text-slate-400">{faq.answer}</AccordionContent></AccordionItem>)}</Accordion></section>}
            </div>
          </div>

          {!isPro && checkoutState !== "idle" && <div id="checkout-status" role="status" aria-live="polite" className="tf-checkout-notice mt-5 flex items-center gap-3 rounded-xl border border-violet-200/[0.16] bg-[#0a1427]/72 px-4 py-3 text-xs leading-5 text-violet-100"><LoaderCircle className={`h-4 w-4 shrink-0 text-violet-200 ${checkoutState === "opening" ? "tf-checkout-spinner" : ""}`} />{checkoutState === "opening" ? "Preparing secure Stripe Checkout. Your workspace stays open while the payment page opens separately." : "Stripe Checkout opened in a new tab. Complete the secure trial there, then return here for updated Pro access."}</div>}

          {!billingLoading && <div className="mt-6 grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-white/[0.09] bg-[#0a1427]/80 p-4"><p className="font-mono text-[9px] uppercase tracking-[0.16em] text-slate-500">Live trade allowance</p><p className="mt-2 text-sm font-semibold text-white">{isPro ? "Unlimited" : `${billing?.usage.trades.remaining ?? 0} remaining this month`}</p>{!isPro && <p className="mt-1 text-xs text-slate-500">{billing?.usage.trades.used ?? 0} of {billing?.usage.trades.limit ?? 15} new live trades used. Resets monthly at 00:00 UTC.</p>}</div><div className="rounded-xl border border-white/[0.09] bg-[#0a1427]/80 p-4"><p className="font-mono text-[9px] uppercase tracking-[0.16em] text-slate-500">Trader’s Room threads</p><p className="mt-2 text-sm font-semibold text-white">{isPro ? "Unlimited" : `${billing?.usage.threads.remaining ?? 0} remaining this month`}</p>{!isPro && <p className="mt-1 text-xs text-slate-500">{billing?.usage.threads.used ?? 0} of {billing?.usage.threads.limit ?? 10} new threads used. Replies stay open.</p>}</div></div>}
          <p className="mt-5 flex items-start gap-2 text-xs leading-5 text-slate-500"><LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-300" />Pro is $10 USD per month, monthly billing only. The first Pro trial lasts seven days and requires a card. Payments are non-refundable for unused time, except where applicable law requires otherwise.</p>

          {billingHistory.length > 0 && <div className="mt-6 border-t border-white/[0.08] pt-5"><div className="flex items-center gap-2"><ReceiptText className="h-4 w-4 text-violet-200" /><h3 className="text-sm font-medium text-white">Payment history</h3></div><div className="mt-3 overflow-hidden rounded-xl border border-white/[0.08]"><div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-3 border-b border-white/[0.08] bg-white/[0.025] px-4 py-2 font-mono text-[9px] uppercase tracking-[0.14em] text-slate-500"><span>Item</span><span>Date</span><span>Paid</span></div>{billingHistory.map(invoice => <div key={invoice.id} className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-3 px-4 py-3 text-xs text-slate-300"><span className="truncate">{invoice.item}</span><span className="text-slate-500">{new Date(invoice.date).toLocaleDateString()}</span><span className={invoice.status === "paid" ? "text-emerald-300" : "text-amber-200"}>{formatInvoiceAmount(invoice.amountPaid, invoice.currency)}</span></div>)}</div></div>}
        </Card>

        <Card className="mt-5 border-blue-200/[0.10] bg-[#101c33] p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl border border-blue-200/[0.12] bg-blue-400/[0.08] text-blue-200"><Layers3 className="h-4 w-4" /></span><div><p className="text-sm font-medium text-white">Saved setups</p><p className="mt-1 max-w-xl text-xs leading-5 text-slate-500">Private setup labels used by your manual journal and Setup Analytics. Archiving keeps historical performance intact while removing a setup from new-trade selection.</p></div></div>
            <Button type="button" onClick={() => { setShowSetupForm(value => !value); setSetupError(null); }} className="bg-blue-500 text-white hover:bg-blue-400"><Plus className="mr-2 h-4 w-4" />New setup</Button>
          </div>

          {showSetupForm && <div className="mt-5 grid gap-3 rounded-xl border border-blue-300/[0.14] bg-[#0a1427] p-4 sm:grid-cols-[1fr_1.4fr_auto]"><input aria-label="New saved setup name" value={setupName} onChange={event => setSetupName(event.target.value)} maxLength={80} placeholder="e.g. London Breakout" className="h-10 rounded-lg border border-white/[0.10] bg-[#07101f] px-3 text-sm text-white outline-none focus:ring-1 focus:ring-blue-300/60" /><input aria-label="New saved setup description" value={setupDescription} onChange={event => setSetupDescription(event.target.value)} maxLength={500} placeholder="Optional rule reminder" className="h-10 rounded-lg border border-white/[0.10] bg-[#07101f] px-3 text-sm text-white outline-none focus:ring-1 focus:ring-blue-300/60" /><Button type="button" disabled={!setupName.trim() || setupWorking} onClick={() => createSetup.mutate({ name: setupName, description: setupDescription })} className="bg-blue-500 text-white hover:bg-blue-400"><Save className="mr-2 h-4 w-4" />Save</Button></div>}
          {setupError && <p role="alert" className="mt-3 text-xs text-red-300">{setupError}</p>}

          <div className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_0.9fr]">
            <div><div className="mb-3 flex items-center justify-between"><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-slate-500">Active setups</p><span className="text-xs text-slate-500">{activeSetups.length}</span></div><div className="space-y-2">{setupsLoading ? <p className="py-4 text-sm text-slate-500">Loading your private setup library…</p> : activeSetups.length ? activeSetups.map(setup => <div key={setup.id} className="rounded-xl border border-white/[0.08] bg-[#0a1427] p-3"><div className="flex flex-wrap items-start justify-between gap-3">{editingSetupId === setup.id ? <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-[1fr_1.4fr]"><input aria-label="Edit setup name" value={editingSetupName} onChange={event => setEditingSetupName(event.target.value)} className="h-9 min-w-0 rounded-lg border border-blue-300/[0.22] bg-[#07101f] px-3 text-sm text-white outline-none focus:ring-1 focus:ring-blue-300/60" /><input aria-label="Edit setup description" value={editingSetupDescription} onChange={event => setEditingSetupDescription(event.target.value)} className="h-9 min-w-0 rounded-lg border border-blue-300/[0.22] bg-[#07101f] px-3 text-sm text-white outline-none focus:ring-1 focus:ring-blue-300/60" /></div> : <div className="min-w-0"><p className="truncate text-sm font-medium text-white">{setup.name}</p><p className="mt-1 text-xs text-slate-500">{setup.description || "No rule reminder added."}</p></div>}<div className="flex shrink-0 gap-2">{editingSetupId === setup.id ? <><Button type="button" size="sm" disabled={!editingSetupName.trim() || setupWorking} onClick={() => updateSetup.mutate({ id: setup.id, name: editingSetupName, description: editingSetupDescription })} className="h-8 bg-blue-500 text-white hover:bg-blue-400" aria-label="Save setup edits"><Check className="h-3.5 w-3.5" /></Button><Button type="button" size="sm" variant="outline" disabled={setupWorking} onClick={() => setEditingSetupId(null)} className="h-8 border-white/[0.12] text-slate-300" aria-label="Cancel setup edits"><X className="h-3.5 w-3.5" /></Button></> : <><Button type="button" size="sm" variant="outline" disabled={setupWorking} onClick={() => startSetupEdit(setup)} className="h-8 border-white/[0.12] text-slate-300 hover:bg-white/[0.06]" aria-label={`Edit ${setup.name}`}><Pencil className="h-3.5 w-3.5" /></Button><Button type="button" size="sm" variant="outline" disabled={setupWorking} onClick={() => archiveSetup.mutate({ id: setup.id, isArchived: true })} className="h-8 border-white/[0.12] text-slate-300 hover:bg-white/[0.06]" aria-label={`Archive ${setup.name}`}><Archive className="h-3.5 w-3.5" /></Button></>}</div></div></div>) : <div className="rounded-xl border border-dashed border-white/[0.10] p-4 text-sm text-slate-500">No saved setups yet. Create one here or from the Journal trade form.</div>}</div></div>
            <div><div className="mb-3 flex items-center justify-between"><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-slate-500">Archived</p><span className="text-xs text-slate-500">{archivedSetups.length}</span></div><div className="space-y-2">{archivedSetups.length ? archivedSetups.map(setup => <div key={setup.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-[#0a1427] p-3"><div className="min-w-0"><p className="truncate text-sm font-medium text-slate-300">{setup.name}</p><p className="mt-1 text-xs text-slate-500">Hidden from new journal entries.</p></div><Button type="button" size="sm" variant="outline" disabled={setupWorking} onClick={() => archiveSetup.mutate({ id: setup.id, isArchived: false })} className="h-8 shrink-0 border-white/[0.12] text-blue-200 hover:bg-blue-400/[0.08]" aria-label={`Restore ${setup.name}`}><ArchiveRestore className="mr-1.5 h-3.5 w-3.5" />Restore</Button></div>) : <div className="rounded-xl border border-dashed border-white/[0.10] p-4 text-sm text-slate-500">Archived setups remain visible here and can be restored at any time.</div>}</div></div>
          </div>
        </Card>
      </div>
    </div>
  );
}

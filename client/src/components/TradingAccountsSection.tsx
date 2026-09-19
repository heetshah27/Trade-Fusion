import React, { useState } from "react";
import { ArrowRight, Bot, Check, Pencil, Plus, ShieldCheck, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";

type AccountType = "none" | "personal_funds" | "live_funded" | "challenge_phase_1" | "challenge_phase_2" | "demo";
type Account = { id: number; name: string; initialBalance: number; currentBalance: number; accountType: AccountType };

const accountTypeLabels: Record<AccountType, string> = {
  none: "None",
  personal_funds: "Personal Funds",
  live_funded: "Live Funded",
  challenge_phase_1: "Challenge Phase 1",
  challenge_phase_2: "Challenge Phase 2",
  demo: "Demo",
};

const emptyForm = { name: "", initialBalance: "", currentBalance: "", accountType: "none" as AccountType };

function money(value: number) {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
}

export default function TradingAccountsSection() {
  const utils = trpc.useUtils();
  const { data: accounts = [], isLoading } = trpc.tradingAccounts.list.useQuery();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const create = trpc.tradingAccounts.create.useMutation({ onSuccess: async () => { reset(); await utils.tradingAccounts.list.invalidate(); } });
  const update = trpc.tradingAccounts.update.useMutation({ onSuccess: async () => { reset(); await utils.tradingAccounts.list.invalidate(); } });
  const remove = trpc.tradingAccounts.delete.useMutation({ onSuccess: async () => { await utils.tradingAccounts.list.invalidate(); } });
  const working = create.isPending || update.isPending || remove.isPending;

  const reset = () => { setForm(emptyForm); setEditingId(null); setFormOpen(false); setError(null); };
  const beginEdit = (account: Account) => {
    setEditingId(account.id);
    setForm({ name: account.name, initialBalance: String(account.initialBalance), currentBalance: String(account.currentBalance), accountType: account.accountType });
    setFormOpen(true);
    setError(null);
  };
  const submit = () => {
    if (!form.name.trim()) return setError("Enter an account name.");
    const initialBalance = Number(form.initialBalance);
    const currentBalance = Number(form.currentBalance);
    if (!Number.isFinite(initialBalance) || initialBalance < 0 || !Number.isFinite(currentBalance) || currentBalance < 0) return setError("Enter valid non-negative balances.");
    setError(null);
    const input = { name: form.name, initialBalance, currentBalance, accountType: form.accountType };
    if (editingId) update.mutate({ id: editingId, ...input }); else create.mutate(input);
  };

  return <Card className="mt-5 border-blue-200/[0.10] bg-[#101c33] p-5 sm:p-6" data-testid="trading-accounts-section">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-blue-200/[0.12] bg-blue-400/[0.08] text-blue-200"><ShieldCheck className="h-4 w-4" /></span><div><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-blue-200">Private portfolio structure</p><h2 className="mt-1 text-lg font-semibold text-white">Trading Accounts</h2><p className="mt-1 max-w-xl text-xs leading-5 text-slate-500">Organize manual trades by account and keep balances visible in one secure workspace.</p></div></div>
      <Button type="button" onClick={() => { setFormOpen(value => !value); setEditingId(null); setForm(emptyForm); setError(null); }} className="bg-blue-500 text-white hover:bg-blue-400"><Plus className="mr-2 h-4 w-4" />Add manual account</Button>
    </div>

    {formOpen && <div className="mt-5 rounded-xl border border-blue-300/[0.16] bg-[#0a1427] p-4" aria-label="Manual account form">
      <div className="mb-4 flex items-center justify-between"><div><p className="text-sm font-medium text-white">{editingId ? "Edit manual account" : "Set up a manual account"}</p><p className="mt-1 text-xs text-slate-500">Balances are entered and maintained by you.</p></div><button type="button" onClick={reset} className="rounded-md p-1.5 text-slate-500 hover:bg-white/[0.06] hover:text-white" aria-label="Close account form"><X className="h-4 w-4" /></button></div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="sm:col-span-2 lg:col-span-1"><span className="mb-1.5 block text-[10px] uppercase tracking-wider text-slate-500">Name</span><input value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} maxLength={80} placeholder="e.g. Apex 50K" className="h-10 w-full rounded-lg border border-white/[0.10] bg-[#07101f] px-3 text-sm text-white outline-none focus:ring-1 focus:ring-blue-300/60" /></label>
        <label><span className="mb-1.5 block text-[10px] uppercase tracking-wider text-slate-500">Initial balance</span><input type="number" min="0" step="0.01" value={form.initialBalance} onChange={event => setForm({ ...form, initialBalance: event.target.value })} placeholder="10000" className="h-10 w-full rounded-lg border border-white/[0.10] bg-[#07101f] px-3 font-mono text-sm text-white outline-none focus:ring-1 focus:ring-blue-300/60" /></label>
        <label><span className="mb-1.5 block text-[10px] uppercase tracking-wider text-slate-500">Current balance</span><input type="number" min="0" step="0.01" value={form.currentBalance} onChange={event => setForm({ ...form, currentBalance: event.target.value })} placeholder="10000" className="h-10 w-full rounded-lg border border-white/[0.10] bg-[#07101f] px-3 font-mono text-sm text-white outline-none focus:ring-1 focus:ring-blue-300/60" /></label>
        <label><span className="mb-1.5 block text-[10px] uppercase tracking-wider text-slate-500">Account type</span><Select value={form.accountType} onValueChange={value => setForm({ ...form, accountType: value as AccountType })}><SelectTrigger className="h-10 border-white/[0.10] bg-[#07101f] text-sm text-white"><SelectValue /></SelectTrigger><SelectContent className="border-white/[0.10] bg-[#101c33] text-white">{Object.entries(accountTypeLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></label>
      </div>
      {error && <p role="alert" className="mt-3 text-xs text-red-300">{error}</p>}
      <div className="mt-4 flex flex-wrap justify-end gap-2"><Button type="button" variant="outline" onClick={reset} className="border-white/[0.12] text-slate-300">Cancel</Button><Button type="button" onClick={submit} disabled={working} className="bg-blue-500 text-white hover:bg-blue-400"><Check className="mr-2 h-4 w-4" />{editingId ? "Save account" : "Create account"}</Button></div>
    </div>}

    <div className="mt-5 grid gap-3 lg:grid-cols-2">
      {isLoading ? <p className="py-4 text-sm text-slate-500">Loading your private accounts…</p> : accounts.length ? accounts.map(account => { const change = account.currentBalance - account.initialBalance; return <div key={account.id} className="rounded-xl border border-white/[0.08] bg-[#0a1427] p-4 transition-colors hover:border-blue-300/[0.24]" data-testid={`trading-account-${account.id}`}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-semibold text-white">{account.name}</p><span className="mt-1 inline-flex rounded-full border border-blue-300/[0.16] bg-blue-400/[0.08] px-2 py-1 font-mono text-[9px] uppercase tracking-[0.10em] text-blue-200">{accountTypeLabels[account.accountType]}</span></div><div className="flex gap-1"><button type="button" onClick={() => beginEdit(account)} className="rounded-md p-2 text-slate-500 hover:bg-blue-500/[0.10] hover:text-blue-200" aria-label={`Edit ${account.name}`}><Pencil className="h-3.5 w-3.5" /></button><button type="button" onClick={() => remove.mutate({ id: account.id })} disabled={working} className="rounded-md p-2 text-slate-500 hover:bg-rose-500/[0.10] hover:text-rose-200" aria-label={`Delete ${account.name}`}><Trash2 className="h-3.5 w-3.5" /></button></div></div><div className="mt-4 grid grid-cols-3 gap-2 font-mono"><div><p className="text-[9px] uppercase tracking-wider text-slate-600">Initial</p><p className="mt-1 text-sm text-slate-300">{money(account.initialBalance)}</p></div><div><p className="text-[9px] uppercase tracking-wider text-slate-600">Current</p><p className="mt-1 text-sm text-white">{money(account.currentBalance)}</p></div><div><p className="text-[9px] uppercase tracking-wider text-slate-600">Change</p><p className={`mt-1 text-sm ${change > 0 ? "text-emerald-300" : change < 0 ? "text-rose-300" : "text-slate-400"}`}>{change > 0 ? "+" : ""}{money(change)}</p></div></div></div>; }) : <div className="rounded-xl border border-dashed border-white/[0.10] p-5 text-sm text-slate-500">No trading accounts yet. Add your first manual account to organize future trade logs.</div>}
      <div className="rounded-xl border border-dashed border-blue-300/[0.20] bg-blue-400/[0.035] p-4"><div className="flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-blue-300/[0.16] bg-blue-400/[0.08] text-blue-200"><Bot className="h-4 w-4" /></span><div><div className="flex items-center gap-2"><p className="text-sm font-medium text-white">Automatic Account</p><span className="rounded-full border border-amber-300/[0.20] bg-amber-300/[0.08] px-2 py-1 font-mono text-[9px] uppercase tracking-wider text-amber-200">Planned</span></div><p className="mt-1 text-xs leading-5 text-slate-500">Broker and platform sync will be added later. Your manual accounts are ready now without VPS or broker credentials.</p><span className="mt-3 inline-flex items-center text-[10px] font-medium text-blue-200">Future sync architecture <ArrowRight className="ml-1.5 h-3 w-3" /></span></div></div></div>
    </div>
  </Card>;
}

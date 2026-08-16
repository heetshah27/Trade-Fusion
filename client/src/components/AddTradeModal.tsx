// Trade Journal — Add/Edit trade modal
// Design: Trading Terminal — clean form, dark inputs, precise labels
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { trpc } from '@/lib/trpc';
import type { Trade, TradeDirection } from '@/lib/tradeTypes';
import { generateId } from '@/lib/tradeTypes';
import { calculateTradePnl } from '@/lib/tradeInstruments';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (trade: Trade) => void;
  editTrade?: Trade | null;
}

const today = new Date().toISOString().slice(0, 10);

const empty = (): Omit<Trade, 'id' | 'pnl'> => ({
  date: today,
  symbol: '',
  direction: 'LONG',
  entryPrice: 0,
  exitPrice: 0,
  quantity: 1,
  fees: 0,
  setupId: null,
  setupTag: '',
  marketSession: '',
  instrumentCategory: '',
  tradeQuality: '',
  ruleFollowed: null,
  notes: '',
});

export default function AddTradeModal({ open, onClose, onSave, editTrade }: Props) {
  const [form, setForm] = useState(empty());
  const [manualPnl, setManualPnl] = useState('');
  const [useManual, setUseManual] = useState(false);
  const [newSetupName, setNewSetupName] = useState('');
  const utils = trpc.useUtils();
  const { data: setups = [] } = trpc.setups.list.useQuery(undefined, { enabled: open });
  const createSetup = trpc.setups.create.useMutation({
    onSuccess: setup => {
      set('setupId', setup.id);
      set('setupTag', setup.name);
      setNewSetupName('');
      utils.setups.list.invalidate();
    },
  });
  const activeSetups = setups.filter(setup => !setup.isArchived);

  useEffect(() => {
    if (editTrade) {
      const { id: _id, pnl, ...rest } = editTrade;
      setForm(rest);
      setManualPnl(pnl.toString());
      setUseManual(false);
      setNewSetupName('');
    } else {
      setForm(empty());
      setManualPnl('');
      setUseManual(false);
      setNewSetupName('');
    }
  }, [editTrade, open]);

  const pnlDetails = calculateTradePnl(form);
  const computed = pnlDetails.net;
  const displayPnl = useManual ? parseFloat(manualPnl) || 0 : computed;

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    if (!form.symbol.trim()) return;
    const trade: Trade = {
      id: editTrade?.id ?? generateId(),
      ...form,
      pnl: parseFloat(displayPnl.toFixed(2)),
    };
    onSave(trade);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">
            {editTrade ? 'Edit Trade' : 'Log New Trade'}
          </DialogTitle>
          <DialogDescription className="sr-only">Record a private live journal trade with optional setup and execution context.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-2">
          {/* Date */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Date</Label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => set('date', e.target.value)}
              className="bg-input border-border font-mono text-sm"
            />
          </div>

          {/* Symbol */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Symbol</Label>
            <Input
              placeholder="e.g. AAPL, BTC"
              value={form.symbol}
              onChange={(e) => set('symbol', e.target.value.toUpperCase())}
              className="bg-input border-border font-mono text-sm uppercase"
            />
          </div>

          {/* Direction */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Direction</Label>
            <Select
              value={form.direction}
              onValueChange={(v) => set('direction', v as TradeDirection)}
            >
              <SelectTrigger className="bg-input border-border font-mono text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="LONG">LONG ▲</SelectItem>
                <SelectItem value="SHORT">SHORT ▼</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quantity */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Size · {pnlDetails.profile.quantityLabel}</Label>
            <Input
              type="number"
              min="0"
              step="any"
              value={form.quantity || ''}
              onChange={(e) => set('quantity', parseFloat(e.target.value) || 0)}
              className="bg-input border-border font-mono text-sm"
            />
          </div>

          {/* Entry Price */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Entry Price</Label>
            <Input
              type="number"
              min="0"
              step="any"
              value={form.entryPrice || ''}
              onChange={(e) => set('entryPrice', parseFloat(e.target.value) || 0)}
              className="bg-input border-border font-mono text-sm"
            />
          </div>

          {/* Exit Price */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Exit Price</Label>
            <Input
              type="number"
              min="0"
              step="any"
              value={form.exitPrice || ''}
              onChange={(e) => set('exitPrice', parseFloat(e.target.value) || 0)}
              className="bg-input border-border font-mono text-sm"
            />
          </div>

          {/* Fees */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Fees / Commission</Label>
            <Input
              type="number"
              min="0"
              step="any"
              value={form.fees || ''}
              onChange={(e) => set('fees', parseFloat(e.target.value) || 0)}
              className="bg-input border-border font-mono text-sm"
            />
          </div>

          <div className="col-span-2 rounded-xl border border-primary/15 bg-primary/[0.04] p-3">
            <div className="flex items-center justify-between gap-3"><Label className="text-xs text-muted-foreground uppercase tracking-wider">Setup <span className="normal-case tracking-normal text-slate-500">optional · private to you</span></Label>{form.setupTag && <span className="rounded-full bg-primary/15 px-2 py-0.5 font-mono text-[10px] text-primary">{form.setupTag}</span>}</div>
            <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
              <select aria-label="Saved setup" value={form.setupId ?? 'none'} onChange={(event) => { const selected = activeSetups.find(setup => setup.id === Number(event.target.value)); set('setupId', selected?.id ?? null); set('setupTag', selected?.name ?? ''); }} className="h-9 rounded-md border border-border bg-input px-3 font-mono text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"><option value="none">Select a saved setup</option>{activeSetups.map(setup => <option key={setup.id} value={setup.id}>{setup.name}</option>)}</select>
              <div className="flex gap-2"><Input aria-label="New setup name" placeholder="New setup" value={newSetupName} maxLength={80} onChange={event => setNewSetupName(event.target.value)} className="h-9 min-w-0 bg-input border-border font-mono text-sm" /><Button type="button" size="sm" disabled={!newSetupName.trim() || createSetup.isPending} onClick={() => createSetup.mutate({ name: newSetupName })}>{createSetup.isPending ? 'Saving…' : '+ Add'}</Button></div>
            </div>
            {createSetup.error && <p role="status" className="mt-2 text-xs text-destructive">{createSetup.error.message}</p>}
          </div>

          <div className="col-span-2 flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Market session <span className="normal-case tracking-normal text-slate-500">optional</span></Label>
            <select value={form.marketSession || 'none'} onChange={(e) => set('marketSession', (e.target.value === 'none' ? '' : e.target.value) as typeof form.marketSession)} className="h-9 rounded-md border border-border bg-input px-3 font-mono text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"><option value="none">Not specified</option><option value="Asia">Asia</option><option value="London">London</option><option value="New York">New York</option><option value="Other">Other</option></select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Instrument category <span className="normal-case tracking-normal text-slate-500">optional</span></Label>
            <select aria-label="Instrument category" value={form.instrumentCategory || 'none'} onChange={event => set('instrumentCategory', (event.target.value === 'none' ? '' : event.target.value) as typeof form.instrumentCategory)} className="h-9 rounded-md border border-border bg-input px-3 font-mono text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"><option value="none">Not specified</option><option value="forex">Forex</option><option value="metals">Metals</option><option value="crypto">Crypto</option><option value="indices">Indices</option><option value="equities">Equities</option><option value="options">Options</option><option value="other">Other</option></select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Trade quality <span className="normal-case tracking-normal text-slate-500">optional</span></Label>
            <select aria-label="Trade quality" value={form.tradeQuality || 'none'} onChange={event => set('tradeQuality', (event.target.value === 'none' ? '' : event.target.value) as typeof form.tradeQuality)} className="h-9 rounded-md border border-border bg-input px-3 font-mono text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"><option value="none">Not specified</option><option value="A_PLUS">A+ setup</option><option value="VALID">Valid setup</option><option value="FORCED">Forced trade</option><option value="RULE_BREAK">Rule break</option></select>
          </div>

          <div className="col-span-2 flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Followed trading plan? <span className="normal-case tracking-normal text-slate-500">optional</span></Label>
            <select aria-label="Rule followed" value={form.ruleFollowed === null || form.ruleFollowed === undefined ? 'none' : form.ruleFollowed ? 'yes' : 'no'} onChange={event => set('ruleFollowed', event.target.value === 'none' ? null : event.target.value === 'yes')} className="h-9 rounded-md border border-border bg-input px-3 font-mono text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"><option value="none">Not reviewed</option><option value="yes">Yes · followed plan</option><option value="no">No · deviation from plan</option></select>
          </div>

          {/* P&L display / override */}
          <div className="col-span-2 flex flex-col gap-1.5 rounded-xl border border-blue-400/15 bg-blue-500/[.045] p-3">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              Assisted P&amp;L {useManual ? '(manual override)' : '(auto)'}
              <button
                type="button"
                onClick={() => setUseManual((v) => !v)}
                className="ml-2 text-primary underline text-xs"
              >
                {useManual ? 'use auto' : 'override'}
              </button>
            </Label>
            {useManual ? (
              <Input
                type="number"
                step="any"
                value={manualPnl}
                onChange={(e) => setManualPnl(e.target.value)}
                className="bg-input border-border font-mono text-sm"
              />
            ) : <><div className="h-9 flex items-center px-3 rounded-md border border-border font-mono text-sm" style={{ color: computed > 0 ? 'var(--profit)' : computed < 0 ? 'var(--loss)' : 'var(--muted-foreground)', background: computed > 0 ? 'var(--profit-bg)' : computed < 0 ? 'var(--loss-bg)' : 'transparent' }}>{computed >= 0 ? '+' : ''}{computed.toFixed(2)}</div><p className="mt-1 text-[10px] leading-4 text-slate-500"><span className="font-medium text-blue-200">{pnlDetails.profile.label}{pnlDetails.profile.estimate ? ' · estimate' : ''}</span> · {pnlDetails.formula}</p><p className="text-[10px] leading-4 text-slate-600">{pnlDetails.profile.basis}</p></>}
          </div>
        </div>

        {/* Notes */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">Notes</Label>
          <Textarea
            placeholder="Trade rationale, emotions, lessons learned..."
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            rows={3}
            className="bg-input border-border text-sm resize-none"
          />
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="border-border">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!form.symbol.trim()}>
            {editTrade ? 'Save Changes' : 'Log Trade'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

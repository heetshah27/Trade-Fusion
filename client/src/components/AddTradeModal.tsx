// Trade Journal — Add/Edit trade modal
// Design: Trading Terminal — clean form, dark inputs, precise labels
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { Trade, TradeDirection } from '@/lib/tradeTypes';
import { generateId } from '@/lib/tradeTypes';
import { calculateTradePnl } from '@/lib/tradeInstruments';
import { InstrumentPicker } from '@/components/InstrumentPicker';

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

  useEffect(() => {
    if (editTrade) {
      const { id: _id, pnl, ...rest } = editTrade;
      setForm(rest);
      setManualPnl(pnl.toString());
      setUseManual(false);
    } else {
      setForm(empty());
      setManualPnl('');
      setUseManual(false);
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
          <DialogDescription className="sr-only">Record a private live trade with its core execution details and notes.</DialogDescription>
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

          {/* Instrument */}
          <div className="col-span-2 flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-3"><Label className="text-xs text-muted-foreground uppercase tracking-wider">Instrument</Label><span className="text-[10px] text-slate-500">Search a listed market or enter a custom symbol</span></div>
            <InstrumentPicker symbol={form.symbol} onSelect={(instrument) => set('symbol', instrument.symbol)} />
            <Input aria-label="Custom instrument symbol" placeholder="Or type custom symbol, e.g. AAPL, BTC" value={form.symbol} onChange={(event) => set('symbol', event.target.value.toUpperCase())} className="h-9 bg-input border-border font-mono text-sm uppercase" />
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

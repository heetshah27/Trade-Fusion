// Trade Journal — Add/Edit trade modal
// Design: Trading Terminal — clean form, dark inputs, precise labels
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { Trade, TradeDirection } from '@/lib/tradeTypes';
import { computePnl, generateId } from '@/lib/tradeTypes';

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

  const computed = computePnl(form);
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
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Quantity / Contracts</Label>
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
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              P&L {useManual ? '(manual)' : '(auto)'}
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
            ) : (
              <div
                className="h-9 flex items-center px-3 rounded-md border border-border font-mono text-sm"
                style={{
                  color: computed > 0 ? 'var(--profit)' : computed < 0 ? 'var(--loss)' : 'var(--muted-foreground)',
                  background: computed > 0 ? 'var(--profit-bg)' : computed < 0 ? 'var(--loss-bg)' : 'transparent',
                }}
              >
                {computed >= 0 ? '+' : ''}
                {computed.toFixed(2)}
              </div>
            )}
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

// Trade Journal — Day group row component
// Design: Trading Terminal — color-coded day rows, expandable trade list
import { useState } from 'react';
import { ChevronDown, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { DayGroup, Trade } from '@/lib/tradeTypes';
import { formatCurrency, formatDate } from '@/lib/tradeTypes';

interface Props {
  group: DayGroup;
  onEdit: (trade: Trade) => void;
  onDelete: (tradeId: string) => void;
}

export default function DayRow({ group, onEdit, onDelete }: Props) {
  const [expanded, setExpanded] = useState(false);
  const isProfit = group.netPnl > 0;
  const isLoss = group.netPnl < 0;

  const rowBg = isProfit
    ? 'var(--profit-bg)'
    : isLoss
    ? 'var(--loss-bg)'
    : 'transparent';
  const rowBorder = isProfit
    ? 'var(--profit-border)'
    : isLoss
    ? 'var(--loss-border)'
    : 'var(--border)';
  const pnlColor = isProfit
    ? 'var(--profit)'
    : isLoss
    ? 'var(--loss)'
    : 'var(--muted-foreground)';

  return (
    <div
      className="rounded-lg mb-2 overflow-hidden transition-all duration-200"
      style={{ background: rowBg, border: `1px solid ${rowBorder}` }}
    >
      {/* Day summary row */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:brightness-110 transition-all duration-150"
      >
        <span className="text-muted-foreground w-4 flex-shrink-0">
          {expanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </span>

        {/* Date */}
        <span className="font-medium text-sm w-44 flex-shrink-0 text-foreground">
          {formatDate(group.date)}
        </span>

        {/* Trades count */}
        <span className="text-xs text-muted-foreground w-24 flex-shrink-0">
          {group.tradeCount} trade{group.tradeCount !== 1 ? 's' : ''}
        </span>

        {/* Win/Loss */}
        <span className="text-xs w-24 flex-shrink-0">
          <span style={{ color: 'var(--profit)' }}>{group.wins}W</span>
          <span className="text-muted-foreground mx-1">/</span>
          <span style={{ color: 'var(--loss)' }}>{group.losses}L</span>
        </span>

        {/* Fees */}
        <span className="text-xs text-muted-foreground font-mono w-24 flex-shrink-0">
          -{formatCurrency(group.totalFees)} fees
        </span>

        {/* Net P&L — right-aligned */}
        <span
          className="ml-auto font-semibold font-mono text-base"
          style={{ color: pnlColor }}
        >
          {group.netPnl >= 0 ? '+' : ''}
          {formatCurrency(group.netPnl)}
        </span>

        {/* Profit/Loss badge */}
        <span
          className="text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded ml-3 w-16 text-center flex-shrink-0"
          style={{
            color: pnlColor,
            border: `1px solid ${rowBorder}`,
          }}
        >
          {isProfit ? 'PROFIT' : isLoss ? 'LOSS' : 'EVEN'}
        </span>
      </button>

      {/* Expanded trade list */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="trades"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-border/40 mx-4" />
            <div className="px-4 py-2">
              {/* Sub-header */}
              <div className="grid grid-cols-[1fr_80px_90px_90px_90px_90px_90px_80px] gap-2 text-xs text-muted-foreground uppercase tracking-wider pb-1 px-1">
                <span>Symbol</span>
                <span>Dir</span>
                <span>Qty</span>
                <span>Entry</span>
                <span>Exit</span>
                <span>Fees</span>
                <span>P&L</span>
                <span></span>
              </div>
              {group.trades.map((trade) => (
                <TradeSubRow
                  key={trade.id}
                  trade={trade}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TradeSubRow({
  trade,
  onEdit,
  onDelete,
}: {
  trade: Trade;
  onEdit: (t: Trade) => void;
  onDelete: (id: string) => void;
}) {
  const isWin = trade.pnl > 0;
  const isLoss = trade.pnl < 0;

  return (
    <div className="grid grid-cols-[1fr_80px_90px_90px_90px_90px_90px_80px] gap-2 items-center py-1.5 px-1 rounded hover:bg-white/5 transition-colors group text-sm">
      <span className="font-mono font-semibold text-foreground">{trade.symbol}</span>
      <span
        className="font-mono text-xs font-bold"
        style={{ color: trade.direction === 'LONG' ? 'var(--profit)' : 'var(--loss)' }}
      >
        {trade.direction}
      </span>
      <span className="font-mono text-muted-foreground">{trade.quantity}</span>
      <span className="font-mono text-muted-foreground">${trade.entryPrice.toFixed(2)}</span>
      <span className="font-mono text-muted-foreground">${trade.exitPrice.toFixed(2)}</span>
      <span className="font-mono text-muted-foreground">${trade.fees.toFixed(2)}</span>
      <span
        className="font-mono font-semibold"
        style={{ color: isWin ? 'var(--profit)' : isLoss ? 'var(--loss)' : 'var(--muted-foreground)' }}
      >
        {trade.pnl >= 0 ? '+' : ''}{trade.pnl.toFixed(2)}
      </span>
      <span className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={() => onEdit(trade)}
          className="p-1 rounded hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(trade.id)}
          className="p-1 rounded hover:bg-white/10 text-muted-foreground hover:text-destructive transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </span>
    </div>
  );
}


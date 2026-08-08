// Trade Journal — Stats bar component
// Design: Trading Terminal — KPI cards across the top, monospaced numbers
import { formatCurrency } from '@/lib/tradeTypes';
import type { Trade } from '@/lib/tradeTypes';

interface Props {
  trades: Trade[];
}

export default function TradeStats({ trades }: Props) {
  const totalPnl = trades.reduce((s, t) => s + t.pnl, 0);
  const wins = trades.filter((t) => t.pnl > 0).length;
  const losses = trades.filter((t) => t.pnl < 0).length;
  const winRate = trades.length > 0 ? (wins / trades.length) * 100 : 0;
  const avgWin =
    wins > 0
      ? trades.filter((t) => t.pnl > 0).reduce((s, t) => s + t.pnl, 0) / wins
      : 0;
  const avgLoss =
    losses > 0
      ? trades.filter((t) => t.pnl < 0).reduce((s, t) => s + t.pnl, 0) / losses
      : 0;
  const profitFactor =
    avgLoss !== 0 ? Math.abs(avgWin / avgLoss) : avgWin > 0 ? Infinity : 0;

  const stats = [
    {
      label: 'Total P&L',
      value: formatCurrency(totalPnl),
      color: totalPnl > 0 ? 'profit' : totalPnl < 0 ? 'loss' : 'neutral',
    },
    {
      label: 'Win Rate',
      value: `${winRate.toFixed(1)}%`,
      color: winRate >= 50 ? 'profit' : winRate > 0 ? 'loss' : 'neutral',
    },
    {
      label: 'Total Trades',
      value: trades.length.toString(),
      color: 'neutral',
    },
    {
      label: 'Wins / Losses',
      value: `${wins} / ${losses}`,
      color: 'neutral',
    },
    {
      label: 'Avg Win',
      value: formatCurrency(avgWin),
      color: 'profit',
    },
    {
      label: 'Avg Loss',
      value: formatCurrency(avgLoss),
      color: 'loss',
    },
    {
      label: 'Profit Factor',
      value: isFinite(profitFactor) ? profitFactor.toFixed(2) : '∞',
      color: profitFactor >= 1 ? 'profit' : 'loss',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-lg border border-border bg-card px-4 py-3 flex flex-col gap-1"
        >
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
            {s.label}
          </span>
          <span
            className="text-lg font-semibold font-mono leading-tight"
            style={{
              color:
                s.color === 'profit'
                  ? 'var(--profit)'
                  : s.color === 'loss'
                  ? 'var(--loss)'
                  : 'var(--foreground)',
            }}
          >
            {s.value}
          </span>
        </div>
      ))}
    </div>
  );
}

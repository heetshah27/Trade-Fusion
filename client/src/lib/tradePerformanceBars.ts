export type TradePerformanceBarInput = {
  id?: number;
  date: string;
  pnl: number;
  symbol?: string;
};

export function buildTradePerformanceBars(trades: TradePerformanceBarInput[], limit = 12) {
  const bars = [...trades]
    .sort((left, right) => left.date.localeCompare(right.date) || (left.id ?? 0) - (right.id ?? 0))
    .slice(-limit);
  const maxAbsolutePnl = Math.max(1, ...bars.map(bar => Math.abs(bar.pnl)));
  return { bars, maxAbsolutePnl };
}

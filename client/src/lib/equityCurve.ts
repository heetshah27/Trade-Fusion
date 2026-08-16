export type EquityCurveTrade = {
  date: string;
  pnl: number;
  id?: number;
};

export type EquityCurvePoint = EquityCurveTrade & {
  balance: number;
  x: number;
  y: number;
};

export type EquityCurve = {
  points: EquityCurvePoint[];
  linePath: string;
  areaPath: string;
  zeroY: number;
};

const chart = { left: 28, right: 572, top: 20, bottom: 180 };

export function buildEquityCurve(trades: EquityCurveTrade[]): EquityCurve | null {
  if (!trades.length) return null;

  const ordered = [...trades].sort((a, b) => a.date.localeCompare(b.date) || (a.id ?? 0) - (b.id ?? 0));
  let balance = 0;
  const balances = ordered.map(trade => {
    balance += trade.pnl;
    return balance;
  });

  const rawMin = Math.min(0, ...balances);
  const rawMax = Math.max(0, ...balances);
  const padding = Math.max((rawMax - rawMin) * 0.16, 1);
  const min = rawMin - padding;
  const max = rawMax + padding;
  const range = Math.max(max - min, 1);
  const yFor = (value: number) => chart.bottom - ((value - min) / range) * (chart.bottom - chart.top);
  const zeroY = yFor(0);

  const points = ordered.map((trade, index) => ({
    ...trade,
    balance: balances[index],
    x: chart.left + ((index + 1) / ordered.length) * (chart.right - chart.left),
    y: yFor(balances[index]),
  }));

  const linePath = points.reduce((path, point) => `${path} H ${point.x.toFixed(1)} V ${point.y.toFixed(1)}`, `M ${chart.left} ${zeroY.toFixed(1)}`);
  const areaPath = `${linePath} L ${chart.right} ${chart.bottom} L ${chart.left} ${chart.bottom} Z`;

  return { points, linePath, areaPath, zeroY };
}

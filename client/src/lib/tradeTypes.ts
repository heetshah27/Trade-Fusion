// Trade Journal — Core types and utilities
// Design: Trading Terminal — dark, data-dense, green/red P&L signals

export type TradeDirection = 'LONG' | 'SHORT';
export type TradeStatus = 'WIN' | 'LOSS' | 'BREAKEVEN';

export interface Trade {
  id: number | string;
  date: string;          // ISO date string YYYY-MM-DD
  symbol: string;
  direction: TradeDirection;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  pnl: number;           // Computed or manual override
  fees: number;
  setupId?: number | null;
  setupTag?: string;
  marketSession?: string;
  instrumentCategory?: string;
  tradeQuality?: string;
  ruleFollowed?: boolean | null;
  notes: string;
}

export interface DayGroup {
  date: string;
  trades: Trade[];
  totalPnl: number;
  totalFees: number;
  netPnl: number;        // totalPnl - totalFees
  tradeCount: number;
  wins: number;
  losses: number;
}

export function computePnl(trade: Omit<Trade, 'id' | 'pnl'>): number {
  const raw =
    trade.direction === 'LONG'
      ? (trade.exitPrice - trade.entryPrice) * trade.quantity
      : (trade.entryPrice - trade.exitPrice) * trade.quantity;
  return parseFloat((raw - trade.fees).toFixed(2));
}

export function groupByDay(trades: Trade[]): DayGroup[] {
  const map = new Map<string, Trade[]>();
  for (const t of trades) {
    if (!map.has(t.date)) map.set(t.date, []);
    map.get(t.date)!.push(t);
  }
  const groups: DayGroup[] = [];
  map.forEach((dayTrades, date) => {
    const totalPnl = dayTrades.reduce((s, t) => s + t.pnl, 0);
    const totalFees = dayTrades.reduce((s, t) => s + t.fees, 0);
    const wins = dayTrades.filter((t) => t.pnl > 0).length;
    const losses = dayTrades.filter((t) => t.pnl < 0).length;
    groups.push({
      date,
      trades: dayTrades,
      totalPnl: parseFloat(totalPnl.toFixed(2)),
      totalFees: parseFloat(totalFees.toFixed(2)),
      netPnl: parseFloat((totalPnl - totalFees).toFixed(2)),
      tradeCount: dayTrades.length,
      wins,
      losses,
    });
  });
  return groups.sort((a, b) => b.date.localeCompare(a.date));
}

export function formatCurrency(value: number): string {
  const abs = Math.abs(value);
  const formatted = abs.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return value < 0 ? `-$${formatted}` : `$${formatted}`;
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

// Local storage helpers
const STORAGE_KEY = 'trade-journal-v1';

export function loadTrades(): Trade[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveTrades(trades: Trade[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trades));
}

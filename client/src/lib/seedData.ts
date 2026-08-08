// Demo seed data for testing the trade journal
import type { Trade } from './tradeTypes';

export const SEED_TRADES: Trade[] = [
  // Aug 8 — profit day
  { id: 's1', date: '2026-08-08', symbol: 'AAPL', direction: 'LONG', entryPrice: 185.50, exitPrice: 188.20, quantity: 100, fees: 5, pnl: 265, notes: 'Breakout above resistance' },
  { id: 's2', date: '2026-08-08', symbol: 'TSLA', direction: 'SHORT', entryPrice: 250.00, exitPrice: 247.50, quantity: 50, fees: 4, pnl: 121, notes: 'Short on rejection' },
  // Aug 7 — loss day
  { id: 's3', date: '2026-08-07', symbol: 'NVDA', direction: 'LONG', entryPrice: 480.00, exitPrice: 475.50, quantity: 20, fees: 6, pnl: -96, notes: 'Stopped out — bad entry' },
  { id: 's4', date: '2026-08-07', symbol: 'SPY', direction: 'LONG', entryPrice: 540.00, exitPrice: 538.00, quantity: 30, fees: 3, pnl: -63, notes: 'Market reversal' },
  // Aug 6 — profit day
  { id: 's5', date: '2026-08-06', symbol: 'MSFT', direction: 'LONG', entryPrice: 415.00, exitPrice: 420.50, quantity: 40, fees: 5, pnl: 215, notes: 'Earnings gap fill' },
  // Aug 5 — breakeven
  { id: 's6', date: '2026-08-05', symbol: 'AMZN', direction: 'SHORT', entryPrice: 195.00, exitPrice: 195.05, quantity: 100, fees: 5, pnl: -5, notes: 'Flat day, small loss to fees' },
];

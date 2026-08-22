import type { Trade } from "./tradeTypes";

export type WeeklyRecap = {
  startDate: string;
  endDate: string;
  tradeCount: number;
  wins: number;
  losses: number;
  winRate: number;
  recordedPnl: number;
  focusSymbols: string[];
  bestTrade: Trade | null;
  ruleFollowRate: number | null;
};

function parseIsoDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

function formatIsoDate(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getWeeklyRecap(trades: Trade[], endDate: string): WeeklyRecap {
  const end = parseIsoDate(endDate);
  const start = new Date(end);
  start.setDate(start.getDate() - 6);
  const startDate = formatIsoDate(start);
  const selected = trades.filter((trade) => trade.date >= startDate && trade.date <= endDate);
  const wins = selected.filter((trade) => Number(trade.pnl) > 0).length;
  const losses = selected.filter((trade) => Number(trade.pnl) < 0).length;
  const scoredTrades = selected.filter((trade) => trade.ruleFollowed !== null && trade.ruleFollowed !== undefined);
  const focusSymbols = Array.from(new Set(selected.map((trade) => trade.symbol).filter(Boolean))).slice(0, 3);
  const bestTrade = selected.reduce<Trade | null>((best, trade) => {
    return !best || Number(trade.pnl) > Number(best.pnl) ? trade : best;
  }, null);

  return {
    startDate,
    endDate,
    tradeCount: selected.length,
    wins,
    losses,
    winRate: selected.length ? Math.round((wins / selected.length) * 100) : 0,
    recordedPnl: selected.reduce((total, trade) => total + Number(trade.pnl), 0),
    focusSymbols,
    bestTrade,
    ruleFollowRate: scoredTrades.length
      ? Math.round((scoredTrades.filter((trade) => trade.ruleFollowed).length / scoredTrades.length) * 100)
      : null,
  };
}

export function formatRecapRange(recap: Pick<WeeklyRecap, "startDate" | "endDate">) {
  const formatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
  return `${formatter.format(parseIsoDate(recap.startDate))} – ${formatter.format(parseIsoDate(recap.endDate))}`;
}

export function formatRecordedPnl(value: number) {
  const absolute = Math.abs(value).toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 });
  return `${value > 0 ? "+" : value < 0 ? "−" : ""}${absolute}`;
}

export function buildWeeklyCaption(recap: WeeklyRecap, lesson: string, showPnl: boolean) {
  const range = formatRecapRange(recap);
  if (!recap.tradeCount) {
    return `WEEKLY REVIEW · ${range}\n\nNo trades to share this week. Protecting capital and waiting for clean conditions is part of the process too.\n\n${lesson}\n\nThis account documents my personal process, not trade signals or financial advice.\n\n#forextrader #tradingjournal #riskmanagement #fxlife`;
  }

  const focus = recap.focusSymbols.length ? recap.focusSymbols.join(" · ") : "focused execution";
  const scoreline = [`${recap.tradeCount} logged trade${recap.tradeCount === 1 ? "" : "s"}`, `${recap.winRate}% win rate`, `focus: ${focus}`];
  if (showPnl) scoreline.splice(1, 0, `recorded P&L: ${formatRecordedPnl(recap.recordedPnl)}`);

  return `WEEKLY REVIEW · ${range}\n\n${scoreline.join(" | ")}\n\n${lesson}\n\nMy focus is repeatable execution, not perfect results. Every chart is shared after the fact as a journal entry—not a signal or financial advice.\n\n#forextrader #tradingjournal #priceaction #riskmanagement #fxlife`;
}

export type ReplayInterval = "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d";

const supportedSymbols = new Set(["BTCUSD", "ETHUSD", "SOLUSD", "EURUSD", "GBPUSD", "USDJPY", "XAUUSD"]);

export function toReplaySymbol(symbol: string) {
  const normalized = symbol.replace(/[^A-Za-z]/g, "").toUpperCase();
  return supportedSymbols.has(normalized) ? normalized as "BTCUSD" | "ETHUSD" | "SOLUSD" | "EURUSD" | "GBPUSD" | "USDJPY" | "XAUUSD" : null;
}

export function toReplayInterval(timeframe: string): ReplayInterval {
  const normalized = timeframe.trim().toLowerCase();
  if (["1m", "5m", "15m", "30m", "1h", "4h", "1d"].includes(normalized)) return normalized as ReplayInterval;
  if (normalized === "60m" || normalized === "1hour") return "1h";
  if (normalized === "240m" || normalized === "4hour") return "4h";
  if (normalized === "daily" || normalized === "day") return "1d";
  return "1h";
}

export function replayDateLabel(timestamp: number) {
  return new Date(timestamp * 1000).toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

export function filterReplayRange<T extends { time: number }>(points: T[], rangeDays: number | null) {
  if (!rangeDays || !points.length) return points;
  const newestTime = points[points.length - 1].time;
  const cutoff = newestTime - rangeDays * 86_400;
  return points.filter(point => point.time >= cutoff);
}

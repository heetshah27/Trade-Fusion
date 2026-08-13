import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";

export const replaySymbolSchema = z.enum(["BTCUSD", "ETHUSD", "SOLUSD", "EURUSD", "GBPUSD", "USDJPY", "XAUUSD"]);
export const replayIntervalSchema = z.enum(["1m", "5m", "15m", "30m", "1h", "4h", "1d"]);

const KRAKEN_PAIRS = { BTCUSD: "XBTUSD", ETHUSD: "ETHUSD", SOLUSD: "SOLUSD" } as const;
const KRAKEN_INTERVALS = { "1m": 1, "5m": 5, "15m": 15, "30m": 30, "1h": 60, "4h": 240, "1d": 1440 } as const;
const ALPHA_FX = { EURUSD: ["EUR", "USD"], GBPUSD: ["GBP", "USD"], USDJPY: ["USD", "JPY"] } as const;
const TWELVE_FX_INTERVALS = { "15m": "15min", "1h": "1h" } as const;
const TWELVE_GOLD_INTERVALS = { "15m": "15min", "1h": "1h" } as const;

export type ReplayCandle = { time: number; open: number; high: number; low: number; close: number };
export type ReplayPricePoint = { time: number; value: number };
export type ReplaySeriesType = "candlestick" | "line";
type KrakenRow = [number, string, string, string, string, string, string, number, number];

export type ReplayResponse = {
  candles: ReplayCandle[];
  prices: ReplayPricePoint[];
  seriesType: ReplaySeriesType;
  source: "Kraken public OHLC" | "Alpha Vantage FX_DAILY" | "Alpha Vantage GOLD_SILVER_HISTORY" | "Twelve Data Time Series";
  sourceStatus: "live" | "unavailable";
  assetClass: "crypto" | "forex" | "gold";
  coverageStart: number | null;
  coverageEnd: number | null;
  note: string;
};

const cache = new Map<string, { expiresAt: number; value: ReplayResponse }>();
const KRAKEN_CACHE_MS = 60_000;
const ALPHA_CACHE_MS = 15 * 60_000;
const TWELVE_CACHE_MS = 5 * 60_000;

function unixDate(value: string) {
  const timestamp = Date.parse(`${value}T00:00:00Z`) / 1000;
  return Number.isFinite(timestamp) ? timestamp : null;
}

function unavailable(source: ReplayResponse["source"], assetClass: ReplayResponse["assetClass"], note: string, seriesType: ReplaySeriesType = assetClass === "gold" ? "line" : "candlestick"): ReplayResponse {
  return { candles: [], prices: [], seriesType, source, sourceStatus: "unavailable", assetClass, coverageStart: null, coverageEnd: null, note };
}

export function normalizeKrakenCandles(rows: KrakenRow[]): ReplayCandle[] {
  return rows
    .map(row => ({ time: Number(row[0]), open: Number(row[1]), high: Number(row[2]), low: Number(row[3]), close: Number(row[4]) }))
    .filter(candle => Number.isFinite(candle.time) && Number.isFinite(candle.open) && Number.isFinite(candle.high) && Number.isFinite(candle.low) && Number.isFinite(candle.close))
    .sort((left, right) => left.time - right.time);
}

export function normalizeAlphaFxDaily(series: Record<string, Record<string, string>>): ReplayCandle[] {
  return Object.entries(series)
    .map(([date, values]) => ({ time: unixDate(date), open: Number(values["1. open"]), high: Number(values["2. high"]), low: Number(values["3. low"]), close: Number(values["4. close"]) }))
    .filter((candle): candle is ReplayCandle => candle.time !== null && Number.isFinite(candle.open) && Number.isFinite(candle.high) && Number.isFinite(candle.low) && Number.isFinite(candle.close))
    .sort((left, right) => left.time - right.time);
}

export function normalizeAlphaGoldHistory(rows: Array<{ date: string; price: string }>): ReplayPricePoint[] {
  return rows
    .map(row => ({ time: unixDate(row.date), value: Number(row.price) }))
    .filter((point): point is ReplayPricePoint => point.time !== null && Number.isFinite(point.value))
    .sort((left, right) => left.time - right.time);
}

export function normalizeTwelveDataCandles(rows: Array<{ datetime: string; open: string; high: string; low: string; close: string }>): ReplayCandle[] {
  return rows
    .map(row => ({ time: Date.parse(`${row.datetime.replace(" ", "T")}Z`) / 1000, open: Number(row.open), high: Number(row.high), low: Number(row.low), close: Number(row.close) }))
    .filter(candle => Number.isFinite(candle.time) && Number.isFinite(candle.open) && Number.isFinite(candle.high) && Number.isFinite(candle.low) && Number.isFinite(candle.close))
    .sort((left, right) => left.time - right.time);
}

function cacheResponse(key: string, value: ReplayResponse, ttl: number) {
  cache.set(key, { value, expiresAt: Date.now() + ttl });
  return value;
}

async function fetchKrakenCandles(symbol: keyof typeof KRAKEN_PAIRS, interval: z.infer<typeof replayIntervalSchema>): Promise<ReplayResponse> {
  const key = `kraken:${symbol}:${interval}`;
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  try {
    const response = await fetch(`https://api.kraken.com/0/public/OHLC?pair=${KRAKEN_PAIRS[symbol]}&interval=${KRAKEN_INTERVALS[interval]}`, { signal: AbortSignal.timeout(8_000) });
    if (!response.ok) throw new Error(`Kraken returned ${response.status}`);
    const payload = await response.json() as { error?: string[]; result?: Record<string, KrakenRow[] | number> };
    if (payload.error?.length || !payload.result) throw new Error(payload.error?.join(", ") || "Kraken response did not include OHLC data");
    const rows = Object.entries(payload.result).find(([name]) => name !== "last")?.[1];
    if (!Array.isArray(rows)) throw new Error("Kraken response did not include candle rows");
    const candles = normalizeKrakenCandles(rows as KrakenRow[]);
    if (!candles.length) throw new Error("Kraken returned no usable candle rows");
    return cacheResponse(key, { candles, prices: [], seriesType: "candlestick", source: "Kraken public OHLC", sourceStatus: "live", assetClass: "crypto", coverageStart: candles[0].time, coverageEnd: candles[candles.length - 1].time, note: "Public crypto OHLC candles are source-backed by Kraken." }, KRAKEN_CACHE_MS);
  } catch (error) {
    console.warn("[Replay] Kraken OHLC unavailable", error);
    return unavailable("Kraken public OHLC", "crypto", "Kraken did not return candles. No substitute or synthetic prices are shown.");
  }
}

function alphaUrl(params: Record<string, string>) {
  const key = process.env.ALPHA_VANTAGE_API_KEY;
  if (!key) throw new Error("Alpha Vantage is not configured");
  return `https://www.alphavantage.co/query?${new URLSearchParams({ ...params, apikey: key }).toString()}`;
}

function alphaError(payload: Record<string, unknown>) {
  return typeof payload["Error Message"] === "string" || typeof payload.Information === "string" || typeof payload.Note === "string";
}

function twelveUrl(params: Record<string, string>) {
  const key = process.env.TWELVE_DATA_API_KEY;
  if (!key) throw new Error("Twelve Data is not configured");
  return `https://api.twelvedata.com/time_series?${new URLSearchParams({ ...params, apikey: key }).toString()}`;
}

async function fetchAlphaFx(symbol: keyof typeof ALPHA_FX): Promise<ReplayResponse> {
  const key = `alpha:fx:${symbol}`;
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  try {
    const [fromSymbol, toSymbol] = ALPHA_FX[symbol];
    const response = await fetch(alphaUrl({ function: "FX_DAILY", from_symbol: fromSymbol, to_symbol: toSymbol, outputsize: "compact" }), { signal: AbortSignal.timeout(12_000) });
    if (!response.ok) throw new Error(`Alpha Vantage returned ${response.status}`);
    const payload = await response.json() as Record<string, unknown>;
    const series = payload["Time Series FX (Daily)"];
    if (alphaError(payload) || !series || typeof series !== "object") throw new Error("Alpha Vantage did not return FX daily OHLC data");
    const candles = normalizeAlphaFxDaily(series as Record<string, Record<string, string>>);
    if (!candles.length) throw new Error("Alpha Vantage returned no usable FX daily candles");
    return cacheResponse(key, { candles, prices: [], seriesType: "candlestick", source: "Alpha Vantage FX_DAILY", sourceStatus: "live", assetClass: "forex", coverageStart: candles[0].time, coverageEnd: candles[candles.length - 1].time, note: "Licensed daily FX OHLC candles are supplied by Alpha Vantage. Intraday FX replay requires an expanded provider entitlement." }, ALPHA_CACHE_MS);
  } catch (error) {
    console.warn("[Replay] Alpha Vantage FX unavailable", error);
    return unavailable("Alpha Vantage FX_DAILY", "forex", "Alpha Vantage daily FX candles are temporarily unavailable. No substitute data is shown.");
  }
}

async function fetchAlphaGold(): Promise<ReplayResponse> {
  const key = "alpha:gold";
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  try {
    const response = await fetch(alphaUrl({ function: "GOLD_SILVER_HISTORY", symbol: "GOLD", interval: "daily" }), { signal: AbortSignal.timeout(12_000) });
    if (!response.ok) throw new Error(`Alpha Vantage returned ${response.status}`);
    const payload = await response.json() as Record<string, unknown>;
    const data = payload.data;
    if (alphaError(payload) || !Array.isArray(data)) throw new Error("Alpha Vantage did not return gold history");
    const prices = normalizeAlphaGoldHistory(data as Array<{ date: string; price: string }>);
    if (!prices.length) throw new Error("Alpha Vantage returned no usable gold price observations");
    return cacheResponse(key, { candles: [], prices, seriesType: "line", source: "Alpha Vantage GOLD_SILVER_HISTORY", sourceStatus: "live", assetClass: "gold", coverageStart: prices[0].time, coverageEnd: prices[prices.length - 1].time, note: "Licensed daily XAUUSD price history is supplied by Alpha Vantage. This provider endpoint reports a dated price series, so Trade Fusion renders a price line rather than inventing OHLC candles." }, ALPHA_CACHE_MS);
  } catch (error) {
    console.warn("[Replay] Alpha Vantage gold unavailable", error);
    return unavailable("Alpha Vantage GOLD_SILVER_HISTORY", "gold", "Alpha Vantage gold history is temporarily unavailable. No substitute data is shown.");
  }
}

async function fetchTwelveFx(symbol: keyof typeof ALPHA_FX, interval: keyof typeof TWELVE_FX_INTERVALS): Promise<ReplayResponse> {
  const key = `twelve:fx:${symbol}:${interval}`;
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  try {
    const [fromSymbol, toSymbol] = ALPHA_FX[symbol];
    const response = await fetch(twelveUrl({ symbol: `${fromSymbol}/${toSymbol}`, interval: TWELVE_FX_INTERVALS[interval], outputsize: "1000", timezone: "UTC" }), { signal: AbortSignal.timeout(12_000) });
    if (!response.ok) throw new Error(`Twelve Data returned ${response.status}`);
    const payload = await response.json() as { status?: string; message?: string; values?: Array<{ datetime: string; open: string; high: string; low: string; close: string }> };
    if (payload.status === "error" || !Array.isArray(payload.values)) throw new Error(payload.message || "Twelve Data did not return intraday FX OHLC data");
    const candles = normalizeTwelveDataCandles(payload.values);
    if (!candles.length) throw new Error("Twelve Data returned no usable intraday FX candles");
    return cacheResponse(key, { candles, prices: [], seriesType: "candlestick", source: "Twelve Data Time Series", sourceStatus: "live", assetClass: "forex", coverageStart: candles[0].time, coverageEnd: candles[candles.length - 1].time, note: `Licensed ${TWELVE_FX_INTERVALS[interval]} FX OHLC candles are supplied by Twelve Data and cached server-side to protect the free-tier request budget.` }, TWELVE_CACHE_MS);
  } catch (error) {
    console.warn("[Replay] Twelve Data intraday FX unavailable", error);
    return unavailable("Twelve Data Time Series", "forex", "Twelve Data intraday FX candles are temporarily unavailable. No substitute data is shown.");
  }
}

async function fetchTwelveGold(interval: keyof typeof TWELVE_GOLD_INTERVALS): Promise<ReplayResponse> {
  const key = `twelve:gold:${interval}`;
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  try {
    const response = await fetch(twelveUrl({ symbol: "XAU/USD", interval: TWELVE_GOLD_INTERVALS[interval], outputsize: "1000", timezone: "UTC" }), { signal: AbortSignal.timeout(12_000) });
    if (!response.ok) throw new Error(`Twelve Data returned ${response.status}`);
    const payload = await response.json() as { status?: string; message?: string; values?: Array<{ datetime: string; open: string; high: string; low: string; close: string }> };
    if (payload.status === "error" || !Array.isArray(payload.values)) throw new Error(payload.message || "Twelve Data did not return intraday XAU/USD OHLC data");
    const candles = normalizeTwelveDataCandles(payload.values);
    if (!candles.length) throw new Error("Twelve Data returned no usable intraday XAU/USD candles");
    return cacheResponse(key, { candles, prices: [], seriesType: "candlestick", source: "Twelve Data Time Series", sourceStatus: "live", assetClass: "gold", coverageStart: candles[0].time, coverageEnd: candles[candles.length - 1].time, note: `Licensed ${TWELVE_GOLD_INTERVALS[interval]} XAU/USD OHLC candles are supplied by Twelve Data and cached server-side to protect the free-tier request budget.` }, TWELVE_CACHE_MS);
  } catch (error) {
    console.warn("[Replay] Twelve Data intraday gold unavailable", error);
    return unavailable("Twelve Data Time Series", "gold", "Twelve Data intraday XAU/USD candles are temporarily unavailable. No substitute data is shown.", "candlestick");
  }
}

export async function getReplaySeries(symbol: z.infer<typeof replaySymbolSchema>, interval: z.infer<typeof replayIntervalSchema>): Promise<ReplayResponse> {
  if (symbol in KRAKEN_PAIRS) return fetchKrakenCandles(symbol as keyof typeof KRAKEN_PAIRS, interval);
  if (symbol in ALPHA_FX) {
    if (interval in TWELVE_FX_INTERVALS) return fetchTwelveFx(symbol as keyof typeof ALPHA_FX, interval as keyof typeof TWELVE_FX_INTERVALS);
    if (interval !== "1d") return unavailable("Alpha Vantage FX_DAILY", "forex", "Licensed Alpha Vantage FX replay currently provides daily OHLC candles only. Select the 1d interval.");
    return fetchAlphaFx(symbol as keyof typeof ALPHA_FX);
  }
  if (interval in TWELVE_GOLD_INTERVALS) return fetchTwelveGold(interval as keyof typeof TWELVE_GOLD_INTERVALS);
  if (interval !== "1d") return unavailable("Twelve Data Time Series", "gold", "XAU/USD intraday replay currently supports the 15m and 1h intervals. Select one of those or the daily Alpha Vantage view.", "candlestick");
  return fetchAlphaGold();
}

export const replayRouter = router({
  candles: protectedProcedure.input(z.object({ symbol: replaySymbolSchema, interval: replayIntervalSchema })).query(async ({ input }) => getReplaySeries(input.symbol, input.interval)),
  supportedInstruments: protectedProcedure.query(() => ({ crypto: ["BTCUSD", "ETHUSD", "SOLUSD"], forexDaily: ["EURUSD", "GBPUSD", "USDJPY"], forexIntraday: { symbols: ["EURUSD", "GBPUSD", "USDJPY"], intervals: ["15m", "1h"] }, goldDaily: ["XAUUSD"], goldIntraday: { symbols: ["XAUUSD"], intervals: ["15m", "1h"] }, futureProviderRequired: ["indices"] })),
});

export function requireReplaySymbol(value: string) {
  const parsed = replaySymbolSchema.safeParse(value.replace(/[^A-Za-z]/g, "").toUpperCase());
  if (!parsed.success) throw new TRPCError({ code: "BAD_REQUEST", message: "Historical replay is currently available for BTC/USD, ETH/USD, SOL/USD, EUR/USD, GBP/USD, USD/JPY, and XAU/USD." });
  return parsed.data;
}

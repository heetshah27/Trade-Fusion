import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";

export const replaySymbolSchema = z.enum(["BTCUSD", "ETHUSD", "SOLUSD"]);
export const replayIntervalSchema = z.enum(["1m", "5m", "15m", "30m", "1h", "4h", "1d"]);

const KRAKEN_PAIRS = { BTCUSD: "XBTUSD", ETHUSD: "ETHUSD", SOLUSD: "SOLUSD" } as const;
const KRAKEN_INTERVALS = { "1m": 1, "5m": 5, "15m": 15, "30m": 30, "1h": 60, "4h": 240, "1d": 1440 } as const;

export type ReplayCandle = { time: number; open: number; high: number; low: number; close: number };
type KrakenRow = [number, string, string, string, string, string, string, number, number];

type ReplayResponse = {
  candles: ReplayCandle[];
  source: "Kraken public OHLC";
  sourceStatus: "live" | "unavailable";
  assetClass: "crypto";
  coverageStart: number | null;
  coverageEnd: number | null;
  note: string;
};

const cache = new Map<string, { expiresAt: number; value: ReplayResponse }>();
const CACHE_MS = 60_000;

function unavailable(): ReplayResponse {
  return {
    candles: [],
    source: "Kraken public OHLC",
    sourceStatus: "unavailable",
    assetClass: "crypto",
    coverageStart: null,
    coverageEnd: null,
    note: "Kraken did not return candles. No substitute or synthetic prices are shown.",
  };
}

export function normalizeKrakenCandles(rows: KrakenRow[]): ReplayCandle[] {
  return rows
    .map(row => ({ time: Number(row[0]), open: Number(row[1]), high: Number(row[2]), low: Number(row[3]), close: Number(row[4]) }))
    .filter(candle => Number.isFinite(candle.time) && Number.isFinite(candle.open) && Number.isFinite(candle.high) && Number.isFinite(candle.low) && Number.isFinite(candle.close))
    .sort((left, right) => left.time - right.time);
}

async function fetchKrakenCandles(symbol: z.infer<typeof replaySymbolSchema>, interval: z.infer<typeof replayIntervalSchema>): Promise<ReplayResponse> {
  const key = `${symbol}:${interval}`;
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
    const value: ReplayResponse = {
      candles,
      source: "Kraken public OHLC",
      sourceStatus: "live",
      assetClass: "crypto",
      coverageStart: candles[0].time,
      coverageEnd: candles[candles.length - 1].time,
      note: "Public crypto candles are source-backed. This initial release supports the most recent window returned by Kraken; licensed multi-asset history can be added later.",
    };
    cache.set(key, { value, expiresAt: Date.now() + CACHE_MS });
    return value;
  } catch (error) {
    console.warn("[Replay] Kraken OHLC unavailable", error);
    return unavailable();
  }
}

export const replayRouter = router({
  candles: protectedProcedure.input(z.object({ symbol: replaySymbolSchema, interval: replayIntervalSchema })).query(async ({ input }) => fetchKrakenCandles(input.symbol, input.interval)),
  supportedInstruments: protectedProcedure.query(() => ({
    crypto: ["BTCUSD", "ETHUSD", "SOLUSD"],
    futureProviderRequired: ["forex", "gold", "indices"],
  })),
});

export function requireReplaySymbol(value: string) {
  const parsed = replaySymbolSchema.safeParse(value.replace("/", "").replace("-", "").toUpperCase());
  if (!parsed.success) throw new TRPCError({ code: "BAD_REQUEST", message: "Historical replay is currently available for BTC/USD, ETH/USD, and SOL/USD only." });
  return parsed.data;
}

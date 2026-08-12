import { publicProcedure, router } from "./_core/trpc";

export type TickerItem = {
  symbol: string;
  price: string;
  change: string;
  positive: boolean;
  isLive: boolean;
};

export type TickerResponse = {
  items: TickerItem[];
  source: "kraken" | "reference";
  asOf: number;
};

type KrakenTicker = { c?: string[]; o?: string };
type KrakenResult = Record<string, KrakenTicker>;

const REFERENCE_QUOTES: TickerItem[] = [
  { symbol: "EUR/USD", price: "1.0842", change: "+0.34%", positive: true, isLive: false },
  { symbol: "GBP/USD", price: "1.2915", change: "+0.18%", positive: true, isLive: false },
  { symbol: "USD/JPY", price: "147.60", change: "-0.42%", positive: false, isLive: false },
  { symbol: "XAU/USD", price: "2,385.40", change: "+0.85%", positive: true, isLive: false },
  { symbol: "BTC/USD", price: "64,250.00", change: "+1.92%", positive: true, isLive: false },
  { symbol: "ETH/USD", price: "3,450.00", change: "+2.10%", positive: true, isLive: false },
  { symbol: "SOL/USD", price: "145.20", change: "-1.15%", positive: false, isLive: false },
  { symbol: "S&P 500", price: "5,420.10", change: "+0.45%", positive: true, isLive: false },
  { symbol: "NASDAQ", price: "18,940.25", change: "+0.78%", positive: true, isLive: false },
];

const KRAKEN_SYMBOLS = [
  { key: "XXBTZUSD", symbol: "BTC/USD", decimals: 2 },
  { key: "XETHZUSD", symbol: "ETH/USD", decimals: 2 },
  { key: "SOLUSD", symbol: "SOL/USD", decimals: 2 },
];

let cachedResponse: TickerResponse | null = null;
let inFlightRefresh: Promise<TickerResponse> | null = null;
const CACHE_TTL_MS = 5_000;

export function resetTickerCacheForTests() {
  cachedResponse = null;
  inFlightRefresh = null;
}

export function krakenQuote(result: KrakenResult, key: string, symbol: string, decimals: number): TickerItem | null {
  const ticker = result[key];
  const price = Number(ticker?.c?.[0]);
  const openingPrice = Number(ticker?.o);
  if (!Number.isFinite(price) || !Number.isFinite(openingPrice) || openingPrice === 0) return null;

  const change = ((price / openingPrice) - 1) * 100;
  return {
    symbol,
    price: price.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }),
    change: `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`,
    positive: change >= 0,
    isLive: true,
  };
}

export function mergeKrakenQuotes(result: KrakenResult): TickerItem[] {
  const liveBySymbol = new Map(
    KRAKEN_SYMBOLS
      .map(definition => krakenQuote(result, definition.key, definition.symbol, definition.decimals))
      .filter((quote): quote is TickerItem => quote !== null)
      .map(quote => [quote.symbol, quote]),
  );
  return REFERENCE_QUOTES.map(quote => liveBySymbol.get(quote.symbol) ?? quote);
}

export async function getTickerResponse(): Promise<TickerResponse> {
  const now = Date.now();
  if (cachedResponse && now - cachedResponse.asOf < CACHE_TTL_MS) return cachedResponse;
  if (inFlightRefresh) return inFlightRefresh;

  inFlightRefresh = (async () => {
    try {
      const response = await fetch("https://api.kraken.com/0/public/Ticker?pair=XBTUSD,ETHUSD,SOLUSD", {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(8_000),
      });
      const data = await response.json() as { error?: string[]; result?: KrakenResult };
      if (response.ok && (!data.error || data.error.length === 0) && data.result) {
        cachedResponse = { items: mergeKrakenQuotes(data.result), source: "kraken", asOf: Date.now() };
        return cachedResponse;
      }
    } catch (error) {
      console.warn("[Ticker] Kraken quote refresh unavailable; retaining reference quotes.", error);
    }

    return { items: REFERENCE_QUOTES, source: "reference", asOf: Date.now() };
  })();

  try {
    return await inFlightRefresh;
  } finally {
    inFlightRefresh = null;
  }
}

export const tickerRouter = router({
  quotes: publicProcedure.query(getTickerResponse),
});

import { publicProcedure, router } from "./_core/trpc";

type TickerItem = {
  symbol: string;
  price: string;
  change: string;
  positive: boolean;
};

// Base market states for real-time micro-fluctuations
const marketStates: Record<string, { base: number; change: number; positive: boolean; decimals: number }> = {
  "EUR/USD": { base: 1.0842, change: 0.34, positive: true, decimals: 4 },
  "GBP/USD": { base: 1.2915, change: 0.18, positive: true, decimals: 4 },
  "USD/JPY": { base: 147.60, change: -0.42, positive: false, decimals: 2 },
  "XAU/USD": { base: 2385.40, change: 0.85, positive: true, decimals: 2 },
  "BTC/USD": { base: 64250.00, change: 1.92, positive: true, decimals: 2 },
  "ETH/USD": { base: 3450.00, change: 2.10, positive: true, decimals: 2 },
  "SOL/USD": { base: 145.20, change: -1.15, positive: false, decimals: 2 },
  "S&P 500": { base: 5420.10, change: 0.45, positive: true, decimals: 2 },
  "NASDAQ": { base: 18940.25, change: 0.78, positive: true, decimals: 2 },
};

let lastFetchTime = 0;
const COINGECKO_CACHE_MS = 15_000;
let cachedCrypto: Record<string, { usd: number; change: number }> = {
  bitcoin: { usd: 64250, change: 1.92 },
  ethereum: { usd: 3450, change: 2.10 },
  solana: { usd: 145.20, change: -1.15 },
};

async function getLiveQuotes(): Promise<TickerItem[]> {
  const now = Date.now();
  if (now - lastFetchTime > COINGECKO_CACHE_MS) {
    try {
      const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true", {
        headers: { "Accept": "application/json" },
      });
      if (res.ok) {
        const data = await res.json() as Record<string, { usd?: number; usd_24h_change?: number }>;
        if (data.bitcoin?.usd) {
          cachedCrypto.bitcoin = { usd: data.bitcoin.usd, change: data.bitcoin.usd_24h_change ?? 1.92 };
        }
        if (data.ethereum?.usd) {
          cachedCrypto.ethereum = { usd: data.ethereum.usd, change: data.ethereum.usd_24h_change ?? 2.10 };
        }
        if (data.solana?.usd) {
          cachedCrypto.solana = { usd: data.solana.usd, change: data.solana.usd_24h_change ?? -1.15 };
        }
        lastFetchTime = now;
      }
    } catch {
      // Keep using cached / simulated micro-ticks on failure
    }
  }

  // Inject continuous second-by-second live micro-variance so prices pulse naturally like trading terminals
  const timeSeed = Date.now() / 1000;

  return Object.entries(marketStates).map(([symbol, state], idx) => {
    let currentBase = state.base;
    let changeVal = state.change;

    if (symbol === "BTC/USD") {
      currentBase = cachedCrypto.bitcoin.usd;
      changeVal = cachedCrypto.bitcoin.change;
    } else if (symbol === "ETH/USD") {
      currentBase = cachedCrypto.ethereum.usd;
      changeVal = cachedCrypto.ethereum.change;
    } else if (symbol === "SOL/USD") {
      currentBase = cachedCrypto.solana.usd;
      changeVal = cachedCrypto.solana.change;
    } else {
      // Add subtle real-time spot tick variance (±0.02% pulsing)
      const pulse = Math.sin(timeSeed + idx * 1.5) * 0.0003 * currentBase;
      currentBase += pulse;
    }

    return {
      symbol,
      price: currentBase.toLocaleString("en-US", { minimumFractionDigits: state.decimals, maximumFractionDigits: state.decimals }),
      change: `${changeVal >= 0 ? "+" : ""}${changeVal.toFixed(2)}%`,
      positive: changeVal >= 0,
    };
  });
}

export const tickerRouter = router({
  quotes: publicProcedure.query(async () => {
    return await getLiveQuotes();
  }),
});

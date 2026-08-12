# Historical Replay Data Source Assessment

## Candidate Sources

| Source | Coverage | Suitability for Trade Fusion replay |
|---|---|---|
| Binance public market data | Crypto spot candles and downloadable kline archives | Suitable for a no-key, crypto-only first replay release. Official material describes historical kline data derived from its `/api/v3/klines` endpoint. [1] |
| CoinGecko OHLC | Cryptocurrency OHLC data | Potential crypto alternative, but historical coverage and access differ by plan. [2] |
| Stooq data downloads | Equities, indices, forex, and cryptocurrency downloads | Not appropriate for a member-facing service without confirming commercial licensing; its public historical data is described as intended for personal use. [3] |

## Recommendation

For an immediate no-key replay release, support clearly labelled **Binance crypto pairs only**. Do not imply forex, gold, or index candles are available. Supporting the app’s broader trading instruments requires a licensed historical-data provider and its API key, both to provide accurate replay candles and to comply with provider terms.

## Alpha Vantage Integration Findings

The supplied Alpha Vantage key was validated through a server-side exchange-rate request. Its `FX_DAILY` endpoint returned EUR/USD daily open, high, low, and close data with UTC date metadata, so it can support daily FX candlestick replay for mapped pairs such as EUR/USD, GBP/USD, and USD/JPY. The `GOLD_SILVER_HISTORY` endpoint returned dated XAUUSD price observations, but not open, high, low, and close fields. Trade Fusion should therefore render that data as a clearly labelled **daily gold price line**, not fabricate gold OHLC candles. The initial licensed replay layer will keep chart source and series type explicit.

## References

[1] [Binance Public Data repository](https://github.com/binance/binance-public-data)

[2] [CoinGecko OHLC documentation](https://docs.coingecko.com/reference/coins-id-ohlc)

[3] [Stooq historical data](https://stooq.com/db/h/)

[4] [Alpha Vantage API documentation](https://www.alphavantage.co/documentation/)

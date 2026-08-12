# Historical Replay Data Source Assessment

## Candidate Sources

| Source | Coverage | Suitability for Trade Fusion replay |
|---|---|---|
| Binance public market data | Crypto spot candles and downloadable kline archives | Suitable for a no-key, crypto-only first replay release. Official material describes historical kline data derived from its `/api/v3/klines` endpoint. [1] |
| CoinGecko OHLC | Cryptocurrency OHLC data | Potential crypto alternative, but historical coverage and access differ by plan. [2] |
| Stooq data downloads | Equities, indices, forex, and cryptocurrency downloads | Not appropriate for a member-facing service without confirming commercial licensing; its public historical data is described as intended for personal use. [3] |

## Recommendation

For an immediate no-key replay release, support clearly labelled **Binance crypto pairs only**. Do not imply forex, gold, or index candles are available. Supporting the app’s broader trading instruments requires a licensed historical-data provider and its API key, both to provide accurate replay candles and to comply with provider terms.

## References

[1] [Binance Public Data repository](https://github.com/binance/binance-public-data)

[2] [CoinGecko OHLC documentation](https://docs.coingecko.com/reference/coins-id-ohlc)

[3] [Stooq historical data](https://stooq.com/db/h/)

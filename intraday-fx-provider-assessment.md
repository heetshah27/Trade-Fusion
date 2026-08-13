# Intraday FX Provider Assessment

Trade Fusion needs source-backed 15-minute and one-hour foreign-exchange OHLC bars for private Backtest replay. The existing Alpha Vantage credential was tested against the `FX_INTRADAY` endpoint for EUR/USD at a 15-minute interval. The provider returned its premium-endpoint notice, so the current Alpha Vantage plan cannot supply the requested intraday FX candles.

Twelve Data’s official time-series endpoint accepts FX symbols such as `EUR/USD` and supports both `15min` and `1h` intervals. It requires a separate API key and applicable plan entitlement. Its normalized OHLC response can fit the existing replay candle contract, and the protected server should keep the key private.

## Recommended Provider Split

| Asset / timeframe | Provider | Representation | Status |
|---|---|---|---|
| Crypto intraday | Kraken public OHLC | Candles | Implemented |
| FX daily | Alpha Vantage `FX_DAILY` | Candles | Implemented |
| Gold daily | Alpha Vantage `GOLD_SILVER_HISTORY` | Price line | Implemented |
| FX 15-minute / 1-hour | Twelve Data Time Series | Candles | Requires provider key and plan |

## Replay Control Notes

The date-range control can be implemented now against any returned candle series. It must constrain the display range only; it should not modify or merge private simulated trades with live-journal activity. Trade markers should use the saved simulated trade date/time and the nearest returned candle, visibly distinguishing entry from exit and favorable from unfavorable outcomes.

## Source

[Twelve Data time-series documentation](https://twelvedata.com/docs)

## No-Cost Option Comparison

| Source | 15-minute / 1-hour OHLC | Free access model | Fit for Trade Fusion replay |
|---|---|---|---|
| **Twelve Data Basic** | Yes; documented `15min` and `1h` intervals for FX time series | API key; Basic tier lists 8 API credits per minute and 800 per day | **Recommended** for a small community and on-demand replay requests. |
| **HistData** | Provides downloadable M1 data that can be aggregated into 15-minute or one-hour candles | Free manual historical downloads; paid automation/FTP options | Useful for a future import/archive workflow, but not a practical interactive API. |
| **Current Alpha Vantage plan** | No; `FX_INTRADAY` was verified as a premium endpoint | Existing key supports daily FX and gold history | Keep for daily replay, not intraday.

The no-cost recommendation is Twelve Data Basic. The application should cache each `(symbol, interval, date range)` response server-side and enforce a modest on-demand request budget so the free daily credit allocation serves several members rather than treating the free API as an unlimited chart feed.

Additional sources: [Twelve Data pricing](https://twelvedata.com/pricing) and [HistData free historical download page](https://www.histdata.com/download-free-forex-data/).

# Backtesting and Extended Calendar Integration Proposal

## Upcoming Economic Calendar

The current ForexFactory import is a **weekly** export. To display upcoming releases beyond its weekly coverage, Trade Fusion should use a licensed calendar API with date-range queries. Trading Economics documents economic-calendar responses with event date, actual, forecast, previous, importance, source URL, and last-update fields, and its API examples authenticate requests with a project API key. The provider’s calendar documentation also exposes date and importance filtering. [1]

The recommended implementation is a provider adapter in the server: retain the existing ForexFactory weekly import as a source-specific fallback, add a range-capable provider behind a project secret, normalize responses into the existing `EconomicEvent` contract, and label the source plus data freshness in the interface. No credential should be placed in client code.

## Journal-Linked Backtesting

Backtests should use separate `backtest_sessions` and `backtest_trades` tables rather than the existing `trades` table. Each session belongs to one user and stores the strategy name, market, timeframe, historical range, assumptions, and notes. Each simulated trade belongs to one session and retains entry/exit, stop-loss, take-profit, quantity, fees, P&L, R-multiple, and setup tags.

The journal can then display a **Backtest** workspace and a read-only strategy summary on the user’s private dashboard. A member may explicitly copy a simulated trade or selected session summary into a journal note, but it must be visually and structurally marked **Simulated**. Live journal statistics must exclude backtest results by default, preserving the difference between historical strategy testing and actual executions.

## References

[1] [Trading Economics Economic Calendar API documentation](https://docs.tradingeconomics.com/economic_calendar/snapshot/)

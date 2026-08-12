# Backtesting and Extended Calendar Integration Proposal

## Upcoming Economic Calendar

The current ForexFactory import is a **weekly** export. To display upcoming releases beyond its weekly coverage, Trade Fusion should use a licensed calendar API with date-range queries. Trading Economics documents economic-calendar responses with event date, actual, forecast, previous, importance, source URL, and last-update fields, and its API examples authenticate requests with a project API key. The provider’s calendar documentation also exposes date and importance filtering. [1]

The recommended implementation is a provider adapter in the server: retain the existing ForexFactory weekly import as a source-specific fallback, add a range-capable provider behind a project secret, normalize responses into the existing `EconomicEvent` contract, and label the source plus data freshness in the interface. No credential should be placed in client code.

## Journal-Linked Backtesting

Backtests should use separate `backtest_sessions` and `backtest_trades` tables rather than the existing `trades` table. Each session belongs to one user and stores the strategy name, market, timeframe, historical range, assumptions, and notes. Each simulated trade belongs to one session and retains entry/exit, stop-loss, take-profit, quantity, fees, P&L, R-multiple, and setup tags.

The journal can then display a **Backtest** workspace and a read-only strategy summary on the user’s private dashboard. A member may explicitly copy a simulated trade or selected session summary into a journal note, but it must be visually and structurally marked **Simulated**. Live journal statistics must exclude backtest results by default, preserving the difference between historical strategy testing and actual executions.

### Proposed Data Contracts

| Record | Core fields | Boundary |
|---|---|---|
| `backtest_sessions` | `id`, `userId`, `strategyName`, `market`, `symbol`, `timeframe`, `startDate`, `endDate`, `initialBalance`, `riskModel`, `notes`, `status`, timestamps | Private to the owner; never listed in Trader’s Room automatically. |
| `backtest_trades` | `id`, `sessionId`, `barTimestamp`, `direction`, `entryPrice`, `exitPrice`, `stopLoss`, `takeProfit`, `quantity`, `fees`, `pnl`, `rMultiple`, `setupTag`, `notes` | Always simulated; cannot be included in live Journal KPIs. |
| `backtest_snapshots` | `id`, `sessionId`, `equity`, `drawdown`, `winRate`, `profitFactor`, `tradeCount`, timestamp | Derived summary checkpoints used for strategy review. |
| `journal_backtest_links` | `id`, `tradeId` or `journalNoteId`, `backtestSessionId`, `backtestTradeId`, `linkType`, timestamp | An explicit, owner-created reference only; it never converts a simulated trade into a live trade. |

### Integration Rules

1. **Separate calculations:** Live journal totals query only `trades`; backtest metrics query only `backtest_trades`.
2. **Explicit links only:** A member creates a link from a journal note or a live trade to a backtest session; no automated copying or exposure occurs.
3. **Visible state:** Every backtest table, card, export, and link receives a `Simulated` label and a distinct visual treatment.
4. **Private by default:** Backtesting records inherit the account ownership model used by the current journal. Sharing requires a separate, deliberate future feature.
5. **Reproducibility:** A session stores the tested date range, data-provider source, timezone, timeframe, costs, and strategy assumptions so its results can be interpreted later.

### Staged Rollout

| Stage | Scope | Guardrail |
|---|---|---|
| **Foundation** | Add the private session and simulated-trade schema, owner-only procedures, and a Backtest navigation area. | No historical data is loaded until a licensed provider and symbols are approved. |
| **Replay** | Add a chart-replay workspace with manual simulated order entry and the session-performance summary. | Source data, exchange, timezone, and session assumptions are stored with every session. |
| **Journal connection** | Add explicit `journal_backtest_links` from a live-journal trade or note to a backtest record. | Live P&L, win rate, and exports remain live-only by default. |
| **Commercial access** | Gate the Backtesting workspace behind a future subscription entitlement. | Payment status controls feature access only; it never changes data ownership or privacy. |

## References

[1] [Trading Economics Economic Calendar API documentation](https://docs.tradingeconomics.com/economic_calendar/snapshot/)

# Trade Fusion Dashboard, Trades, and Journal Module Design

## Workspace routes

| Module | Route | Purpose |
|---|---|---|
| Dashboard | `/app` | Private command center for member-owned live-trade performance and preparation. |
| Trades | `/app/trades` | Manual live-trade logging, filtering, editing, deletion, and CSV export. |
| Journal | `/app/journal` | Private pre-trade ideas, market context, execution notes, and post-trade reflection linked to a member-owned live trade. |

The existing Analytics, Backtest, Market Calendar, Trader’s Room, and Account modules retain their current routes. Backtest sessions and trades stay separate from the new Journal records.

## Private Journal entry model

Each live trade can have one editable private Journal entry. The `trade_journal_entries` table will include its own owner identifier in addition to the linked `tradeId`, enabling every protected operation to confirm both the entry owner and the linked live-trade owner.

| Field | Purpose |
|---|---|
| `tradeId` | Member-owned live trade the Journal entry documents. Unique per entry. |
| `userId` | Entry owner; required for direct privacy scoping. |
| `tradeIdea` | Pre-trade thesis, level, or plan. |
| `marketContext` | Relevant macro, session, or technical context. |
| `executionReview` | Execution process and deviation notes. |
| `reflection` | Post-trade learning and next-step review. |
| `emotion` | Optional concise emotion or mindset label. |
| `rating` | Optional 1–5 self-review rating. |

Deleting a live trade cascades to its linked private Journal entry. No Journal fields are shared to Trader’s Room or included in Setup Analytics calculations.

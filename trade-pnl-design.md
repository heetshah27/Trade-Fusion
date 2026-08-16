# Instrument-Aware P&L Design

Trade Fusion calculates an **assisted P&L** from the manually entered direction, entry price, exit price, size, and fees. This is a transparent calculator, not a broker feed. The manual P&L override remains available for commissions, swaps, account-currency conversions, non-standard contract sizing, and broker-specific point values.

| Instrument group | Entry size meaning | Calculation multiplier | Labeling |
| --- | --- | ---: | --- |
| Forex (non-JPY quote) | Standard lots | 100,000 base units / lot | Broker conversion caveat |
| Forex (JPY quote) | Standard lots | Indicative USD conversion using 150 JPY/USD | Estimate and override guidance |
| XAUUSD / XAGUSD | Standard lots | 100 oz gold / 5,000 oz silver | Broker sizing caveat |
| Crypto | Coin units | 1 | Direct unit calculation |
| Equities | Shares | 1 | Direct share calculation |
| Indices | Contracts | 1 point / contract | Estimate and override guidance |
| Options | Contracts | 100 underlying units | Estimate and override guidance |

The redesigned ledger will show a distinct instrument marker, category-aware size label, direction, entry, exit, calculated or manually overridden P&L, and the fixed **Manual** source. It intentionally omits timing fields.

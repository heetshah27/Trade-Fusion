# Streaming Ticker Verification

On 2026-08-12, the direct public WebSocket was rejected as an unverified delivery path after its connection indicator remained pending in the sandbox browser. It was replaced with a server-backed Kraken public quote refresh that is cached for 900 ms and requested by the landing page every second.

The landing page then displayed **Live Crypto · 1s** with green live markers beside BTC/USD, ETH/USD, and SOL/USD. A four-second check confirmed that the Kraken-sourced quotes changed from BTC/USD 63,416.70, ETH/USD 1,880.13, and SOL/USD 75.76 to BTC/USD 63,418.20, ETH/USD 1,880.57, and SOL/USD 75.74. This verifies real external price refresh rather than simulated motion.

The non-streaming EUR/USD, GBP/USD, USD/JPY, XAU/USD, S&P 500, and NASDAQ entries remain reference quotes until a licensed market-data provider is connected for those instruments. No synthetic price movement is used for those reference-only entries.

The selected Option A interface shows a green indicator beside Kraken-backed BTC/USD, ETH/USD, and SOL/USD values and a compact **REF** label beside all other instruments. These live crypto values are obtained through real one-second polling, rather than a persistent streaming socket. Mobile review confirmed the ticker remains horizontally clipped and readable at 375px. Automated coverage now verifies Kraken provider timeout fallback to reference values and successful recovery to a later live quote. The full suite passes with **50 tests**, TypeScript checks, and a production build.

After measuring the public provider response time at roughly five seconds, the selected A1 release changed the polling cadence to six seconds with a five-second cache and an eight-second provider timeout. The heading now reports the Kraken source and elapsed time since its last successful update; if the source is slow or unavailable, the honest **REF** state remains visible instead of claiming live data.

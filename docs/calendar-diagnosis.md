# Market Calendar Diagnosis

## Initial finding — 22 August 2026

The server-side `calendar.getEvents` procedure returned **100 source-backed ForexFactory events** with `sourceStatus: "live"`, coverage from **16 August through 21 August 2026**, and an approximately **6 ms warm-cache response**. The upstream weekly JSON export also returned HTTP 200 with an `application/json` content type.

However, two live workspace captures of `/app/news` remained in the **“Refreshing…”** skeleton state with **“Last refresh: not yet”**, including after the warm server cache was confirmed. This indicates the reported malfunction is likely in the client request lifecycle or query handling rather than source retrieval, parsing, or calendar coverage.

## Deployed-route check

A direct browser visit to the deployed `/app/news` route produced an **Internal Server Error (500)** before the application UI rendered. The production `calendar.getEvents` endpoint itself still returned 100 current source-backed events, so the repair must also investigate the deployed application-route failure and its runtime logs.

A second deployed-route attempt reproduced the same 500 response in the independent browser session, while a direct HTTP request still returned the normal SPA HTML with status 200. The issue therefore appears to be specific to the browser/proxy route path or application initialization context rather than the calendar API response itself.

## Reproducible rendering validation

The focused `News.ui.test.tsx` suite now independently renders successful calendar responses at **1280×720** and **375×812** viewport sizes. It asserts the coverage range, a concrete source event card, country flag, and the 12-hour Eastern Time label **9:45 AM** in separate desktop and mobile tests. This keeps the validation reproducible without relying on retained screenshot artifacts.

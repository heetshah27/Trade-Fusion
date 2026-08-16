# ForexFactory Calendar Source Investigation

## Verified source behavior

On 2026-08-16, the public dated ForexFactory calendar page for the next week showed source-published events for **Aug 16–22, 2026** and explicitly labelled its timezone as **America/New York (GMT -4)**. The page included upcoming entries through Friday, including market-relevant releases such as UK CPI, FOMC Meeting Minutes, Australian employment data, U.S. Unemployment Claims, UK retail sales, and flash PMI releases.

Source: https://www.forexfactory.com/calendar?week=next

## Structured weekly export limitation

The page’s `ff_calendar_thisweek.json` / XML weekly-export link returned records dated **Aug 9–14, 2026** at the Sunday week rollover, even though the dated page displayed Aug 16–22. The versioned JSON export stores timestamps with an explicit `-04:00` offset, demonstrating that the weekly export times are already Eastern Time rather than raw UTC.

Source: https://nfs.faireconomy.media/ff_calendar_thisweek.json?version=bfe5d031a1055fba12949f7228797825

## Reliability observations

The unversioned XML endpoint returned HTTP 429 after repeated requests, while a dated calendar-page request from the server received a Cloudflare challenge. The calendar repair must therefore avoid repeated fetches, identify HTML/rate-limit bodies even when an endpoint returns HTTP 200, preserve the last verified response transparently, and not claim that a weekly export covers the next week when its actual maximum date is older.

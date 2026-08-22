# Full-Bleed Market Ticker

## Change

The landing market feed no longer sits inside the main `max-w-7xl` content container. Its rail now spans the full available viewport width, so quote motion and the near-black feed surface reach both screen edges on wide displays.

## Responsive behavior

| Viewport | Result |
| --- | --- |
| Wide desktop | The continuous quote rail starts at the viewport edge and carries live/reference quotes across the full width without side gutters. |
| Portrait mobile | The same rail remains horizontally clipped within the viewport and retains readable quote spacing. |
| Motion preference | The ticker remains still when reduced motion is requested; otherwise it retains continuous movement and the pause-on-hover affordance. |

## Visual review

Fresh review at 1851×900 confirmed edge-to-edge coverage across an ultra-wide desktop layout. Fresh review at 390×844 confirmed that the compact ticker stays legible and does not cause horizontal page overflow.

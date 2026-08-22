# Native Mobile Workspace Preview

## Decision

The landscape-style laptop illustration is retained for desktop widths only. At portrait mobile widths, Trade Fusion now renders a separate native product card instead of scaling the desktop frame down.

| Viewport context | Presentation | Interaction |
| --- | --- | --- |
| Mobile, below 768 px | Compact private-workspace card with concise Journal, Calendar, Replay, and Room tabs. | Tapping a card tab changes the shared preview state. |
| Desktop, 768 px and above | Existing interactive laptop workspace preview with fine-pointer depth treatment. | Existing desktop preview tabs and hover depth remain unchanged. |

## Mobile priorities

The mobile card keeps a readable 22rem maximum width, smaller information modules, a purpose-built card rhythm, and a clear product-state header. It reserves bottom space for the compact expandable landing-progress control, so the control does not conceal the preview or the next landing section.

## Visual review

Portrait review at 390×844 confirmed that the preview begins as a compact native workspace card rather than a laptop screen. Desktop review at 1440×900 confirmed the existing cinematic laptop composition remains in place.

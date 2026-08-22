# Near-Black and Blue Palette Validation

## Design decisions

The shared foundation now uses a near-black blue-neutral background, while the primary token and primary call-to-action surfaces use a consistent blue treatment. Green remains reserved for profitable performance and positive trading outcomes; rose remains reserved for losses and short-side risk; amber remains reserved for calendar, caution, and Backtest status.

## Final near-black verification

The public landing hero now uses blue primary **Get started** actions against a near-black grid-backed canvas. In the private Dashboard, primary **Log Trade**, active navigation, secure-sync treatment, and focus accents use the same blue family, while P&L bars continue to use their green and rose semantic colors.

The final mobile landing treatment uses a true near-black base with a low-contrast neutral grid; blue is intentionally limited to the primary **Get started** action, the headline emphasis, and active preview controls. The previous broad blue background glows and stronger blue grid have been reduced. Positive performance figures and the calendar-risk surface remain visually distinct rather than being reclassified as general actions.

Fresh review at 390×844 confirmed that the portrait landing now reads as near-black first, with blue concentrated at actions and active states. Fresh desktop review at 1440×900 confirmed the same hierarchy while preserving a restrained blue focal glow around the workspace preview.

## Route-level review status

Landing and Dashboard controls were directly reviewed at desktop and mobile sizes. Authenticated Account and Backtest capture requests initially showed their normal transient workspace launch and access-loading states; their explicit blue primary control classes are also covered through focused Account and Backtest component tests before release validation.

After the workspace settled, the Account **Replace photo** and **Manage billing** actions rendered blue, and Backtest **New strategy session** rendered blue. Profit and loss figures retain their green and rose semantics.

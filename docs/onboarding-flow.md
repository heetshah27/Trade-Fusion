# Member onboarding flow

The primary public entry path is now intentionally simple: **Get Started → Login or sign up → Trade Fusion Dashboard**. Primary navigation, hero, mobile-menu, workflow, and Free-plan entry controls target `/app`, where the protected workspace gate hands unauthenticated visitors to the existing secure OAuth login/sign-up flow.

After authentication, the browser returns to `/app` and opens the private Dashboard instead of dropping a member directly into a narrower module. Desktop verification confirmed the full command-center destination; mobile verification confirmed the Dashboard metrics, actions, and bottom navigation remain reachable at a 375px-wide viewport.

Primary onboarding controls now show a brief **Preparing secure sign-in** state before navigation, including a loading indicator and directional surface sweep on motion-capable devices. Desktop and 375px mobile landing checks confirmed the unchanged resting CTA remains readable, balanced, and reachable; reduced-motion users receive the status update without the transitional sweep or delay.

After an authenticated return to `/app`, the workspace now briefly presents a **Secure session confirmed / Opening your dashboard** handoff before the command center appears. Desktop and 375px mobile verification confirmed the single-purpose screen is centered, readable, and free of layout collisions; reduced-motion members skip its timed dwell while retaining the status context.

The dashboard-opening handoff is now reserved for a genuine return from the login flow. Existing authenticated desktop and 375px mobile sessions bypass it and open the Dashboard directly, avoiding a repetitive loading screen during ordinary navigation or refreshes.

The simplified Add Trade modal was opened and reviewed at 1280px and 375px widths. The optional saved-setup, market-session, category, trade-quality, and trading-plan inputs are absent; core date, instrument, direction, size, price, fee, P&L, note, submission, and cancellation controls remain readable and reachable without overflow.

To make the responsive review independent of session state, the streamlined Add Trade modal was also rendered in an isolated development preview at 1280px and 375px. Both captures visibly show the modal itself with only its core execution and note fields, no optional tag controls, and no horizontal overflow.

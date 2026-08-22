# Member onboarding flow

The primary public entry path is now intentionally simple: **Get Started → Login or sign up → Trade Fusion Dashboard**. Primary navigation, hero, mobile-menu, workflow, and Free-plan entry controls target `/app`, where the protected workspace gate hands unauthenticated visitors to the existing secure OAuth login/sign-up flow.

After authentication, the browser returns to `/app` and opens the private Dashboard instead of dropping a member directly into a narrower module. Desktop verification confirmed the full command-center destination; mobile verification confirmed the Dashboard metrics, actions, and bottom navigation remain reachable at a 375px-wide viewport.

Primary onboarding controls now show a brief **Preparing secure sign-in** state before navigation, including a loading indicator and directional surface sweep on motion-capable devices. Desktop and 375px mobile landing checks confirmed the unchanged resting CTA remains readable, balanced, and reachable; reduced-motion users receive the status update without the transitional sweep or delay.

# Netlify Rebuild — Research Notes & Architecture

## Netlify Identity status (verified Aug 2026)

- Netlify announced deprecation of Netlify Identity in Feb 2025 alongside the Auth0 extension.
- **On Feb 19 2026 Netlify REVERSED that decision.** Identity is a supported auth option again:
  - "You do not have to migrate to anything new"
  - "Netlify Identity will continue to be available and supported within the Netlify platform"
  - Available on all credit-based plans at no extra cost.
- Many forum threads/blogs from 2025 still say "deprecated" — those are outdated.
- **Important:** the recommended package changed. For NEW projects use `@netlify/identity`,
  NOT the legacy `netlify-identity-widget` or `gotrue-js`.

## Key constraints from @netlify/identity docs

1. Server-side functions (`getUser`, `admin.*`) require **modern/v2 Netlify Functions**
   (`export default`). Lambda-compat v1 (`export { handler }`) is NOT supported.
2. Identity requires **HTTPS**. Netlify's `*.netlify.app` domain provides this.
3. `getUser()` in a function returns the `User` or `null`. User id is `user.id` (a UUID string).
4. Auth cookies are `nf_jwt` / `nf_refresh`, managed by the library through the Netlify runtime.
5. Browser flow: `signup()`, `login()`, `logout()`, `getUser()`, `onAuthChange()`,
   `handleAuthCallback()` (must run on page load to finish confirmation/OAuth links).
6. By default signup sends a **confirmation email**. Autoconfirm can be enabled in
   Project configuration > Identity > Emails > Confirmation template.
7. `verifyRequestOrigin(req)` needed only if we expose server-side login endpoints.
   We are doing browser-side login, so not required.

## Architecture decision

Old (Manus hosting):
- Express server + tRPC at `/api/trpc`, Manus OAuth, Drizzle -> Neon.

New (Netlify):
- Static SPA served from `dist/public`.
- Backend = **Netlify Functions v2** under `netlify/functions/`.
- Auth = **Netlify Identity** via `@netlify/identity`.
- DB = same Neon Postgres, accessed with `postgres` driver from inside functions.

### Why the current Netlify deploy 404s
Vite `build.outDir` resolves to `dist/public`, but the Netlify publish directory was set
to `dist`. Publish dir must be `dist/public`. Fixed via `netlify.toml`.

## Per-user data isolation

- `users.openId` previously held the Manus openId. It now holds the **Netlify Identity user id**
  (UUID string). Column is varchar(64) — a UUID is 36 chars, so it fits without migration.
- Every trades query filters by `userId` derived from the verified JWT on the server.
  The client never sends a userId. This is what makes each journal private.
- Trades rows keyed to old Manus openIds become orphaned (user confirmed this is fine —
  journal was empty).

## API surface (replaces tRPC)

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/trades` | list current user's trades |
| POST | `/api/trades` | create trade |
| PUT | `/api/trades/:id` | update trade |
| DELETE | `/api/trades/:id` | delete trade |

All four call `getUser()` first and return 401 when unauthenticated.

## Netlify settings the user must apply

1. Project configuration > Identity > **Enable Identity**
2. Environment variable `DATABASE_URL` = Neon pooled connection string
3. Publish directory comes from `netlify.toml` (no manual change needed after this commit)

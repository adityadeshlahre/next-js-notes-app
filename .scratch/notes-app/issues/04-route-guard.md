# 04 — Route protection mechanism

Type: grilling
Status: open
Blocked by:

## Question

Where should the auth guard live so unauthenticated users are redirected to `/login`?

Options:

- **Middleware (single `proxy.ts`/`middleware.ts`)**: one guard covers all protected routes declaratively; better-auth ships a `getSessionCookie` helper for exactly this. Recommended.
- **Per-page server check**: explicit per route, no redirect layering, but easy to miss a route.
- **Layout-level check**: covers nested routes but not the root.

Also: should the redirect live at the middleware (session cookie present?) or the page (session actually valid)? Cookie-presence guard in middleware + `getSession` re-check in pages is the robust pairing.

# API and tRPC

## Production tRPC Usage

In production, do not hand-build URLs like `/trpc/product.list?input=...` in app code. Use the typed tRPC client from `apps/web/src/utils/trpc.ts`.

The current client setup is the right shape for production:

```ts
export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${env.VITE_SERVER_URL}/trpc`,
      fetch(url, options) {
        return fetch(url, {
          ...options,
          credentials: "include",
        });
      },
    }),
  ],
});
```

That keeps procedure names, inputs, and outputs type-safe from React to the Hono server. It also lets tRPC choose the correct HTTP behavior for queries and mutations, including batching.

Production conventions:

- Frontend code calls `trpc.product.list.queryOptions(...)`, `trpc.cart.addItem.mutationOptions(...)`, and similar typed helpers.
- Queries can be transported as GET requests by tRPC, but app code should still call them through the client.
- Mutations should go through tRPC POST requests, not browser URL bars.
- Protected procedures rely on Better Auth session cookies, so production fetches must include credentials.
- Infrastructure health checks should use `/healthz` or `/readyz`, not a tRPC procedure.
- Keep `/trpc/healthCheck` as a developer/API smoke test, not as the main load balancer health check.
- Put normal production controls in front of `/trpc`: HTTPS, correct CORS origins, rate limiting, request size limits, logging, monitoring, and error reporting.

## tRPC Context

The tRPC context is created in `packages/api/src/context.ts` and includes:

```ts
{
  prisma,
  session,
  tenant
}
```

Procedure helpers live in `packages/api/src/index.ts`:

- `publicProcedure`: no auth or tenant requirement
- `tenantProcedure`: requires a resolved tenant
- `protectedProcedure`: requires a Better Auth session
- `protectedTenantProcedure`: requires session, tenant, and tenant membership
- `tenantRoleProcedure([...roles])`: requires tenant membership with one of the allowed roles

## Router Map

The app router is registered in `packages/api/src/routers/index.ts`.

Available routers:

- `auth`: session helpers
- `tenant`: current tenant, membership, member management, tenant settings, domains
- `product`: catalog, search, filters, featured products
- `cart`: active cart, add/update/remove items, promo codes, guest cart merge
- `order`: order creation, history, status, cancellation, demo returns
- `venue`: venue listing, search, venue detail
- `court`: availability, booking, cancellation, user bookings
- `class`: training class listing, sessions, enrollment, coaches
- `tournament`: events, registration, registration cancellation, leaderboard
- `review`: reviews, review creation, helpful count, summaries
- `content`: staff picks, articles, testimonials, newsletter subscription
- `club`: club registration, code validation, club transactions, leaderboard
- `paddleFinder`: quiz submission, paddle recommendations, buying guide capture
- `user`: profile, wishlist, dashboard

## Example Procedure Calls

List products:

```text
GET /trpc/product.list?input=%7B%7D
```

Get filters:

```text
GET /trpc/product.getFilters
```

Search venues:

```text
GET /trpc/venue.search?input=%7B%22query%22%3A%22Sydney%22%7D
```

Submit a paddle finder recommendation request:

```text
GET /trpc/paddleFinder.getRecommendations?input=%7B%22skillLevel%22%3A%22BEGINNER%22%2C%22maxBudget%22%3A200%7D
```

For app code, prefer the generated tRPC client rather than hand-building URLs.

# Backend Guide

This backend is built with Hono, tRPC, Better Auth, Prisma, and PostgreSQL. It follows the project plan in `pickle-power-sports-implementation-plan.md`, updated for the actual generated stack: Postgres + Prisma + Better Auth instead of MySQL + Drizzle + NextAuth.

## Local Services

Start the database:

```bash
npm run db:start
```

The Docker Postgres container exposes host port `5433` and container port `5432`.

Current server database URL:

```bash
postgresql://postgres:password@localhost:5433/Pickle-Power-Sports
```

Push Prisma schema changes and generate the Prisma client:

```bash
npm run db:push
npm run db:generate
```

Start the backend:

```bash
npm run dev:server
```

The server runs at:

```text
http://localhost:3000
```

The tRPC API runs under:

```text
http://localhost:3000/trpc
```

## Useful URLs

Opening `/trpc` in a browser shows a small API guide. tRPC procedures must be called by path.

```text
http://localhost:3000/
http://localhost:3000/trpc
http://localhost:3000/trpc/healthCheck
http://localhost:3000/trpc/product.getFilters
http://localhost:3000/trpc/product.list?input=%7B%7D
http://localhost:3000/trpc/venue.list?input=%7B%7D
http://localhost:3000/trpc/content.getTestimonials?input=%7B%7D
```

If you see `No procedure found on path ""`, the request went to `/trpc` without a procedure path. Use `/trpc/healthCheck` or another procedure name.

## Tenant Behavior

The backend is tenant-ready from day one. Every business table is scoped by `tenantId`, and tenant-aware tRPC procedures require a tenant in context.

Tenant resolution happens in `apps/server/src/index.ts`:

- `localhost`, `127.0.0.1`, and the root domain resolve to the default tenant slug.
- The default tenant slug is `picklepowersports`.
- You can override it with `DEFAULT_TENANT_SLUG`.
- You can override the production root domain with `ROOT_DOMAIN`.
- Subdomains resolve from the host, such as `rallypoint.picklepowersports.com`.
- Custom domains resolve through the `tenant_domain` table.

On local requests, the server upserts the default tenant automatically. This makes local development smoother because public tenant-scoped APIs work immediately.

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
- `protectedTenantProcedure`: requires both session and tenant

## Authentication

Authentication is handled by Better Auth in `packages/auth/src/index.ts`.

Auth routes are mounted at:

```text
/api/auth/*
```

Protected tRPC procedures require the Better Auth session cookie. Public catalog and content endpoints do not require sign-in, but they do require tenant resolution.

## Database Schema

Prisma schema files live in:

```text
packages/db/prisma/schema/schema.prisma
packages/db/prisma/schema/auth.prisma
```

Core model groups:

- Tenancy: `Tenant`, `TenantDomain`, `TenantMember`
- Auth and profile: `User`, `Session`, `Account`, `Verification`
- Commerce: `Category`, `Brand`, `Product`, `ProductImage`, `ProductTag`, `Cart`, `Order`, `Payment`, `Wishlist`
- Courts: `Venue`, `Court`, `VenueAvailability`, `CourtBooking`
- Training: `Coach`, `TrainingClass`, `ClassSession`, `ClassEnrollment`
- Tournaments: `Tournament`, `TournamentRegistration`
- Content and community: `Review`, `StaffPick`, `Article`, `Testimonial`, `Club`, `ClubTransaction`, `NewsletterSubscriber`
- Quiz: `PaddleFinderSubmission`

Important tenancy rule: business slugs are unique per tenant, not globally. For example, products use `@@unique([tenantId, slug])` so different clubs can reuse the same URL slugs.

## Router Map

The app router is registered in `packages/api/src/routers/index.ts`.

Available routers:

- `auth`: session helpers
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

## Verification Commands

Run these after backend changes:

```bash
npm run db:generate
npm run db:push
npm run check-types
npm run build --workspace server
```

Quick smoke checks:

```bash
curl http://localhost:3000/
curl http://localhost:3000/trpc/healthCheck
curl "http://localhost:3000/trpc/product.list?input=%7B%7D"
```

## Current Limitations

- Stripe, Resend, UploadThing, and Mapbox are not wired yet.
- Admin CRUD screens are not implemented yet.
- Public list endpoints return empty arrays until the database has seed data.
- Protected procedures require a real Better Auth session from the web app.

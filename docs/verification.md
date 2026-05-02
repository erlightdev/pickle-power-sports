# Verification

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
curl http://localhost:3000/healthz
curl http://localhost:3000/readyz
curl http://localhost:3000/trpc/healthCheck
curl "http://localhost:3000/trpc/product.list?input=%7B%7D"
```

## Current Limitations

- Stripe, Resend, UploadThing, and Mapbox are not wired yet.
- Admin CRUD screens are not implemented yet.
- Public list endpoints return empty arrays until the database has seed data.
- Protected tenant procedures require a Better Auth session and a `TenantMember` row for the active tenant.

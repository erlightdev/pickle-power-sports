# Local Development

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

## Local Debug URLs

These URLs are for local browser checks and smoke tests only. They are not the production integration pattern for app code.

Opening `/trpc` in a local browser shows a small API guide. This guide is disabled when `NODE_ENV=production`. tRPC procedures must be called by path.

```text
http://localhost:3000/
http://localhost:3000/healthz
http://localhost:3000/readyz
http://localhost:3000/trpc
http://localhost:3000/trpc/healthCheck
http://localhost:3000/trpc/product.getFilters
http://localhost:3000/trpc/product.list?input=%7B%7D
http://localhost:3000/trpc/venue.list?input=%7B%7D
http://localhost:3000/trpc/content.getTestimonials?input=%7B%7D
```

If you see `No procedure found on path ""`, the request went to `/trpc` without a procedure path. Use `/trpc/healthCheck` or another procedure name.

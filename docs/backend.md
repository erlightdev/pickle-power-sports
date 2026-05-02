# Backend Docs

This backend is built with Hono, tRPC, Better Auth, Prisma, and PostgreSQL. The detailed backend notes are split into focused docs so each area stays easy to maintain.

## Start Here

- [Local development](./local-development.md): database, server startup, and local URLs
- [API and tRPC](./api.md): production tRPC usage, context, routers, and example calls
- [Authentication and RBAC](./auth-rbac.md): Better Auth, platform roles, tenant roles, and membership rules
- [Tenancy](./tenancy.md): tenant resolution, domains, local tenant behavior, and production rules
- [Database schema](./database.md): Prisma schema layout and model groups
- [EchoAPI testing](./echoapi.md): import and run local smoke tests in EchoAPI Desktop
- [Verification](./verification.md): commands, smoke checks, and current limitations

## Stack Notes

The implementation follows `pickle-power-sports-implementation-plan.md`, updated for the generated stack in this repository:

- PostgreSQL + Prisma instead of MySQL + Drizzle
- Better Auth instead of NextAuth
- Hono + tRPC for the API boundary
- Turborepo + npm workspaces for package orchestration

## Main Backend Paths

```text
apps/server/src/index.ts
packages/api/src
packages/auth/src
packages/db/prisma/schema
echoapi/pickle-power-sports-smoke.openapi.json
```

# pickle-power-sports

Monorepo for the Pickle Power Sports demo application.

This workspace contains a full-stack TypeScript app (server, web, packages) using tRPC, Prisma, Better Auth, and Vite.

Quick start

1. Start the database:

```bash
npm run db:start
```

2. Push Prisma schema and generate client:

```bash
npm run db:push
npm run db:generate
```

3. Start the backend:

```bash
npm run dev:server
```

Backend docs start at `docs/backend.md`.

Focused backend guides:

- `docs/local-development.md`
- `docs/api.md`
- `docs/auth-rbac.md`
- `docs/admin-settings.md`
- `docs/tenancy.md`
- `docs/database.md`
- `docs/echoapi.md`
- `docs/verification.md`
# Pickle-Power-Sports

This project was created with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack), a modern TypeScript stack that combines React, TanStack Router, Hono, TRPC, and more.

## Features

- **TypeScript** - For type safety and improved developer experience
- **TanStack Router** - File-based routing with full type safety
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **Shared UI package** - shadcn/ui primitives live in `packages/ui`
- **Hono** - Lightweight, performant server framework
- **tRPC** - End-to-end type-safe APIs
- **Node.js** - Runtime environment
- **Prisma** - TypeScript-first ORM
- **PostgreSQL** - Database engine
- **Authentication** - Better-Auth
- **Biome** - Linting and formatting
- **Turborepo** - Optimized monorepo build system

## Getting Started

First, install the dependencies:

```bash
npm install
```

## Database Setup

This project uses PostgreSQL with Prisma.

1. Make sure you have a PostgreSQL database set up.
2. Update your `apps/server/.env` file with your PostgreSQL connection details.

3. Apply the schema to your database:

```bash
npm run db:push
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser to see the web application.
The API is running at [http://localhost:3000](http://localhost:3000).

## UI Customization

React web apps in this stack share shadcn/ui primitives through `packages/ui`.

- Change design tokens and global styles in `packages/ui/src/styles/globals.css`
- Update shared primitives in `packages/ui/src/components/*`
- Adjust shadcn aliases or style config in `packages/ui/components.json` and `apps/web/components.json`

### Add more shared components

Run this from the project root to add more primitives to the shared UI package:

```bash
npx shadcn@latest add accordion dialog popover sheet table -c packages/ui
```

Import shared components like this:

```tsx
import { Button } from "@Pickle-Power-Sports/ui/components/button";
```

### Add app-specific blocks

If you want to add app-specific blocks instead of shared primitives, run the shadcn CLI from `apps/web`.

## Git Hooks and Formatting

- Format and lint fix: `npm run check`

## Project Structure

```
Pickle-Power-Sports/
├── apps/
│   ├── web/         # Frontend application (React + TanStack Router)
│   └── server/      # Backend API (Hono, TRPC)
├── packages/
│   ├── ui/          # Shared shadcn/ui components and styles
│   ├── api/         # API layer / business logic
│   ├── auth/        # Authentication configuration & logic
│   └── db/          # Database schema & queries
```

## Available Scripts

- `npm run dev`: Start all applications in development mode
- `npm run build`: Build all applications
- `npm run dev:web`: Start only the web application
- `npm run dev:server`: Start only the server
- `npm run check-types`: Check TypeScript types across all apps
- `npm run db:push`: Push schema changes to database
- `npm run db:generate`: Generate database client/types
- `npm run db:migrate`: Run database migrations
- `npm run db:studio`: Open database studio UI
- `npm run check`: Run Biome formatting and linting

 ╭────────────────────────────────────────────────────────────────────╮
 │                                                                    │
 │  Next steps                                                        │
 │  1. cd Projects                                         │
 │  2. npm install                                                    │
 │  3. npm run dev                                                    │
 │  Your project will be available at:                                │
 │  • Frontend: http://localhost:5173                                 │
 │  • Backend API: http://localhost:3000                              │
 │                                                                    │
 │  Database commands:                                                │
 │  • Start docker container: npm run db:start                        │
 │  • Generate Prisma Client: npm run db:generate                     │
 │  • Apply schema: npm run db:push                                   │
 │  • Database UI: npm run db:studio                                  │
 │                                                                    │
 │  Linting and formatting:                                           │
 │  • Format and lint fix: npm run check                              │
 │                                                                    │
 │  Special sponsors                                                  │
 │  • neondatabase   • Guillermo Rauch   • Clerk   • Novu   • Convex  │
 │                                                                    │
 │  Like Better-T-Stack? Please consider giving us a star             │
 │     on GitHub:                                                     │
 │  https://github.com/AmanVarshney01/create-better-t-stack           │
 │                                                                  

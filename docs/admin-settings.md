# Admin Settings

The admin settings UI lives at:

```text
/team
```

The sidebar Settings links route to three hash sections:

- `/team#tenant`
- `/team#members`
- `/team#domains`

The page is implemented in `apps/web/src/routes/team.tsx`. Sidebar links are configured in `apps/web/src/components/app-sidebar.tsx`.

## Access Rules

Admin settings require tenant admin access.

Allowed tenant roles:

- `OWNER`
- `ADMIN`

Platform `User.role = ADMIN` bypasses tenant role checks and can manage tenant settings globally.

Tenant users without admin access see an access-required message.

## Tenant Section

The Tenant section manages the current tenant profile:

- Name
- Slug
- Logo URL
- Brand color

API procedures:

- `tenant.settings`
- `tenant.updateCurrent`

Owner-only behavior:

- Only `OWNER` can change the tenant slug.
- `ADMIN` can update other tenant fields, but the slug field is disabled in the UI.

Relevant database table:

```text
tenant
```

Important columns:

- `name`
- `slug`
- `logoUrl`
- `brandColor`
- `status`

## Members Section

The Members section shows all registered users, including users who do not yet have access to the current tenant.

For each user, admins can:

- Assign a tenant role
- Update an existing tenant role
- Remove tenant access

API procedures:

- `tenant.listRegisteredUsers`
- `tenant.addMember`
- `tenant.updateMemberRole`
- `tenant.removeMember`

Relevant database tables:

```text
user
tenant_member
```

Platform roles are stored on `user.role`:

- `CUSTOMER`
- `COACH`
- `ADMIN`

Tenant roles are stored on `tenant_member.role`:

- `OWNER`
- `ADMIN`
- `STAFF`
- `COACH`
- `MEMBER`

Safety rules:

- Only tenant owners can assign `OWNER`.
- A tenant must always keep at least one owner.
- Users cannot remove their own tenant membership.
- Platform admins do not need a `tenant_member` row to access tenant admin actions.

## First User Bootstrap

When a user registers from a tenant subdomain, the web app calls `tenant.joinCurrent` after email verification.

If the tenant has no members yet:

- The tenant membership row is created.
- The registering user becomes `OWNER`.

If the tenant already has members:

- New users are not auto-promoted.
- Tenant access remains invite-only through the Members section.

In local development, `*.localhost` hosts resolve to tenant slugs. For example:

```text
club.localhost
```

uses the tenant slug:

```text
club
```

In production, subdomain bootstrap requires `ROOT_DOMAIN` so a host like:

```text
club.yourdomain.com
```

can resolve the tenant slug:

```text
club
```

## Domains Section

The Domains section manages domains that resolve to the current tenant.

Admins can:

- Add a subdomain
- Add a custom domain
- View verification status
- Remove a domain

API procedures:

- `tenant.settings`
- `tenant.addDomain`
- `tenant.removeDomain`

Relevant database table:

```text
tenant_domain
```

Important columns:

- `domain`
- `type`
- `verified`
- `tenantId`

Domain types:

- `SUBDOMAIN`
- `CUSTOM`

For `SUBDOMAIN`, admins enter only the available label. For example, entering:

```text
club
```

saves:

```text
club.localhost
```

in local development, and:

```text
club.yourdomain.com
```

in production when `ROOT_DOMAIN=yourdomain.com`.

The suffix comes from `ROOT_DOMAIN`. When `ROOT_DOMAIN` is not set, the app uses `localhost` in development. In production, there is no hard-coded fallback; `ROOT_DOMAIN` must be configured before adding subdomains.

For `CUSTOM`, admins enter the full domain, such as:

```text
club.example.com
```

Verification is currently stored and displayed, but DNS verification automation is not implemented yet.

Status labels:

- `Local`: `localhost` or `*.localhost` domains used for development.
- `Verified`: DNS verification has been marked true.
- `Pending`: production/custom domain has not been verified yet.

## Local Domain Testing

The default local app URLs are:

```text
http://localhost:3001
http://localhost:3000
```

The server can resolve local tenant subdomains like:

```text
tenant-slug.localhost
```

Saved domain mappings are checked before the local tenant-slug fallback, so a saved `club.localhost` domain resolves to the tenant that owns that domain.

For browser testing, the frontend and backend origins must match your local subdomain setup. For example, to test `club.localhost`, use matching local env values:

```text
VITE_SERVER_URL=http://club.localhost:3000
CORS_ORIGIN=http://club.localhost:3001
```

Then open:

```text
http://club.localhost:3001
```

The web app also auto-rewrites `VITE_SERVER_URL` in development when it is opened from `*.localhost`. For example, with:

```text
VITE_SERVER_URL=http://localhost:3000
```

opening `http://club.localhost:3001` makes tRPC and Better Auth call:

```text
http://club.localhost:3000
```

The server accepts `http://*.localhost:3001` CORS/auth origins in development.

Do not open `http://club.localhost` without the port during Vite development. Without `:3001`, the browser tries port `80`, where no local web server is running.

Testing a production-style domain locally, such as `club.yourdomain.com`, requires mapping that host to `127.0.0.1` in your hosts file and using matching env origins. In normal local development, `*.localhost` is easier.

## Local Development URLs

Start the app:

```bash
npm run dev
```

Open:

```text
http://localhost:3001/team#tenant
http://localhost:3001/team#members
http://localhost:3001/team#domains
```

The backend runs at:

```text
http://localhost:3000
```

## Prisma Studio Fixes

Use Prisma Studio for manual database fixes:

```bash
npm run db:studio
```

To fix a mistaken tenant role assignment:

1. Open `TenantMember`.
2. Find the row with the user's `userId`.
3. Change `role` to the correct tenant role.
4. Save.

Do not confuse:

- `TenantMember.role`: tenant access role.
- `User.role`: platform role.

## Direct SQL Fix

For local Docker Postgres:

```powershell
docker exec -it Pickle-Power-Sports-postgres psql -U postgres -d Pickle-Power-Sports
```

Change one tenant member back to `MEMBER` by email:

```sql
UPDATE tenant_member tm
SET role = 'MEMBER'
FROM "user" u
WHERE tm."userId" = u.id
  AND u.email = 'user@example.com';
```

Check the result:

```sql
SELECT u.email, tm.role
FROM tenant_member tm
JOIN "user" u ON u.id = tm."userId"
WHERE u.email = 'user@example.com';
```

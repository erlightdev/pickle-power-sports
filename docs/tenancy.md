# Tenancy

The backend is tenant-ready from day one. Every business table is scoped by `tenantId`, and tenant-aware tRPC procedures require a tenant in context.

Tenant resolution happens in `apps/server/src/index.ts`.

## Resolution Rules

- `localhost`, `127.0.0.1`, and the root domain resolve to the default tenant slug.
- The default tenant slug is `picklepowersports`.
- You can override it with `DEFAULT_TENANT_SLUG`.
- Production subdomains require `ROOT_DOMAIN`.
- Subdomains resolve from an explicit `tenant_domain` row, such as `rallypoint.yourdomain.com`.
- Custom domains resolve through the `tenant_domain` table.
- In local development only, `X-Tenant-Slug` can select a tenant while using `localhost`.
- Tenants are not auto-created during normal host resolution. The tenant must already exist and have `ACTIVE` status.

## Local Tenant Behavior

On local root requests, the server resolves the default tenant slug. On `*.localhost` requests, the subdomain must match a domain row created by an owner/admin. This makes local subdomain testing explicit and prevents deleted or never-created subdomains from becoming accessible.

Non-default tenants must be created explicitly by a system admin. Creating a subdomain creates the tenant and its `tenant_domain` row first; the first registration on that subdomain claims owner access for that tenant.

If a tenant is deleted, the React dev server may still serve the app shell at the old `*.localhost:3001` URL, but the server rejects tenant-scoped auth and tRPC requests for that host. The web app redirects missing subdomains back to the main system domain.

## Production Tenant Rules

- Tenants must be created before traffic is routed to them.
- Only active tenants should resolve.
- Custom domains should be stored in `tenant_domain`.
- Production requests should not rely on `X-Tenant-Slug`.
- Tenant membership is required for protected tenant procedures.

## Admin Management

Tenant profile and domain management are documented in `docs/admin-settings.md`.

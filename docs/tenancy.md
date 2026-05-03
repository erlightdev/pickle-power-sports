# Tenancy

The backend is tenant-ready from day one. Every business table is scoped by `tenantId`, and tenant-aware tRPC procedures require a tenant in context.

Tenant resolution happens in `apps/server/src/index.ts`.

## Resolution Rules

- `localhost`, `127.0.0.1`, and the root domain resolve to the default tenant slug.
- The default tenant slug is `picklepowersports`.
- You can override it with `DEFAULT_TENANT_SLUG`.
- Production subdomains require `ROOT_DOMAIN`.
- Subdomains resolve from the host, such as `rallypoint.yourdomain.com`.
- Custom domains resolve through the `tenant_domain` table.
- In local development only, `X-Tenant-Slug` can select a tenant while using `localhost`.
- In production, tenants are never auto-created from hostnames. The tenant must already exist and have `ACTIVE` status.

## Local Tenant Behavior

On local root requests, the server upserts the default tenant automatically. On `*.localhost` requests, the subdomain is treated as the tenant slug. This makes subdomain testing work locally.

Non-default tenants must be created explicitly.

## Production Tenant Rules

- Tenants must be created before traffic is routed to them.
- Only active tenants should resolve.
- Custom domains should be stored in `tenant_domain`.
- Production requests should not rely on `X-Tenant-Slug`.
- Tenant membership is required for protected tenant procedures.

## Admin Management

Tenant profile and domain management are documented in `docs/admin-settings.md`.

# Authentication and RBAC

## Authentication

Authentication is handled by Better Auth in `packages/auth/src/index.ts`.

Auth routes are mounted at:

```text
/api/auth/*
```

Protected tRPC procedures require the Better Auth session cookie. Public catalog and content endpoints do not require sign-in, but they do require tenant resolution.

Local auth cookies use `SameSite=Lax` and non-secure cookies for HTTP development. HTTPS deployments use secure cookies with `SameSite=None`.

## RBAC Files

RBAC helpers live in:

```text
packages/api/src/auth/roles.ts
packages/api/src/auth/access.ts
```

## Platform Roles

Platform-level user roles:

- `CUSTOMER`
- `COACH`
- `ADMIN`

Platform `ADMIN` users bypass tenant role checks for support and operations.

## Tenant Roles

Tenant-level member roles:

- `OWNER`
- `ADMIN`
- `STAFF`
- `COACH`
- `MEMBER`

Tenant role groups:

- `tenantAdminRoles`: `OWNER`, `ADMIN`
- `tenantStaffRoles`: `OWNER`, `ADMIN`, `STAFF`
- `tenantCoachRoles`: `OWNER`, `ADMIN`, `STAFF`, `COACH`
- `tenantMemberRoles`: all tenant roles

Normal users must have a `TenantMember` row for the active tenant before they can call `protectedTenantProcedure` APIs.

## Tenant Membership Flow

1. User signs up or signs in through Better Auth.
2. App calls `tenant.joinCurrent` for the active tenant only during tenant bootstrap.
3. If the tenant has no members yet, the first member becomes `OWNER`.
4. After the first owner exists, tenant membership is invite-only through admin-managed APIs.
5. Tenant owners/admins manage members through `tenant.listMembers`, `tenant.addMember`, `tenant.updateMemberRole`, and `tenant.removeMember`.

## Admin Safety Rules

- Only tenant owners can assign `OWNER`.
- A tenant must always keep at least one owner.
- Users cannot remove their own tenant membership.
- Tenant slug changes require owner access.

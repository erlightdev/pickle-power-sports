# Database Schema

Prisma schema files live in:

```text
packages/db/prisma/schema/schema.prisma
packages/db/prisma/schema/auth.prisma
```

## Core Model Groups

- Tenancy: `Tenant`, `TenantDomain`, `TenantMember`
- Auth and profile: `User`, `Session`, `Account`, `Verification`
- Commerce: `Category`, `Brand`, `Product`, `ProductImage`, `ProductTag`, `Cart`, `Order`, `Payment`, `Wishlist`
- Courts: `Venue`, `Court`, `VenueAvailability`, `CourtBooking`
- Training: `Coach`, `TrainingClass`, `ClassSession`, `ClassEnrollment`
- Tournaments: `Tournament`, `TournamentRegistration`
- Content and community: `Review`, `StaffPick`, `Article`, `Testimonial`, `Club`, `ClubTransaction`, `NewsletterSubscriber`
- Quiz: `PaddleFinderSubmission`

## Tenancy Rule

Business slugs are unique per tenant, not globally. For example, products use `@@unique([tenantId, slug])` so different clubs can reuse the same URL slugs.

## Schema Commands

Generate the Prisma client:

```bash
npm run db:generate
```

Push the schema to the local database:

```bash
npm run db:push
```

Open Prisma Studio:

```bash
npm run db:studio
```

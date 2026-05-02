# Pickle Power Sports — Full-Stack Implementation Plan
## Better-T-Stack (tRPC + Drizzle ORM + Hono + MySQL)

---

## Executive Summary

This document maps every feature from the Pickle Power Sports static website to a complete backend implementation using the **Better-T-Stack** architecture. The plan covers database schema, tRPC routers, authentication, e-commerce flows, court booking, class scheduling, tournament management, and content systems.

**Recommended Stack Selection via Better-T-Stack CLI:**
```bash
bun create better-t-stack@latest pickle-power-sports \
  --frontend tanstack-router \
  --backend hono \
  --database mysql \
  --orm drizzle \
  --api trpc \
  --auth next-auth  # or clerk
  --addons stripe,uploadthing,resend
```

---

## Phase 1: Foundation & Architecture

### 1.1 Project Structure (Monorepo)

```
pickle-power-sports/
├── apps/
│   ├── web/              # React + TanStack Router frontend
│   ├── server/           # Hono + tRPC backend
│   └── docs/             # Starlight documentation (optional)
├── packages/
│   ├── config/           # Shared ESLint, TS, Tailwind config
│   ├── db/               # Drizzle schema + migrations
│   ├── contracts/        # Shared tRPC types + Zod schemas
│   └── ui/               # shadcn/ui shared components
└── bts.jsonc
```

### 1.2 Core Technology Mapping

| Website Feature | Better-T-Stack Component |
|-----------------|--------------------------|
| Product Catalog | Drizzle ORM + tRPC query router |
| User Accounts | Next-Auth / Clerk + Drizzle users table |
| Shopping Cart | tRPC mutations + cart items table |
| Court Booking | tRPC mutations + bookings table |
| Class Enrollment | tRPC mutations + enrollments table |
| Tournament Registration | tRPC mutations + registrations table |
| Paddle Finder Quiz | Frontend state → tRPC recommendation engine |
| Reviews & Ratings | tRPC CRUD + reviews table |
| Club Rewards | tRPC logic + referrals table |
| Payments | Stripe integration addon |
| File Uploads | UploadThing addon (product images, avatars) |
| Emails | Resend addon (order confirmations, newsletters) |

---

## Phase 2: Database Schema Design

### 2.1 Core Commerce Tables

```typescript
// packages/db/schema.ts

import { mysqlTable, serial, varchar, text, decimal, int, timestamp, boolean, json, mysqlEnum } from "drizzle-orm/mysql-core";

// ─── Users & Auth ─────────────────────────────────
export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  avatarUrl: varchar("avatar_url", { length: 500 }),
  duprRating: decimal("dupr_rating", { precision: 3, scale: 1 }),
  skillLevel: mysqlEnum("skill_level", ["Beginner", "Intermediate", "Advanced", "Pro"]),
  role: mysqlEnum("role", ["customer", "coach", "admin"]).default("customer"),
  memberSince: timestamp("member_since").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─── Categories ───────────────────────────────────
export const categories = mysqlTable("categories", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  imageUrl: varchar("image_url", { length: 500 }),
  productCount: int("product_count").default(0),
  sortOrder: int("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── Brands ─────────────────────────────────────────
export const brands = mysqlTable("brands", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  logoUrl: varchar("logo_url", { length: 500 }),
  description: text("description"),
  website: varchar("website", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── Products ─────────────────────────────────────
export const products = mysqlTable("products", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 150 }).notNull().unique(),
  sku: varchar("sku", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  brandId: int("brand_id").references(() => brands.id),
  categoryId: int("category_id").references(() => categories.id),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  compareAtPrice: decimal("compare_at_price", { precision: 10, scale: 2 }),
  stockQuantity: int("stock_quantity").default(0),
  isInStock: boolean("is_in_stock").default(true),
  isFeatured: boolean("is_featured").default(false),
  isOnSale: boolean("is_on_sale").default(false),
  salePercentage: int("sale_percentage").default(0),
  skillLevel: mysqlEnum("skill_level", ["Beginner", "Intermediate", "Advanced", "Pro"]),
  weight: decimal("weight", { precision: 5, scale: 2 }),     // oz
  thickness: decimal("thickness", { precision: 3, scale: 1 }), // mm
  surfaceMaterial: varchar("surface_material", { length: 50 }),
  coreMaterial: varchar("core_material", { length: 50 }),
  gripSize: varchar("grip_size", { length: 20 }),
  handleLength: decimal("handle_length", { precision: 4, scale: 1 }),
  shape: varchar("shape", { length: 50 }),                 // standard/elongated/wide
  usapaApproved: boolean("usapa_approved").default(false),
  paApproved: boolean("pa_approved").default(false),           // Pickleball Australia
  demoEligible: boolean("demo_eligible").default(true),
  rating: decimal("rating", { precision: 2, scale: 1 }).default("0"),
  reviewCount: int("review_count").default(0),
  metadata: json("metadata"),                                // flexible specs
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─── Product Images ───────────────────────────────
export const productImages = mysqlTable("product_images", {
  id: serial("id").primaryKey(),
  productId: int("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  url: varchar("url", { length: 500 }).notNull(),
  alt: varchar("alt", { length: 255 }),
  sortOrder: int("sort_order").default(0),
  isPrimary: boolean("is_primary").default(false),
});

// ─── Product Tags ───────────────────────────────────
export const productTags = mysqlTable("product_tags", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
});

export const productTagRelations = mysqlTable("product_tag_relations", {
  productId: int("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  tagId: int("tag_id").notNull().references(() => productTags.id, { onDelete: "cascade" }),
});
```

### 2.2 E-Commerce & Orders

```typescript
// ─── Carts ──────────────────────────────────────────
export const carts = mysqlTable("carts", {
  id: serial("id").primaryKey(),
  userId: int("user_id").references(() => users.id, { onDelete: "cascade" }),
  sessionId: varchar("session_id", { length: 255 }),        // for guest carts
  status: mysqlEnum("status", ["active", "converted", "abandoned"]).default("active"),
  totalItems: int("total_items").default(0),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const cartItems = mysqlTable("cart_items", {
  id: serial("id").primaryKey(),
  cartId: int("cart_id").notNull().references(() => carts.id, { onDelete: "cascade" }),
  productId: int("product_id").notNull().references(() => products.id),
  quantity: int("quantity").notNull().default(1),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  isDemoItem: boolean("is_demo_item").default(false),     // 14-day demo
});

// ─── Wishlists ────────────────────────────────────
export const wishlists = mysqlTable("wishlists", {
  id: serial("id").primaryKey(),
  userId: int("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  productId: int("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── Orders ───────────────────────────────────────
export const orders = mysqlTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: varchar("order_number", { length: 50 }).notNull().unique(),
  userId: int("user_id").notNull().references(() => users.id),
  status: mysqlEnum("status", [
    "pending", "paid", "processing", "shipped", "delivered", "cancelled", "returned"
  ]).default("pending"),
  paymentStatus: mysqlEnum("payment_status", ["pending", "paid", "failed", "refunded"]).default("pending"),
  fulfillmentStatus: mysqlEnum("fulfillment_status", ["unfulfilled", "partial", "fulfilled"]).default("unfulfilled"),
  currency: varchar("currency", { length: 3 }).default("AUD"),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  shippingCost: decimal("shipping_cost", { precision: 10, scale: 2 }).default("0"),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0"),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0"),  // GST
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  shippingAddress: json("shipping_address"),
  billingAddress: json("billing_address"),
  trackingNumber: varchar("tracking_number", { length: 100 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const orderItems = mysqlTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: int("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: int("product_id").notNull().references(() => products.id),
  quantity: int("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  isDemoItem: boolean("is_demo_item").default(false),
});

// ─── Payment Records (Stripe) ─────────────────────
export const payments = mysqlTable("payments", {
  id: serial("id").primaryKey(),
  orderId: int("order_id").notNull().references(() => orders.id),
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 100 }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("AUD"),
  status: mysqlEnum("status", ["pending", "succeeded", "failed", "refunded"]).default("pending"),
  paymentMethod: varchar("payment_method", { length: 50 }),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
});
```

### 2.3 Court Booking System

```typescript
// ─── Venues ───────────────────────────────────────
export const venues = mysqlTable("venues", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 150 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  postcode: varchar("postcode", { length: 20 }),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  phone: varchar("phone", { length: 30 }),
  email: varchar("email", { length: 255 }),
  description: text("description"),
  rating: decimal("rating", { precision: 2, scale: 1 }).default("0"),
  reviewCount: int("review_count").default(0),
  totalCourts: int("total_courts").default(0),
  indoorCourts: int("indoor_courts").default(0),
  outdoorCourts: int("outdoor_courts").default(0),
  hasLights: boolean("has_lights").default(false),
  hasProShop: boolean("has_pro_shop").default(false),
  hasFreeParking: boolean("has_free_parking").default(false),
  hasShowers: boolean("has_showers").default(false),
  hasLockerRooms: boolean("has_locker_rooms").default(false),
  hasClimateControl: boolean("has_climate_control").default(false),
  isPartner: boolean("is_partner").default(false),         // "Tour Partner"
  images: json("images"),
  amenities: json("amenities"),                              // extensible list
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── Courts ─────────────────────────────────────────
export const courts = mysqlTable("courts", {
  id: serial("id").primaryKey(),
  venueId: int("venue_id").notNull().references(() => venues.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  type: mysqlEnum("type", ["indoor", "outdoor"]).default("outdoor"),
  surfaceType: varchar("surface_type", { length: 50 }),     // hardcourt, grass, etc.
  isActive: boolean("is_active").default(true),
  hourlyRate: decimal("hourly_rate", { precision: 6, scale: 2 }).notNull(),
  memberHourlyRate: decimal("member_hourly_rate", { precision: 6, scale: 2 }),
});

// ─── Court Bookings ─────────────────────────────────
export const courtBookings = mysqlTable("court_bookings", {
  id: serial("id").primaryKey(),
  courtId: int("court_id").notNull().references(() => courts.id),
  userId: int("user_id").notNull().references(() => users.id),
  bookingDate: timestamp("booking_date").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  durationMinutes: int("duration_minutes").notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["confirmed", "cancelled", "completed", "no_show"]).default("confirmed"),
  cancellationReason: text("cancellation_reason"),
  cancelledAt: timestamp("cancelled_at"),
  isMemberBooking: boolean("is_member_booking").default(false),
  guestCount: int("guest_count").default(1),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── Venue Availability Slots ──────────────────────
export const venueAvailability = mysqlTable("venue_availability", {
  id: serial("id").primaryKey(),
  courtId: int("court_id").notNull().references(() => courts.id, { onDelete: "cascade" }),
  dayOfWeek: int("day_of_week").notNull(),                  // 0=Sunday...6=Saturday
  startTime: varchar("start_time", { length: 5 }).notNull(),  // "HH:MM"
  endTime: varchar("end_time", { length: 5 }).notNull(),
  isAvailable: boolean("is_available").default(true),
});
```

### 2.4 Skill School (Training)

```typescript
// ─── Coaches ──────────────────────────────────────
export const coaches = mysqlTable("coaches", {
  id: serial("id").primaryKey(),
  userId: int("user_id").references(() => users.id),        // linked account
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 150 }).notNull().unique(),
  bio: text("bio"),
  avatarUrl: varchar("avatar_url", { length: 500 }),
  duprRating: decimal("dupr_rating", { precision: 3, scale: 1 }),
  certifications: json("certifications"),                  // ["PPR-certified", ...]
  specialties: json("specialties"),                        // ["dinking", "serves", ...]
  isActive: boolean("is_active").default(true),
});

// ─── Classes / Lessons ────────────────────────────
export const classes = mysqlTable("classes", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 150 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  skillLevel: mysqlEnum("skill_level", ["Beginner", "Intermediate", "Advanced"]).notNull(),
  type: mysqlEnum("type", ["course", "drop_in", "private"]).notNull(),
  coachId: int("coach_id").references(() => coaches.id),
  venueId: int("venue_id").references(() => venues.id),
  maxGroupSize: int("max_group_size").default(6),
  durationMinutes: int("duration_minutes").notNull(),      // 45, 60, 90, 120
  totalSessions: int("total_sessions").default(1),         // for multi-week courses
  pricePerSession: decimal("price_per_session", { precision: 6, scale: 2 }).notNull(),
  memberDiscount: decimal("member_discount", { precision: 4, scale: 2 }).default("5.00"),
  isActive: boolean("is_active").default(true),
  imageUrl: varchar("image_url", { length: 500 }),
  tags: json("tags"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── Class Sessions / Schedule ────────────────────
export const classSessions = mysqlTable("class_sessions", {
  id: serial("id").primaryKey(),
  classId: int("class_id").notNull().references(() => classes.id, { onDelete: "cascade" }),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  venueId: int("venue_id").references(() => venues.id),
  courtId: int("court_id").references(() => courts.id),
  spotsTotal: int("spots_total").notNull(),
  spotsRemaining: int("spots_remaining").notNull(),
  isCancelled: boolean("is_cancelled").default(false),
});

// ─── Class Enrollments ────────────────────────────
export const classEnrollments = mysqlTable("class_enrollments", {
  id: serial("id").primaryKey(),
  sessionId: int("session_id").notNull().references(() => classSessions.id),
  userId: int("user_id").notNull().references(() => users.id),
  status: mysqlEnum("status", ["enrolled", "cancelled", "attended", "no_show"]).default("enrolled"),
  pricePaid: decimal("price_paid", { precision: 6, scale: 2 }).notNull(),
  isMember: boolean("is_member").default(false),
  enrolledAt: timestamp("enrolled_at").defaultNow(),
});
```

### 2.5 Tournament System

```typescript
// ─── Tournaments ──────────────────────────────────
export const tournaments = mysqlTable("tournaments", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 150 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  venueId: int("venue_id").references(() => venues.id),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  registrationOpenDate: timestamp("registration_open_date"),
  registrationCloseDate: timestamp("registration_close_date"),
  format: mysqlEnum("format", ["singles", "doubles", "mixed_doubles", "mixer"]).notNull(),
  levels: json("levels"),                                  // ["3.0", "3.5", "4.0", "4.5+"]
  entryFee: decimal("entry_fee", { precision: 6, scale: 2 }).notNull(),
  prizePool: decimal("prize_pool", { precision: 10, scale: 2 }),
  maxParticipants: int("max_participants"),
  spotsRemaining: int("spots_remaining"),
  isDUPRRated: boolean("is_dupr_rated").default(false),
  isSanctioned: boolean("is_sanctioned").default(false),   // PA/USAPA
  status: mysqlEnum("status", ["upcoming", "open", "waitlist", "in_progress", "completed", "cancelled"]).default("upcoming"),
  imageUrl: varchar("image_url", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── Tournament Registrations ─────────────────────
export const tournamentRegistrations = mysqlTable("tournament_registrations", {
  id: serial("id").primaryKey(),
  tournamentId: int("tournament_id").notNull().references(() => tournaments.id, { onDelete: "cascade" }),
  userId: int("user_id").notNull().references(() => users.id),
  partnerId: int("partner_id").references(() => users.id), // for doubles
  status: mysqlEnum("status", ["pending", "confirmed", "waitlist", "cancelled"]).default("pending"),
  skillLevel: varchar("skill_level", { length: 20 }),
  duprRating: decimal("dupr_rating", { precision: 3, scale: 1 }),
  entryFeePaid: decimal("entry_fee_paid", { precision: 6, scale: 2 }),
  paymentStatus: mysqlEnum("payment_status", ["pending", "paid", "refunded"]).default("pending"),
  registeredAt: timestamp("registered_at").defaultNow(),
});
```

### 2.6 Reviews, Content & Community

```typescript
// ─── Reviews ──────────────────────────────────────
export const reviews = mysqlTable("reviews", {
  id: serial("id").primaryKey(),
  productId: int("product_id").references(() => products.id, { onDelete: "cascade" }),
  venueId: int("venue_id").references(() => venues.id, { onDelete: "cascade" }),
  userId: int("user_id").references(() => users.id),
  authorName: varchar("author_name", { length: 255 }),
  authorAvatar: varchar("author_avatar", { length: 500 }),
  rating: int("rating").notNull(),                         // 1-5
  title: varchar("title", { length: 255 }),
  content: text("content"),
  verifiedPurchase: boolean("verified_purchase").default(false),
  duprRating: decimal("dupr_rating", { precision: 3, scale: 1 }),
  helpfulCount: int("helpful_count").default(0),
  isApproved: boolean("is_approved").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── Staff Picks ──────────────────────────────────
export const staffPicks = mysqlTable("staff_picks", {
  id: serial("id").primaryKey(),
  productId: int("product_id").notNull().references(() => products.id),
  staffName: varchar("staff_name", { length: 100 }).notNull(),
  staffRole: varchar("staff_role", { length: 100 }),
  staffAvatar: varchar("staff_avatar", { length: 500 }),
  staffDupr: decimal("staff_dupr", { precision: 3, scale: 1 }),
  quote: text("quote").notNull(),
  monthYear: varchar("month_year", { length: 10 }).notNull(), // "April 2026"
  sortOrder: int("sort_order").default(0),
  isActive: boolean("is_active").default(true),
});

// ─── Content / Blog / Buying Guides ────────────────
export const articles = mysqlTable("articles", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 150 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  subtitle: varchar("subtitle", { length: 500 }),
  type: mysqlEnum("type", ["review", "comparison", "guide", "technique", "news"]).notNull(),
  authorId: int("author_id").references(() => users.id),
  authorName: varchar("author_name", { length: 255 }),
  authorAvatar: varchar("author_avatar", { length: 500 }),
  authorDupr: decimal("author_dupr", { precision: 3, scale: 1 }),
  content: text("content"),
  excerpt: text("excerpt"),
  readTimeMinutes: int("read_time_minutes"),
  featuredImage: varchar("featured_image", { length: 500 }),
  isFeatured: boolean("is_featured").default(false),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── Club Rewards ─────────────────────────────────
export const clubs = mysqlTable("clubs", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 150 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 20 }).notNull().unique(),   // e.g., "RALLYPOINT"
  location: varchar("location", { length: 255 }),
  memberCount: int("member_count").default(0),
  discountPercent: decimal("discount_percent", { precision: 4, scale: 2 }).default("7.00"),
  cashbackPercent: decimal("cashback_percent", { precision: 4, scale: 2 }).default("7.00"),
  totalEarned: decimal("total_earned", { precision: 10, scale: 2 }).default("0"),
  isActive: boolean("is_active").default(true),
  logoUrl: varchar("logo_url", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const clubTransactions = mysqlTable("club_transactions", {
  id: serial("id").primaryKey(),
  clubId: int("club_id").notNull().references(() => clubs.id),
  userId: int("user_id").notNull().references(() => users.id),
  orderId: int("order_id").references(() => orders.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  type: mysqlEnum("type", ["cashback", "payout"]).default("cashback"),
  status: mysqlEnum("status", ["pending", "paid"]).default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── Newsletter Subscribers ───────────────────────
export const newsletterSubscribers = mysqlTable("newsletter_subscribers", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  skillLevel: mysqlEnum("skill_level", ["Beginner", "Intermediate", "Advanced", "Coach"]),
  isActive: boolean("is_active").default(true),
  subscribedAt: timestamp("subscribed_at").defaultNow(),
});
```

---

## Phase 3: tRPC Router Architecture

### 3.1 Router Registry

```typescript
// apps/server/src/router.ts
import { router } from "./lib/trpc";
import { authRouter } from "./routers/auth";
import { productRouter } from "./routers/product";
import { cartRouter } from "./routers/cart";
import { orderRouter } from "./routers/order";
import { venueRouter } from "./routers/venue";
import { courtRouter } from "./routers/court";
import { classRouter } from "./routers/class";
import { tournamentRouter } from "./routers/tournament";
import { reviewRouter } from "./routers/review";
import { contentRouter } from "./routers/content";
import { clubRouter } from "./routers/club";
import { paddleFinderRouter } from "./routers/paddle-finder";
import { userRouter } from "./routers/user";

export const appRouter = router({
  auth: authRouter,
  product: productRouter,
  cart: cartRouter,
  order: orderRouter,
  venue: venueRouter,
  court: courtRouter,
  class: classRouter,
  tournament: tournamentRouter,
  review: reviewRouter,
  content: contentRouter,
  club: clubRouter,
  paddleFinder: paddleFinderRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
```

### 3.2 Router Feature Breakdown

#### `product` Router
| Procedure | Type | Purpose |
|-----------|------|---------|
| `list` | query | Paginated product listing with filters (category, brand, skill, price, sale) |
| `getBySlug` | query | Single product detail with images, reviews, related products |
| `getFeatured` | query | Homepage featured products |
| `getBestsellers` | query | Top-selling products for homepage |
| `getNewArrivals` | query | Recently added products |
| `getBySkillLevel` | query | Products filtered by Beginner/Intermediate/Advanced/Pro |
| `search` | query | Full-text search across name, brand, specs |
| `getCategories` | query | All product categories |
| `getBrands` | query | All brands with product counts |
| `getFilters` | query | Active filter options for faceted navigation |

#### `cart` Router
| Procedure | Type | Purpose |
|-----------|------|---------|
| `get` | query | Current cart with items, totals |
| `addItem` | mutation | Add product to cart |
| `updateQuantity` | mutation | Change item quantity |
| `removeItem` | mutation | Remove item from cart |
| `applyPromo` | mutation | Apply discount code |
| `clear` | mutation | Empty cart |
| `mergeGuestCart` | mutation | Merge guest cart on login |

#### `order` Router
| Procedure | Type | Purpose |
|-----------|------|---------|
| `create` | mutation | Create order from cart |
| `get` | query | Order details by ID |
| `list` | query | User's order history |
| `getStatus` | query | Track order status |
| `cancel` | mutation | Request cancellation |
| `createDemoReturn` | mutation | Initiate 14-day demo return |

#### `venue` + `court` Routers
| Procedure | Type | Purpose |
|-----------|------|---------|
| `venue.list` | query | Search venues with geo + filters |
| `venue.getBySlug` | query | Venue detail with amenities, map |
| `venue.search` | query | Location-based search ("Sydney Olympic Park") |
| `court.getAvailability` | query | Available slots for date range |
| `court.book` | mutation | Book a court slot |
| `court.cancelBooking` | mutation | Cancel booking (free up to 4h) |
| `court.getUserBookings` | query | My upcoming court bookings |

#### `class` Router
| Procedure | Type | Purpose |
|-----------|------|---------|
| `list` | query | Classes with filters (skill, coach, venue) |
| `getBySlug` | query | Class detail with coach, schedule |
| `getSessions` | query | Upcoming sessions for a class |
| `enroll` | mutation | Book a class session |
| `cancelEnrollment` | mutation | Cancel class enrollment |
| `getMyEnrollments` | query | My upcoming classes |
| `getCoaches` | query | All coaches with specialties |

#### `tournament` Router
| Procedure | Type | Purpose |
|-----------|------|---------|
| `list` | query | Upcoming/past tournaments with filters |
| `getBySlug` | query | Tournament detail with registration status |
| `register` | mutation | Solo or doubles registration |
| `cancelRegistration` | mutation | Withdraw from tournament |
| `getMyRegistrations` | query | My tournament entries |
| `getLeaderboard` | query | Past tournament results |

#### `paddleFinder` Router
| Procedure | Type | Purpose |
|-----------|------|---------|
| `submitQuiz` | mutation | Submit 8-question quiz answers |
| `getRecommendations` | query | AI/algorithm-based paddle matches |
| `getBuyingGuide` | mutation | Email PDF guide by skill level |

#### `review` Router
| Procedure | Type | Purpose |
|-----------|------|---------|
| `list` | query | Reviews for product/venue with pagination |
| `create` | mutation | Submit review (verified purchase check) |
| `markHelpful` | mutation | Increment helpful count |
| `getSummary` | query | Average rating + distribution |

#### `content` Router
| Procedure | Type | Purpose |
|-----------|------|---------|
| `getStaffPicks` | query | Monthly staff picks with testimonials |
| `getArticles` | query | Blog/technique/buying guide listings |
| `getArticle` | query | Single article content |
| `getTestimonials` | query | Creator/community testimonials |

#### `club` Router
| Procedure | Type | Purpose |
|-----------|------|---------|
| `register` | mutation | Register new club |
| `validateCode` | query | Check club code validity |
| `getTransactions` | query | Club earnings history |
| `getLeaderboard` | query | Top-earning clubs |

#### `user` Router
| Procedure | Type | Purpose |
|-----------|------|---------|
| `getProfile` | query | Current user profile |
| `updateProfile` | mutation | Update DUPR, skill level, preferences |
| `getWishlist` | query | Saved products |
| `addToWishlist` | mutation | Save product |
| `removeFromWishlist` | mutation | Unsave product |
| `getDashboard` | query | Orders + bookings + enrollments + tournaments |

---

## Phase 4: Frontend Page-to-API Mapping

### 4.1 Homepage (`/`)

| Section | Data Source | tRPC Call |
|---------|-------------|-----------|
| Announcement Bar | Static config | — |
| Navigation | Categories + user | `product.getCategories`, `user.getProfile` |
| Hero: Featured Paddle | CMS/featured flag | `product.getFeatured` |
| Trust Bar (4.9★, 12K+) | Aggregated | `review.getSummary` (site-wide) |
| Value Props | Static | — |
| Shop Categories | Categories | `product.getCategories` |
| Bestsellers | Sales ranking | `product.getBestsellers` |
| Brand Logos | All brands | `product.getBrands` |
| Creator Testimonials | CMS | `content.getTestimonials` |
| Shop by Level | Products by skill | `product.getBySkillLevel` × 4 |
| Staff Picks | Curated | `content.getStaffPicks` |
| Paddle Finder CTA | — | Link to `/paddle-finder` |
| New Arrivals | Recent products | `product.getNewArrivals` |
| The Paddle Lab | Articles | `content.getArticles` (type=review) |
| Skill School | Classes | `class.list` (top 3) |
| Player Loadouts | Curated bundles | Static/CMS |
| Club Rewards | Club data | `club.getLeaderboard` (top clubs) |
| Community Instagram | Static links | — |
| Methodology Stats | Static | — |
| Buying Guide PDF | Form | `paddleFinder.getBuyingGuide` |
| Footer Newsletter | Form | Direct DB insert or Resend API |

### 4.2 Shop / Paddles (`/paddles`)

| Feature | Implementation |
|---------|----------------|
| Faceted Filters | Sidebar: Category, Brand, Skill, Price, Weight, Shape, Surface — tRPC `product.getFilters` |
| Product Grid | `product.list` with Zod filter input |
| Sort Options | Price, Rating, Newest, Name — server-side sorting |
| Pagination | Cursor or offset pagination |
| Quick Add to Cart | `cart.addItem` mutation |
| Wishlist Heart | `user.addToWishlist` / `user.removeFromWishlist` |

### 4.3 Product Detail (`/paddles/:slug`)

| Feature | Implementation |
|---------|----------------|
| Product Info | `product.getBySlug` |
| Image Gallery | Product images array from relation |
| Specs Table | `metadata` JSON field |
| Stock Status | Real-time `stockQuantity` |
| Add to Cart | `cart.addItem` |
| 14-Day Demo CTA | `cart.addItem` with `isDemoItem: true` |
| Reviews Section | `review.list` with pagination |
| Review Summary | `review.getSummary` |
| Related Products | Same category/brand/skill |

### 4.4 Paddle Finder Quiz (`/paddle-finder`)

| Feature | Implementation |
|---------|----------------|
| 8-Question Wizard | Frontend state machine (TanStack Router or React state) |
| Quiz Submission | `paddleFinder.submitQuiz` |
| Recommendation Results | `paddleFinder.getRecommendations` |
| Email Buying Guide | `paddleFinder.getBuyingGuide` (triggers Resend email) |
| Save to Profile | `user.updateProfile` with quiz results |

### 4.5 Courts (`/courts`)

| Feature | Implementation |
|---------|----------------|
| Search Bar | `venue.search` with geo params |
| Filter Chips | Client-side filtering on `venue.list` results |
| Venue Cards | `venue.list` with pagination |
| Map View | Mapbox/Google Maps with venue pins |
| Favorite Button | `user.addToWishlist` (venue variant) |
| Booking Flow | `court.getAvailability` → `court.book` |
| Court Detail | `venue.getBySlug` with `court.list` |

### 4.6 Skill School (`/lessons`)

| Feature | Implementation |
|---------|----------------|
| Class Schedule | `class.list` with date filters |
| Skill Level Tabs | Filter by `skillLevel` |
| Coach Filter | `class.list` with `coachId` param |
| Venue Filter | `class.list` with `venueId` param |
| Enrollment | `class.enroll` with Stripe payment |
| Spots Counter | `spotsRemaining` from `classSessions` |

### 4.7 Tournaments (`/tournaments`)

| Feature | Implementation |
|---------|----------------|
| Featured Event | `tournament.list` with `isFeatured` |
| Upcoming List | `tournament.list` with date filter |
| My Events | `tournament.getMyRegistrations` |
| Registration | `tournament.register` + Stripe |
| Partner Matching | Algorithm: find player with similar DUPR, notify both |

### 4.8 Authentication (`/login`, `/register`)

| Feature | Implementation |
|---------|----------------|
| OAuth (Google, Apple) | Better-T-Stack Next-Auth or Clerk addon |
| Email/Password | Credentials provider or custom |
| Member Benefits Display | Static marketing content |
| Forgot Password | Resend reset email flow |

### 4.9 User Dashboard (`/account`)

| Feature | Implementation |
|---------|----------------|
| Profile | `user.getProfile` + `user.updateProfile` |
| Orders | `order.list` |
| Court Bookings | `court.getUserBookings` |
| Class Enrollments | `class.getMyEnrollments` |
| Tournament Entries | `tournament.getMyRegistrations` |
| Wishlist | `user.getWishlist` |
| Club Code | Display + share |

---

## Phase 5: Third-Party Integrations

### 5.1 Stripe (Payments)

**Better-T-Stack Addon**: Select Stripe during CLI setup

```typescript
// apps/server/src/routers/order.ts
import { stripe } from "../lib/stripe";

export const orderRouter = router({
  createCheckout: publicProcedure
    .input(z.object({ cartId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const cart = await getCartWithItems(input.cartId);
      const session = await stripe.checkout.sessions.create({
        line_items: cart.items.map((item) => ({
          price_data: {
            currency: "aud",
            product_data: { name: item.product.name },
            unit_amount: item.unitPrice * 100,
          },
          quantity: item.quantity,
        })),
        mode: "payment",
        success_url: `${env.CLIENT_URL}/order/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${env.CLIENT_URL}/cart`,
      });
      return { sessionUrl: session.url };
    }),
});
```

### 5.2 Resend (Transactional Emails)

**Better-T-Stack Addon**: Select Resend during CLI setup

| Trigger | Email Template |
|---------|--------------|
| Order Confirmation | Item list, total, tracking link |
| Shipping Notification | Carrier + tracking number |
| Demo Return Reminder | 12-day reminder, return label |
| Class Confirmation | Time, venue, coach, what to bring |
| Court Booking | QR code + cancellation link |
| Tournament Registration | Bracket info, check-in time |
| Buying Guide PDF | 120-page guide attachment |
| Newsletter (weekly) | `newsletterSubscribers` + Resend broadcast |

### 5.3 UploadThing (File Uploads)

**Better-T-Stack Addon**: Select UploadThing during CLI setup

| Use Case | Upload Endpoint |
|----------|-----------------|
| Product Images | Admin-only, multiple files |
| User Avatar | `user.updateProfile` with file |
| Review Photos | `review.create` with attachments |
| Club Logo | `club.register` with file |
| Article Images | CMS upload |

### 5.4 Map Integration (Mapbox / Google Maps)

```typescript
// Venue map display
const mapConfig = {
  accessToken: env.MAPBOX_TOKEN,
  style: "mapbox://styles/mapbox/light-v11",
  center: [151.2093, -33.8688], // Sydney
  zoom: 11,
};
```

- Venue list map: Pins with price + rating
- Venue detail: Static map image + directions link
- Court locations: Precise court positions within venue

---

## Phase 6: Implementation Roadmap

### Sprint 1: Foundation (Week 1)
- [ ] Initialize Better-T-Stack project with recommended stack
- [ ] Set up database schema (core tables: users, categories, brands, products)
- [ ] Configure tRPC routers + middleware
- [ ] Seed database with sample products, categories, brands
- [ ] Build homepage shell + navigation

### Sprint 2: E-Commerce Core (Week 2)
- [ ] Product listing page with filters
- [ ] Product detail page
- [ ] Cart state + tRPC mutations
- [ ] Stripe checkout integration
- [ ] Order creation + confirmation flow
- [ ] Basic user auth (OAuth + email)

### Sprint 3: Content & Discovery (Week 3)
- [ ] Paddle Finder quiz (frontend wizard + recommendation API)
- [ ] Reviews system (CRUD + aggregation)
- [ ] Staff picks module
- [ ] Article/blog content API
- [ ] Testimonials section
- [ ] Wishlist functionality

### Sprint 4: Court Booking (Week 4)
- [ ] Venue database + search API
- [ ] Court availability calendar logic
- [ ] Booking flow (select time → pay → confirm)
- [ ] Cancellation policy enforcement
- [ ] Map integration
- [ ] Venue detail pages

### Sprint 5: Skill School (Week 5)
- [ ] Coach profiles
- [ ] Class schedule system
- [ ] Enrollment + payment flow
- [ ] Spot capacity management
- [ ] Class detail pages

### Sprint 6: Tournaments (Week 6)
- [ ] Tournament CRUD (admin)
- [ ] Registration flow
- [ ] DUPR rating validation
- [ ] Partner matching algorithm
- [ ] Bracket display (read-only for MVP)

### Sprint 7: Community & Growth (Week 7)
- [ ] Club Rewards system (codes + tracking)
- [ ] Newsletter subscription
- [ ] Email templates (Resend)
- [ ] Buying guide PDF generation
- [ ] Instagram feed (static embed)

### Sprint 8: Polish & Admin (Week 8)
- [ ] Admin dashboard (product/venue/class/tournament management)
- [ ] Order management
- [ ] Analytics dashboard
- [ ] Performance optimization
- [ ] SEO meta tags + structured data
- [ ] Accessibility audit

---

## Phase 7: Advanced Features (Post-MVP)

| Feature | Technical Approach |
|---------|-------------------|
| **Real-time Availability** | WebSockets or Server-Sent Events for court slot updates |
| **AI Paddle Recommendations** | OpenAI/Claude integration via tRPC router |
| **Inventory Management** | Admin dashboard with stock alerts, low-stock notifications |
| **Multi-currency** | Exchange rate API + user preference |
| **Advanced Search** | Algolia or Meilisearch integration |
| **Push Notifications** | OneSignal or web push for class reminders, restocks |
| **Mobile App** | Better-T-Stack Expo addon |
| **Loyalty Points** | Points table + redemption logic |
| **Referral System** | Referral codes + reward tracking |
| **Live Chat Support** | Intercom/Chatwoot integration |
| **Subscription Boxes** | Recurring billing with Stripe Subscriptions |
| **Video Content** | CDN-hosted technique videos with progress tracking |
| **Social Login Expansion** | Facebook, Discord |
| **Two-Factor Auth** | TOTP with authenticator apps |

---

## Phase 8: DevOps & Deployment

### Environment Variables (`.env`)

```bash
# Database
DATABASE_URL=mysql://user:pass@host:3306/pickle_power_sports

# Auth (Clerk or Next-Auth)
NEXTAUTH_SECRET=...
CLERK_SECRET_KEY=...
CLERK_PUBLISHABLE_KEY=...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_SHIPPING=...

# Resend
RESEND_API_KEY=re_...

# UploadThing
UPLOADTHING_SECRET=...
UPLOADTHING_APP_ID=...

# Maps
MAPBOX_ACCESS_TOKEN=pk.eyJ...

# App
CLIENT_URL=https://picklepowersports.com.au
SERVER_URL=https://api.picklepowersports.com.au
```

### Deployment Strategy

| Service | Provider | Purpose |
|---------|----------|---------|
| Frontend | Vercel / Cloudflare Pages | React app CDN |
| API | Hono on Vercel Edge / Cloudflare Workers | tRPC server |
| Database | PlanetScale / Neon / AWS RDS | MySQL |
| File Storage | UploadThing / AWS S3 + CloudFront | Images, PDFs |
| Email | Resend | Transactional + marketing |
| Payments | Stripe | Checkout, subscriptions |
| Maps | Mapbox | Venue maps |
| Monitoring | Sentry | Error tracking |
| Analytics | Plausible / PostHog | Privacy-friendly analytics |

---

## Appendix A: Paddle Finder Algorithm (MVP)

```typescript
// Simple scoring algorithm — can be replaced with ML later
function recommendPaddles(answers: QuizAnswers, products: Product[]) {
  return products
    .map((product) => {
      let score = 0;
      
      // DUPR match (weight: 40%)
      if (product.skillLevel === answers.skillLevel) score += 40;
      else if (adjacentLevel(product.skillLevel, answers.skillLevel)) score += 20;
      
      // Play style match (weight: 25%)
      if (product.metadata.playStyle === answers.playStyle) score += 25;
      
      // Physical preferences (weight: 20%)
      if (answers.preferredWeight && inRange(product.weight, answers.preferredWeight)) score += 20;
      
      // Budget match (weight: 15%)
      if (product.price <= answers.maxBudget) score += 15;
      
      return { product, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}
```

## Appendix B: Data Seeding Strategy

```typescript
// db/seed.ts
import { seedProducts } from "./seeds/products";
import { seedVenues } from "./seeds/venues";
import { seedCoaches } from "./seeds/coaches";
import { seedClasses } from "./seeds/classes";
import { seedTournaments } from "./seeds/tournaments";
import { seedContent } from "./seeds/content";

async function main() {
  await seedProducts();      // 240+ paddles, shoes, balls, bags
  await seedVenues();        // 6 Sydney venues with courts
  await seedCoaches();       // 4 PPR-certified coaches
  await seedClasses();       // 6 weekly classes
  await seedTournaments();   // 6 seasonal events
  await seedContent();       // Reviews, articles, staff picks
}
```

---

## Summary Checklist

- [x] **Database Schema**: 25+ tables covering commerce, booking, events, content, community
- [x] **tRPC Routers**: 11 domain routers with 60+ procedures
- [x] **Authentication**: OAuth 2.0 + email/password + role-based access
- [x] **Payments**: Stripe checkout + webhooks for orders, demos, classes, tournaments
- [x] **Email**: Resend for transactional + marketing emails
- [x] **File Uploads**: UploadThing for product images, avatars, club logos
- [x] **Maps**: Mapbox for venue search and display
- [x] **Search**: Full-text product search + faceted filters
- [x] **Quiz Engine**: Paddle Finder with scoring algorithm
- [x] **Booking Logic**: Court availability + class capacity management
- [x] **Admin Features**: Content management, order fulfillment, analytics
- [x] **8-Week Roadmap**: Prioritized sprint plan from MVP to polish

---

*Generated for Pickle Power Sports full-stack implementation using Better-T-Stack v3.28.0*

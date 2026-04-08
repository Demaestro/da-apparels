# DA Apparels — System Architecture

## Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                                   │
│                                                                          │
│   Browser / Mobile Browser                                               │
│   ┌────────────────────────────────────────────────────────────────┐    │
│   │  Next.js 14 App (apps/web)                                     │    │
│   │  • App Router + React Server Components                        │    │
│   │  • Tailwind CSS  +  Framer Motion animations                   │    │
│   │  • Zustand (client state)                                      │    │
│   │  • React Query / TanStack Query (server state / caching)       │    │
│   │  • Cloudinary Next Image  (optimised luxury imagery)           │    │
│   │  • 8th Wall SDK hook  (AR Try-on — placeholder)                │    │
│   └────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────┬────────────────────────────────────────────┘
                              │  HTTPS / REST + JSON
                              ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                            API LAYER                                     │
│                                                                          │
│   NestJS (apps/api)  — Port 4000                                         │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│   │  Auth Module │  │Product Module│  │ Order Module │                  │
│   │  JWT + RBAC  │  │  Catalog +   │  │  Checkout +  │                  │
│   │  Refresh Tok │  │  Fabric Eng. │  │  Scheduling  │                  │
│   └──────────────┘  └──────────────┘  └──────────────┘                  │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│   │  User Vault  │  │ Style Quiz   │  │  CRM/Admin   │                  │
│   │  AES-256 enc │  │  Matching    │  │  Dashboard   │                  │
│   └──────────────┘  └──────────────┘  └──────────────┘                  │
│                                                                          │
│   Security middleware stack (request order):                             │
│   Helmet → CORS → CSRF → Rate Limiter → JWT Guard → RBAC Guard → Route  │
│                                                                          │
│   ┌──────────────────────────────────────────────────────────────┐       │
│   │  BullMQ Worker Process  (separate Node process)              │       │
│   │  • email-queue   → order confirmations, status updates       │       │
│   │  • sms-queue     → delivery reminders                        │       │
│   │  • ar-queue      → 8th Wall try-on asset prep                │       │
│   └──────────────────────────────────────────────────────────────┘       │
└───────┬───────────────────────────┬──────────────────────────────────────┘
        │                           │
        ▼                           ▼
┌─────────────┐           ┌─────────────────┐
│ PostgreSQL   │           │     Redis        │
│ (Prisma ORM)│           │  • Product cache │
│             │           │  • Session store │
│ Users        │           │  • BullMQ queues│
│ Profiles     │           │  • Rate limit   │
│ Measurements │           └─────────────────┘
│ Products     │
│ Orders       │           ┌─────────────────┐
│ Payments     │           │   Cloudinary    │
│ Notifications│◄──────────│  (image CDN)    │
│ AuditLogs    │           │  • Products     │
└─────────────┘           │  • Avatars      │
                           │  • Fabric swatch│
                           └─────────────────┘
```

## Data Flow Examples

### Checkout with Fabric Customization
```
User selects fabric/color → POST /cart/validate (checks stock + price)
→ POST /orders (creates order, locks stock)
→ POST /payments/initiate (Paystack/Flutterwave)
→ Webhook callback → PATCH /orders/:id/status → BullMQ email-queue
→ Worker sends confirmation email via Resend
→ Admin CRM dashboard updates in real time
```

### Style Quiz Match
```
User completes quiz → POST /style-quiz/submit
→ Algorithm scores products by bodyType × preferredStyles × occasion
→ Result stored in style_quiz_results
→ GET /products/recommended (reads quiz result from Redis cache)
```

### Measurement Encryption
```
Client sends plain JSON measurements
→ NestJS MeasurementsService.encrypt()
  → crypto.randomBytes(12) → IV
  → crypto.createCipheriv('aes-256-gcm', KEY, IV)
  → store { encryptedData, iv, authTag } in DB
→ Decrypt only on authenticated user vault requests
```

## Module Boundaries

| Module         | Owns                          | Calls Into          |
|----------------|-------------------------------|---------------------|
| AuthModule     | Sessions, JWT, passwords      | UsersModule         |
| UsersModule    | Profiles, Measurements        | —                   |
| ProductsModule | Catalog, Fabric, Quiz         | CloudinaryService   |
| OrdersModule   | Checkout, Timeline, Delivery  | ProductsModule, BullMQ |
| PaymentsModule | Provider webhooks             | OrdersModule        |
| NotifyModule   | BullMQ workers, templates     | —                   |
| AdminModule    | CRM analytics, staff actions  | All modules (read)  |

## Security Layers

1. **Transport** — HTTPS enforced; HSTS header via Helmet
2. **Auth** — JWT (15 min access) + HttpOnly Refresh cookie (7 days)
3. **RBAC** — Guards on every protected route; role hierarchy: CUSTOMER < STAFF < ADMIN < SUPER_ADMIN
4. **Input** — Zod on frontend; class-validator + class-transformer on backend; parameterised Prisma queries
5. **Encryption** — AES-256-GCM for measurements; bcrypt (cost 12) for passwords
6. **Rate Limiting** — 100 req/min per IP; 10 req/min on auth routes
7. **Audit** — Every mutation writes an AuditLog row
8. **CSRF** — csurf token for cookie-based flows

## Scaling Path

```
Single-server MVP
      ↓
Horizontal API scaling (stateless JWT + Redis sessions)
      ↓
Read replicas for PostgreSQL (analytics queries)
      ↓
BullMQ workers on separate compute
      ↓
Microservices split along module boundaries when traffic demands
```

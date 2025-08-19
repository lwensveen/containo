# Containo

**Pooling logistics for cheaper cross-border shipping (LCL/air consolidation).**

Monorepo containing:

- **API** (`apps/api`) – Fastify + Zod + Drizzle (Postgres). Handles quotes, intents, pooling, events, webhooks, and
  payments.
- **Web** (`apps/web`) – Next.js (App Router) for quoting, checkout, dashboard, and admin ops.
- **Packages** – shared UI, DB schema, types, and a small **checkout plugin** embeddable on third-party sites.

---

## Features

- **Quote & intent**
  `/pools/quote` (price) and `/pools/intent` (reserve space idempotently), with lane rules and priorities.
- **Container pooling**
  Pool fill tracking (capacity/used/fill%), thresholds (80/90/100%), pool status lifecycle.
- **Events & webhooks**
  `pool_events` / `pickup_events`, recent events API, webhooks with delivery queue + retries.
- **Lane pricing overrides**
  Multi-version lane rates with priorities and time windows.
- **CSV export**
  Pool items export for operations.
- **Date serializer**
  API responses serialize `Date` → ISO string consistently.
- **Auth (Better Auth)**
  Email/password + OAuth on the web app; public vs protected route groups.
- **Public site pages**
  Home, Pricing, Quote, About (team), Careers, Contact, Privacy, Terms.
- **App UX**
  Sidebar legal layout, cookie consent banner, consistent header/footer, shadcn UI components.

---

## Tech Stack

- **API**: Fastify, Zod, Drizzle ORM (Postgres), Stripe (Checkout), Webhooks
- **Web**: Next.js (App Router), Tailwind CSS, shadcn/ui, lucide-react
- **Auth**: Better Auth (`apps/web/auth.ts`, `apps/web/lib/auth-client.ts`)
- **Monorepo**: Workspaces, optional Turborepo
- **DB**: Postgres 14+, Drizzle migrations (generated + manual SQL)

---

## Architecture

```
apps/
  api/
    src/
      drizzle/                # migrations (generated + manual SQL)
      modules/
        bookings/
        buyers/
        consolidation/
        events/
        payments/
        pickups/
        pools/
        pricing/
        webhooks/
      plugins/                # date-serializer, scheduler, swagger
      server.ts               # buildServer()
      main.ts                 # boot
    drizzle.config.ts         # uses db package schema (built JS or TS)
  web/
    app/
      (public)/               # public routes: login, signup, quote, pricing, marketing pages
      (protected)/            # authed: dashboard, admin, checkout, pickups
      layout.tsx              # global UI shell
    components/
      layout/                 # Header, Footer, Container, Section, LegalLayout
      dashboard/              # Shipments, ShipmentCard, Pickups widget
      cookies/                # CookieConsent
    lib/
      api.ts                  # client calls to API
      auth-client.ts          # Better Auth client
packages/
  db/                         # Drizzle schema (TS) + build output (dist)
  types/                      # shared zod/ts types (buyers, intents, pickups, pool-items)
  checkout-plugin/            # embeddable quote/checkout widget
  ui/, eslint-config/, typescript-config/ ...
```

### Route Groups (Next.js)

- `(public)` – Home, Pricing, Quote, About, Careers, Contact, Legal, Login, Signup
- `(protected)` – Dashboard (shipments), Pickups, Checkout, Admin
  Protected layouts redirect unauthenticated users to `/login` (Better Auth session check).

---

## Data Model Highlights

- **Timestamps** use `timestamptz` (UTC) with `*_at` naming:
  - Pools / Pool Items / Intents: `cutoff_at`
  - Pickups: `window_start_at`, `window_end_at`

- **Numerics** (`numeric`) are passed as **strings** from API to avoid float rounding.
- **Country/Port codes** validated (ISO-2 for countries; 3-letter ports where applicable).
- **Events** stored as JSONB payloads with non-null default `{}`.

### Important DB Constraints (manual SQL)

Drizzle generates most DDL from TS, but we keep a manual migration for DB-only guarantees:

- **Partial unique**: at most 1 **open** pool per `(origin, dest, mode, cutoff_at)`
- **Partial indexes**:
  - pending pool items per lane/cutoff
  - open pools per lane/cutoff
  - active lane rates per lane

- **Exclusion constraint** on lane rates to block overlapping active windows (GiST on a generated `tstzrange`)
- **Trigger** to enforce pool capacity (prevent overfill on insert/update)

> See `apps/api/src/drizzle/00YY_manual_constraints.sql`.

---

## Quickstart (Local)

**Prereqs:** Node 20+ (or Bun), Postgres 14+, and your preferred package manager.

1. **Install**

```bash
pnpm install   # or bun install / npm i
```

2. **Configure env**

Copy `apps/api/.env.example` → `apps/api/.env` and set `DATABASE_URL`, Stripe keys, etc.

3. **Build DB package (if using compiled schema in drizzle.config.ts)**

```bash
pnpm --filter ./packages/db build
```

4. **Migrations**

```bash
cd apps/api

# (Optional) Generate from schema changes:
npx drizzle-kit generate

# Apply migrations (generated + manual SQL in src/drizzle):
npx drizzle-kit migrate
```

> Migrations are written to `apps/api/src/drizzle`.
> We mix **generated SQL** (from Drizzle) with a **manual constraints file** for partial unique indexes, triggers, and
> exclusion constraints.

5. **Run dev**

```bash
# from repo root
pnpm dev              # or bun run dev / turbo run dev
```

- API: `http://localhost:4000` (Swagger: `/docs`)
- Web: `http://localhost:3000`

---

## Web UI

- **Home** – Marketing overview
- **Pricing** – Clear sea/air examples + lane estimator (where applicable)
- **Quote** – Instant quote + deep-link to checkout
- **Checkout** – Reserve (intent) → price → pay (Stripe Checkout)
- **Dashboard** – My shipments (status, pool fill, receipts)
- **Pickups** – Request pickup + list of my pickups
- **Admin** – Pools overview, pickups admin
- **About / Careers / Contact / Privacy / Terms** – Marketing & legal
- **Cookie Consent** – Non-blocking banner using shadcn primitives

All built with Tailwind utilities and shadcn components for consistent spacing, typography, and theming.

---

## API Notes

- **Validation**: All handlers use Zod schemas; errors map to HTTP 4xx.
- **Dates**: Accept/return ISO strings; internally stored as `timestamptz`. Date serializer plugin ensures consistent
  output.
- **Idempotency**: Certain endpoints honor `Idempotency-Key` to avoid duplicates (e.g., intent submission).
- **Payments**: Stripe Checkout session created server-side; success/cancel routes handled in `(protected)/checkout`.

---

## Drizzle & Migrations

- Config lives at `apps/api/drizzle.config.ts`. It can target:
  - **TS sources**: `packages/db/src/schemas/**/*.ts` (no prebuild)
  - **Built JS aggregator**: `packages/db/dist/schemas/index.js` (requires building `packages/db`)

- You’ll see a hybrid of:
  - **Generated** migrations (schema-driven)
  - **Manual** SQL (`00YY_manual_constraints.sql`) for:
    - partial unique indexes
    - exclusion constraints (GiST)
    - triggers (pool capacity)

> This keeps Drizzle-Kit happy while still leveraging Postgres features Drizzle doesn’t express directly.

---

## Conventions

- **Naming**: `snake_case` columns, `*_at` for timestamps, `*_id` for FKs.
- **Booleans/Enums**: App-level enums in `packages/db/src/enums.ts`.
- **Precision**: `numeric` columns sent/received as strings by API.
- **Auth**: Better Auth on Next.js; public vs protected route groups.
- **CI/CD**: Run migrations before app start; ensure `btree_gist` extension is enabled.

---

## Embeddable Checkout Plugin

Under `packages/checkout-plugin`:

- Lightweight widget to capture quote/intent and redirect to Stripe Checkout.
- Exposes element APIs and types; ships unstyled with a small CSS baseline.

---

## Contributing

PRs welcome. Please:

- Add/adjust Zod schemas with any API changes.
- Generate migrations when schema changes.
- Keep manual SQL idempotent.

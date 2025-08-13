# Containo

**Pooling logistics for cheaper cross‑border shipping (LCL/air consolidation).**

Monorepo containing:

- **API** (`apps/api`) – Fastify + Zod + Drizzle (Postgres). Handles quotes, intentsTable, pooling, events, and
  webhooks.
- **Web** (`apps/web`) – Next.js app for quoting, pricing, and basic operations.
- **Packages** – shared UI, types, ESLint/TS configs, and a tiny **checkout plugin** for third‑party sites.

---

## Features (current)

- Quote + submit intent to join a pool (`/pools/quote`, `/pools/intent`)
- Container pooling with fill tracking and thresholds (80/90/100%)
- Event stream (`/events/recent`) + webhook subscriptions for automation
- Lane pricing overrides module
- CSV export of pooled items
- Date serializer plugin (ensures `Date` → ISO strings in API responses)
- **Public website pages**:
  - Pricing page (`/pricing`) with responsive Tailwind + shadcn components
  - Quote form UI with improved layout, padding, and form styling
  - Shared layout components (`Header`, `Footer`, `Container`, `Section`)

- **UI consistency**: Tailwind + shadcn UI primitives for quick theming

### Planned / next

- Buyer checkout plugin bundle and demo UI
- Seller/auction batch API and API keys
- First‑mile pickup requests
- Carrier bookings (ocean/air) integrations
- Customs documentation generation
- Buyer dashboard for status & tracking

---

## Architecture

```
apps/
  api/
    src/
      db/              # drizzle schema + client
      modules/
        events/
        pools/
        pricing/
        webhooks/
      plugins/          # scheduler, date-serializer, swagger
      server.ts         # buildServer()
      main.ts           # boot
  web/
    app/                # Next.js routes / UI (includes /pricing, /quote)
    components/
      layout/           # Header, Footer, Container, Section
      pricing/          # Pricing table & plans
packages/
  ui/                   # shared components
  types/                # shared types
  typescript-config/    # tsconfig bases
  eslint-config/        # eslint bases
```

---

## Quickstart (local)

**Prereqs:** Node 20+ (or Bun), Postgres 14+, pnpm/bun/npm.

1. **Install deps**

```bash
bun install  # or pnpm install / npm i
```

2. **Configure env**
   Copy and edit `apps/api/.env.example` → `apps/api/.env`.

3. **Run migrations**

```bash
cd apps/api
bun run migrate:generate   # optional if schema changed
bun run migrate:push
```

4. **Start dev servers**

```bash
bun run dev  # or: turbo run dev
```

- API on `http://localhost:4000` → Swagger UI at `/docs`
- Web on `http://localhost:3000`

---

## Web UI Pages

- **Home**: Overview of pooling logistics
- **Pricing**: Table of sea and air consolidation rates
- **Quote**: Form for instant price calculation

All pages use Tailwind utilities and shadcn components with responsive layouts and consistent paddings.

---

## Development Notes

- **Type safety**: Zod schemas power Fastify validation and TS inference
- **Dates**: Fastify `onSend` hook serializes dates to ISO strings
- **UI**: Layout components (`Container`, `Section`) ensure consistent spacing
- **Pricing Page**: Uses dedicated `pricing/` components for maintainability
- **Footer**: Simple responsive design with navigation & copyright

---

## Roadmap

1. Complete checkout plugin + demo
2. Seller batch API + keys
3. Pickup module
4. Carrier bookings + webhooks
5. Customs docs
6. Buyer dashboard

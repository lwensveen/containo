# Containo

**Pooling logistics for cheaper cross‑border shipping (LCL/air consolidation).**

Monorepo containing:

- **API** (`apps/api`) – Fastify + Zod + Drizzle (Postgres). Handles quotes, intents, pooling, events, and webhooks.
- **Web** (`apps/web`) – Next.js app for quoting and basic ops.
- **Packages** – shared UI, types, ESLint/TS configs, and a tiny **checkout plugin** (optional) for third‑party sites.

---

## ✨ Features (current)

- Quote + submit intent to join a pool (`/pools/quote`, `/pools/intent`)
- Container pooling with fill tracking and thresholds (80/90/100%)
- Event stream (`/events/recent`) + webhook subscriptions for automation
- Lane pricing overrides module
- CSV export of pooled items
- Date serializer plugin (ensures `Date` → ISO strings in API responses)

### Planned / next

- Buyer checkout plugin bundle and demo UI
- Seller/auction batch API and API keys
- First‑mile pickup requests
- Carrier bookings (ocean/air) integrations
- Customs documentation generation
- Buyer dashboard for status & tracking

---

## 🧱 Architecture

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
    app/                # Next.js routes / UI
packages/
  ui/                   # shared components
  types/                # shared types
  typescript-config/    # tsconfig bases
  eslint-config/        # eslint bases
```

---

## 🚀 Quickstart (local)

**Prereqs:** Node 20+ (or Bun), Postgres 14+, pnpm/bun/npm.

1. **Install deps**

```bash
bun install  # or pnpm install / npm i
```

2. **Configure env**
   Copy and edit `apps/api/.env.example` → `apps/api/.env`.
   Minimal variables (see example file for the full list):

```ini
DATABASE_URL=postgres://user:pass@localhost:5432/containo
PORT=4000
POOL_SEA_CAP_M3=28
POOL_AIR_CAP_M3=4
WEBHOOK_MAX_ATTEMPTS=10
```

3. **Run migrations**

```bash
cd apps/api
bun run migrate:generate   # optional if schema changed
bun run migrate:push
```

4. **Start dev servers**

```bash
# in repo root
bun run dev  # or: turbo run dev
```

- API on `http://localhost:4000` → Swagger UI at `/docs`
- Web on `http://localhost:3000`

> **Tip:** add Docker Compose later if you want a one‑command stack.

---

## 🧪 Scripts

From the repo root:

```bash
bun run build       # turbo build all
bun run lint        # run eslint (fixes in web)
bun run typecheck   # strict TS across packages
bun run test:ci     # vitest with --passWithNoTests
```

API app:

```bash
cd apps/api
bun run dev                 # fastify in watch mode
bun run migrate:generate
bun run migrate:push
```

---

## 🔌 API (high level)

All responses emit ISO timestamps (via preSerialization date serializer).

### Health

`GET /health` → `{ ok: true, service: "containo-api" }`

### Pools

- **Quote**
    - `POST /pools/quote`
    - **Body**

      ```ts
      {
        originPort: string; // e.g. "AMS"
        destPort: string; // e.g. "BKK"
        mode: 'sea' | 'air';
        cutoffISO: string; // ISO date for cutoff
        weightKg: number;
        dimsCm: {
          l: number;
          w: number;
          h: number;
        }
      }
      ```

    - **200** → `{ price: number; currency: string; etaDays: number }`

- **Submit intent**
    - `POST /pools/intent`
    - **Headers (optional)**: `Idempotency-Key: string`
    - **Body** same as quote + `userId?: string` (metadata)
    - **202** → `{ id: string; accepted: true; volumeM3: number }`

- **List items in a pool**
    - `GET /pools/:id/items` → `Item[]`
    - `GET /pools/:id/items.csv` → CSV download

- **Update status** (ops/admin)
    - `POST /pools/:id/status` with `{ status: 'open'|'closing'|'booked'|'in_transit'|'arrived' }`

### Events

- `GET /events/recent?limit=50` → recent pool events
    - Types: `pool_created`, `item_pooled`, `fill_80`, `fill_90`, `fill_100`, `status_changed`

### Webhooks

- `GET /webhooks` → subscriptions
- `POST /webhooks` → create `{ url, events: '*'|csv, secret }`
- `DELETE /webhooks/:id` → deactivate
- Deliveries are queued/retried; HMAC signing with `secret` (consumer verifies).

---

## 🧩 Checkout Plugin (buyer)

Minimal client to call `/pools/quote` and `/pools/intent`.

**Installation (bundle or npm)**

- Bundle: expose as `window.Containo` (`init`, `poolOrder`)
- NPM: `import { init, poolOrder } from '@containo/checkout-plugin'`

**Usage**

```html

<script src="/checkout-plugin.bundle.js"></script>
<script>
    Containo.init({apiBase: 'http://localhost:4000'});
    Containo.poolOrder({
        originPort: 'AMS',
        destPort: 'BKK',
        mode: 'sea',
        cutoffISO: new Date().toISOString(),
        weightKg: 3,
        dimsCm: {l: 40, w: 30, h: 25},
        metadata: {userId: 'demo-user'},
    })
            .then(console.log)
            .catch(console.error);
</script>
```

---

## 🛠️ Development Notes

- **Type safety**: Zod schemas power Fastify validation and TS inference via route generics.
- **Dates**: Schemas use `z.date()`; a Fastify `preSerialization` plugin outputs ISO strings.
- **Pooling**: a scheduler assigns pending items into pools and emits events on fill thresholds.
- **Rates**: lane overrides allow per‑lane pricing; fallback to ENV defaults.
- **Webhooks**: simple subscription model; deliveries queued with retries & backoff.

---

## 🔐 Environment variables (API)

See `apps/api/.env.example`. Common ones:

- `DATABASE_URL` – Postgres connection string
- `PORT` – API port (default 4000)
- `POOL_SEA_CAP_M3`, `POOL_AIR_CAP_M3` – default capacities
- `WEBHOOK_MAX_ATTEMPTS` – delivery retry ceiling

---

## 🧭 Roadmap (execution order)

1. One‑command local stack (Docker Compose + seeds)
2. Idempotency for intents + partial unique index for open pools per lane
3. Buyer checkout plugin demo page in `apps/web`
4. Seller batch API + API keys
5. First‑mile pickups module + basic courier integration
6. Carrier bookings (sea/air) and status webhooks
7. Customs doc generation (PDF) per pool
8. Buyer dashboard (status, tracking, documents)

---

## 🧹 Contributing

- Conventional commits via Husky/commitlint
- Lint + typecheck on pre‑commit
- Tests via Vitest (CI uses `--passWithNoTests` until specs land)

--- 

## 📄 License

No license yet. All rights reserved by default. Choose one (MIT/Apache-2.0/BSL) when ready.

---

## 📫 Support

Issues and PRs welcome. For security matters, please avoid public issues and reach out directly.

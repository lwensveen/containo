import { and, eq, inArray, sql } from 'drizzle-orm';
import { db, webhookDeliveriesTable, webhookSubscriptionsTable } from '@containo/db';
import crypto from 'node:crypto';
import { WebhookEventType } from '@containo/types';

const MAX_ATTEMPTS = Number(process.env.WH_MAX_ATTEMPTS ?? '8');
const BASE_DELAY_MS = Number(process.env.WH_BASE_DELAY_MS ?? '30000'); // 30s
const JITTER_MS = Number(process.env.WH_JITTER_MS ?? '5000');
const HTTP_TIMEOUT_MS = Number(process.env.WH_HTTP_TIMEOUT_MS ?? '10000');
const BATCH_SIZE = Number(process.env.WH_BATCH_SIZE ?? '25');

type DeliveryRow = Awaited<ReturnType<typeof fetchBatch>>[number];

function hmacSignature(secret: string, body: string) {
  const mac = crypto.createHmac('sha256', secret).update(body).digest('hex');
  return `sha256=${mac}`;
}

function nextDelay(attempt: number) {
  const exp = Math.min(attempt, 10);
  const base = BASE_DELAY_MS * Math.pow(2, exp - 1);
  const jitter = Math.floor(Math.random() * JITTER_MS);
  return base + jitter;
}

async function claimBatch(limit = BATCH_SIZE): Promise<DeliveryRow[]> {
  const now = new Date();

  type ClaimedRow = {
    id: string;
    subscription_id: string;
    event_id: string;
    event_type: WebhookEventType;
    payload: Record<string, unknown>;
    attempt_count: number | null;
    next_attempt_at: Date | null;
    status: string;
  };

  const claimed = await db.execute<ClaimedRow>(sql`
    WITH cte AS (
      SELECT d.id
      FROM ${webhookDeliveriesTable} d
      WHERE d.status = 'pending'
        AND d.next_attempt_at <= ${now}
      ORDER BY d.created_at
      FOR UPDATE SKIP LOCKED
      LIMIT ${limit}
    )
    UPDATE ${webhookDeliveriesTable} AS d
    SET status = 'pending'
    FROM cte
    WHERE d.id = cte.id
    RETURNING
      d.id,
      d.subscription_id,
      d.event_id,
      d.event_type,
      d.payload,
      d.attempt_count,
      d.next_attempt_at,
      d.status
 `);

  if (claimed.length === 0) return [];

  const subIds = [...new Set(claimed.map((r) => r.subscription_id))];

  const subs = await db
    .select({
      id: webhookSubscriptionsTable.id,
      url: webhookSubscriptionsTable.url,
      secret: webhookSubscriptionsTable.secret,
      isActive: webhookSubscriptionsTable.isActive,
    })
    .from(webhookSubscriptionsTable)
    .where(inArray(webhookSubscriptionsTable.id, subIds));

  const bySub = new Map(subs.map((s) => [s.id, s]));

  return claimed
    .map((c) => {
      const s = bySub.get(c.subscription_id);
      if (!s) return null;

      const row: DeliveryRow = {
        id: c.id,
        subscriptionId: c.subscription_id,
        eventId: c.event_id,
        eventType: c.event_type,
        payload: c.payload,
        attemptCount: c.attempt_count ?? 0,
        nextAttemptAt: c.next_attempt_at,
        status: 'pending',
        url: s.url,
        secret: s.secret ?? undefined,
        isActive: s.isActive,
      };

      return row;
    })
    .filter((x): x is DeliveryRow => x !== null);
}

async function fetchBatch(limit = BATCH_SIZE) {
  const now = new Date();
  return db
    .select({
      id: webhookDeliveriesTable.id,
      subscriptionId: webhookDeliveriesTable.subscriptionId,
      eventId: webhookDeliveriesTable.eventId,
      eventType: webhookDeliveriesTable.eventType,
      payload: webhookDeliveriesTable.payload,
      attemptCount: webhookDeliveriesTable.attemptCount,
      nextAttemptAt: webhookDeliveriesTable.nextAttemptAt,
      status: webhookDeliveriesTable.status,
      url: webhookSubscriptionsTable.url,
      secret: webhookSubscriptionsTable.secret,
      isActive: webhookSubscriptionsTable.isActive,
    })
    .from(webhookDeliveriesTable)
    .innerJoin(
      webhookSubscriptionsTable,
      eq(webhookSubscriptionsTable.id, webhookDeliveriesTable.subscriptionId)
    )
    .where(
      and(
        eq(webhookDeliveriesTable.status, 'pending'),
        sql`${webhookDeliveriesTable.nextAttemptAt} IS NULL OR ${webhookDeliveriesTable.nextAttemptAt} <= ${now}`
      )
    )
    .limit(limit);
}

async function markDelivered(id: string, httpStatus: number) {
  await db
    .update(webhookDeliveriesTable)
    .set({
      status: 'success',
      responseStatus: httpStatus,
      lastError: null,
      nextAttemptAt: null,
    })
    .where(eq(webhookDeliveriesTable.id, id));
}

async function markFailed(id: string, httpStatus: number | null, err: string) {
  await db
    .update(webhookDeliveriesTable)
    .set({
      status: 'failed',
      responseStatus: httpStatus,
      lastError: err.slice(0, 1000),
      nextAttemptAt: null,
    })
    .where(eq(webhookDeliveriesTable.id, id));
}

async function bumpRetry(id: string, attemptCount: number, httpStatus: number | null, err: string) {
  const next = new Date(Date.now() + nextDelay(attemptCount + 1));
  await db
    .update(webhookDeliveriesTable)
    .set({
      attemptCount: attemptCount + 1,
      responseStatus: httpStatus,
      lastError: err.slice(0, 1000),
      nextAttemptAt: next,
      status: 'pending',
    })
    .where(eq(webhookDeliveriesTable.id, id));
}

async function deliverOne(row: Awaited<ReturnType<typeof fetchBatch>>[number]) {
  if (!row.isActive) {
    await markFailed(row.id, null, 'Subscription inactive');
    return;
  }

  const body = JSON.stringify({
    id: row.eventId,
    type: row.eventType,
    data: row.payload ?? {},
  });

  const headers: Record<string, string> = {
    'content-type': 'application/json',
    'user-agent': 'containo-webhooks/1',
    'x-containo-event': row.eventType,
    'x-containo-delivery-id': row.id,
  };
  if (row.secret) headers['x-containo-signature'] = hmacSignature(row.secret, body);

  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), HTTP_TIMEOUT_MS).unref?.();

  let res: Response | null = null;
  try {
    res = await fetch(row.url, { method: 'POST', headers, body, signal: ctrl.signal as any });
  } catch (e: any) {
    clearTimeout(to as any);
    const err = String(e?.message ?? e);
    if ((row.attemptCount ?? 0) + 1 >= MAX_ATTEMPTS) {
      await markFailed(row.id, null, err);
    } else {
      await bumpRetry(row.id, row.attemptCount ?? 0, null, err);
    }
    return;
  } finally {
    clearTimeout(to as any);
  }

  const ok = res.status >= 200 && res.status < 300;
  const stop =
    res.status === 400 ||
    res.status === 401 ||
    res.status === 403 ||
    res.status === 404 ||
    res.status === 410;

  if (ok) {
    await markDelivered(row.id, res.status);
  } else {
    const errText = await res.text().catch(() => `HTTP ${res.status}`);
    if (stop || (row.attemptCount ?? 0) + 1 >= MAX_ATTEMPTS) {
      await markFailed(row.id, res.status, errText);
    } else {
      await bumpRetry(row.id, row.attemptCount ?? 0, res.status, errText);
    }
  }
}

export async function runOnce() {
  const batch = await claimBatch(BATCH_SIZE);
  if (!batch.length) return 0;

  await Promise.all(batch.map((b) => deliverOne(b)));
  return batch.length;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const interval = Number(process.env.WH_POLL_INTERVAL_MS ?? '5000');
  (async function loop() {
    while (true) {
      try {
        await runOnce();
      } catch (e) {
        console.error('[webhooks] worker error:', e);
      }
      await new Promise((r) => setTimeout(r, interval));
    }
  })();
}

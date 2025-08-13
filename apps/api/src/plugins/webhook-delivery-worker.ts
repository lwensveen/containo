import type { FastifyPluginCallback } from 'fastify';
import { and, asc, eq, lte } from 'drizzle-orm';
import { db, webhookDeliveriesTable, webhookSubscriptionsTable } from '@containo/db';

const MAX_ATTEMPTS = Number(process.env.WEBHOOK_MAX_ATTEMPTS ?? 10);
const BASE_BACKOFF_SEC = Number(process.env.WEBHOOK_BACKOFF_BASE_SEC ?? 30);
const POLL_EVERY_MS = Number(process.env.WEBHOOK_WORKER_INTERVAL_MS ?? 5000);
const CLAIM_HOLD_SEC = Number(process.env.WEBHOOK_CLAIM_HOLD_SEC ?? 30);

type DeliveryRow = typeof webhookDeliveriesTable.$inferSelect;
type SubscriptionRow = typeof webhookSubscriptionsTable.$inferSelect;

function backoffSeconds(attempt: number) {
  const expo = Math.min(BASE_BACKOFF_SEC * 2 ** attempt, 3600);
  const jitter = Math.floor(Math.random() * 5);
  return expo + jitter;
}

export const webhookDeliveryWorker: FastifyPluginCallback = (fastify, _opts, done) => {
  let timer: NodeJS.Timeout | null = null;

  async function findDue(limit = 20) {
    const now = new Date();

    return db
      .select({
        d: webhookDeliveriesTable,
        s: webhookSubscriptionsTable,
      })
      .from(webhookDeliveriesTable)
      .innerJoin(
        webhookSubscriptionsTable,
        eq(webhookDeliveriesTable.subscriptionId, webhookSubscriptionsTable.id)
      )
      .where(
        and(
          eq(webhookDeliveriesTable.status, 'pending' as any),
          lte(webhookDeliveriesTable.nextAttemptAt, now),
          eq(webhookSubscriptionsTable.isActive, true)
        )
      )
      .orderBy(asc(webhookDeliveriesTable.nextAttemptAt), asc(webhookDeliveriesTable.attemptCount))
      .limit(limit);
  }

  async function claim(d: DeliveryRow) {
    const holdUntil = new Date(Date.now() + CLAIM_HOLD_SEC * 1000);
    const res = await db
      .update(webhookDeliveriesTable)
      .set({ nextAttemptAt: holdUntil })
      .where(
        and(
          eq(webhookDeliveriesTable.id, d.id),
          eq(webhookDeliveriesTable.status, 'pending' as any),
          eq(webhookDeliveriesTable.attemptCount, d.attemptCount),
          lte(webhookDeliveriesTable.nextAttemptAt, new Date())
        )
      )
      .returning({ id: webhookDeliveriesTable.id });

    return res.length === 1;
  }

  async function sendOnce(d: DeliveryRow, s: SubscriptionRow) {
    const body = JSON.stringify(d.payload);
    const { createHmac } = await import('node:crypto');
    const sig = createHmac('sha256', s.secret).update(body).digest('hex');

    try {
      const resp = await fetch(s.url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-containo-event-id': d.eventId,
          'x-containo-event-type': d.eventType,
          'x-containo-signature': sig,
        },
        body,
      });

      const status = resp.status;
      if (status >= 200 && status < 300) {
        await db
          .update(webhookDeliveriesTable)
          .set({
            responseStatus: status,
            status: 'success' as any,
            updatedAt: new Date(),
          })
          .where(eq(webhookDeliveriesTable.id, d.id));
        return;
      }

      const next = new Date(Date.now() + backoffSeconds(d.attemptCount + 1) * 1000);
      await db
        .update(webhookDeliveriesTable)
        .set({
          responseStatus: status,
          attemptCount: d.attemptCount + 1,
          nextAttemptAt: next,
          status: d.attemptCount + 1 >= MAX_ATTEMPTS ? ('failed' as any) : ('pending' as any),
          updatedAt: new Date(),
          lastError: `HTTP ${status}`,
        })
        .where(eq(webhookDeliveriesTable.id, d.id));
    } catch (e: any) {
      const next = new Date(Date.now() + backoffSeconds(d.attemptCount + 1) * 1000);
      await db
        .update(webhookDeliveriesTable)
        .set({
          responseStatus: 0,
          attemptCount: d.attemptCount + 1,
          nextAttemptAt: next,
          status: d.attemptCount + 1 >= MAX_ATTEMPTS ? ('failed' as any) : ('pending' as any),
          updatedAt: new Date(),
          lastError: String(e?.message ?? e),
        })
        .where(eq(webhookDeliveriesTable.id, d.id));
    }
  }

  async function tick() {
    try {
      const rows = await findDue(20);
      for (const { d, s } of rows) {
        const ok = await claim(d);
        if (!ok) continue;
        await sendOnce(d, s);
      }
    } catch (err) {
      fastify.log.error({ err }, '[webhooks] tick error');
    }
  }

  fastify.addHook('onReady', async () => {
    timer = setInterval(tick, POLL_EVERY_MS);
    fastify.log.info(`[webhooks] worker started (poll=${POLL_EVERY_MS}ms)`);
  });

  fastify.addHook('onClose', async () => {
    if (timer) clearInterval(timer);
  });

  done();
};

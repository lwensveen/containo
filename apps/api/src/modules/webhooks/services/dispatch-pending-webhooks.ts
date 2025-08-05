import { and, asc, eq, inArray, lte } from 'drizzle-orm';
import { db } from '../../../db/client';
import { webhookDeliveries, webhookSubscriptions } from '../../../db/schema';
import { hmacSha256 } from '../utils';
import { scheduleRetry } from './schedule-retry';

export async function dispatchPendingWebhooks(limit = 20) {
  const now = new Date();

  const deliveries = await db
    .select()
    .from(webhookDeliveries)
    .where(
      and(eq(webhookDeliveries.status, 'pending'), lte(webhookDeliveries.nextAttemptAt, now as any))
    )
    .orderBy(asc(webhookDeliveries.nextAttemptAt))
    .limit(limit);

  if (!deliveries.length) return 0;

  const subIds = Array.from(new Set(deliveries.map((d) => d.subscriptionId))).filter(
    Boolean
  ) as string[];

  if (subIds.length === 0) return 0;

  const subs = await db
    .select()
    .from(webhookSubscriptions)
    .where(inArray(webhookSubscriptions.id, subIds));

  const subMap = new Map(subs.map((s) => [s.id, s]));

  let success = 0;

  for (const d of deliveries) {
    const sub = subMap.get(d.subscriptionId);
    if (!sub || !sub.isActive) {
      await db
        .update(webhookDeliveries)
        .set({ status: 'failed', lastError: 'subscription inactive' })
        .where(eq(webhookDeliveries.id, d.id));
      continue;
    }

    const body = JSON.stringify({
      id: d.eventId,
      type: d.eventType,
      payload: d.payload,
      createdAt: d.createdAt,
    });

    const signature = hmacSha256(sub.secret, body);

    try {
      const res = await fetch(sub.url, {
        method: 'POST',
        headers: {
          'user-agent': 'containo-webhooks/0.1',
          'content-type': 'application/json',
          'x-containo-event': d.eventType,
          'x-containo-signature': `sha256=${signature}`,
        },
        body,
      });

      if (res.ok) {
        await db
          .update(webhookDeliveries)
          .set({ status: 'success', responseStatus: res.status })
          .where(eq(webhookDeliveries.id, d.id));
        success++;
      } else {
        await scheduleRetry(d.id, d.attemptCount, `HTTP ${res.status}`);
      }
    } catch (e: any) {
      await scheduleRetry(d.id, d.attemptCount, e?.message ?? 'network error');
    }
  }

  return success;
}

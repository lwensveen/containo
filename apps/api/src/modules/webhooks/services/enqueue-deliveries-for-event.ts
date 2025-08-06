import { listWebhooks } from './list-webhooks.js';
import { db, webhookDeliveries } from '@containo/db';

type PoolEventType =
  | 'pool_created'
  | 'item_pooled'
  | 'fill_80'
  | 'fill_90'
  | 'fill_100'
  | 'status_changed';

export async function enqueueDeliveriesForEvent(event: {
  id: string;
  type: PoolEventType;
  payload: Record<string, unknown>;
}) {
  const subs = await listWebhooks();

  const targets = subs.filter((s) => {
    if (!s.isActive) return false;
    if (s.events.trim() === '*') return true;
    const set = new Set(s.events.split(',').map((x) => x.trim()));
    return set.has(event.type);
  });

  if (!targets.length) return 0;

  await db.insert(webhookDeliveries).values(
    targets.map((s) => ({
      subscriptionId: s.id,
      eventId: event.id,
      eventType: event.type,
      payload: event.payload,
    }))
  );
  return targets.length;
}

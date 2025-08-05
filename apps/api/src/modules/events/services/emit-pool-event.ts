import { expectOne } from '../../pools/utils.js';
import { db } from '../../../db/client.js';
import { poolEvents } from '../../../db/schema.js';
import { enqueueDeliveriesForEvent } from '../../webhooks/services/enqueue-deliveries-for-event.js';

export async function emitPoolEvent(input: {
  poolId: string;
  type: 'pool_created' | 'item_pooled' | 'fill_80' | 'fill_90' | 'fill_100' | 'status_changed';
  payload?: Record<string, unknown>;
}) {
  const ev = expectOne(
    await db
      .insert(poolEvents)
      .values({
        poolId: input.poolId,
        type: input.type,
        payload: (input.payload ?? {}) as any,
      })
      .returning({ id: poolEvents.id, type: poolEvents.type, payload: poolEvents.payload }),
    'Failed to insert pool event'
  );

  await enqueueDeliveriesForEvent({
    id: ev.id,
    type: ev.type,
    payload: (ev as any).payload ?? {},
  });
}

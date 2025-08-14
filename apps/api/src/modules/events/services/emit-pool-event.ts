import { expectOne } from '../../pools/utils.js';
import { db, poolEventsTable } from '@containo/db';
import { enqueueDeliveriesForEvent } from '../../webhooks/services/enqueue-deliveries-for-event.js';
import { PoolEventType } from '@containo/types';

export async function emitPoolEvent(input: {
  poolId: string;
  type: PoolEventType;
  payload?: Record<string, unknown>;
}) {
  const ev = expectOne(
    await db
      .insert(poolEventsTable)
      .values({
        poolId: input.poolId,
        type: input.type,
        payload: (input.payload ?? {}) as any,
      })
      .returning({
        id: poolEventsTable.id,
        type: poolEventsTable.type,
        payload: poolEventsTable.payload,
      }),
    'Failed to insert pool event'
  );

  await enqueueDeliveriesForEvent({
    id: ev.id,
    type: ev.type,
    payload: (ev as any).payload ?? {},
  });
}

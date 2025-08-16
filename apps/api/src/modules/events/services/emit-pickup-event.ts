import { db, pickupEventsTable } from '@containo/db';
import { enqueueDeliveriesForEvent } from '../../webhooks/services/enqueue-deliveries-for-event.js';
import type { PickupEventType } from '@containo/types';

export async function emitPickupEvent(args: {
  pickupId: string;
  type: PickupEventType;
  payload?: Record<string, unknown>;
}) {
  const rows = await db
    .insert(pickupEventsTable)
    .values({
      pickupId: args.pickupId,
      type: args.type,
      payload: args.payload ?? null,
    })
    .returning();

  const row = rows[0];
  if (!row) throw new Error('Failed to create pickup event');

  await enqueueDeliveriesForEvent({
    id: row.id,
    type: row.type,
    payload: row.payload ?? {},
  });

  return row;
}

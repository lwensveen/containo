import { db, inboundEventsTable } from '@containo/db';
import { enqueueDeliveriesForEvent } from '../../webhooks/services/enqueue-deliveries-for-event.js';
import type { InboundEventType, WebhookEventType } from '@containo/types';

export async function emitInboundEvent(args: {
  inboundId: string;
  type: InboundEventType;
  payload?: Record<string, unknown>;
}) {
  const rows = await db
    .insert(inboundEventsTable)
    .values({
      inboundId: args.inboundId,
      type: args.type,
      payload: args.payload ?? {},
    })
    .returning();

  const row = rows[0];
  if (!row) throw Error('Unable to insert inbound event');

  const webhookType = `inbound_${args.type}` as WebhookEventType;

  await enqueueDeliveriesForEvent({
    id: row.id,
    type: webhookType,
    payload: { inboundId: args.inboundId, ...(args.payload ?? {}) },
  });

  return row;
}

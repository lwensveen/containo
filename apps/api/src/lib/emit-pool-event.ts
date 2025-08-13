import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { db, webhookDeliveriesTable, webhookSubscriptionsTable } from '@containo/db';

export async function emitPoolEvent(eventType: string, payload: Record<string, unknown>) {
  const eventId = randomUUID();

  const subs = await db
    .select()
    .from(webhookSubscriptionsTable)
    .where(eq(webhookSubscriptionsTable.isActive, true));

  const deliveries = subs
    .filter((s) => {
      if (!s.events || s.events === '*') return true;
      const list = s.events.split(',').map((e) => e.trim());
      return list.includes(eventType);
    })
    .map((s) => ({
      id: randomUUID(),
      subscriptionId: s.id,
      eventId,
      eventType: eventType as any,
      payload,
      attemptCount: 0,
      nextAttemptAt: new Date(),
      status: 'pending' as any,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

  if (deliveries.length > 0) {
    await db.insert(webhookDeliveriesTable).values(deliveries);
  }

  return { eventId, enqueued: deliveries.length };
}

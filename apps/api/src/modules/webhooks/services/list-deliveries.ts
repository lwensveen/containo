import { desc, eq, sql } from 'drizzle-orm';
import { db, webhookDeliveriesTable, webhookSubscriptionsTable } from '@containo/db';
import type { z } from 'zod/v4';
import { DeliveriesListQuerySchema, WebhookDeliveryWithSubSchema } from '@containo/types';

type Input = z.infer<typeof DeliveriesListQuerySchema>;

export async function listDeliveries(input: Input) {
  const { status, limit = 100 } = input ?? {};
  const rows = await db
    .select({
      id: webhookDeliveriesTable.id,
      subscriptionId: webhookDeliveriesTable.subscriptionId,
      eventId: webhookDeliveriesTable.eventId,
      eventType: webhookDeliveriesTable.eventType,
      payload: webhookDeliveriesTable.payload,
      attemptCount: webhookDeliveriesTable.attemptCount,
      nextAttemptAt: webhookDeliveriesTable.nextAttemptAt,
      lastError: webhookDeliveriesTable.lastError,
      responseStatus: webhookDeliveriesTable.responseStatus,
      status: webhookDeliveriesTable.status,
      createdAt: webhookDeliveriesTable.createdAt,
      updatedAt: webhookDeliveriesTable.updatedAt,
      subscriptionUrl: webhookSubscriptionsTable.url,
      subscriptionIsActive: webhookSubscriptionsTable.isActive,
    })
    .from(webhookDeliveriesTable)
    .innerJoin(
      webhookSubscriptionsTable,
      eq(webhookDeliveriesTable.subscriptionId, webhookSubscriptionsTable.id)
    )
    .where(status ? eq(webhookDeliveriesTable.status, status) : sql`true`)
    .orderBy(desc(webhookDeliveriesTable.createdAt))
    .limit(Math.min(Math.max(Number(limit) || 100, 1), 200));

  return WebhookDeliveryWithSubSchema.array().parse(rows);
}

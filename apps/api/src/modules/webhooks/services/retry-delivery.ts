import { db, webhookDeliveriesTable } from '@containo/db';
import { eq } from 'drizzle-orm';
import { WebhookDeliveryPublicSchema } from '@containo/types';

export async function retryDelivery(id: string) {
  const now = new Date();
  const [row] = await db
    .update(webhookDeliveriesTable)
    .set({
      status: 'pending',
      nextAttemptAt: now,
      responseStatus: null,
      lastError: null,
    })
    .where(eq(webhookDeliveriesTable.id, id))
    .returning();

  if (!row) return null;

  return WebhookDeliveryPublicSchema.parse({ row });
}

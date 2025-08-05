import { eq } from 'drizzle-orm';
import { db } from '../../../db/client.js';
import { webhookSubscriptions } from '../../../db/schema.js';

export async function deactivateWebhook(id: string) {
  const [row] = await db
    .update(webhookSubscriptions)
    .set({ isActive: false })
    .where(eq(webhookSubscriptions.id, id))
    .returning();
  return row;
}

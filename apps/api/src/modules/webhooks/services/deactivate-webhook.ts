import { eq } from 'drizzle-orm';
import { db, webhookSubscriptionsTable } from '@containo/db';

export async function deactivateWebhook(id: string) {
  const [row] = await db
    .update(webhookSubscriptionsTable)
    .set({ isActive: false })
    .where(eq(webhookSubscriptionsTable.id, id))
    .returning();
  return row;
}

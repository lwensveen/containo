import { eq } from 'drizzle-orm';
import { db, webhookSubscriptions } from '@containo/db';

export async function deactivateWebhook(id: string) {
  const [row] = await db
    .update(webhookSubscriptions)
    .set({ isActive: false })
    .where(eq(webhookSubscriptions.id, id))
    .returning();
  return row;
}

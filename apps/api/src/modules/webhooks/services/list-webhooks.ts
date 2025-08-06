import { eq } from 'drizzle-orm';
import { db, webhookSubscriptionsTable } from '@containo/db';

export async function listWebhooks() {
  return db
    .select()
    .from(webhookSubscriptionsTable)
    .where(eq(webhookSubscriptionsTable.isActive, true));
}

import { eq } from 'drizzle-orm';
import { db, webhookSubscriptions } from '@containo/db';

export async function listWebhooks() {
  return db.select().from(webhookSubscriptions).where(eq(webhookSubscriptions.isActive, true));
}

import { eq } from 'drizzle-orm';
import { db } from '../../../db/client';
import { webhookSubscriptions } from '../../../db/schema';

export async function listWebhooks() {
  return db.select().from(webhookSubscriptions).where(eq(webhookSubscriptions.isActive, true));
}

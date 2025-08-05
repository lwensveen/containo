import { eq } from 'drizzle-orm';
import { db } from '../../../db/client.js';
import { webhookSubscriptions } from '../../../db/schema.js';

export async function listWebhooks() {
  return db.select().from(webhookSubscriptions).where(eq(webhookSubscriptions.isActive, true));
}

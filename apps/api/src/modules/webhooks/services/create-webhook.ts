import { db, webhookSubscriptionsTable } from '@containo/db';

export async function createWebhook(input: { url: string; events: string; secret: string }) {
  const [row] = await db
    .insert(webhookSubscriptionsTable)
    .values({
      url: input.url,
      events: input.events,
      secret: input.secret,
    })
    .returning();
  return row;
}

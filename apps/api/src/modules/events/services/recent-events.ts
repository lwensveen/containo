import { desc } from 'drizzle-orm';
import { db, poolEvents } from '@containo/db';

export async function recentEvents(limit = 50) {
  return db.select().from(poolEvents).orderBy(desc(poolEvents.createdAt)).limit(limit);
}

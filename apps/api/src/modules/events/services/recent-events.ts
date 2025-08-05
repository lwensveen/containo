import { desc } from 'drizzle-orm';
import { db } from '../../../db/client.js';
import { poolEvents } from '../../../db/schema.js';

export async function recentEvents(limit = 50) {
  return db.select().from(poolEvents).orderBy(desc(poolEvents.createdAt)).limit(limit);
}

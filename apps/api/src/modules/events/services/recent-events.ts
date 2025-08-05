import { desc } from 'drizzle-orm';
import { db } from '../../../db/client';
import { poolEvents } from '../../../db/schema';

export async function recentEvents(limit = 50) {
  return db.select().from(poolEvents).orderBy(desc(poolEvents.createdAt)).limit(limit);
}
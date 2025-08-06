import { desc } from 'drizzle-orm';
import { db, poolEventsTable } from '@containo/db';

export async function recentEvents(limit = 50) {
  return db.select().from(poolEventsTable).orderBy(desc(poolEventsTable.createdAt)).limit(limit);
}

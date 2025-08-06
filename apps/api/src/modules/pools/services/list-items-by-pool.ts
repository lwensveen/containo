import { asc, eq } from 'drizzle-orm';
import { db, items } from '@containo/db';

export async function listItemsByPool(poolId: string) {
  return db.select().from(items).where(eq(items.poolId, poolId)).orderBy(asc(items.createdAt));
}

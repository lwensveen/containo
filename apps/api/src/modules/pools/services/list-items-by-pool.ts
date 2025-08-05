import { asc, eq } from 'drizzle-orm';
import { db } from '../../../db/client';
import { items } from '../../../db/schema';

export async function listItemsByPool(poolId: string) {
  return db.select().from(items).where(eq(items.poolId, poolId)).orderBy(asc(items.createdAt));
}

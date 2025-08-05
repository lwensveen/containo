import { asc, eq } from 'drizzle-orm';
import { db } from '../../../db/client.js';
import { items } from '../../../db/schema.js';

export async function listItemsByPool(poolId: string) {
  return db.select().from(items).where(eq(items.poolId, poolId)).orderBy(asc(items.createdAt));
}

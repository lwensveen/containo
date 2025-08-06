import { asc, eq } from 'drizzle-orm';
import { db, poolItemsTable } from '@containo/db';

export async function listItemsByPool(poolId: string) {
  return db
    .select()
    .from(poolItemsTable)
    .where(eq(poolItemsTable.poolId, poolId))
    .orderBy(asc(poolItemsTable.createdAt));
}

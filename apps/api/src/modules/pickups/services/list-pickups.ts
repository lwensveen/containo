import { and, desc, eq } from 'drizzle-orm';
import { db, pickupsTable } from '@containo/db';
import type { PickupListQuery } from '@containo/types';

export async function listPickups(q: PickupListQuery) {
  const where = and(
    q.userId ? eq(pickupsTable.userId, q.userId) : undefined,
    q.status ? eq(pickupsTable.status, q.status) : undefined
  );

  return db
    .select()
    .from(pickupsTable)
    .where(where)
    .orderBy(desc(pickupsTable.createdAt))
    .limit(q.limit ?? 100);
}

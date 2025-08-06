import { eq } from 'drizzle-orm';
import { db, poolsTable } from '@containo/db';

export async function getPoolById(id: string) {
  const rows = await db.select().from(poolsTable).where(eq(poolsTable.id, id)).limit(1);

  return rows[0] ?? null;
}

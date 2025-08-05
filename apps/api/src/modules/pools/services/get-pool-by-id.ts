import { eq } from 'drizzle-orm';
import { db } from '../../../db/client';
import { pools } from '../../../db/schema';

export async function getPoolById(id: string) {
  const rows = await db.select().from(pools).where(eq(pools.id, id)).limit(1);
  return rows[0] ?? null;
}

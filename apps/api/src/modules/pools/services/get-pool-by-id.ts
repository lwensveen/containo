import { eq } from 'drizzle-orm';
import { db, pools } from '@containo/db';

export async function getPoolById(id: string) {
  const rows = await db.select().from(pools).where(eq(pools.id, id)).limit(1);
  return rows[0] ?? null;
}

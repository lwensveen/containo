import { db, poolsTable } from '@containo/db';

export async function listPools() {
  return db.select().from(poolsTable);
}

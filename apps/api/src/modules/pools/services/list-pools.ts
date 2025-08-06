import { db, pools } from '@containo/db';

export async function listPools() {
  return db.select().from(pools);
}

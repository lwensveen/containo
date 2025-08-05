import { db } from '../../../db/client';
import { pools } from '../../../db/schema';

export async function listPools() {
  return db.select().from(pools);
}

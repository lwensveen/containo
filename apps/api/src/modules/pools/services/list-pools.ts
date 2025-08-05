import { db } from '../../../db/client.js';
import { pools } from '../../../db/schema.js';

export async function listPools() {
  return db.select().from(pools);
}

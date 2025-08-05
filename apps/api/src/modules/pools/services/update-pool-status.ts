import { eq } from 'drizzle-orm';
import { db } from '../../../db/client.js';
import { pools } from '../../../db/schema.js';
import { emitPoolEvent } from '../../events/services/emit-pool-event.js';

export async function updatePoolStatus(
  poolId: string,
  status: 'open' | 'closing' | 'booked' | 'in_transit' | 'arrived'
) {
  const [row] = await db.update(pools).set({ status }).where(eq(pools.id, poolId)).returning();
  if (row) {
    await emitPoolEvent({ poolId, type: 'status_changed', payload: { status } });
  }
  return row;
}

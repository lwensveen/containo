import { eq } from 'drizzle-orm';
import { db } from '../../../db/client';
import { pools } from '../../../db/schema';
import { emitPoolEvent } from '../../events/services';

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

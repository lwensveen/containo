import { eq } from 'drizzle-orm';
import { db, poolsTable } from '@containo/db';
import { emitPoolEvent } from '../../events/services/emit-pool-event.js';

export async function updatePoolStatus(
  poolId: string,
  status: 'open' | 'closing' | 'booked' | 'in_transit' | 'arrived'
) {
  const [row] = await db
    .update(poolsTable)
    .set({ status })
    .where(eq(poolsTable.id, poolId))
    .returning();
  if (row) {
    await emitPoolEvent({ poolId, type: 'status_changed', payload: { status } });
  }
  return row;
}

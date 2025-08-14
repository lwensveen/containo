import { and, eq, inArray } from 'drizzle-orm';
import { db, poolsTable } from '@containo/db';
import { emitPoolEvent } from '../../events/services/emit-pool-event.js';

export async function manualBook(poolId: string, bookingRef: string): Promise<boolean> {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .update(poolsTable)
      .set({ status: 'booked', bookingRef })
      .where(
        and(eq(poolsTable.id, poolId), inArray(poolsTable.status, ['open', 'closing'] as const))
      )
      .returning();

    if (!row) return false;

    await emitPoolEvent({ poolId, type: 'booking_confirmed', payload: { bookingRef } });
    await emitPoolEvent({
      poolId,
      type: 'status_changed',
      payload: { status: 'booked', bookingRef },
    });

    return true;
  });
}

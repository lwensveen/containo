import { eq } from 'drizzle-orm';
import { db, pickupsTable } from '@containo/db';
import { emitPickupEvent } from '../../events/services/emit-pickup-event.js';

export async function markPickupPickedUp(pickupId: string) {
  const [row] = await db
    .update(pickupsTable)
    .set({ status: 'picked_up' })
    .where(eq(pickupsTable.id, pickupId))
    .returning();

  if (!row) throw new Error('Pickup not found');

  await emitPickupEvent({ pickupId: row.id, type: 'pickup_picked_up' });
  return row;
}

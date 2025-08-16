import { eq } from 'drizzle-orm';
import { db, pickupsTable } from '@containo/db';
import type { PickupStatusUpdate } from '@containo/types';

export async function updatePickupStatus(id: string, body: PickupStatusUpdate) {
  const [row] = await db
    .update(pickupsTable)
    .set({
      status: body.status,
      carrierRef: body.carrierRef,
      labelUrl: body.labelUrl,
    })
    .where(eq(pickupsTable.id, id))
    .returning();

  return row ?? null;
}

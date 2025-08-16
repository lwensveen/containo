import { eq } from 'drizzle-orm';
import { db, pickupsTable } from '@containo/db';
import { getPickupProvider } from '../providers/index.js';
import { emitPickupEvent } from '../../events/services/emit-pickup-event.js';
import { updatePickupStatus } from './update-pickup-status.js';

export async function schedulePickup(pickupId: string) {
  const [p] = await db.select().from(pickupsTable).where(eq(pickupsTable.id, pickupId)).limit(1);
  if (!p) throw new Error('Pickup not found');

  if (p.status !== 'requested') {
    if (p.status === 'scheduled') return p; // idempotent
    throw new Error(`Pickup status must be 'requested', got '${p.status}'`);
  }

  const provider = getPickupProvider();
  const res = provider
    ? await provider.schedule({
        pickup: {
          id: p.id,
          userId: p.userId,
          contactName: p.contactName,
          phone: p.phone ?? undefined,
          email: p.email ?? undefined,
          address1: p.address1,
          address2: p.address2 ?? undefined,
          city: p.city,
          state: p.state ?? undefined,
          postcode: p.postcode,
          country: p.country,
          windowStartISO: p.windowStartISO,
          windowEndISO: p.windowEndISO,
          pieces: p.pieces,
          totalWeightKg: Number(p.totalWeightKg),
          notes: p.notes ?? undefined,
        },
      })
    : { carrierRef: '', labelUrl: undefined, scheduled: true };

  const row =
    (await updatePickupStatus?.(pickupId, {
      status: 'scheduled',
      carrierRef: res.carrierRef,
      labelUrl: res.labelUrl,
    })) ||
    (await db
      .update(pickupsTable)
      .set({
        status: 'scheduled',
        carrierRef: res.carrierRef || null,
        labelUrl: res.labelUrl || null,
      })
      .where(eq(pickupsTable.id, pickupId))
      .returning()
      .then((r) => r[0]));

  if (!row) throw new Error('Failed to update pickup');

  await emitPickupEvent({
    pickupId: row.id,
    type: 'pickup_scheduled',
    payload: { carrierRef: row.carrierRef, labelUrl: row.labelUrl },
  });

  return row;
}

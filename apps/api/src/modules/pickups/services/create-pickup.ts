import { db, pickupsTable } from '@containo/db';
import type { PickupCreate } from '@containo/types';

export async function createPickup(input: PickupCreate) {
  const [row] = await db
    .insert(pickupsTable)
    .values({
      userId: input.userId,
      contactName: input.contactName,
      company: input.company ?? null,
      email: input.email ?? null,
      phone: input.phone ?? null,
      address1: input.address1,
      address2: input.address2 ?? null,
      city: input.city,
      state: input.state ?? null,
      postcode: input.postcode,
      country: input.country,
      windowStartISO: input.windowStartISO,
      windowEndISO: input.windowEndISO,
      pieces: input.pieces ?? 1,
      totalWeightKg: String(input.totalWeightKg),
      notes: input.notes ?? null,
      status: 'requested',
    })
    .returning();

  return row!;
}
